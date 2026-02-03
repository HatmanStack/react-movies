/**
 * Application Constants
 * Centralized configuration to eliminate magic strings and numbers
 */

/**
 * Filter type constants
 */
export const FILTERS = {
  POPULAR: 'popular',
  TOP_RATED: 'toprated',
  FAVORITES: 'favorites',
  ALL: 'all',
} as const;

export type FilterType = (typeof FILTERS)[keyof typeof FILTERS];

/**
 * Default filter configuration
 */
export const DEFAULT_FILTERS: FilterType[] = [FILTERS.POPULAR, FILTERS.TOP_RATED];

/**
 * API configuration
 */
export const API = {
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  YOUTUBE_BASE_URL: 'https://www.googleapis.com/youtube/v3',
  YOUTUBE_THUMBNAIL_BASE: 'https://img.youtube.com/vi',
  MIN_VOTE_COUNT: 100,
  DEFAULT_PAGE: 1,
} as const;

/**
 * Image size constants for TMDb
 */
export const IMAGE_SIZES = {
  POSTER: {
    SMALL: 'w185',
    MEDIUM: 'w342',
    LARGE: 'w500',
    XLARGE: 'w780',
    ORIGINAL: 'original',
  },
  BACKDROP: {
    SMALL: 'w300',
    MEDIUM: 'w780',
    LARGE: 'w1280',
    ORIGINAL: 'original',
  },
} as const;

/**
 * Responsive breakpoints for grid columns
 */
export const BREAKPOINTS = {
  XL: 1500,
  LG: 1200,
  MD: 900,
  SM: 600,
} as const;

/**
 * Grid column counts by breakpoint
 */
export const GRID_COLUMNS = {
  XL: 6,
  LG: 5,
  MD: 4,
  SM: 3,
  XS: 2,
} as const;

/**
 * Database configuration
 */
export const DB = {
  NAME: 'movies.db',
  VERSION: 1,
} as const;

/**
 * Video types
 */
export const VIDEO_TYPES = {
  TRAILER: 'Trailer',
  CLIP: 'Clip',
  FEATURETTE: 'Featurette',
  TEASER: 'Teaser',
} as const;

/**
 * Retry configuration
 */
export const RETRY = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  RETRYABLE_STATUS_CODES: [429, 500, 502, 503, 504],
} as const;

/**
 * Pagination configuration
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  ITEMS_PER_PAGE: 20,
  INFINITE_SCROLL_THRESHOLD: 0.5,
} as const;

/**
 * Animation configuration
 */
export const ANIMATION = {
  SPRING_DAMPING: 15,
  SPRING_STIFFNESS: 300,
  SCALE_PRESSED: 0.95,
  SCALE_NORMAL: 1,
  IMAGE_TRANSITION_MS: 200,
} as const;

/**
 * Placeholder URLs
 */
export const PLACEHOLDERS = {
  POSTER: 'https://via.placeholder.com/342x513?text=No+Image',
  BACKDROP: 'https://via.placeholder.com/780x439?text=No+Image',
} as const;

/**
 * Color constants
 */
export const COLORS = {
  PRIMARY: '#1976D2',
  SECONDARY: '#FFC107',
  FAVORITE: '#E91E63',
  RATING: '#FFC107',
  ERROR: '#f44336',
  BACKGROUND: '#f5f5f5',
  TEXT_SECONDARY: '#666',
  TEXT_TERTIARY: '#999',
} as const;
