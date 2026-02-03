/**
 * Database query functions
 * Migrated from MovieDao.java Room interface
 *
 * Platform-specific: Uses SQLite on native, indexed AsyncStorage on web
 * All operations are O(1) or O(k) where k is the result set size
 */

import { Platform } from 'react-native';
import { getDatabase } from './init';
import { MovieDetails, VideoDetails, ReviewDetails } from '../models/types';
import { DatabaseError } from '../api/errors';
import { logError } from '../utils/errorHandler';
import { VIDEO_TYPES } from '../constants';
import {
  webInsertMovie,
  webInsertMovies,
  webGetMovieById,
  webGetAllMovies,
  webGetFavoriteMovies,
  webGetPopularMovies,
  webGetTopRatedMovies,
  webDeleteMovie,
  webInsertVideo,
  webInsertVideos,
  webGetVideosForMovie,
  webGetTrailersForMovie,
  webInsertReview,
  webInsertReviews,
  webGetReviewsForMovie,
  migrateToIndexedStorage,
} from './webStorage';

/**
 * Check if we're running on web
 */
const isWeb = Platform.OS === 'web';

// ============================================================================
// TYPED DATABASE ROW INTERFACES
// ============================================================================

/**
 * SQLite row type for movie_details table
 * Note: SQLite stores booleans as INTEGER (0/1)
 */
interface MovieRow {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  favorite: number;
  toprated: number;
  popular: number;
}

/**
 * SQLite row type for video_details table
 */
interface VideoRow {
  identity: number;
  id: number;
  image_url: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  site: string;
  size: string;
  type: string;
}

/**
 * SQLite row type for review_details table
 */
interface ReviewRow {
  identity: number;
  id: number;
  author: string;
  content: string;
}

// ============================================================================
// ERROR HANDLING WRAPPER
// ============================================================================

/**
 * Wrap database operations with consistent error handling
 */
async function withDbError<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);
    throw new DatabaseError(
      `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      context
    );
  }
}

// ============================================================================
// ROW MAPPERS
// ============================================================================

/**
 * Map database row to MovieDetails object
 * Handles INTEGER to boolean conversion for favorite, toprated, popular
 */
function mapRowToMovie(row: MovieRow): MovieDetails {
  return {
    id: row.id,
    title: row.title,
    overview: row.overview,
    poster_path: row.poster_path,
    release_date: row.release_date,
    vote_average: row.vote_average,
    vote_count: row.vote_count,
    popularity: row.popularity,
    original_language: row.original_language,
    favorite: Boolean(row.favorite),
    toprated: Boolean(row.toprated),
    popular: Boolean(row.popular),
  };
}

/**
 * Map database row to VideoDetails object
 */
function mapRowToVideo(row: VideoRow): VideoDetails {
  return {
    identity: row.identity,
    id: row.id,
    image_url: row.image_url,
    iso_639_1: row.iso_639_1,
    iso_3166_1: row.iso_3166_1,
    key: row.key,
    site: row.site,
    size: row.size,
    type: row.type,
  };
}

/**
 * Map database row to ReviewDetails object
 */
function mapRowToReview(row: ReviewRow): ReviewDetails {
  return {
    identity: row.identity,
    id: row.id,
    author: row.author,
    content: row.content,
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize web storage migration
 * Call this on app startup for web platform
 */
export async function initializeWebStorage(): Promise<void> {
  if (isWeb) {
    await migrateToIndexedStorage();
  }
}

// ============================================================================
// MOVIE QUERIES
// ============================================================================

/**
 * Insert or update a movie
 * O(1) on both platforms
 */
export async function insertMovie(movie: MovieDetails): Promise<void> {
  return withDbError(async () => {
    if (isWeb) {
      return webInsertMovie(movie);
    }

    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO movie_details
       (id, title, overview, poster_path, release_date, vote_average, vote_count, popularity, original_language, favorite, toprated, popular)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movie.id,
        movie.title,
        movie.overview,
        movie.poster_path,
        movie.release_date,
        movie.vote_average,
        movie.vote_count,
        movie.popularity,
        movie.original_language,
        movie.favorite ? 1 : 0,
        movie.toprated ? 1 : 0,
        movie.popular ? 1 : 0,
      ]
    );
  }, 'insertMovie');
}

/**
 * Batch insert movies
 * Much more efficient than individual inserts
 */
export async function insertMovies(movies: MovieDetails[]): Promise<void> {
  return withDbError(async () => {
    if (movies.length === 0) return;

    if (isWeb) {
      return webInsertMovies(movies);
    }

    // Native: Use transaction for batch insert
    const db = getDatabase();
    await db.withTransactionAsync(async () => {
      for (const movie of movies) {
        await db.runAsync(
          `INSERT OR REPLACE INTO movie_details
           (id, title, overview, poster_path, release_date, vote_average, vote_count, popularity, original_language, favorite, toprated, popular)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            movie.id,
            movie.title,
            movie.overview,
            movie.poster_path,
            movie.release_date,
            movie.vote_average,
            movie.vote_count,
            movie.popularity,
            movie.original_language,
            movie.favorite ? 1 : 0,
            movie.toprated ? 1 : 0,
            movie.popular ? 1 : 0,
          ]
        );
      }
    });
  }, 'insertMovies');
}

