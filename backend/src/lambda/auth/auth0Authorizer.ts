import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'


import { verify, decode, JsonWebTokenError } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')
const jwksUrl = 'https://dev-m5sefk5t.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const decodedToken: Jwt = decode(token, { complete: true }) as Jwt

  if (decodedToken.header.alg !== 'RS256') {
    // we are only supporting RS256 so fail if this happens.
    throw new JsonWebTokenError('RS256 alg not found in header.')
  }

  const jwksCertResponse = await Axios.get(jwksUrl)

  if (jwksCertResponse.status < 200 || jwksCertResponse.status >= 300) {
    throw new Error(
      `Http error on jwks cert, ${jwksCertResponse.status} + ${jwksCertResponse.statusText}`
    )
  }

  var jwksKeys = jwksCertResponse.data.keys

  if (!jwksKeys || !jwksKeys.length) {
    throw new Error('The JWKS endpoint did not contain any keys')
  }

  const signingKeys = jwksKeys
    .filter(
      (key: {
        use: string
        kty: string
        kid: any
        x5c: string | any[]
        n: any
        e: any
      }) =>
        key.use === 'sig' && // JWK property `use` determines the JWK is for signature verification
        key.kty === 'RSA' && // We are only supporting RSA (RS256)
        key.kid && // The `kid` must be present to be useful for later
        ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
    )
    .map((key: { kid: any; nbf: any; x5c: any[] }) => {
      return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) }
    })

  // If at least one signing key doesn't exist we have a problem... Kaboom.
  if (!signingKeys.length) {
    throw new Error(
      'The JWKS endpoint did not contain any signature verification keys'
    )
  }

  const signingKey = signingKeys.find(
    (key: { kid: string }) => key.kid === decodedToken.header.kid
  )

  if (!signingKey) {
    throw new Error(
      `Unable to find a signing key that matches '${decodedToken.header.kid}`
    )
  }

  const key = signingKey.publicKey
  return verify(token, key, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

export function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n')
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
  return cert
}