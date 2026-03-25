/**
 * TMDb API Service
 * Implements all TMDb API endpoints with retry logic and request cancellation
 */

import { z } from 'zod';
import { APIError, NetworkError } from './errors';
import { API, IMAGE_SIZES, PLACEHOLDERS } from '../constants';
import { withRetry } from '../utils/retry';
import { logWarn, isAbortError } from '../utils/errorHandler';
import {
  TMDbDiscoverResponseSchema,
  TMDbVideosResponseSchema,
  TMDbReviewsResponseSchema,
} from '../validation/schemas';

type TMDbDiscoverResponse = z.infer<typeof TMDbDiscoverResponseSchema>;
type TMDbVideosResponse = z.infer<typeof TMDbVideosResponseSchema>;
type TMDbReviewsResponse = z.infer<typeof TMDbReviewsResponseSchema>;

/**
 * TMDb API configuration
 */
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

/**
 * TMDb API Service class
 * Provides typed methods for all TMDb API endpoints with retry and cancellation support
 */
export class TMDbService {
  /**
   * Generic GET request handler with error handling and retry
   *
   * @param endpoint - API endpoint path
   * @param params - Query parameters
   * @param signal - AbortSignal for request cancellation
   */
  private static async get<T>(
    endpoint: string,
    params: Record<string, string> = {},
    signal?: AbortSignal
  ): Promise<T> {
    const fetchWithRetry = async (): Promise<T> => {
      // Check if aborted before starting
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const url = new URL(`${API.TMDB_BASE_URL}${endpoint}`);

      // Add API key
      if (!TMDB_API_KEY) {
        throw new APIError('TMDb API key not configured', undefined, endpoint);
      }
      url.searchParams.append('api_key', TMDB_API_KEY);

      // Add additional parameters
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString(), { signal });

      if (!response.ok) {
        const errorMessage = `API request failed: ${response.statusText}`;
        throw new APIError(errorMessage, response.status, endpoint);
      }

      return (await response.json()) as T;
    };

    try {
      return await withRetry(fetchWithRetry, {
        maxAttempts: 3,
        baseDelay: 1000,
        signal,
        onRetry: (attempt, error) => {
          logWarn(`TMDb API retry attempt ${attempt}`, 'TMDbService', {
            endpoint,
            error: error instanceof Error ? error.message : String(error),
          });
        },
      });
    } catch (error) {
      // Don't wrap abort errors
      if (isAbortError(error)) {
        throw error;
      }

      if (error instanceof APIError) {
        throw error;
      }

      throw new NetworkError(
        `Network request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get popular movies
   * Endpoint: /discover/movie
   *
   * @param page - Page number (default: 1)
   * @param signal - AbortSignal for cancellation
   * @returns Promise<TMDbDiscoverResponse>
   */
  static async getPopularMovies(
    page: number = API.DEFAULT_PAGE,
    signal?: AbortSignal
  ): Promise<TMDbDiscoverResponse> {
    const data = await this.get<unknown>(
      '/discover/movie',
      {
        page: page.toString(),
        sort_by: 'popularity.desc',
      },
      signal
    );
    return TMDbDiscoverResponseSchema.parse(data);
  }

  /**
   * Get top-rated TV shows
   * Endpoint: /discover/tv
   *
   * @param page - Page number (default: 1)
   * @param signal - AbortSignal for cancellation
   * @returns Promise<TMDbDiscoverResponse>
   */
  static async getTopRatedTV(
    page: number = API.DEFAULT_PAGE,
    signal?: AbortSignal
  ): Promise<TMDbDiscoverResponse> {
    const data = await this.get<unknown>(
      '/discover/tv',
      {
        page: page.toString(),
        sort_by: 'vote_average.desc',
        'vote_count.gte': API.MIN_VOTE_COUNT.toString(),
      },
      signal
    );
    return TMDbDiscoverResponseSchema.parse(data);
  }

  /**
   * Get videos/trailers for a specific movie
   * Endpoint: /movie/{movieId}/videos
   *
   * @param movieId - TMDb movie ID
   * @param signal - AbortSignal for cancellation
   * @returns Promise<TMDbVideosResponse>
   */
  static async getMovieVideos(
    movieId: number,
    signal?: AbortSignal
  ): Promise<TMDbVideosResponse> {
    const data = await this.get<unknown>(
      `/movie/${movieId}/videos`,
      {},
      signal
    );
    return TMDbVideosResponseSchema.parse(data);
  }

  /**
   * Get reviews for a specific movie
   * Endpoint: /movie/{movieId}/reviews
   *
   * @param movieId - TMDb movie ID
   * @param page - Page number (default: 1)
   * @param signal - AbortSignal for cancellation
   * @returns Promise<TMDbReviewsResponse>
   */
  static async getMovieReviews(
    movieId: number,
    page: number = API.DEFAULT_PAGE,
    signal?: AbortSignal
  ): Promise<TMDbReviewsResponse> {
    const data = await this.get<unknown>(
      `/movie/${movieId}/reviews`,
      { page: page.toString() },
      signal
    );
    return TMDbReviewsResponseSchema.parse(data);
  }

  /**
   * Construct full poster image URL from poster_path
   *
   * @param posterPath - Poster path from TMDb API (e.g., '/abc123.jpg')
   * @param size - Image size
   * @returns Full image URL or placeholder if posterPath is null
   */
  static getPosterUrl(
    posterPath: string | null,
    size: keyof typeof IMAGE_SIZES.POSTER = 'MEDIUM'
  ): string {
    if (!posterPath) {
      return PLACEHOLDERS.POSTER;
    }
    return `${API.TMDB_IMAGE_BASE_URL}/${IMAGE_SIZES.POSTER[size]}${posterPath}`;
  }

  /**
   * Construct full backdrop image URL from backdrop_path
   *
   * @param backdropPath - Backdrop path from TMDb API
   * @param size - Image size
   * @returns Full image URL or placeholder if backdropPath is null
   */
  static getBackdropUrl(
    backdropPath: string | null,
    size: keyof typeof IMAGE_SIZES.BACKDROP = 'MEDIUM'
  ): string {
    if (!backdropPath) {
      return PLACEHOLDERS.BACKDROP;
    }
    return `${API.TMDB_IMAGE_BASE_URL}/${IMAGE_SIZES.BACKDROP[size]}${backdropPath}`;
  }
}
