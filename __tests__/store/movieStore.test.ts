/**
 * Zustand Movie Store tests
 * Tests all state management actions and error handling
 */

import { useMovieStore } from '../../src/store/movieStore';
import { MovieDetails } from '../../src/models/types';
import * as queries from '../../src/database/queries';

// Mock database queries
jest.mock('../../src/database/queries');

const mockQueries = queries as jest.Mocked<typeof queries>;

// Test data
const mockMovies: MovieDetails[] = [
  {
    id: 1,
    title: 'Test Movie 1',
    overview: 'Test description 1',
    poster_path: '/test1.jpg',
    release_date: '2024-01-01',
    vote_average: 8,
    vote_count: 100,
    popularity: 50.5,
    original_language: 'en',
    favorite: true,
    toprated: false,
    popular: true,
  },
  {
    id: 2,
    title: 'Test Movie 2',
    overview: 'Test description 2',
    poster_path: '/test2.jpg',
    release_date: '2024-01-02',
    vote_average: 7,
    vote_count: 80,
    popularity: 40.5,
    original_language: 'en',
    favorite: false,
    toprated: true,
    popular: false,
  },
  {
    id: 3,
    title: 'Test Movie 3',
    overview: 'Test description 3',
    poster_path: '/test3.jpg',
    release_date: '2024-01-03',
    vote_average: 9,
    vote_count: 150,
    popularity: 60.5,
    original_language: 'en',
    favorite: false,
    toprated: true,
    popular: true,
  },
];

