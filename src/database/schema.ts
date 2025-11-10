/**
 * Database schema definitions for SQLite
 * Migrated from Android Room entities
 */

/**
 * Movie Details table schema
 * Migrated from: MovieDetails.java Room entity
 *
 * Column mapping:
 * - boolean fields (favorite, toprated, popular) → INTEGER (0=false, 1=true)
 * - int fields → INTEGER
 * - float fields → REAL
 * - String fields → TEXT
 */
export const CREATE_MOVIE_DETAILS_TABLE = `
  CREATE TABLE IF NOT EXISTS movie_details (
    id INTEGER PRIMARY KEY,
    title TEXT,
    overview TEXT,
    poster_path TEXT,
    release_date TEXT,
    vote_average INTEGER,
    vote_count INTEGER,
    popularity REAL,
    original_language TEXT,
    favorite INTEGER DEFAULT 0,
    toprated INTEGER DEFAULT 0,
    popular INTEGER DEFAULT 0
  );
`;

/**
 * Video Details table schema
 * Migrated from: VideoDetails.java Room entity
 *
 * Note:
 * - identity is auto-increment primary key
 * - id is foreign key reference to movie_details.id (not enforced)
 */
export const CREATE_VIDEO_DETAILS_TABLE = `
  CREATE TABLE IF NOT EXISTS video_details (
    identity INTEGER PRIMARY KEY AUTOINCREMENT,
    id INTEGER,
    image_url TEXT,
    iso_639_1 TEXT,
    iso_3166_1 TEXT,
    key TEXT,
    site TEXT,
    size TEXT,
    type TEXT
  );
`;

/**
 * Review Details table schema
 * Migrated from: ReviewDetails.java Room entity
 *
 * Note:
 * - identity is auto-increment primary key
 * - id is foreign key reference to movie_details.id (not enforced)
 */
export const CREATE_REVIEW_DETAILS_TABLE = `
  CREATE TABLE IF NOT EXISTS review_details (
    identity INTEGER PRIMARY KEY AUTOINCREMENT,
    id INTEGER,
    author TEXT,
    content TEXT
  );
`;

/**
 * Database version tracking table
 * Used for future schema migrations
 */
export const CREATE_VERSION_TABLE = `
  CREATE TABLE IF NOT EXISTS database_version (
    version INTEGER PRIMARY KEY
  );
`;

/**
 * Performance indexes for frequently queried columns
 */
export const CREATE_INDEXES = [
  // Index for favorite movies filter
  `CREATE INDEX IF NOT EXISTS idx_movie_favorite ON movie_details(favorite);`,

  // Index for popular movies filter
  `CREATE INDEX IF NOT EXISTS idx_movie_popular ON movie_details(popular);`,

  // Index for top-rated movies filter
  `CREATE INDEX IF NOT EXISTS idx_movie_toprated ON movie_details(toprated);`,

  // Index for video lookups by movie ID
  `CREATE INDEX IF NOT EXISTS idx_video_movie_id ON video_details(id);`,

  // Index for trailer lookups (id + type)
  `CREATE INDEX IF NOT EXISTS idx_video_trailer ON video_details(id, type);`,

  // Index for review lookups by movie ID
  `CREATE INDEX IF NOT EXISTS idx_review_movie_id ON review_details(id);`,
];

/**
 * All schema creation statements
 */
export const SCHEMA_STATEMENTS = [
  CREATE_MOVIE_DETAILS_TABLE,
  CREATE_VIDEO_DETAILS_TABLE,
  CREATE_REVIEW_DETAILS_TABLE,
  CREATE_VERSION_TABLE,
  ...CREATE_INDEXES,
];

/**
 * Current database version
 * Increment this when schema changes are made
 */
export const CURRENT_DB_VERSION = 1;
