import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { getMovieItem, updateMovieItemImage } from '../../businessLayer/movie'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import * as middy from 'middy'

const logger = createLogger('uploadUrl')
const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.MOVIE_IMAGES_S3_BUCKET
const urlExpiration = Number(process.env.SIGNED_URL_EXPIRATION)

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const movieId = event.pathParameters.movieId
    const userId = getUserId(event)
    const movieItem = await getMovieItem(userId, movieId)
    const isItemExists = !!movieItem

    if (!isItemExists) {
      logger.error(
        `${userId} attempted to create upload url for non-existing movie item with id of : ${movieId}`
      )
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          error: `${movieId} item not exists.`
        })
      }
    }

    const url = getUploadUrl(movieId)
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${movieId}`
    await updateMovieItemImage(userId, movieId, imageUrl)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl: url
      })
    }
  }
)

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}