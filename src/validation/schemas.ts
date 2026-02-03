/**
 * Zod Validation Schemas
 * Runtime type validation for external data (API responses, storage reads)
 */

import { z } from 'zod';

// ============================================================================
// DOMAIN MODEL SCHEMAS
// ============================================================================

/**
 * MovieDetails validation schema
 */
export const MovieDetailsSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  overview: z.string(),
  poster_path: z.string(),
  release_date: z.string(),
  vote_average: z.number().min(0).max(10),
  vote_count: z.number().int().nonnegative(),
  popularity: z.number().nonnegative(),
  original_language: z.string(),
  favorite: z.boolean(),
  toprated: z.boolean(),
  popular: z.boolean(),
});

export type ValidatedMovieDetails = z.infer<typeof MovieDetailsSchema>;

/**
 * VideoDetails validation schema
 */
export const VideoDetailsSchema = z.object({
  identity: z.number().optional(),
  id: z.number().int().positive(),
  image_url: z.string(),
  iso_639_1: z.string(),
  iso_3166_1: z.string(),
  key: z.string(),
  site: z.string(),
  size: z.string(),
  type: z.string(),
});

export type ValidatedVideoDetails = z.infer<typeof VideoDetailsSchema>;

/**
 * ReviewDetails validation schema
 */
export const ReviewDetailsSchema = z.object({
  identity: z.number().optional(),
  id: z.number().int().positive(),
  author: z.string(),
  content: z.string(),
});

export type ValidatedReviewDetails = z.infer<typeof ReviewDetailsSchema>;

// ============================================================================
// TMDb API RESPONSE SCHEMAS
// ============================================================================

/**
 * TMDb Movie/TV show response schema
 */
export const TMDbMovieSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().optional(),
  name: z.string().optional(),
  overview: z.string(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable().optional(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  vote_average: z.number(),
  vote_count: z.number().int(),
  popularity: z.number(),
  original_language: z.string(),
  genre_ids: z.array(z.number().int()).optional(),
  adult: z.boolean().optional(),
  video: z.boolean().optional(),
});

export type ValidatedTMDbMovie = z.infer<typeof TMDbMovieSchema>;

/**
 * TMDb paginated response schema
 */
export const TMDbDiscoverResponseSchema = z.object({
  page: z.number().int().positive(),
  results: z.array(TMDbMovieSchema),
  total_pages: z.number().int().nonnegative(),
  total_results: z.number().int().nonnegative(),
});

export type ValidatedTMDbDiscoverResponse = z.infer<typeof TMDbDiscoverResponseSchema>;

/**
 * TMDb Video response schema
 */
export const TMDbVideoSchema = z.object({
  id: z.string(),
  iso_639_1: z.string(),
  iso_3166_1: z.string(),
  key: z.string(),
  name: z.string().optional(),
  site: z.string(),
  size: z.number().int(),
  type: z.string(),
  official: z.boolean().optional(),
  published_at: z.string().optional(),
});

export type ValidatedTMDbVideo = z.infer<typeof TMDbVideoSchema>;

/**
 * TMDb Videos response schema
 */
export const TMDbVideosResponseSchema = z.object({
  id: z.number().int().positive(),
  results: z.array(TMDbVideoSchema),
});

export type ValidatedTMDbVideosResponse = z.infer<typeof TMDbVideosResponseSchema>;

/**
 * TMDb Review response schema
 */
export const TMDbReviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  content: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  url: z.string().optional(),
  author_details: z
    .object({
      name: z.string().optional(),
      username: z.string().optional(),
      avatar_path: z.string().nullable().optional(),
      rating: z.number().nullable().optional(),
    })
    .optional(),
});

export type ValidatedTMDbReview = z.infer<typeof TMDbReviewSchema>;

/**
 * TMDb Reviews response schema
 */
export const TMDbReviewsResponseSchema = z.object({
  id: z.number().int().positive(),
  page: z.number().int().positive(),
  results: z.array(TMDbReviewSchema),
  total_pages: z.number().int().nonnegative(),
  total_results: z.number().int().nonnegative(),
});

export type ValidatedTMDbReviewsResponse = z.infer<typeof TMDbReviewsResponseSchema>;

// ============================================================================
// YOUTUBE API RESPONSE SCHEMAS
// ============================================================================

/**
 * YouTube thumbnail schema
 */
export const YouTubeThumbnailSchema = z.object({
  url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

/**
 * YouTube video snippet schema
 */
export const YouTubeSnippetSchema = z.object({
  thumbnails: z.object({
    default: YouTubeThumbnailSchema.optional(),
    medium: YouTubeThumbnailSchema.optional(),
    high: YouTubeThumbnailSchema.optional(),
    standard: YouTubeThumbnailSchema.optional(),
    maxres: YouTubeThumbnailSchema.optional(),
  }),
});

/**
 * YouTube video item schema
 */
export const YouTubeVideoItemSchema = z.object({
  id: z.string(),
  snippet: YouTubeSnippetSchema,
});

/**
 * YouTube API response schema
 */
export const YouTubeVideoResponseSchema = z.object({
  items: z.array(YouTubeVideoItemSchema),
});

export type ValidatedYouTubeVideoResponse = z.infer<typeof YouTubeVideoResponseSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Safe parse with detailed error info
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Parse and throw on validation error
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Parse with fallback on validation error
 */
export function validateWithFallback<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T
): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : fallback;
}

/**
 * Validate array with partial success (filter out invalid items)
 */
export function validateArray<T>(
  itemSchema: z.ZodSchema<T>,
  data: unknown[]
): T[] {
  return data
    .map(item => itemSchema.safeParse(item))
    .filter((result): result is { success: true; data: T } => result.success)
    .map(result => result.data);
}

/**
 * Validate TMDb discover response
 */
export function validateTMDbDiscoverResponse(data: unknown): ValidatedTMDbDiscoverResponse {
  return validate(TMDbDiscoverResponseSchema, data);
}

/**
 * Validate TMDb videos response
 */
export function validateTMDbVideosResponse(data: unknown): ValidatedTMDbVideosResponse {
  return validate(TMDbVideosResponseSchema, data);
}

/**
 * Validate TMDb reviews response
 */
export function validateTMDbReviewsResponse(data: unknown): ValidatedTMDbReviewsResponse {
  return validate(TMDbReviewsResponseSchema, data);
}

/**
 * Validate movie details from storage
 */
export function validateMovieDetails(data: unknown): ValidatedMovieDetails | null {
  const result = MovieDetailsSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate movie details array from storage
 */
export function validateMovieDetailsArray(data: unknown): ValidatedMovieDetails[] {
  if (!Array.isArray(data)) return [];
  return validateArray(MovieDetailsSchema, data);
}

/**
 * Validate video details array from storage
 */
export function validateVideoDetailsArray(data: unknown): ValidatedVideoDetails[] {
  if (!Array.isArray(data)) return [];
  return validateArray(VideoDetailsSchema, data);
}

/**
 * Validate review details array from storage
 */
export function validateReviewDetailsArray(data: unknown): ValidatedReviewDetails[] {
  if (!Array.isArray(data)) return [];
  return validateArray(ReviewDetailsSchema, data);
}
