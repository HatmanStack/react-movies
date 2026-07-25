/* global jest, beforeEach, afterEach */
// Jest setup file for React Native Testing Library
// extend-expect is now built into @testing-library/react-native v12.4+

// Set up test environment variables before any modules are imported
process.env.EXPO_PUBLIC_TMDB_API_KEY = 'test_tmdb_api_key';
process.env.EXPO_PUBLIC_YOUTUBE_API_KEY = 'test_youtube_api_key';

// Mock Expo's import meta registry to fix "import outside test scope" errors
global.__ExpoImportMetaRegistry = {
  get: () => ({ url: 'file:///' }),
  set: () => {},
};

// Mock structuredClone for Node environments that don't have it
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Expo SDK 57 installs its WinterCG globals as enumerable lazy getters that
// `require()` on first access. Jest enumerates globals during teardown, which
// fires any getter still unread after the module registry is gone and throws
// "trying to `import` a file outside of the scope of the test code". Reading
// them here swaps each getter for a plain value while the registry is alive.
for (const name of [
  'fetch',
  'Headers',
  'Request',
  'Response',
  'TextDecoder',
  'TextDecoderStream',
  'TextEncoderStream',
  'URL',
  'URLSearchParams',
  'DOMException',
]) {
  try {
    void global[name];
  } catch {
    // Global not installed on this platform preset; nothing to materialize.
  }
}

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
        // Handle WHERE type = ? AND id = ? (params: [type, movieId])
        if (sql.includes('WHERE type = ?') && sql.includes('AND id = ?')) {
          return table.filter((row) => row.type === params[0] && row.id === params[1]);
        }
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

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => {
  let storage = {};

  return {
    __esModule: true,
    default: {
      setItem: jest.fn((key, value) => {
        storage[key] = value;
        return Promise.resolve();
      }),
      getItem: jest.fn((key) => Promise.resolve(storage[key] || null)),
      removeItem: jest.fn((key) => {
        delete storage[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storage = {};
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(storage))),
      multiGet: jest.fn((keys) =>
        Promise.resolve(keys.map((key) => [key, storage[key] || null]))
      ),
      multiSet: jest.fn((keyValuePairs) => {
        keyValuePairs.forEach(([key, value]) => {
          storage[key] = value;
        });
        return Promise.resolve();
      }),
      setMany: jest.fn((entries) => {
        Object.entries(entries).forEach(([key, value]) => {
          storage[key] = value;
        });
        return Promise.resolve();
      }),
      getMany: jest.fn((keys) => {
        const result = {};
        keys.forEach((key) => {
          result[key] = storage[key] || null;
        });
        return Promise.resolve(result);
      }),
      multiRemove: jest.fn((keys) => {
        keys.forEach((key) => delete storage[key]);
        return Promise.resolve();
      }),
    },
  };
});

// Mock react-native-worklets
jest.mock('react-native-worklets', () => ({
  createSerializable: jest.fn(() => ({})),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      call: jest.fn(),
      createAnimatedComponent: (component) => component,
      View: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref })),
      Text: React.forwardRef((props, ref) => React.createElement('Text', { ...props, ref })),
      Image: React.forwardRef((props, ref) => React.createElement('Image', { ...props, ref })),
      ScrollView: React.forwardRef((props, ref) => React.createElement('ScrollView', { ...props, ref })),
      FlatList: React.forwardRef((props, ref) => React.createElement('FlatList', { ...props, ref })),
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedRef: jest.fn(() => ({ current: null })),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
    withDecay: jest.fn((val) => val),
    withDelay: jest.fn((_, val) => val),
    withSequence: jest.fn((...vals) => vals[0]),
    withRepeat: jest.fn((val) => val),
    Easing: { linear: jest.fn(), ease: jest.fn(), bezier: jest.fn(() => jest.fn()) },
    FadeIn: { duration: jest.fn(() => ({ delay: jest.fn() })) },
    FadeOut: { duration: jest.fn(() => ({ delay: jest.fn() })) },
    SlideInRight: { duration: jest.fn() },
    SlideOutLeft: { duration: jest.fn() },
    Layout: { duration: jest.fn() },
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    createAnimatedComponent: (component) => component,
  };
});

// Mock expo-router
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: jest.fn((callback) => {
      React.useEffect(() => {
        callback();
      }, []);
    }),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    })),
    useLocalSearchParams: jest.fn(() => ({})),
    useSegments: jest.fn(() => []),
    usePathname: jest.fn(() => '/'),
    Stack: {
      Screen: ({ children }) => children,
    },
    Link: ({ children }) => children,
    Redirect: ({ children }) => children,
  };
});
