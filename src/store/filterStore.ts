/**
 * Zustand Filter Store
 * Replaces SharedPreferences for filter preferences
 *
 * Note: Multiple filters can be active simultaneously, matching Android behavior.
 * The Android app combines results from all active filters (MainActivity.java:96-105).
 */

import { create } from 'zustand';

export type MovieFilter = 'popular' | 'toprated' | 'favorites' | 'all';

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
 * Replaces SharedPreferences from Android app
 */
export const useFilterStore = create<FilterStore>((set, get) => ({
  // Initial state (matches Android defaults from MainActivity.java)
  // Default: showPopular=true, showTopRated=true, showFavorites=false
  showPopular: true,
  showTopRated: true,
  showFavorites: false,

  /**
   * Toggle popular movies filter
   * Filters can be toggled independently (multiple can be active)
   */
  togglePopular: () => {
    set((state) => ({ showPopular: !state.showPopular }));
  },

  /**
   * Toggle top-rated movies filter
   * Filters can be toggled independently (multiple can be active)
   */
  toggleTopRated: () => {
    set((state) => ({ showTopRated: !state.showTopRated }));
  },

  /**
   * Toggle favorites filter
   * Filters can be toggled independently (multiple can be active)
   */
  toggleFavorites: () => {
    set((state) => ({ showFavorites: !state.showFavorites }));
  },

  /**
   * Get all currently active filters
   * Returns array of active filter types for combining results
   *
   * Matches Android behavior: MainActivity.java checks each filter independently
   * and combines results with list.addAll()
   *
   * @returns Array of active filter types
   */
  getActiveFilters: (): MovieFilter[] => {
    const { showPopular, showTopRated, showFavorites } = get();
    const activeFilters: MovieFilter[] = [];

    if (showPopular) activeFilters.push('popular');
    if (showTopRated) activeFilters.push('toprated');
    if (showFavorites) activeFilters.push('favorites');

    // If no filters active, default to popular (safe fallback)
    if (activeFilters.length === 0) {
      activeFilters.push('popular');
    }

    return activeFilters;
  },
}));
