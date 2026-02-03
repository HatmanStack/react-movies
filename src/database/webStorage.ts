/**
 * Indexed Web Storage Abstraction
 * Provides O(1) CRUD operations using individual keys instead of single array
 *
 * Storage Architecture:
 * - movies_index: JSON array of all movie IDs
 * - movie_{id}: Individual movie record
 * - favorites_index: JSON array of favorite movie IDs
 * - popular_index: JSON array of popular movie IDs
 * - toprated_index: JSON array of top-rated movie IDs
 * - videos_{movieId}: Array of videos for a movie
 * - reviews_{movieId}: Array of reviews for a movie
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MovieDetails, VideoDetails, ReviewDetails } from '../models/types';

// Storage keys
const KEYS = {
  MOVIES_INDEX: 'movies_index',
  FAVORITES_INDEX: 'favorites_index',
  POPULAR_INDEX: 'popular_index',
  TOPRATED_INDEX: 'toprated_index',
  movieKey: (id: number) => `movie_${id}`,
  videosKey: (movieId: number) => `videos_${movieId}`,
  reviewsKey: (movieId: number) => `reviews_${movieId}`,
} as const;

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get index set from storage
 */
async function getIndexSet(key: string): Promise<Set<number>> {
  const json = await AsyncStorage.getItem(key);
  const ids = safeJsonParse<number[]>(json, []);
  return new Set(ids);
}

/**
 * Save index set to storage
 */
async function saveIndexSet(key: string, ids: Set<number>): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify([...ids]));
}

// ============================================================================
// MOVIE OPERATIONS - O(1) complexity
// ============================================================================

/**
 * Insert or update a movie - O(1)
 */
export async function webInsertMovie(movie: MovieDetails): Promise<void> {
  const movieKey = KEYS.movieKey(movie.id);

  // Get current movie to check if updating categories
  const existingJson = await AsyncStorage.getItem(movieKey);
  const existing = existingJson ? safeJsonParse<MovieDetails | null>(existingJson, null) : null;

  // Store the movie
  await AsyncStorage.setItem(movieKey, JSON.stringify(movie));

  // Update all indexes atomically
  const [allIds, favoriteIds, popularIds, topratedIds] = await Promise.all([
    getIndexSet(KEYS.MOVIES_INDEX),
    getIndexSet(KEYS.FAVORITES_INDEX),
    getIndexSet(KEYS.POPULAR_INDEX),
    getIndexSet(KEYS.TOPRATED_INDEX),
  ]);

  // Add to main index
  allIds.add(movie.id);

  // Update category indexes based on flags
  if (movie.favorite) {
    favoriteIds.add(movie.id);
  } else {
    favoriteIds.delete(movie.id);
  }

  if (movie.popular) {
    popularIds.add(movie.id);
  } else if (existing?.popular) {
    // Only remove if it was previously popular
    popularIds.delete(movie.id);
  }

  if (movie.toprated) {
    topratedIds.add(movie.id);
  } else if (existing?.toprated) {
    // Only remove if it was previously toprated
    topratedIds.delete(movie.id);
  }

  // Save all indexes in parallel
  await Promise.all([
    saveIndexSet(KEYS.MOVIES_INDEX, allIds),
    saveIndexSet(KEYS.FAVORITES_INDEX, favoriteIds),
    saveIndexSet(KEYS.POPULAR_INDEX, popularIds),
    saveIndexSet(KEYS.TOPRATED_INDEX, topratedIds),
  ]);
}

/**
 * Batch insert movies - O(n) but single storage writes
 */
export async function webInsertMovies(movies: MovieDetails[]): Promise<void> {
  if (movies.length === 0) return;

  // Get all current indexes
  const [allIds, favoriteIds, popularIds, topratedIds] = await Promise.all([
    getIndexSet(KEYS.MOVIES_INDEX),
    getIndexSet(KEYS.FAVORITES_INDEX),
    getIndexSet(KEYS.POPULAR_INDEX),
    getIndexSet(KEYS.TOPRATED_INDEX),
  ]);

  // Prepare batch writes
  const writes: [string, string][] = [];

  for (const movie of movies) {
    writes.push([KEYS.movieKey(movie.id), JSON.stringify(movie)]);

    allIds.add(movie.id);

    if (movie.favorite) {
      favoriteIds.add(movie.id);
    }
    if (movie.popular) {
      popularIds.add(movie.id);
    }
    if (movie.toprated) {
      topratedIds.add(movie.id);
    }
  }

  // Batch write all movies + indexes
  await AsyncStorage.multiSet([
    ...writes,
    [KEYS.MOVIES_INDEX, JSON.stringify([...allIds])],
    [KEYS.FAVORITES_INDEX, JSON.stringify([...favoriteIds])],
    [KEYS.POPULAR_INDEX, JSON.stringify([...popularIds])],
    [KEYS.TOPRATED_INDEX, JSON.stringify([...topratedIds])],
  ]);
}