describe('MovieStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useMovieStore.setState({
      movies: [],
      loading: false,
      error: null,
    });

    // Clear all mock calls
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useMovieStore.getState();

      expect(state.movies).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadMoviesFromFilters', () => {
    it('should load movies from a single filter', async () => {
      const popularMovies = [mockMovies[0], mockMovies[2]];
      mockQueries.getPopularMovies.mockResolvedValue(popularMovies);

      const store = useMovieStore.getState();
      await store.loadMoviesFromFilters(['popular']);

      const state = useMovieStore.getState();
      expect(state.movies).toEqual(popularMovies);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockQueries.getPopularMovies).toHaveBeenCalledTimes(1);
    });

    it('should combine movies from multiple filters', async () => {
      const popularMovies = [mockMovies[0], mockMovies[2]];
      const topRatedMovies = [mockMovies[1], mockMovies[2]]; // Movie 3 is in both

      mockQueries.getPopularMovies.mockResolvedValue(popularMovies);
      mockQueries.getTopRatedMovies.mockResolvedValue(topRatedMovies);

      const store = useMovieStore.getState();
      await store.loadMoviesFromFilters(['popular', 'toprated']);

      const state = useMovieStore.getState();
      // Should have all 3 movies (movie 3 should not be duplicated)
      expect(state.movies).toHaveLength(3);
      expect(state.movies.map((m) => m.id)).toEqual([1, 3, 2]);
      expect(mockQueries.getPopularMovies).toHaveBeenCalledTimes(1);
      expect(mockQueries.getTopRatedMovies).toHaveBeenCalledTimes(1);
    });

    it('should avoid duplicate movies when combining filters', async () => {
      const popularMovies = [mockMovies[2]];
      const topRatedMovies = [mockMovies[2]]; // Same movie

      mockQueries.getPopularMovies.mockResolvedValue(popularMovies);
      mockQueries.getTopRatedMovies.mockResolvedValue(topRatedMovies);

      const store = useMovieStore.getState();
      await store.loadMoviesFromFilters(['popular', 'toprated']);

      const state = useMovieStore.getState();
      // Should have only 1 movie, not duplicated
      expect(state.movies).toHaveLength(1);
      expect(state.movies[0].id).toBe(3);
    });

    it('should set loading state while loading', async () => {
      mockQueries.getPopularMovies.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const store = useMovieStore.getState();
      const loadPromise = store.loadMoviesFromFilters(['popular']);

      // Check loading state is true while async operation is in progress
      expect(useMovieStore.getState().loading).toBe(true);

      await loadPromise;

      // Check loading state is false after completion
      expect(useMovieStore.getState().loading).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Database connection failed';
      mockQueries.getPopularMovies.mockRejectedValue(new Error(errorMessage));

      const store = useMovieStore.getState();
      await store.loadMoviesFromFilters(['popular']);

      const state = useMovieStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
      expect(state.movies).toEqual([]);
    });
  });

  describe('loadPopularMovies', () => {
    it('should load popular movies successfully', async () => {
      const popularMovies = [mockMovies[0], mockMovies[2]];
      mockQueries.getPopularMovies.mockResolvedValue(popularMovies);

      const store = useMovieStore.getState();
      await store.loadPopularMovies();

      const state = useMovieStore.getState();
      expect(state.movies).toEqual(popularMovies);
      expect(mockQueries.getPopularMovies).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      mockQueries.getPopularMovies.mockRejectedValue(new Error('Failed to load'));

      const store = useMovieStore.getState();
      await store.loadPopularMovies();

      const state = useMovieStore.getState();
      expect(state.error).not.toBeNull();
      expect(state.movies).toEqual([]);
    });
  });

  describe('loadTopRatedMovies', () => {
    it('should load top-rated movies successfully', async () => {
      const topRatedMovies = [mockMovies[1], mockMovies[2]];
      mockQueries.getTopRatedMovies.mockResolvedValue(topRatedMovies);

      const store = useMovieStore.getState();
      await store.loadTopRatedMovies();

      const state = useMovieStore.getState();
      expect(state.movies).toEqual(topRatedMovies);
      expect(mockQueries.getTopRatedMovies).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      mockQueries.getTopRatedMovies.mockRejectedValue(new Error('Failed to load'));

      const store = useMovieStore.getState();
      await store.loadTopRatedMovies();

      const state = useMovieStore.getState();
      expect(state.error).not.toBeNull();
      expect(state.movies).toEqual([]);
    });
  });

  describe('loadFavoriteMovies', () => {
    it('should load favorite movies successfully', async () => {
      const favoriteMovies = [mockMovies[0]]; // Only favorites
      mockQueries.getFavoriteMovies.mockResolvedValue(favoriteMovies);

      const store = useMovieStore.getState();
      await store.loadFavoriteMovies();

      const state = useMovieStore.getState();
      expect(state.movies).toEqual(favoriteMovies);
      expect(mockQueries.getFavoriteMovies).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadAllMovies', () => {
    it('should load all movies successfully', async () => {
      mockQueries.getAllMovies.mockResolvedValue(mockMovies);

      const store = useMovieStore.getState();
      await store.loadAllMovies();

      const state = useMovieStore.getState();
      expect(state.movies).toEqual(mockMovies);
      expect(mockQueries.getAllMovies).toHaveBeenCalledTimes(1);
    });
  });

  describe('toggleFavorite', () => {
    beforeEach(() => {
      // Set up initial state with movies
      useMovieStore.setState({ movies: mockMovies });
      mockQueries.insertMovie.mockResolvedValue();
    });

    it('should toggle favorite status optimistically', async () => {
      const store = useMovieStore.getState();
      await store.toggleFavorite(1);

      const state = useMovieStore.getState();
      const movie = state.movies.find((m) => m.id === 1);

      // Movie 1 was favorite=true, should now be false
      expect(movie?.favorite).toBe(false);
      expect(mockQueries.insertMovie).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          favorite: false,
        })
      );
    });

    it('should update database with new favorite status', async () => {
      const store = useMovieStore.getState();
      await store.toggleFavorite(2);

      expect(mockQueries.insertMovie).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          favorite: true, // Was false, toggled to true
        })
      );
    });

    it('should handle movie not found in list', async () => {
      const store = useMovieStore.getState();
      await store.toggleFavorite(999);

      const state = useMovieStore.getState();
      expect(state.error).toBe('Movie not found in current list');
      expect(mockQueries.insertMovie).not.toHaveBeenCalled();
    });

    it('should rollback on database error', async () => {
      mockQueries.insertMovie.mockRejectedValue(new Error('Database error'));

      const originalMovies = [...mockMovies];
      const store = useMovieStore.getState();
      await store.toggleFavorite(1);

      const state = useMovieStore.getState();
      // Should rollback to original state
      expect(state.movies).toEqual(originalMovies);
      expect(state.error).toContain('Failed to toggle favorite');
    });
  });

  describe('refreshMovie', () => {
    beforeEach(() => {
      useMovieStore.setState({ movies: mockMovies });
    });

    it('should refresh a single movie from database', async () => {
      const updatedMovie = { ...mockMovies[0], title: 'Updated Title' };
      mockQueries.getMovieById.mockResolvedValue(updatedMovie);

      const store = useMovieStore.getState();
      await store.refreshMovie(1);

      const state = useMovieStore.getState();
      const movie = state.movies.find((m) => m.id === 1);

      expect(movie?.title).toBe('Updated Title');
      expect(mockQueries.getMovieById).toHaveBeenCalledWith(1);
    });

    it('should handle movie not found in database', async () => {
      mockQueries.getMovieById.mockResolvedValue(null);

      const store = useMovieStore.getState();
      await store.refreshMovie(999);

      // Should not error, just skip update
      const state = useMovieStore.getState();
      expect(state.movies).toEqual(mockMovies); // Unchanged
    });

    it('should handle refresh errors', async () => {
      mockQueries.getMovieById.mockRejectedValue(new Error('Database error'));

      const store = useMovieStore.getState();
      await store.refreshMovie(1);

      const state = useMovieStore.getState();
      expect(state.error).toContain('Failed to refresh movie');
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      useMovieStore.setState({ error: 'Test error' });

      const store = useMovieStore.getState();
      store.clearError();

      const state = useMovieStore.getState();
      expect(state.error).toBeNull();
    });
  });
});
