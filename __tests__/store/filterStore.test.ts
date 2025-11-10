/**
 * Zustand Filter Store tests
 * Tests filter preference management with multiple active filters support
 */

import { useFilterStore } from '../../src/store/filterStore';

describe('FilterStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useFilterStore.setState({
      showPopular: true,
      showTopRated: true,
      showFavorites: false,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state matching Android defaults', () => {
      const state = useFilterStore.getState();

      expect(state.showPopular).toBe(true);
      expect(state.showTopRated).toBe(true);
      expect(state.showFavorites).toBe(false);
    });
  });

  describe('togglePopular', () => {
    it('should toggle popular filter on when off', () => {
      useFilterStore.setState({ showPopular: false });

      const store = useFilterStore.getState();
      store.togglePopular();

      const state = useFilterStore.getState();
      expect(state.showPopular).toBe(true);
    });

    it('should toggle popular filter off when on', () => {
      useFilterStore.setState({ showPopular: true });

      const store = useFilterStore.getState();
      store.togglePopular();

      const state = useFilterStore.getState();
      expect(state.showPopular).toBe(false);
    });

    it('should not affect other filters', () => {
      useFilterStore.setState({
        showPopular: false,
        showTopRated: true,
        showFavorites: false,
      });

      const store = useFilterStore.getState();
      store.togglePopular();

      const state = useFilterStore.getState();
      expect(state.showPopular).toBe(true);
      expect(state.showTopRated).toBe(true); // Unchanged
      expect(state.showFavorites).toBe(false); // Unchanged
    });
  });

  describe('toggleTopRated', () => {
    it('should toggle top-rated filter on when off', () => {
      useFilterStore.setState({ showTopRated: false });

      const store = useFilterStore.getState();
      store.toggleTopRated();

      const state = useFilterStore.getState();
      expect(state.showTopRated).toBe(true);
    });

    it('should toggle top-rated filter off when on', () => {
      useFilterStore.setState({ showTopRated: true });

      const store = useFilterStore.getState();
      store.toggleTopRated();

      const state = useFilterStore.getState();
      expect(state.showTopRated).toBe(false);
    });

    it('should not affect other filters', () => {
      useFilterStore.setState({
        showPopular: true,
        showTopRated: false,
        showFavorites: false,
      });

      const store = useFilterStore.getState();
      store.toggleTopRated();

      const state = useFilterStore.getState();
      expect(state.showPopular).toBe(true); // Unchanged
      expect(state.showTopRated).toBe(true);
      expect(state.showFavorites).toBe(false); // Unchanged
    });
  });

  describe('toggleFavorites', () => {
    it('should toggle favorites filter on when off', () => {
      useFilterStore.setState({ showFavorites: false });

      const store = useFilterStore.getState();
      store.toggleFavorites();

      const state = useFilterStore.getState();
      expect(state.showFavorites).toBe(true);
    });

    it('should toggle favorites filter off when on', () => {
      useFilterStore.setState({ showFavorites: true });

      const store = useFilterStore.getState();
      store.toggleFavorites();

      const state = useFilterStore.getState();
      expect(state.showFavorites).toBe(false);
    });

    it('should not affect other filters', () => {
      useFilterStore.setState({
        showPopular: true,
        showTopRated: true,
        showFavorites: false,
      });

      const store = useFilterStore.getState();
      store.toggleFavorites();

      const state = useFilterStore.getState();
      expect(state.showPopular).toBe(true); // Unchanged
      expect(state.showTopRated).toBe(true); // Unchanged
      expect(state.showFavorites).toBe(true);
    });
  });

  describe('getActiveFilters', () => {
    it('should return popular and toprated when both are true (default state)', () => {
      useFilterStore.setState({
        showPopular: true,
        showTopRated: true,
        showFavorites: false,
      });

      const store = useFilterStore.getState();
      const filters = store.getActiveFilters();

      expect(filters).toEqual(['popular', 'toprated']);
    });

    it('should return all three when all are true', () => {
      useFilterStore.setState({
        showPopular: true,
        showTopRated: true,
        showFavorites: true,
      });

      const store = useFilterStore.getState();
      const filters = store.getActiveFilters();

      expect(filters).toEqual(['popular', 'toprated', 'favorites']);
    });

    it('should return only popular when only popular is true', () => {
      useFilterStore.setState({
        showPopular: true,
        showTopRated: false,
        showFavorites: false,
      });

      const store = useFilterStore.getState();
      const filters = store.getActiveFilters();

      expect(filters).toEqual(['popular']);
    });

    it('should return only toprated when only toprated is true', () => {
      useFilterStore.setState({
        showPopular: false,
        showTopRated: true,
        showFavorites: false,
      });

      const store = useFilterStore.getState();
      const filters = store.getActiveFilters();

      expect(filters).toEqual(['toprated']);
    });

    it('should return only favorites when only favorites is true', () => {
      useFilterStore.setState({
        showPopular: false,
        showTopRated: false,
        showFavorites: true,
      });

      const store = useFilterStore.getState();
      const filters = store.getActiveFilters();

      expect(filters).toEqual(['favorites']);
    });

    it('should return popular as default when all are false', () => {
      useFilterStore.setState({
        showPopular: false,
        showTopRated: false,
        showFavorites: false,
      });

      const store = useFilterStore.getState();
      const filters = store.getActiveFilters();

      expect(filters).toEqual(['popular']); // Default fallback
    });

    it('should return multiple filters when multiple are active', () => {
      useFilterStore.setState({
        showPopular: true,
        showTopRated: false,
        showFavorites: true,
      });

      const store = useFilterStore.getState();
      const filters = store.getActiveFilters();

      expect(filters).toEqual(['popular', 'favorites']);
    });
  });

  describe('Multiple Filters Support (Android Behavior)', () => {
    it('should allow all filters to be active simultaneously', () => {
      // All can be on at once
      useFilterStore.setState({
        showPopular: true,
        showTopRated: true,
        showFavorites: true,
      });

      const state = useFilterStore.getState();
      const activeCount =
        Number(state.showPopular) + Number(state.showTopRated) + Number(state.showFavorites);

      expect(activeCount).toBe(3); // All three can be active
      expect(state.getActiveFilters()).toEqual(['popular', 'toprated', 'favorites']);
    });

    it('should allow toggling filters independently without affecting others', () => {
      useFilterStore.setState({
        showPopular: true,
        showTopRated: true,
        showFavorites: false,
      });

      const store = useFilterStore.getState();

      // Toggle favorites on
      store.toggleFavorites();

      let state = useFilterStore.getState();
      expect(state.showPopular).toBe(true); // Still on
      expect(state.showTopRated).toBe(true); // Still on
      expect(state.showFavorites).toBe(true); // Now on

      // Toggle popular off
      store.togglePopular();

      state = useFilterStore.getState();
      expect(state.showPopular).toBe(false); // Now off
      expect(state.showTopRated).toBe(true); // Still on
      expect(state.showFavorites).toBe(true); // Still on
    });
  });
});
