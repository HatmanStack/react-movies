/**
 * Integration Test: Favorites Flow
 * Tests favorite toggle and filter functionality
 */

import { useMovieStore } from '../../src/store/movieStore';
import { useFilterStore } from '../../src/store/filterStore';

// Mock database
jest.mock('../../src/database/queries', () => ({
  insertMovie: jest.fn().mockResolvedValue(undefined),
  getFavoriteMovies: jest.fn().mockResolvedValue([]),
  getPopularMovies: jest.fn().mockResolvedValue([]),
  getTopRatedMovies: jest.fn().mockResolvedValue([]),
  getAllMovies: jest.fn().mockResolvedValue([]),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

describe('Integration: Favorites Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset stores
    useMovieStore.setState({
      movies: [],
      loading: false,
      error: null,
      syncing: false,
      isOffline: false,
    });

    useFilterStore.setState({
      showPopular: true,
      showTopRated: false,
      showFavorites: false,
    });
  });

  it('toggles favorite status correctly', async () => {
    const testMovie = {
      id: 1,
      title: 'Test Movie',
      overview: 'Test',
      poster_path: '/test.jpg',
      release_date: '2024-01-01',
      vote_average: 8.5,
      vote_count: 100,
      popularity: 50,
      original_language: 'en',
      favorite: false,
      toprated: false,
      popular: true,
    };

    useMovieStore.setState({ movies: [testMovie] });

    // Toggle favorite
    await useMovieStore.getState().toggleFavorite(1);

    // Verify favorite status changed
    const updatedMovies = useMovieStore.getState().movies;
    expect(updatedMovies[0].favorite).toBe(true);
  });

  it('handles favorite toggle error with rollback', async () => {
    const { insertMovie } = require('../../src/database/queries');
    insertMovie.mockRejectedValueOnce(new Error('Database error'));

    const testMovie = {
      id: 1,
      title: 'Test Movie',
      overview: 'Test',
      poster_path: '/test.jpg',
      release_date: '2024-01-01',
      vote_average: 8.5,
      vote_count: 100,
      popularity: 50,
      original_language: 'en',
      favorite: false,
      toprated: false,
      popular: true,
    };

    useMovieStore.setState({ movies: [testMovie] });

    // Attempt to toggle favorite (will fail)
    await useMovieStore.getState().toggleFavorite(1);

    // Verify rollback occurred
    const movies = useMovieStore.getState().movies;
    expect(movies[0].favorite).toBe(false);
    expect(useMovieStore.getState().error).toContain('Failed to toggle favorite');
  });

  it('filters movies by favorites correctly', async () => {
    const movies = [
      {
        id: 1,
        title: 'Favorite Movie',
        overview: 'Test',
        poster_path: '/test1.jpg',
        release_date: '2024-01-01',
        vote_average: 8.5,
        vote_count: 100,
        popularity: 50,
        original_language: 'en',
        favorite: true,
        toprated: false,
        popular: true,
      },
      {
        id: 2,
        title: 'Regular Movie',
        overview: 'Test',
        poster_path: '/test2.jpg',
        release_date: '2024-01-02',
        vote_average: 7.5,
        vote_count: 80,
        popularity: 40,
        original_language: 'en',
        favorite: false,
        toprated: false,
        popular: true,
      },
    ];

    const { getFavoriteMovies } = require('../../src/database/queries');
    getFavoriteMovies.mockResolvedValue([movies[0]]);

    useMovieStore.setState({ movies });

    // Apply favorites filter
    useFilterStore.getState().toggleFavorites();

    // Load filtered movies
    const activeFilters = useFilterStore.getState().getActiveFilters();
    await useMovieStore.getState().loadMoviesFromFilters(activeFilters);

    // Verify only favorite movies loaded
    const filteredMovies = useMovieStore.getState().movies;
    expect(filteredMovies.length).toBe(1);
    expect(filteredMovies[0].favorite).toBe(true);
  });
});
