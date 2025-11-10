/**
 * Domain models migrated from Android Room entities
 * These interfaces represent the local database schema
 */

/**
 * MovieDetails entity - migrated from MovieDetails.java
 * Represents a movie with all its metadata and user-specific flags
 */
export interface MovieDetails {
  /** TMDb movie ID (primary key) */
  id: number;
  /** Movie title */
  title: string;
  /** Movie plot/synopsis */
  overview: string;
  /** Poster image path (relative to TMDb image base URL) */
  poster_path: string;
  /** Release date in YYYY-MM-DD format */
  release_date: string;
  /** Average user rating */
  vote_average: number;
  /** Number of user votes */
  vote_count: number;
  /** Popularity score */
  popularity: number;
  /** Original language code (e.g., 'en') */
  original_language: string;
  /** User favorite flag */
  favorite: boolean;
  /** Top rated flag */
  toprated: boolean;
  /** Popular flag */
  popular: boolean;
}

/**
 * VideoDetails entity - migrated from VideoDetails.java
 * Represents a video/trailer associated with a movie
 */
export interface VideoDetails {
  /** Auto-generated primary key (optional for inserts) */
  identity?: number;
  /** Movie ID (foreign key to MovieDetails) */
  id: number;
  /** YouTube video thumbnail URL */
  image_url: string;
  /** ISO 639-1 language code */
  iso_639_1: string;
  /** ISO 3166-1 country code */
  iso_3166_1: string;
  /** YouTube video key/ID */
  key: string;
  /** Video hosting site (e.g., 'YouTube') */
  site: string;
  /** Video resolution (e.g., '1080', '720') */
  size: string;
  /** Video type (e.g., 'Trailer', 'Clip') */
  type: string;
}

/**
 * ReviewDetails entity - migrated from ReviewDetails.java
 * Represents a user review for a movie
 */
export interface ReviewDetails {
  /** Auto-generated primary key (optional for inserts) */
  identity?: number;
  /** Movie ID (foreign key to MovieDetails) */
  id: number;
  /** Review author name */
  author: string;
  /** Review content/text */
  content: string;
}
