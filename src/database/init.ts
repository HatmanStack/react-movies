/**
 * Database initialization and connection management
 * Implements singleton pattern for SQLite database access
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA_STATEMENTS, CURRENT_DB_VERSION } from './schema';

/**
 * Singleton database instance
 */
let database: SQLite.SQLiteDatabase | null = null;

/**
 * Database name
 */
const DB_NAME = 'movies.db';

/**
 * Initialize the database
 * - Creates tables if they don't exist
 * - Sets up database version tracking
 * - Idempotent (safe to call multiple times)
 *
 * @returns Promise<void>
 */
export async function initDatabase(): Promise<void> {
  try {
    const db = getDatabase();

    // Execute all schema creation statements
    for (const statement of SCHEMA_STATEMENTS) {
      await db.execAsync(statement);
    }

    // Set or verify database version
    const versionRow = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM database_version LIMIT 1'
    );

    if (!versionRow) {
      // First time initialization
      await db.runAsync('INSERT INTO database_version (version) VALUES (?)', [
        CURRENT_DB_VERSION,
      ]);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error(
      `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get database instance (singleton pattern)
 * Opens database connection if not already open
 *
 * @returns SQLiteDatabase instance
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    try {
      database = SQLite.openDatabaseSync(DB_NAME);
    } catch (error) {
      console.error('Failed to open database:', error);
      throw new Error(
        `Failed to open database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  return database;
}

/**
 * Close database connection (for cleanup/testing)
 */
export function closeDatabase(): void {
  if (database) {
    try {
      database.closeSync();
      database = null;
    } catch (error) {
      console.error('Failed to close database:', error);
    }
  }
}

/**
 * Reset database (for testing only)
 * Drops all tables and reinitializes
 */
export async function resetDatabase(): Promise<void> {
  try {
    const db = getDatabase();

    // Drop all tables
    await db.execAsync('DROP TABLE IF EXISTS movie_details');
    await db.execAsync('DROP TABLE IF EXISTS video_details');
    await db.execAsync('DROP TABLE IF EXISTS review_details');
    await db.execAsync('DROP TABLE IF EXISTS database_version');

    // Reinitialize
    await initDatabase();
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
}
