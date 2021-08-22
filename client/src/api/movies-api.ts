import { apiEndpoint } from '../config'
import { Movie } from '../types/Movie';
import { CreateMovieRequest } from '../types/CreateMovieRequest';
import Axios from 'axios'
import { UpdateMovieRequest } from '../types/UpdateMovieRequest';

export async function getMovies(idToken: string): Promise<Movie[]> {
  console.log('Fetching movies')

  const response = await Axios.get(`${apiEndpoint}/movies`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
  })
  console.log('Movies:', response.data)
  return response.data.items
}

export async function createMovie(
  idToken: string,
  newMovie: CreateMovieRequest
): Promise<Movie> {
  const response = await Axios.post(`${apiEndpoint}/movies`,  JSON.stringify(newMovie), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.item
}

export async function patchMovie(
  idToken: string,
  movieId: string,
  updatedMovie: UpdateMovieRequest
): Promise<void> {
  await Axios.patch(`${apiEndpoint}/movies/${movieId}`, JSON.stringify(updatedMovie), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function deleteMovie(
  idToken: string,
  movieId: string
): Promise<void> {
  await Axios.delete(`${apiEndpoint}/movies/${movieId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function getUploadUrl(
  idToken: string,
  movieId: string
): Promise<string> {
  const response = await Axios.post(`${apiEndpoint}/movies/${movieId}/attachment`, '', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.uploadUrl
}

export async function uploadFile(uploadUrl: string, file: Buffer): Promise<void> {
  await Axios.put(uploadUrl, file)
}
