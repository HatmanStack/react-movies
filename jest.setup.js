/* eslint-env jest, node */
// Jest setup file for React Native Testing Library
// extend-expect is now built into @testing-library/react-native v12.4+

// Set up test environment variables before any modules are imported
process.env.EXPO_PUBLIC_TMDB_API_KEY = 'test_tmdb_api_key';
process.env.EXPO_PUBLIC_YOUTUBE_API_KEY = 'test_youtube_api_key';

// Mock expo-sqlite for database tests
// In-memory mock implementation
jest.mock('expo-sqlite', () => {
  const tables = new Map();

  class MockDatabase {
    async execAsync(sql) {
      if (sql.includes('CREATE TABLE IF NOT EXISTS movie_details')) tables.set('movie_details', []);
      else if (sql.includes('CREATE TABLE IF NOT EXISTS video_details'))
        tables.set('video_details', []);
      else if (sql.includes('CREATE TABLE IF NOT EXISTS review_details'))
        tables.set('review_details', []);
      else if (sql.includes('CREATE TABLE IF NOT EXISTS database_version'))
        tables.set('database_version', []);
      else if (sql.includes('DROP TABLE')) {
        const tableName = sql.match(/DROP TABLE IF EXISTS (\w+)/)?.[1];
        if (tableName) tables.delete(tableName);
      }
    }

    async runAsync(sql, params = []) {
      if (sql.includes('INSERT OR REPLACE INTO movie_details')) {
        const table = tables.get('movie_details') || [];
        const [
          id,
          title,
          overview,
          poster_path,
          release_date,
          vote_average,
          vote_count,
          popularity,
          original_language,
          favorite,
          toprated,
          popular,
        ] = params;
        const filtered = table.filter((row) => row.id !== id);
        filtered.push({
          id,
          title,
          overview,
          poster_path,
          release_date,
          vote_average,
          vote_count,
          popularity,
          original_language,
          favorite,
          toprated,
          popular,
        });
        tables.set('movie_details', filtered);
      } else if (sql.includes('INSERT OR REPLACE INTO video_details')) {
        const table = tables.get('video_details') || [];
        const [id, image_url, iso_639_1, iso_3166_1, key, site, size, type] = params;
        table.push({
          identity: table.length + 1,
          id,
          image_url,
          iso_639_1,
          iso_3166_1,
          key,
          site,
          size,
          type,
        });
        tables.set('video_details', table);
      } else if (sql.includes('INSERT OR REPLACE INTO review_details')) {
        const table = tables.get('review_details') || [];
        const [id, author, content] = params;
        table.push({ identity: table.length + 1, id, author, content });
        tables.set('review_details', table);
      } else if (sql.includes('INSERT INTO database_version')) {
        const table = tables.get('database_version') || [];
        table.push({ version: params[0] });
        tables.set('database_version', table);
      } else if (sql.includes('DELETE FROM movie_details')) {
        const table = tables.get('movie_details') || [];
        tables.set(
          'movie_details',
          table.filter((row) => row.id !== params[0])
        );
      }
      return { changes: 1, lastInsertRowId: 1 };
    }

    async getFirstAsync(sql, params = []) {
      const rows = await this.getAllAsync(sql, params);
      return rows.length > 0 ? rows[0] : null;
    }

    async getAllAsync(sql, params = []) {
      if (sql.includes('FROM movie_details')) {
        const table = tables.get('movie_details') || [];
        if (sql.includes('WHERE id = ?')) return table.filter((row) => row.id === params[0]);
        if (sql.includes('WHERE favorite = 1')) return table.filter((row) => row.favorite === 1);
        if (sql.includes('WHERE popular = 1')) return table.filter((row) => row.popular === 1);
        if (sql.includes('WHERE toprated = 1')) return table.filter((row) => row.toprated === 1);
        return table;
      } else if (sql.includes('FROM video_details')) {
        const table = tables.get('video_details') || [];
        if (sql.includes("WHERE type = 'Trailer'"))
          return table.filter((row) => row.id === params[0] && row.type === 'Trailer');
        if (sql.includes('WHERE id = ?')) return table.filter((row) => row.id === params[0]);
        return table;
      } else if (sql.includes('FROM review_details')) {
        const table = tables.get('review_details') || [];
        if (sql.includes('WHERE id = ?')) return table.filter((row) => row.id === params[0]);
        return table;
      } else if (sql.includes('FROM database_version')) {
        return tables.get('database_version') || [];
      }
      return [];
    }

    closeSync() {
      tables.clear();
    }
  }

  return {
    openDatabaseSync: () => new MockDatabase(),
    default: {
      openDatabaseSync: () => new MockDatabase(),
    },
  };
});

// Mock @react-native-community/netinfo for offline mode support
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
}));
