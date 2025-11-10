/**
 * Unit tests for movieStore
 * Covers offline mode, syncing debounce, error handling, and refreshMovies
 */

import { useMovieStore } from '../../src/store/movieStore';
import { TMDbService } from '../../src/api/tmdb';
import { insertMovie, getFavoriteMovies } from '../../src/database/queries';

// Mock database queries
jest.mock('../../src/database/queries', () => ({
  getAllMovies: jest.fn().mockResolvedValue([]),
  getPopularMovies: jest.fn().mockResolvedValue([]),
  getTopRatedMovies: jest.fn().mockResolvedValue([]),
  getFavoriteMovies: jest.fn().mockResolvedValue([]),
  insertMovie: jest.fn().mockResolvedValue(undefined),
  getMovieById: jest.fn(),
}));

// Mock TMDb API
jest.mock('../../src/api/tmdb', () => ({
  TMDbService: {
    getPopularMovies: jest.fn(),
    getTopRatedTV: jest.fn(),
  },
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

describe('movieStore - syncMoviesWithAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMovieStore.setState({
      movies: [],
      loading: false,
      error: null,
      syncing: false,
      isOffline: false,
    });
  });

  it('should skip sync when offline', async () => {
    // Set offline mode
    useMovieStore.setState({ isOffline: true });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await useMovieStore.getState().syncMoviesWithAPI();

    expect(consoleSpy).toHaveBeenCalledWith('Offline mode: skipping API sync, using cached data');
    expect(useMovieStore.getState().error).toBe('You are offline. Showing cached movies.');
    expect(TMDbService.getPopularMovies).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should skip sync when already syncing', async () => {
    // Set syncing mode
    useMovieStore.setState({ syncing: true });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await useMovieStore.getState().syncMoviesWithAPI();

    expect(consoleSpy).toHaveBeenCalledWith('Sync already in progress, skipping...');
    expect(TMDbService.getPopularMovies).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle API errors during sync', async () => {
    (TMDbService.getPopularMovies as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    await useMovieStore.getState().syncMoviesWithAPI();

    const state = useMovieStore.getState();
    expect(state.error).toBe('Failed to sync with API: Network error');
    expect(state.syncing).toBe(false);
    expect(state.loading).toBe(false);
  });

  it('should successfully sync movies from API', async () => {
    const mockPopularMovies = {
      results: [
        {
          id: 1,
          title: 'Popular Movie',
          overview: 'Description',
          poster_path: '/poster.jpg',
          release_date: '2024-01-01',
          vote_average: 8.5,
          vote_count: 100,
          popularity: 50,
          original_language: 'en',
        },
      ],
    };

    const mockTopRatedTV = {
      results: [
        {
          id: 2,
          name: 'Top Rated TV',
          overview: 'TV Description',
          poster_path: '/tv.jpg',
          first_air_date: '2024-01-02',
          vote_average: 9.0,
          vote_count: 200,
          popularity: 60,
          original_language: 'en',
        },
      ],
    };

    (TMDbService.getPopularMovies as jest.Mock).mockResolvedValueOnce(mockPopularMovies);
    (TMDbService.getTopRatedTV as jest.Mock).mockResolvedValueOnce(mockTopRatedTV);

    await useMovieStore.getState().syncMoviesWithAPI();

    expect(insertMovie).toHaveBeenCalledTimes(2);
    expect(insertMovie).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        title: 'Popular Movie',
        popular: true,
        toprated: false,
        favorite: false,
      })
    );
    expect(insertMovie).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 2,
        title: 'Top Rated TV',
        popular: false,
        toprated: true,
        favorite: false,
      })
    );
  });
});

describe('movieStore - refreshMovies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMovieStore.setState({
      movies: [],
      loading: false,
      error: null,
      syncing: false,
      isOffline: false,
    });
  });

  it('should skip refresh when offline', async () => {
    useMovieStore.setState({ isOffline: true });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await useMovieStore.getState().refreshMovies();

    expect(consoleSpy).toHaveBeenCalledWith('Offline mode: cannot refresh, showing cached data');
    expect(useMovieStore.getState().error).toBe(
      'Cannot refresh while offline. Showing cached movies.'
    );
    expect(TMDbService.getPopularMovies).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should skip refresh when already syncing', async () => {
    useMovieStore.setState({ syncing: true });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await useMovieStore.getState().refreshMovies();

    expect(consoleSpy).toHaveBeenCalledWith('Refresh already in progress, skipping...');
    expect(TMDbService.getPopularMovies).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should preserve favorite status during refresh', async () => {
    // Set up existing favorites
    const existingFavorites = [
      {
        id: 1,
        title: 'Favorite Movie',
        overview: 'Description',
        poster_path: '/poster.jpg',
        release_date: '2024-01-01',
        vote_average: 8.5,
        vote_count: 100,
        popularity: 50,
        original_language: 'en',
        favorite: true,
        popular: true,
        toprated: false,
      },
    ];

    (getFavoriteMovies as jest.Mock).mockResolvedValueOnce(existingFavorites);

    const mockPopularMovies = {
      results: [
        {
          id: 1,
          title: 'Favorite Movie Updated',
          overview: 'Updated Description',
          poster_path: '/poster.jpg',
          release_date: '2024-01-01',
          vote_average: 9.0,
          vote_count: 150,
          popularity: 60,
          original_language: 'en',
        },
      ],
    };

    const mockTopRatedTV = {
      results: [],
    };

    (TMDbService.getPopularMovies as jest.Mock).mockResolvedValueOnce(mockPopularMovies);
    (TMDbService.getTopRatedTV as jest.Mock).mockResolvedValueOnce(mockTopRatedTV);

    await useMovieStore.getState().refreshMovies();

    // Verify favorite status was preserved
    expect(insertMovie).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        favorite: true, // Should be preserved
        popular: true,
        toprated: false,
      })
    );
  });

  it('should handle API errors during refresh', async () => {
    (getFavoriteMovies as jest.Mock).mockResolvedValueOnce([]);
    (TMDbService.getPopularMovies as jest.Mock).mockRejectedValueOnce(
      new Error('API timeout')
    );

    await useMovieStore.getState().refreshMovies();

    const state = useMovieStore.getState();
    expect(state.error).toBe('Failed to refresh movies: API timeout');
    expect(state.syncing).toBe(false);
    expect(state.loading).toBe(false);
  });

  it('should handle non-Error exceptions during refresh', async () => {
    (getFavoriteMovies as jest.Mock).mockResolvedValueOnce([]);
    (TMDbService.getPopularMovies as jest.Mock).mockRejectedValueOnce('String error');

    await useMovieStore.getState().refreshMovies();

    const state = useMovieStore.getState();
    expect(state.error).toContain('Failed to refresh movies');
    expect(state.syncing).toBe(false);
    expect(state.loading).toBe(false);
  });
});

describe('movieStore - setOfflineStatus', () => {
  it('should update offline status', () => {
    useMovieStore.getState().setOfflineStatus(true);
    expect(useMovieStore.getState().isOffline).toBe(true);

    useMovieStore.getState().setOfflineStatus(false);
    expect(useMovieStore.getState().isOffline).toBe(false);
  });
});
