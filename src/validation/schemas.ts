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



/**
 * ReviewDetails validation schema
 */
export const ReviewDetailsSchema = z.object({
  identity: z.number().optional(),
  id: z.number().int().positive(),
  author: z.string(),
  content: z.string(),
});



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



/**
 * TMDb paginated response schema
 */
export const TMDbDiscoverResponseSchema = z.object({
  page: z.number().int().positive(),
  results: z.array(TMDbMovieSchema),
  total_pages: z.number().int().nonnegative(),
  total_results: z.number().int().nonnegative(),
});



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



/**
 * TMDb Videos response schema
 */
export const TMDbVideosResponseSchema = z.object({
  id: z.number().int().positive(),
  results: z.array(TMDbVideoSchema),
});



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



