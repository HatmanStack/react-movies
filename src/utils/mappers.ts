/**
 * Data Transformation Utilities
 * Shared mappers for converting between API responses and domain models
 */

import { MovieDetails, VideoDetails, ReviewDetails } from '../models/types';
import { TMDbMovie, TMDbVideo, TMDbReview } from '../api/types';
import { YouTubeService } from '../api/youtube';

/**
 * Flags for categorizing movies
 */
interface MovieFlags {
  popular: boolean;
  toprated: boolean;
  favorite?: boolean;
}

/**
 * Map TMDb API movie response to MovieDetails domain model
 *
 * @param movie - TMDb API movie/TV response
 * @param flags - Category flags to set on the movie
 * @returns MovieDetails domain object
 */
export function mapTMDbToMovieDetails(
  movie: TMDbMovie,
  flags: MovieFlags
): MovieDetails {
  return {
    id: movie.id,
    title: movie.title || movie.name || '',
    overview: movie.overview,
    poster_path: movie.poster_path || '',
    release_date: movie.release_date || movie.first_air_date || '',
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    popularity: movie.popularity,
    original_language: movie.original_language,
    favorite: flags.favorite ?? false,
    toprated: flags.toprated,
    popular: flags.popular,
  };
}

/**
 * Map TMDb video to VideoDetails with thumbnail URL
 *
 * @param video - TMDb video response
 * @param movieId - Parent movie ID
 * @param thumbnailUrl - Pre-fetched thumbnail URL
 * @returns VideoDetails domain object (without identity)
 */
function mapTMDbToVideoDetails(
  video: TMDbVideo,
  movieId: number,
  thumbnailUrl: string
): Omit<VideoDetails, 'identity'> {
  return {
    id: movieId,
    image_url: thumbnailUrl,
    iso_639_1: video.iso_639_1,
    iso_3166_1: video.iso_3166_1,
    key: video.key,
    site: video.site,
    size: video.size.toString(),
    type: video.type,
  };
}

/**
 * Map TMDb review to ReviewDetails
 *
 * @param review - TMDb review response
 * @param movieId - Parent movie ID
 * @returns ReviewDetails domain object (without identity)
 */
function mapTMDbToReviewDetails(
  review: TMDbReview,
  movieId: number
): Omit<ReviewDetails, 'identity'> {
  return {
    id: movieId,
    author: review.author,
    content: review.content,
  };
}

/**
 * Batch map TMDb movies to MovieDetails
 *
 * @param movies - Array of TMDb movie responses
 * @param flags - Category flags to apply to all movies
 * @returns Array of MovieDetails domain objects
 */
export function mapTMDbMoviesToMovieDetails(
  movies: TMDbMovie[],
  flags: MovieFlags
): MovieDetails[] {
  return movies.map(movie => mapTMDbToMovieDetails(movie, flags));
}

/**
 * Batch map TMDb videos to VideoDetails with parallel thumbnail fetching
 *
 * @param videos - Array of TMDb video responses
 * @param movieId - Parent movie ID
 * @returns Promise resolving to array of VideoDetails
 */
export async function mapTMDbVideosToVideoDetails(
  videos: TMDbVideo[],
  movieId: number
): Promise<Omit<VideoDetails, 'identity'>[]> {
  // Fetch all thumbnails in parallel
  const thumbnailPromises = videos.map(video =>
    YouTubeService.getVideoThumbnail(video.key)
  );
  const thumbnails = await Promise.all(thumbnailPromises);

  // Map with fetched thumbnails
  return videos.map((video, index) =>
    mapTMDbToVideoDetails(video, movieId, thumbnails[index])
  );
}

/**
 * Batch map TMDb reviews to ReviewDetails
 *
 * @param reviews - Array of TMDb review responses
 * @param movieId - Parent movie ID
 * @returns Array of ReviewDetails
 */
export function mapTMDbReviewsToReviewDetails(
  reviews: TMDbReview[],
  movieId: number
): Omit<ReviewDetails, 'identity'>[] {
  return reviews.map(review => mapTMDbToReviewDetails(review, movieId));
}

