import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateMovieRequest } from '../../requests/UpdateMovieRequest'
import { getMovieItem, updateMovie } from '../../businessLayer/movie'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'

const logger = createLogger('updateMovie')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const movieId = event.pathParameters.movieId
    const userId = getUserId(event)
    const movieItem = await getMovieItem(userId, movieId)
    const isItemExists = !!movieItem

    if (!isItemExists) {
      logger.error(
        `${userId} attempted to update non-existing movie item with id of : ${movieId}`
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

    const updatedMovie: UpdateMovieRequest = JSON.parse(event.body)

    await updateMovie(userId, movieId, updatedMovie)

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