/**
 * TMDb API Service
 * Implements all TMDb API endpoints used in the application
 */

import { APIError, NetworkError } from './errors';
import {
  TMDbDiscoverResponse,
  TMDbVideosResponse,
  TMDbReviewsResponse,
} from './types';

/**
 * TMDb API configuration constants
 */
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

/**
 * TMDb API Service class
 * Provides typed methods for all TMDb API endpoints
 */
export class TMDbService {
  /**
   * Generic GET request handler with error handling
   */
  private static async get<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    try {
      const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

      // Add API key
      if (!TMDB_API_KEY) {
        throw new APIError('TMDb API key not configured', undefined, endpoint);
      }
      url.searchParams.append('api_key', TMDB_API_KEY);

      // Add additional parameters
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorMessage = `API request failed: ${response.statusText}`;
        throw new APIError(errorMessage, response.status, endpoint);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new NetworkError(`Network request failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get popular movies
   * Endpoint: /discover/movie
   * @param page - Page number (default: 1)
   * @returns Promise<TMDbDiscoverResponse>
   */
  static async getPopularMovies(page: number = 1): Promise<TMDbDiscoverResponse> {
    return this.get<TMDbDiscoverResponse>('/discover/movie', {
      page: page.toString(),
      sort_by: 'popularity.desc',
    });
  }

  /**
   * Get top-rated TV shows
   * Endpoint: /discover/tv
   * @param page - Page number (default: 1)
   * @returns Promise<TMDbDiscoverResponse>
   */
  static async getTopRatedTV(page: number = 1): Promise<TMDbDiscoverResponse> {
    return this.get<TMDbDiscoverResponse>('/discover/tv', {
      page: page.toString(),
      sort_by: 'vote_average.desc',
      'vote_count.gte': '100', // Only include shows with at least 100 votes
    });
  }

  /**
   * Get videos/trailers for a specific movie
   * Endpoint: /movie/{movieId}/videos
   * @param movieId - TMDb movie ID
   * @returns Promise<TMDbVideosResponse>
   */
  static async getMovieVideos(movieId: number): Promise<TMDbVideosResponse> {
    return this.get<TMDbVideosResponse>(`/movie/${movieId}/videos`);
  }

  /**
   * Get reviews for a specific movie
   * Endpoint: /movie/{movieId}/reviews
   * @param movieId - TMDb movie ID
   * @param page - Page number (default: 1)
   * @returns Promise<TMDbReviewsResponse>
   */
  static async getMovieReviews(
    movieId: number,
    page: number = 1
  ): Promise<TMDbReviewsResponse> {
    return this.get<TMDbReviewsResponse>(`/movie/${movieId}/reviews`, {
      page: page.toString(),
    });
  }

  /**
   * Construct full poster image URL from poster_path
   * @param posterPath - Poster path from TMDb API (e.g., '/abc123.jpg')
   * @param size - Image size ('w185', 'w342', 'w500', 'w780', 'original')
   * @returns Full image URL or placeholder if posterPath is null
   */
  static getPosterUrl(
    posterPath: string | null,
    size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'
  ): string {
    if (!posterPath) {
      // Return placeholder image URL when poster is not available
      return 'https://via.placeholder.com/342x513?text=No+Image';
    }
    return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`;
  }

  /**
   * Construct full backdrop image URL from backdrop_path
   * @param backdropPath - Backdrop path from TMDb API
   * @param size - Image size ('w300', 'w780', 'w1280', 'original')
   * @returns Full image URL or placeholder if backdropPath is null
   */
  static getBackdropUrl(
    backdropPath: string | null,
    size: 'w300' | 'w780' | 'w1280' | 'original' = 'w780'
  ): string {
    if (!backdropPath) {
      return 'https://via.placeholder.com/780x439?text=No+Image';
    }
    return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath}`;
  }
}
