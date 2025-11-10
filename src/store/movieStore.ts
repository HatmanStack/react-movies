/**
 * Zustand Movie Store
 * Replaces LiveData functionality from Android app
 *
 * Note: Supports loading from multiple active filters simultaneously,
 * matching Android behavior (MainActivity.java:96-105 combines results).
 */

import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { MovieDetails } from '../models/types';
import {
  getAllMovies,
  getPopularMovies,
  getTopRatedMovies,
  getFavoriteMovies,
  insertMovie,
  getMovieById,
} from '../database/queries';
import { MovieFilter } from './filterStore';
import { TMDbService } from '../api/tmdb';
import { TMDbMovie } from '../api/types';
import { formatError, logError } from '../utils/errorHandler';

/**
 * Movie Store interface
 * Replaces ViewModel + LiveData pattern from Android
 */
interface MovieStore {
  // State
  movies: MovieDetails[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  isOffline: boolean;

  // Actions
  loadMoviesFromFilters: (filters: MovieFilter[]) => Promise<void>;
  loadPopularMovies: () => Promise<void>;
  loadTopRatedMovies: () => Promise<void>;
  loadFavoriteMovies: () => Promise<void>;
  loadAllMovies: () => Promise<void>;
  toggleFavorite: (movieId: number) => Promise<void>;
  refreshMovie: (movieId: number) => Promise<void>;
  clearError: () => void;
  syncMoviesWithAPI: () => Promise<void>;
  refreshMovies: () => Promise<void>;
  setOfflineStatus: (isOffline: boolean) => void;
}

/**
 * Create Zustand store
 * Implements reactive state management (LiveData replacement)
 */
export const useMovieStore = create<MovieStore>((set, get) => ({
  // Initial state
  movies: [],
  loading: false,
  error: null,
  syncing: false,
  isOffline: false,

  /**
   * Load movies from multiple active filters
   * Combines results from all specified filters, matching Android behavior
   *
   * Android equivalent: MainActivity.java:96-105
   * - Checks each filter independently
   * - Combines results with list.addAll()
   *
   * @param filters - Array of active filters to load from
   */
  loadMoviesFromFilters: async (filters: MovieFilter[]) => {
    set({ loading: true, error: null });

    try {
      const combinedMovies: MovieDetails[] = [];
      const movieIds = new Set<number>(); // Track IDs to avoid duplicates

      // Load from each active filter and combine results
      for (const filter of filters) {
        let filterMovies: MovieDetails[] = [];

        switch (filter) {
          case 'popular':
            filterMovies = await getPopularMovies();
            break;
          case 'toprated':
            filterMovies = await getTopRatedMovies();
            break;
          case 'favorites':
            filterMovies = await getFavoriteMovies();
            break;
          case 'all':
            filterMovies = await getAllMovies();
            break;
        }

        // Add movies, avoiding duplicates (a movie can be both popular and top-rated)
        for (const movie of filterMovies) {
          if (!movieIds.has(movie.id)) {
            movieIds.add(movie.id);
            combinedMovies.push(movie);
          }
        }
      }

      set({ movies: combinedMovies, loading: false });
    } catch (error) {
      logError(error, 'loadMoviesFromFilters');
      const formatted = formatError(error);
      set({ error: formatted.message, loading: false, movies: [] });
    }
  },

  /**
   * Load popular movies
   * Replaces: loadPopular() DAO query + LiveData update
   */
  loadPopularMovies: async () => {
    await get().loadMoviesFromFilters(['popular']);
  },

  /**
   * Load top-rated movies
   * Replaces: loadTopRated() DAO query + LiveData update
   */
  loadTopRatedMovies: async () => {
    await get().loadMoviesFromFilters(['toprated']);
  },

  /**
   * Load favorite movies
   * Replaces: loadFavorites() DAO query + LiveData update
   */
  loadFavoriteMovies: async () => {
    await get().loadMoviesFromFilters(['favorites']);
  },

  /**
   * Load all movies
   * Replaces: getAll() DAO query + LiveData update
   */
  loadAllMovies: async () => {
    await get().loadMoviesFromFilters(['all']);
  },

  /**
   * Toggle favorite status for a movie
   * Implements optimistic update: update UI immediately, rollback on error
   *
   * Replaces: toggle favorite → update database → LiveData notifies UI
   */
  toggleFavorite: async (movieId: number) => {
    const { movies } = get();

    // Find the movie in current state
    const movieIndex = movies.findIndex((m) => m.id === movieId);
    if (movieIndex === -1) {
      set({ error: 'Movie not found in current list' });
      return;
    }

    const movie = movies[movieIndex];
    const newFavoriteStatus = !movie.favorite;

    // Optimistic update: update UI immediately
    const optimisticMovies = movies.map((m) =>
      m.id === movieId ? { ...m, favorite: newFavoriteStatus } : m
    );

    set({ movies: optimisticMovies });

    try {
      // Update database
      await insertMovie({ ...movie, favorite: newFavoriteStatus });
    } catch (error) {
      // Rollback on error
      set({ movies });
      logError(error, 'toggleFavorite');
      const formatted = formatError(error);
      set({ error: `Failed to toggle favorite: ${formatted.message}` });
    }
  },

  /**
   * Refresh a single movie from database
   * Useful after updating a movie's details
   */
  refreshMovie: async (movieId: number) => {
    try {
      const updatedMovie = await getMovieById(movieId);
      if (!updatedMovie) return;

      const { movies } = get();
      const updatedMovies = movies.map((m) => (m.id === movieId ? updatedMovie : m));

      set({ movies: updatedMovies });
    } catch (error) {
      logError(error, 'refreshMovie');
      const formatted = formatError(error);
      set({ error: `Failed to refresh movie: ${formatted.message}` });
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Sync movies with TMDb API
   * Fetches popular movies and top-rated TV shows from API and stores in database
   * Only runs if not already syncing (debouncing)
   *
   * Replaces Android's GetWebData.java data sync pattern
   */
  syncMoviesWithAPI: async () => {
    const { syncing, isOffline } = get();

    // Skip sync if offline
    if (isOffline) {
      console.log('Offline mode: skipping API sync, using cached data');
      set({ error: 'You are offline. Showing cached movies.' });
      return;
    }

    // Prevent duplicate syncs
    if (syncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    set({ syncing: true, loading: true, error: null });

    try {
      // Helper function to map TMDb API response to MovieDetails
      const mapTMDbToMovieDetails = (
        movie: TMDbMovie,
        popular: boolean,
        toprated: boolean
      ): MovieDetails => ({
        id: movie.id,
        title: movie.title || movie.name || '',
        overview: movie.overview,
        poster_path: movie.poster_path || '',
        release_date: movie.release_date || movie.first_air_date || '',
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        original_language: movie.original_language,
        favorite: false, // Not favorited by default
        toprated,
        popular,
      });

      // Fetch popular movies and top-rated TV shows in parallel
      const [popularResponse, topRatedResponse] = await Promise.all([
        TMDbService.getPopularMovies(),
        TMDbService.getTopRatedTV(),
      ]);

      // Map and insert popular movies
      const popularMovies = popularResponse.results.map((movie) =>
        mapTMDbToMovieDetails(movie, true, false)
      );

      // Map and insert top-rated TV shows
      const topRatedMovies = topRatedResponse.results.map((movie) =>
        mapTMDbToMovieDetails(movie, false, true)
      );

      // Combine all movies
      const allMovies = [...popularMovies, ...topRatedMovies];

      // Insert into database (will replace existing movies with same ID)
      for (const movie of allMovies) {
        await insertMovie(movie);
      }

      // Load movies from database and update store
      const filters = get().movies.length > 0
        ? ['popular', 'toprated'] as MovieFilter[]
        : ['popular', 'toprated'] as MovieFilter[];

      await get().loadMoviesFromFilters(filters);

      set({ syncing: false, loading: false });
    } catch (error) {
      logError(error, 'syncMoviesWithAPI');
      const formatted = formatError(error);
      set({ error: `Failed to sync with API: ${formatted.message}`, syncing: false, loading: false });
    }
  },

  /**
   * Refresh movies from TMDb API
   * Similar to syncMoviesWithAPI but preserves user's favorite status
   * Called by pull-to-refresh
   */
  refreshMovies: async () => {
    const { syncing, isOffline } = get();

    // Skip refresh if offline
    if (isOffline) {
      console.log('Offline mode: cannot refresh, showing cached data');
      set({ error: 'Cannot refresh while offline. Showing cached movies.', loading: false });
      return;
    }

    // Prevent duplicate refreshes
    if (syncing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }

    set({ syncing: true, loading: true, error: null });

    try {
      // Get current favorites to preserve them
      const currentFavorites = await getFavoriteMovies();
      const favoriteIds = new Set(currentFavorites.map((m) => m.id));

      // Helper function to map TMDb API response to MovieDetails
      const mapTMDbToMovieDetails = (
        movie: TMDbMovie,
        popular: boolean,
        toprated: boolean
      ): MovieDetails => ({
        id: movie.id,
        title: movie.title || movie.name || '',
        overview: movie.overview,
        poster_path: movie.poster_path || '',
        release_date: movie.release_date || movie.first_air_date || '',
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        original_language: movie.original_language,
        favorite: favoriteIds.has(movie.id), // Preserve favorite status
        toprated,
        popular,
      });

      // Fetch fresh data from API
      const [popularResponse, topRatedResponse] = await Promise.all([
        TMDbService.getPopularMovies(),
        TMDbService.getTopRatedTV(),
      ]);

      // Map and insert movies (preserving favorites)
      const popularMovies = popularResponse.results.map((movie) =>
        mapTMDbToMovieDetails(movie, true, false)
      );

      const topRatedMovies = topRatedResponse.results.map((movie) =>
        mapTMDbToMovieDetails(movie, false, true)
      );

      const allMovies = [...popularMovies, ...topRatedMovies];

      // Update database
      for (const movie of allMovies) {
        await insertMovie(movie);
      }

      // Reload movies from database
      const filters = get().movies.length > 0
        ? ['popular', 'toprated'] as MovieFilter[]
        : ['popular', 'toprated'] as MovieFilter[];

      await get().loadMoviesFromFilters(filters);

      set({ syncing: false, loading: false });
    } catch (error) {
      logError(error, 'refreshMovies');
      const formatted = formatError(error);
      set({ error: `Failed to refresh movies: ${formatted.message}`, syncing: false, loading: false });
    }
  },

  /**
   * Set offline status
   * Called by NetInfo subscription
   */
  setOfflineStatus: (isOffline: boolean) => {
    set({ isOffline });
  },
}));

// Subscribe to NetInfo for network status updates
NetInfo.addEventListener((state: NetInfoState) => {
  const isOffline = !state.isConnected || !state.isInternetReachable;
  useMovieStore.getState().setOfflineStatus(isOffline);
});
