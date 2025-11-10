/**
 * Database initialization and connection management
 * Implements singleton pattern for SQLite database access
 * Uses platform-specific storage: SQLite on native, AsyncStorage on web
 */

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
 * Check if we're running on web
 */
const isWeb = Platform.OS === 'web';

/**
 * Initialize the database
 * - Creates tables if they don't exist (native only)
 * - Sets up database version tracking
 * - Idempotent (safe to call multiple times)
 * - On web: uses AsyncStorage as fallback
 *
 * @returns Promise<void>
 */
export async function initDatabase(): Promise<void> {
  try {
    if (isWeb) {
      // Web platform: just mark as initialized
      await AsyncStorage.setItem('db_initialized', 'true');
      await AsyncStorage.setItem('db_version', String(CURRENT_DB_VERSION));
      console.log('Database initialized successfully (web mode - using AsyncStorage)');
      return;
    }

    // Native platform: use SQLite
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
 * NOTE: Only works on native platforms (iOS/Android)
 *
 * @returns SQLiteDatabase instance
 * @throws Error on web platform
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (isWeb) {
    throw new Error('SQLite database not available on web. Use AsyncStorage methods instead.');
  }

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
 * No-op on web platform
 */
export function closeDatabase(): void {
  if (isWeb) {
    // Nothing to close on web
    return;
  }

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
 * On web: clears all AsyncStorage data
 */
export async function resetDatabase(): Promise<void> {
  try {
    if (isWeb) {
      // Web platform: clear AsyncStorage
      await AsyncStorage.clear();
      await initDatabase();
      return;
    }

    // Native platform: drop tables
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
