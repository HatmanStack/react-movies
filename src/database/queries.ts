/**
 * Database query functions
 * Migrated from MovieDao.java Room interface
 *
 * Note: Database row types use `any` because SQLite query results are dynamically typed.
 * Each row is immediately mapped to a strongly-typed interface for type safety.
 * ESLint rule @typescript-eslint/no-explicit-any is disabled for database operations.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getDatabase } from './init';
import { MovieDetails, VideoDetails, ReviewDetails } from '../models/types';

/**
 * Helper function to map database row to MovieDetails object
 * Handles INTEGER to boolean conversion for favorite, toprated, popular
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToMovie(row: any): MovieDetails {
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
    favorite: Boolean(row.favorite), // INTEGER → boolean
    toprated: Boolean(row.toprated), // INTEGER → boolean
    popular: Boolean(row.popular), // INTEGER → boolean
  };
}

/**
 * Insert or update a movie
 * Migrates: @Insert(onConflict = OnConflictStrategy.REPLACE) void insertAll(MovieDetails movieDetails)
 *
 * @param movie - Movie to insert/update
 */
export async function insertMovie(movie: MovieDetails): Promise<void> {
  const db = getDatabase();

  try {
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
        movie.favorite ? 1 : 0, // boolean → INTEGER
        movie.toprated ? 1 : 0, // boolean → INTEGER
        movie.popular ? 1 : 0, // boolean → INTEGER
      ]
    );
  } catch (error) {
    console.error('Failed to insert movie:', error);
    throw new Error(
      `Failed to insert movie: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get movie by ID
 * Migrates: @Query("SELECT * FROM movie_details WHERE id = :id") MovieDetails loadMovieID(int id)
 *
 * @param movieId - Movie ID to retrieve
 * @returns Movie details or null if not found
 */
export async function getMovieById(movieId: number): Promise<MovieDetails | null> {
  const db = getDatabase();

  try {
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM movie_details WHERE id = ?',
      [movieId]
    );

    return row ? mapRowToMovie(row) : null;
  } catch (error) {
    console.error('Failed to get movie by ID:', error);
    throw new Error(
      `Failed to get movie by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all favorite movies
 * Migrates: @Query("SELECT * FROM movie_details WHERE favorite = 1") List<MovieDetails> loadFavorites()
 *
 * @returns Array of favorite movies
 */
export async function getFavoriteMovies(): Promise<MovieDetails[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM movie_details WHERE favorite = 1');

    return rows.map(mapRowToMovie);
  } catch (error) {
    console.error('Failed to get favorite movies:', error);
    throw new Error(
      `Failed to get favorite movies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all popular movies
 * Migrates: @Query("SELECT * FROM movie_details WHERE popular = 1") List<MovieDetails> loadPopular()
 *
 * @returns Array of popular movies
 */
export async function getPopularMovies(): Promise<MovieDetails[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM movie_details WHERE popular = 1');

    return rows.map(mapRowToMovie);
  } catch (error) {
    console.error('Failed to get popular movies:', error);
    throw new Error(
      `Failed to get popular movies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all top-rated movies
 * Migrates: @Query("SELECT * FROM movie_details WHERE toprated = 1") List<MovieDetails> loadTopRated()
 *
 * @returns Array of top-rated movies
 */
export async function getTopRatedMovies(): Promise<MovieDetails[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM movie_details WHERE toprated = 1');

    return rows.map(mapRowToMovie);
  } catch (error) {
    console.error('Failed to get top-rated movies:', error);
    throw new Error(
      `Failed to get top-rated movies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all movies
 * Migrates: @Query("SELECT * FROM movie_details") List<MovieDetails> getAll()
 *
 * @returns Array of all movies
 */
export async function getAllMovies(): Promise<MovieDetails[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM movie_details');

    return rows.map(mapRowToMovie);
  } catch (error) {
    console.error('Failed to get all movies:', error);
    throw new Error(
      `Failed to get all movies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a movie by ID
 * Migrates: @Delete void delete(MovieDetails movieDetails)
 *
 * @param movieId - Movie ID to delete
 */
export async function deleteMovie(movieId: number): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync('DELETE FROM movie_details WHERE id = ?', [movieId]);
  } catch (error) {
    console.error('Failed to delete movie:', error);
    throw new Error(
      `Failed to delete movie: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// VIDEO DETAILS QUERIES
// ============================================================================

/**
 * Helper function to map database row to VideoDetails object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToVideo(row: any): VideoDetails {
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
 * Insert or update a video
 * Migrates: @Insert(onConflict = OnConflictStrategy.REPLACE) void insertVideoDetails(VideoDetails videoDetails)
 *
 * @param video - Video to insert/update (identity is auto-generated if not provided)
 */
export async function insertVideo(
  video: Omit<VideoDetails, 'identity'> | VideoDetails
): Promise<void> {
  const db = getDatabase();

  try {
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
  } catch (error) {
    console.error('Failed to insert video:', error);
    throw new Error(
      `Failed to insert video: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all videos for a specific movie
 * Migrates: @Query("SELECT * FROM video_details WHERE id = :id") List<VideoDetails> getVideosDetails(int id)
 *
 * @param movieId - Movie ID to get videos for
 * @returns Array of videos for the movie
 */
export async function getVideosForMovie(movieId: number): Promise<VideoDetails[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM video_details WHERE id = ?', [movieId]);

    return rows.map(mapRowToVideo);
  } catch (error) {
    console.error('Failed to get videos for movie:', error);
    throw new Error(
      `Failed to get videos for movie: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get trailers for a specific movie
 * Migrates: @Query("SELECT * FROM video_details WHERE type = 'Trailer' AND id = :id") List<VideoDetails> loadVideo(int id)
 *
 * @param movieId - Movie ID to get trailers for
 * @returns Array of trailers for the movie
 */
export async function getTrailersForMovie(movieId: number): Promise<VideoDetails[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<any>(
      "SELECT * FROM video_details WHERE type = 'Trailer' AND id = ?",
      [movieId]
    );

    return rows.map(mapRowToVideo);
  } catch (error) {
    console.error('Failed to get trailers for movie:', error);
    throw new Error(
      `Failed to get trailers for movie: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// REVIEW DETAILS QUERIES
// ============================================================================

/**
 * Helper function to map database row to ReviewDetails object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToReview(row: any): ReviewDetails {
  return {
    identity: row.identity,
    id: row.id,
    author: row.author,
    content: row.content,
  };
}

/**
 * Insert or update a review
 * Migrates: @Insert(onConflict = OnConflictStrategy.REPLACE) void insertReviewDetails(ReviewDetails reviewDetails)
 *
 * @param review - Review to insert/update (identity is auto-generated if not provided)
 */
export async function insertReview(
  review: Omit<ReviewDetails, 'identity'> | ReviewDetails
): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO review_details
       (id, author, content)
       VALUES (?, ?, ?)`,
      [review.id, review.author, review.content]
    );
  } catch (error) {
    console.error('Failed to insert review:', error);
    throw new Error(
      `Failed to insert review: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all reviews for a specific movie
 * Migrates: @Query("SELECT * FROM review_details WHERE id = :id") List<ReviewDetails> getReviewDetails(int id)
 *
 * @param movieId - Movie ID to get reviews for
 * @returns Array of reviews for the movie
 */
export async function getReviewsForMovie(movieId: number): Promise<ReviewDetails[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM review_details WHERE id = ?', [movieId]);

    return rows.map(mapRowToReview);
  } catch (error) {
    console.error('Failed to get reviews for movie:', error);
    throw new Error(
      `Failed to get reviews for movie: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
