import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
const AWSXRay = require('aws-xray-sdk');

const XAWS = AWSXRay.captureAWS(AWS)

import { MovieItem } from '../models/MovieItem'
import { MovieUpdate } from '../models/MovieUpdate'

export class MovieAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly moviesTable = process.env.MOVIES_TABLE,
    private readonly moviesUserIdIndex = process.env.MOVIES_USERID_INDEX
  ) {}

  async getMoviesByUser(userId: string): Promise<MovieItem[]> {
    const queryParams = {
      TableName: this.moviesTable,
      IndexName: this.moviesUserIdIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }

    const result = await this.docClient.query(queryParams).promise()
    return result.Items as MovieItem[]
  }

  async getMovieBydId(userId: string, movieId: string): Promise<MovieItem> {
    const getParams = {
      TableName: this.moviesTable,
      Key: {
        userId: userId,
        movieId: movieId
      }
    }

    const result = await this.docClient.get(getParams).promise()
    return result.Item as MovieItem
  }

  async createMovie(item: MovieItem): Promise<MovieItem> {
    const createParams = {
      TableName: this.moviesTable,
      Item: item
    }

    await this.docClient.put(createParams).promise()
    return item
  }

  async deleteMovie(userId: string, movieId: string): Promise<void> {
    const deleteParams = {
      TableName: this.moviesTable,
      Key: {
        userId: userId,
        movieId: movieId
      }
    }

    await this.docClient.delete(deleteParams).promise()
  }

  async updateMovie(
    userId: string,
    movieId: string,
    updatedMovie: MovieUpdate
  ): Promise<void> {
    const updateParams = {
      TableName: this.moviesTable,
      Key: {
        userId: userId,
        movieId: movieId
      },
      UpdateExpression:
        'set #name = :movieName, watched= :watched, director = :director',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':movieName': updatedMovie.name,
        ':watched': updatedMovie.watched,
        ':director': updatedMovie.director
      }
    }
    await this.docClient.update(updateParams).promise()

    return
  }

  async updateMovieItemImage(
    userId: string,
    movieId: string,
    imageUrl: string
  ): Promise<void> {
    const updateImageParams = {
      TableName: this.moviesTable,
      Key: {
        userId: userId,
        movieId: movieId
      },
      UpdateExpression: 'set attachmentUrl = :imageUrl',
      ExpressionAttributeValues: {
        ':imageUrl': imageUrl
      }
    }
    await this.docClient.update(updateImageParams).promise()
    return
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}