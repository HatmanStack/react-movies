/**
 * API response types for TMDb and YouTube APIs
 * These types represent the raw API responses before database mapping
 */

/**
 * TMDb API movie object (from /discover/movie or /discover/tv)
 */
export interface TMDbMovie {
  id: number;
  title?: string; // For movies
  name?: string; // For TV shows
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string; // For movies
  first_air_date?: string; // For TV shows
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  genre_ids: number[];
  adult: boolean;
  video: boolean;
}

/**
 * TMDb Discovery API response (paginated results)
 */
export interface TMDbDiscoverResponse {
  page: number;
  results: TMDbMovie[];
  total_results: number;
  total_pages: number;
}

/**
 * TMDb video object (trailer, clip, etc.)
 */
export interface TMDbVideo {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

/**
 * TMDb Videos API response
 */
export interface TMDbVideosResponse {
  id: number;
  results: TMDbVideo[];
}

/**
 * TMDb review object
 */
export interface TMDbReview {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
}

/**
 * TMDb Reviews API response (paginated)
 */
export interface TMDbReviewsResponse {
  id: number;
  page: number;
  results: TMDbReview[];
  total_pages: number;
  total_results: number;
}

/**
 * YouTube Data API v3 video snippet
 */
export interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: YouTubeThumbnail;
    medium: YouTubeThumbnail;
    high: YouTubeThumbnail;
    standard?: YouTubeThumbnail;
    maxres?: YouTubeThumbnail;
  };
  channelTitle: string;
  tags?: string[];
  categoryId: string;
}

/**
 * YouTube thumbnail object
 */
export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

/**
 * YouTube Data API v3 video item
 */
export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubeVideoSnippet;
}

/**
 * YouTube Data API v3 videos response
 */
export interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideoItem[];
}
