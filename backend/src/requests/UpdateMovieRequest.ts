/**
 * Fields in a request to update a single MOVIE item.
 */
export interface UpdateMovieRequest {
  name: string
  director: string
  watched: boolean
}