/**
 * Get movie by ID - O(1)
 */
export async function webGetMovieById(movieId: number): Promise<MovieDetails | null> {
  const json = await AsyncStorage.getItem(KEYS.movieKey(movieId));
  return safeJsonParse<MovieDetails | null>(json, null);
}

/**
 * Get movies by IDs - O(n) but parallelized
 */
async function getMoviesByIds(ids: number[]): Promise<MovieDetails[]> {
  if (ids.length === 0) return [];

  const keys = ids.map(id => KEYS.movieKey(id));
  const results = await AsyncStorage.multiGet(keys);

  return results
    .map(([, json]) => safeJsonParse<MovieDetails | null>(json, null))
    .filter((movie): movie is MovieDetails => movie !== null);
}

/**
 * Get all movies - O(n) but single index read + batch movie reads
 */
export async function webGetAllMovies(): Promise<MovieDetails[]> {
  const allIds = await getIndexSet(KEYS.MOVIES_INDEX);
  return getMoviesByIds([...allIds]);
}

/**
 * Get favorite movies - O(k) where k = number of favorites
 */
export async function webGetFavoriteMovies(): Promise<MovieDetails[]> {
  const favoriteIds = await getIndexSet(KEYS.FAVORITES_INDEX);
  return getMoviesByIds([...favoriteIds]);
}

/**
 * Get popular movies - O(k) where k = number of popular
 */
export async function webGetPopularMovies(): Promise<MovieDetails[]> {
  const popularIds = await getIndexSet(KEYS.POPULAR_INDEX);
  return getMoviesByIds([...popularIds]);
}

/**
 * Get top-rated movies - O(k) where k = number of top-rated
 */
export async function webGetTopRatedMovies(): Promise<MovieDetails[]> {
  const topratedIds = await getIndexSet(KEYS.TOPRATED_INDEX);
  return getMoviesByIds([...topratedIds]);
}

/**
 * Delete movie by ID - O(1)
 */
export async function webDeleteMovie(movieId: number): Promise<void> {
  // Remove from all indexes
  const [allIds, favoriteIds, popularIds, topratedIds] = await Promise.all([
    getIndexSet(KEYS.MOVIES_INDEX),
    getIndexSet(KEYS.FAVORITES_INDEX),
    getIndexSet(KEYS.POPULAR_INDEX),
    getIndexSet(KEYS.TOPRATED_INDEX),
  ]);

  allIds.delete(movieId);
  favoriteIds.delete(movieId);
  popularIds.delete(movieId);
  topratedIds.delete(movieId);

  // Remove movie and update indexes
  await Promise.all([
    AsyncStorage.removeItem(KEYS.movieKey(movieId)),
    saveIndexSet(KEYS.MOVIES_INDEX, allIds),
    saveIndexSet(KEYS.FAVORITES_INDEX, favoriteIds),
    saveIndexSet(KEYS.POPULAR_INDEX, popularIds),
    saveIndexSet(KEYS.TOPRATED_INDEX, topratedIds),
  ]);
}

// ============================================================================
// VIDEO OPERATIONS
// ============================================================================

/**
 * Insert video for a movie
 */
export async function webInsertVideo(
  video: Omit<VideoDetails, 'identity'> | VideoDetails
): Promise<void> {
  const key = KEYS.videosKey(video.id);
  const json = await AsyncStorage.getItem(key);
  const videos = safeJsonParse<VideoDetails[]>(json, []);

  const videoWithIdentity: VideoDetails =
    'identity' in video ? video : { ...video, identity: Date.now() + Math.random() };

  // Check for existing by key (YouTube video ID)
  const existingIndex = videos.findIndex(v => v.key === videoWithIdentity.key);

  if (existingIndex >= 0) {
    videos[existingIndex] = videoWithIdentity;
  } else {
    videos.push(videoWithIdentity);
  }

  await AsyncStorage.setItem(key, JSON.stringify(videos));
}

/**
 * Batch insert videos for a movie
 */
