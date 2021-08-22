import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { deleteMovie, getMovieItem } from '../../businessLayer/movie'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import * as middy from 'middy'

const logger = createLogger('deleteMovie')
const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.MOVIE_IMAGES_S3_BUCKET

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const movieId = event.pathParameters.movieId
    const userId = getUserId(event)
    const movieItem = await getMovieItem(userId, movieId)
    const isItemExists = !!movieItem

    if (!isItemExists) {
      logger.error(
        `${userId} attempted to delete non-existing movie item with id of : ${movieId}`
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

    await deleteMovie(userId, movieId)

    if (movieItem.attachmentUrl) {
      await deleteFromS3(movieId)
    }

    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: ''
    }
  }
)

async function deleteFromS3(movieId: string): Promise<void> {
  const params = {
    Bucket: bucketName,
    Key: movieId
  }

  try {
    await s3.deleteObject(params).promise()
  } catch (err) {
    logger.error(`Cant delete image of movie id : ${movieId}`, err)
  }
}