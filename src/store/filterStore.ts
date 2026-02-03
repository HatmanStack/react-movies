/**
 * Zustand Filter Store
 * Replaces SharedPreferences for filter preferences
 *
 * Note: Multiple filters can be active simultaneously, matching Android behavior.
 */

import { create } from 'zustand';
import { FILTERS as FILTER_CONSTANTS } from '../constants';

export type MovieFilter = 'popular' | 'toprated' | 'favorites' | 'all';

// Re-export filter constants for use with switch statements
export const FILTERS = FILTER_CONSTANTS;

/**
 * Filter Store interface
 * Manages user preferences for which movie types to display
 */
interface FilterStore {
  // State
  showPopular: boolean;
  showTopRated: boolean;
  showFavorites: boolean;

  // Actions
  togglePopular: () => void;
  toggleTopRated: () => void;
  toggleFavorites: () => void;
  getActiveFilters: () => MovieFilter[];
}

/**
 * Create Zustand store for filter preferences
 */
export const useFilterStore = create<FilterStore>((set, get) => ({
  // Initial state - default to showing popular and top-rated
  showPopular: true,
  showTopRated: true,
  showFavorites: false,

  /**
   * Toggle popular movies filter
   */
  togglePopular: () => {
    set((state) => ({ showPopular: !state.showPopular }));
  },

  /**
   * Toggle top-rated movies filter
   */
  toggleTopRated: () => {
    set((state) => ({ showTopRated: !state.showTopRated }));
  },

  /**
   * Toggle favorites filter
   */
  toggleFavorites: () => {
    set((state) => ({ showFavorites: !state.showFavorites }));
  },

  /**
   * Get all currently active filters
   * Returns array of active filter types for combining results
   */
  getActiveFilters: (): MovieFilter[] => {
    const { showPopular, showTopRated, showFavorites } = get();
    const activeFilters: MovieFilter[] = [];

    if (showPopular) activeFilters.push(FILTER_CONSTANTS.POPULAR);
    if (showTopRated) activeFilters.push(FILTER_CONSTANTS.TOP_RATED);
    if (showFavorites) activeFilters.push(FILTER_CONSTANTS.FAVORITES);

    // If no filters active, default to popular (safe fallback)
    if (activeFilters.length === 0) {
      activeFilters.push(FILTER_CONSTANTS.POPULAR);
    }

    return activeFilters;
  },
}));
