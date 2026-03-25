/**
 * Zustand Movie Store
 * Replaces LiveData functionality from Android app
 *
 * Features:
 * - Batched database operations for performance
 * - Request cancellation support
 * - Multiple active filters simultaneously
 * - Network status awareness
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
  insertMovies,
  getMovieById,
} from '../database/queries';
import { MovieFilter, FILTERS } from './filterStore';
import { TMDbService } from '../api/tmdb';
import { DEFAULT_FILTERS } from '../constants';
import { formatError, logError, logInfo, isAbortError } from '../utils/errorHandler';
import { mapTMDbToMovieDetails, mapTMDbMoviesToMovieDetails } from '../utils/mappers';

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
  popularPage: number;
  topRatedPage: number;
  hasMorePopular: boolean;
  hasMoreTopRated: boolean;
  loadingMore: boolean;

  // Actions
  loadMoviesFromFilters: (filters: MovieFilter[], signal?: AbortSignal) => Promise<void>;
  loadPopularMovies: () => Promise<void>;
  loadTopRatedMovies: () => Promise<void>;
  loadFavoriteMovies: () => Promise<void>;
  loadAllMovies: () => Promise<void>;
  loadMoreMovies: (signal?: AbortSignal) => Promise<void>;
  toggleFavorite: (movieId: number) => Promise<void>;
  refreshMovie: (movieId: number) => Promise<void>;
  clearError: () => void;
  syncMoviesWithAPI: (signal?: AbortSignal, options?: { preserveFavorites?: boolean }) => Promise<void>;
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
  popularPage: 1,
  topRatedPage: 1,
  hasMorePopular: true,
  hasMoreTopRated: true,
  loadingMore: false,

  /**
   * Load movies from multiple active filters
   * Combines results from all specified filters
   */
  loadMoviesFromFilters: async (filters: MovieFilter[], signal?: AbortSignal) => {
    set({ loading: true, error: null });

    try {
      // Check if aborted
      if (signal?.aborted) {
        set({ loading: false });
        return;
      }

      const combinedMovies: MovieDetails[] = [];
      const movieIds = new Set<number>();

      // Load from each active filter and combine results
      for (const filter of filters) {
        let filterMovies: MovieDetails[] = [];

        switch (filter) {
          case FILTERS.POPULAR:
            filterMovies = await getPopularMovies();
            break;
          case FILTERS.TOP_RATED:
            filterMovies = await getTopRatedMovies();
            break;
          case FILTERS.FAVORITES:
            filterMovies = await getFavoriteMovies();
            break;
          case FILTERS.ALL:
            filterMovies = await getAllMovies();
            break;
        }

        // Add movies, avoiding duplicates
        for (const movie of filterMovies) {
          if (!movieIds.has(movie.id)) {
            movieIds.add(movie.id);
            combinedMovies.push(movie);
          }
        }
      }

      if (!signal?.aborted) {
        set({ movies: combinedMovies, loading: false });
      }
    } catch (error) {
      if (isAbortError(error)) {
        set({ loading: false });
        return;
      }

      logError(error, 'loadMoviesFromFilters');
      const formatted = formatError(error);
      set({ error: formatted.message, loading: false, movies: [] });
    }
  },

  /**
   * Load popular movies
   */
  loadPopularMovies: async () => {
    await get().loadMoviesFromFilters([FILTERS.POPULAR]);
  },

  /**
   * Load top-rated movies
   */
  loadTopRatedMovies: async () => {
    await get().loadMoviesFromFilters([FILTERS.TOP_RATED]);
  },

  /**
   * Load favorite movies
   */
  loadFavoriteMovies: async () => {
    await get().loadMoviesFromFilters([FILTERS.FAVORITES]);
  },

  /**
   * Load all movies
   */
  loadAllMovies: async () => {
    await get().loadMoviesFromFilters([FILTERS.ALL]);
  },

  /**
   * Load more movies (infinite scroll pagination)
   * Fetches next page of movies from API and appends to existing list
   */
  loadMoreMovies: async (signal?: AbortSignal) => {
    const { loadingMore, syncing, isOffline, hasMorePopular, hasMoreTopRated, popularPage, topRatedPage } = get();

    // Don't load if already loading, syncing, offline, or no more pages
    if (loadingMore || syncing || isOffline || (!hasMorePopular && !hasMoreTopRated)) {
      return;
    }

    set({ loadingMore: true, error: null });

    try {
      if (signal?.aborted) {
        set({ loadingMore: false });
        return;
      }

      const { movies } = get();
      const movieIds = new Set(movies.map(m => m.id));
      const newMovies: MovieDetails[] = [];

      // Load next page of popular movies if available
      if (hasMorePopular) {
        const nextPopularPage = popularPage + 1;
        const popularResponse = await TMDbService.getPopularMovies(nextPopularPage, signal);

        const popularMovies = mapTMDbMoviesToMovieDetails(popularResponse.results, {
          popular: true,
          toprated: false,
        });

        // Filter out duplicates and add to new movies
        const uniquePopular = popularMovies.filter(m => !movieIds.has(m.id));
        uniquePopular.forEach(m => movieIds.add(m.id));
        newMovies.push(...uniquePopular);

        set({
          popularPage: nextPopularPage,
          hasMorePopular: popularResponse.page < popularResponse.total_pages,
        });
      }

      // Load next page of top-rated if available
      if (hasMoreTopRated && !signal?.aborted) {
        const nextTopRatedPage = topRatedPage + 1;
        const topRatedResponse = await TMDbService.getTopRatedTV(nextTopRatedPage, signal);

        const topRatedMovies = mapTMDbMoviesToMovieDetails(topRatedResponse.results, {
          popular: false,
          toprated: true,
        });

        // Filter out duplicates
        const uniqueTopRated = topRatedMovies.filter(m => !movieIds.has(m.id));
        newMovies.push(...uniqueTopRated);

        set({
          topRatedPage: nextTopRatedPage,
          hasMoreTopRated: topRatedResponse.page < topRatedResponse.total_pages,
        });
      }

      // Batch insert new movies to database
      if (newMovies.length > 0) {
        await insertMovies(newMovies);
      }

      // Append new movies to existing list
      if (!signal?.aborted) {
        set({ movies: [...movies, ...newMovies], loadingMore: false });
      }
    } catch (error) {
      if (isAbortError(error)) {
        set({ loadingMore: false });
        return;
      }

      logError(error, 'loadMoreMovies');
      const formatted = formatError(error);
      set({ error: `Failed to load more movies: ${formatted.message}`, loadingMore: false });
    }
  },

  /**
   * Toggle favorite status for a movie
   */
  toggleFavorite: async (movieId: number) => {
    try {
      const movie = await getMovieById(movieId);

      if (!movie) {
        set({ error: 'Movie not found' });
        return;
      }

      const newFavoriteStatus = !movie.favorite;

      // Update database
      await insertMovie({ ...movie, favorite: newFavoriteStatus });

      // Update in current movies list if present (optimistic update)
      const { movies } = get();
      const movieIndex = movies.findIndex((m) => m.id === movieId);

      if (movieIndex !== -1) {
        const optimisticMovies = movies.map((m) =>
          m.id === movieId ? { ...m, favorite: newFavoriteStatus } : m
        );
        set({ movies: optimisticMovies });
      }
    } catch (error) {
      logError(error, 'toggleFavorite');
      const formatted = formatError(error);
      set({ error: `Failed to toggle favorite: ${formatted.message}` });
    }
  },

  /**
   * Refresh a single movie from database
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
   *
   * @param signal - AbortSignal for cancellation
   * @param options.preserveFavorites - When true, preserves user's favorite status during sync
   */
  syncMoviesWithAPI: async (signal?: AbortSignal, options?: { preserveFavorites?: boolean }) => {
    const { syncing, isOffline } = get();
    const preserveFavorites = options?.preserveFavorites ?? false;
    const context = preserveFavorites ? 'refreshMovies' : 'syncMoviesWithAPI';

    // Skip sync if offline
    if (isOffline) {
      const offlineMsg = preserveFavorites
        ? 'Cannot refresh while offline. Showing cached movies.'
        : 'You are offline. Showing cached movies.';
      logInfo(`Offline mode: skipping API sync, using cached data`, context);
      set({ error: offlineMsg, ...(preserveFavorites ? { loading: false } : {}) });
      return;
    }

    // Prevent duplicate syncs
    if (syncing) {
      logInfo('Sync already in progress, skipping...', context);
      return;
    }

    set({
      syncing: true,
      loading: true,
      error: null,
      popularPage: 1,
      topRatedPage: 1,
      hasMorePopular: true,
      hasMoreTopRated: true,
    });

    try {
      if (signal?.aborted) {
        set({ syncing: false, loading: false });
        return;
      }

      // Get current favorites if preserving them
      let favoriteIds = new Set<number>();
      if (preserveFavorites) {
        const currentFavorites = await getFavoriteMovies();
        favoriteIds = new Set(currentFavorites.map((m) => m.id));
      }

      // Fetch popular movies and top-rated TV shows in parallel
      const [popularResponse, topRatedResponse] = await Promise.all([
        TMDbService.getPopularMovies(1, signal),
        TMDbService.getTopRatedTV(1, signal),
      ]);

      if (signal?.aborted) {
        set({ syncing: false, loading: false });
        return;
      }

      // Map API responses to domain models
      const popularMovies = preserveFavorites
        ? popularResponse.results.map((movie) =>
            mapTMDbToMovieDetails(movie, {
              popular: true,
              toprated: false,
              favorite: favoriteIds.has(movie.id),
            })
          )
        : mapTMDbMoviesToMovieDetails(popularResponse.results, {
            popular: true,
            toprated: false,
          });

      const topRatedMovies = preserveFavorites
        ? topRatedResponse.results.map((movie) =>
            mapTMDbToMovieDetails(movie, {
              popular: false,
              toprated: true,
              favorite: favoriteIds.has(movie.id),
            })
          )
        : mapTMDbMoviesToMovieDetails(topRatedResponse.results, {
            popular: false,
            toprated: true,
          });

      // Combine all movies
      const allMovies = [...popularMovies, ...topRatedMovies];

      // Batch insert into database
      await insertMovies(allMovies);

      // Load movies from database and update store
      await get().loadMoviesFromFilters(DEFAULT_FILTERS, signal);

      set({ syncing: false, loading: false });
    } catch (error) {
      if (isAbortError(error)) {
        set({ syncing: false, loading: false });
        return;
      }

      logError(error, context);
      const formatted = formatError(error);
      const errorPrefix = preserveFavorites ? 'Failed to refresh movies' : 'Failed to sync with API';
      set({ error: `${errorPrefix}: ${formatted.message}`, syncing: false, loading: false });
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
  // On web, isInternetReachable can be null initially - treat null as reachable
  const isOffline = state.isConnected === false || state.isInternetReachable === false;
  useMovieStore.getState().setOfflineStatus(isOffline);
});