/**
 * Get movie by ID
 * O(1) lookup
 */
export async function getMovieById(movieId: number): Promise<MovieDetails | null> {
  return withDbError(async () => {
    if (isWeb) {
      return webGetMovieById(movieId);
    }

    const db = getDatabase();
    const row = await db.getFirstAsync<MovieRow>(
      'SELECT * FROM movie_details WHERE id = ?',
      [movieId]
    );

    return row ? mapRowToMovie(row) : null;
  }, 'getMovieById');
}

/**
 * Get all favorite movies
 * O(k) where k = number of favorites
 */
export async function getFavoriteMovies(): Promise<MovieDetails[]> {
  return withDbError(async () => {
    if (isWeb) {
      return webGetFavoriteMovies();
    }

    const db = getDatabase();
    const rows = await db.getAllAsync<MovieRow>(
      'SELECT * FROM movie_details WHERE favorite = 1'
    );
    return rows.map(mapRowToMovie);
  }, 'getFavoriteMovies');
}

/**
 * Get all popular movies
 * O(k) where k = number of popular movies
 */
export async function getPopularMovies(): Promise<MovieDetails[]> {
  return withDbError(async () => {
    if (isWeb) {
      return webGetPopularMovies();
    }

    const db = getDatabase();
    const rows = await db.getAllAsync<MovieRow>(
      'SELECT * FROM movie_details WHERE popular = 1'
    );
    return rows.map(mapRowToMovie);
  }, 'getPopularMovies');
}

/**
 * Get all top-rated movies
 * O(k) where k = number of top-rated movies
 */
export async function getTopRatedMovies(): Promise<MovieDetails[]> {
  return withDbError(async () => {
    if (isWeb) {
      return webGetTopRatedMovies();
    }

    const db = getDatabase();
    const rows = await db.getAllAsync<MovieRow>(
      'SELECT * FROM movie_details WHERE toprated = 1'
    );
    return rows.map(mapRowToMovie);
  }, 'getTopRatedMovies');
}

/**
 * Get all movies
 * O(n) where n = total movies
 */
export async function getAllMovies(): Promise<MovieDetails[]> {
  return withDbError(async () => {
    if (isWeb) {
      return webGetAllMovies();
    }

    const db = getDatabase();
    const rows = await db.getAllAsync<MovieRow>('SELECT * FROM movie_details');
    return rows.map(mapRowToMovie);
  }, 'getAllMovies');
}

/**
 * Delete a movie by ID
 * O(1) on both platforms
 */
export async function deleteMovie(movieId: number): Promise<void> {
  return withDbError(async () => {
    if (isWeb) {
      return webDeleteMovie(movieId);
    }

    const db = getDatabase();
    await db.runAsync('DELETE FROM movie_details WHERE id = ?', [movieId]);
  }, 'deleteMovie');
}

// ============================================================================
// VIDEO QUERIES
// ============================================================================

/**
 * Insert or update a video
 */