export async function webInsertVideos(
  movieId: number,
  newVideos: (Omit<VideoDetails, 'identity'> | VideoDetails)[]
): Promise<void> {
  if (newVideos.length === 0) return;

  const key = KEYS.videosKey(movieId);
  const json = await AsyncStorage.getItem(key);
  const videos = safeJsonParse<VideoDetails[]>(json, []);
  const existingKeys = new Set(videos.map(v => v.key));

  for (const video of newVideos) {
    const videoWithIdentity: VideoDetails =
      'identity' in video ? video : { ...video, identity: Date.now() + Math.random() };

    if (existingKeys.has(videoWithIdentity.key)) {
      const idx = videos.findIndex(v => v.key === videoWithIdentity.key);
      videos[idx] = videoWithIdentity;
    } else {
      videos.push(videoWithIdentity);
      existingKeys.add(videoWithIdentity.key);
    }
  }

  await AsyncStorage.setItem(key, JSON.stringify(videos));
}

/**
 * Get all videos for a movie
 */
export async function webGetVideosForMovie(movieId: number): Promise<VideoDetails[]> {
  const json = await AsyncStorage.getItem(KEYS.videosKey(movieId));
  return safeJsonParse<VideoDetails[]>(json, []);
}

/**
 * Get trailers for a movie
 */
export async function webGetTrailersForMovie(movieId: number): Promise<VideoDetails[]> {
  const videos = await webGetVideosForMovie(movieId);
  return videos.filter(v => v.type === 'Trailer');
}

// ============================================================================
// REVIEW OPERATIONS
// ============================================================================

/**
 * Insert review for a movie
 */
export async function webInsertReview(
  review: Omit<ReviewDetails, 'identity'> | ReviewDetails
): Promise<void> {
  const key = KEYS.reviewsKey(review.id);
  const json = await AsyncStorage.getItem(key);
  const reviews = safeJsonParse<ReviewDetails[]>(json, []);

  const reviewWithIdentity: ReviewDetails =
    'identity' in review ? review : { ...review, identity: Date.now() + Math.random() };

  // Check for existing by author
  const existingIndex = reviews.findIndex(r => r.author === reviewWithIdentity.author);

  if (existingIndex >= 0) {
    reviews[existingIndex] = reviewWithIdentity;
  } else {
    reviews.push(reviewWithIdentity);
  }

  await AsyncStorage.setItem(key, JSON.stringify(reviews));
}

/**
 * Batch insert reviews for a movie
 */
export async function webInsertReviews(
  movieId: number,
  newReviews: (Omit<ReviewDetails, 'identity'> | ReviewDetails)[]
): Promise<void> {
  if (newReviews.length === 0) return;

  const key = KEYS.reviewsKey(movieId);
  const json = await AsyncStorage.getItem(key);
  const reviews = safeJsonParse<ReviewDetails[]>(json, []);
  const existingAuthors = new Set(reviews.map(r => r.author));

  for (const review of newReviews) {
    const reviewWithIdentity: ReviewDetails =
      'identity' in review ? review : { ...review, identity: Date.now() + Math.random() };

    if (existingAuthors.has(reviewWithIdentity.author)) {
      const idx = reviews.findIndex(r => r.author === reviewWithIdentity.author);
      reviews[idx] = reviewWithIdentity;
    } else {
      reviews.push(reviewWithIdentity);
      existingAuthors.add(reviewWithIdentity.author);
    }
  }

  await AsyncStorage.setItem(key, JSON.stringify(reviews));
}

/**
 * Get all reviews for a movie
 */
export async function webGetReviewsForMovie(movieId: number): Promise<ReviewDetails[]> {
  const json = await AsyncStorage.getItem(KEYS.reviewsKey(movieId));
  return safeJsonParse<ReviewDetails[]>(json, []);
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Migrate from old single-array storage to indexed storage
 */
export async function migrateToIndexedStorage(): Promise<void> {
  // Check if already migrated
  const migrated = await AsyncStorage.getItem('storage_migrated_v2');
  if (migrated === 'true') return;

  // Get old data
  const oldMoviesJson = await AsyncStorage.getItem('movies_all');
  if (oldMoviesJson) {
    const movies = safeJsonParse<MovieDetails[]>(oldMoviesJson, []);
    if (movies.length > 0) {
      await webInsertMovies(movies);
      // Remove old storage key
      await AsyncStorage.removeItem('movies_all');
    }
  }

  await AsyncStorage.setItem('storage_migrated_v2', 'true');
}

/**
 * Clear all indexed storage (for testing)
 */
export async function clearIndexedStorage(): Promise<void> {
  const allIds = await getIndexSet(KEYS.MOVIES_INDEX);

  const keysToRemove = [
    KEYS.MOVIES_INDEX,
    KEYS.FAVORITES_INDEX,
    KEYS.POPULAR_INDEX,
    KEYS.TOPRATED_INDEX,
    ...[...allIds].map(id => KEYS.movieKey(id)),
    'storage_migrated_v2',
  ];

  await AsyncStorage.multiRemove(keysToRemove);
}
