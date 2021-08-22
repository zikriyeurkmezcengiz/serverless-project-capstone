import * as uuid from 'uuid'

import { MovieItem } from '../models/MovieItem'
import { MovieAccess } from '../dataLayer/movie'
import { CreateMovieRequest } from '../requests/CreateMovieRequest'
import { UpdateMovieRequest } from '../requests/UpdateMovieRequest'

const movieAccess = new MovieAccess()

export async function getMoviesByUser(userId: string): Promise<MovieItem[]> {
  return movieAccess.getMoviesByUser(userId)
}

export async function getMovieItem(
  userId: string,
  movieId: string
): Promise<MovieItem> {
  return movieAccess.getMovieBydId(userId, movieId)
}

export async function createMovie(
  createmovieRequest: CreateMovieRequest,
  userId: string
): Promise<MovieItem> {
  const itemId = uuid.v4()

  return movieAccess.createMovie({
    movieId: itemId,
    userId: userId,
    watched: false,
    name: createmovieRequest.name,
    director: createmovieRequest.director,
    createdAt: new Date().toISOString()
  })
}

export async function updateMovie(
  userId: string,
  movieId: string,
  updateMovieRequest: UpdateMovieRequest
): Promise<void> {
  return movieAccess.updateMovie(userId, movieId, {
    name: updateMovieRequest.name,
    watched: updateMovieRequest.watched,
    director: updateMovieRequest.director
  })
}

export async function updateMovieItemImage(
  userId: string,
  movieId: string,
  imageUrl: string
): Promise<void> {
  return movieAccess.updateMovieItemImage(userId, movieId, imageUrl)
}

export async function deleteMovie(
  userId: string,
  movieId: string
): Promise<void> {
  return movieAccess.deleteMovie(userId, movieId)
}