export async function insertVideo(
  video: Omit<VideoDetails, 'identity'> | VideoDetails
): Promise<void> {
  return withDbError(async () => {
    if (isWeb) {
      return webInsertVideo(video);
    }

    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO video_details
       (id, image_url, iso_639_1, iso_3166_1, key, site, size, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        video.id,
        video.image_url,
        video.iso_639_1,
        video.iso_3166_1,
        video.key,
        video.site,
        video.size,
        video.type,
      ]
    );
  }, 'insertVideo');
}

/**
 * Batch insert videos for a movie
 */
export async function insertVideos(
  movieId: number,
  videos: (Omit<VideoDetails, 'identity'> | VideoDetails)[]
): Promise<void> {
  return withDbError(async () => {
    if (videos.length === 0) return;

    if (isWeb) {
      return webInsertVideos(movieId, videos);
    }

    const db = getDatabase();
    await db.withTransactionAsync(async () => {
      for (const video of videos) {
        await db.runAsync(
          `INSERT OR REPLACE INTO video_details
           (id, image_url, iso_639_1, iso_3166_1, key, site, size, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            video.id,
            video.image_url,
            video.iso_639_1,
            video.iso_3166_1,
            video.key,
            video.site,
            video.size,
            video.type,
          ]
        );
      }
    });
  }, 'insertVideos');
}

/**
 * Get all videos for a specific movie
 */
export async function getVideosForMovie(movieId: number): Promise<VideoDetails[]> {
  return withDbError(async () => {
    if (isWeb) {
      return webGetVideosForMovie(movieId);
    }

    const db = getDatabase();
    const rows = await db.getAllAsync<VideoRow>(
      'SELECT * FROM video_details WHERE id = ?',
      [movieId]
    );
    return rows.map(mapRowToVideo);
  }, 'getVideosForMovie');
}

/**
 * Get trailers for a specific movie
 */
export async function getTrailersForMovie(movieId: number): Promise<VideoDetails[]> {
  return withDbError(async () => {
    if (isWeb) {
      return webGetTrailersForMovie(movieId);
    }

    const db = getDatabase();
    const rows = await db.getAllAsync<VideoRow>(
      `SELECT * FROM video_details WHERE type = ? AND id = ?`,
      [VIDEO_TYPES.TRAILER, movieId]
    );
    return rows.map(mapRowToVideo);
  }, 'getTrailersForMovie');
}

// ============================================================================
// REVIEW QUERIES
// ============================================================================

/**
 * Insert or update a review
 */
export async function insertReview(
  review: Omit<ReviewDetails, 'identity'> | ReviewDetails
): Promise<void> {
  return withDbError(async () => {
    if (isWeb) {
      return webInsertReview(review);
    }

    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO review_details
       (id, author, content)
       VALUES (?, ?, ?)`,
      [review.id, review.author, review.content]
    );
  }, 'insertReview');
}

/**
 * Batch insert reviews for a movie
 */
export async function insertReviews(
  movieId: number,
  reviews: (Omit<ReviewDetails, 'identity'> | ReviewDetails)[]
): Promise<void> {
  return withDbError(async () => {
    if (reviews.length === 0) return;

    if (isWeb) {
      return webInsertReviews(movieId, reviews);
    }

    const db = getDatabase();
    await db.withTransactionAsync(async () => {
      for (const review of reviews) {
        await db.runAsync(
          `INSERT OR REPLACE INTO review_details
           (id, author, content)
           VALUES (?, ?, ?)`,
          [review.id, review.author, review.content]
        );
      }
    });
  }, 'insertReviews');
}

/**
 * Get all reviews for a specific movie
 */
export async function getReviewsForMovie(movieId: number): Promise<ReviewDetails[]> {
  return withDbError(async () => {
    if (isWeb) {
      return webGetReviewsForMovie(movieId);
    }

    const db = getDatabase();
    const rows = await db.getAllAsync<ReviewRow>(
      'SELECT * FROM review_details WHERE id = ?',
      [movieId]
    );
    return rows.map(mapRowToReview);
  }, 'getReviewsForMovie');
}
