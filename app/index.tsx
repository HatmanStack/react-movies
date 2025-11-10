import React, { useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, Text, Banner } from 'react-native-paper';
import { router } from 'expo-router';
import { useMovieStore } from '../src/store/movieStore';
import { useFilterStore } from '../src/store/filterStore';
import MovieCard from '../src/components/MovieCard';
import LoadingSpinner from '../src/components/LoadingSpinner';
import ErrorMessage from '../src/components/ErrorMessage';

/**
 * Home Screen - Main movie browsing screen
 * Displays a 2-column grid of movies based on active filters
 * Replaces Android's MainActivity
 */
export default function HomeScreen(): React.JSX.Element {
  // Subscribe to movie store state (individual selectors for optimal re-rendering)
  const movies = useMovieStore((state) => state.movies);
  const loading = useMovieStore((state) => state.loading);
  const error = useMovieStore((state) => state.error);
  const isOffline = useMovieStore((state) => state.isOffline);
  const loadMoviesFromFilters = useMovieStore((state) => state.loadMoviesFromFilters);
  const syncMoviesWithAPI = useMovieStore((state) => state.syncMoviesWithAPI);
  const refreshMovies = useMovieStore((state) => state.refreshMovies);
  const clearError = useMovieStore((state) => state.clearError);

  // Subscribe to filter store state
  const getActiveFilters = useFilterStore((state) => state.getActiveFilters);

  // Initial data sync on mount and load movies when filters change
  useEffect(() => {
    const initializeData = async () => {
      const activeFilters = getActiveFilters();
      await loadMoviesFromFilters(activeFilters);

      // If no movies in database, sync with API
      const currentMovies = useMovieStore.getState().movies;
      if (currentMovies.length === 0) {
        await syncMoviesWithAPI();
      }
    };

    initializeData();
  }, [loadMoviesFromFilters, getActiveFilters, syncMoviesWithAPI]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshMovies();
  }, [refreshMovies]);

  // Handle movie card press - navigate to details
  const handleMoviePress = useCallback((movieId: number) => {
    router.push(`/details/${movieId}`);
  }, []);

  // Handle FAB press - navigate to filter screen
  const handleFilterPress = useCallback(() => {
    router.push('/filter');
  }, []);

  // Handle error retry
  const handleRetry = useCallback(() => {
    clearError();
    const activeFilters = getActiveFilters();
    loadMoviesFromFilters(activeFilters);
  }, [clearError, loadMoviesFromFilters, getActiveFilters]);

  // Render movie card item
  const renderMovieItem = useCallback(
    ({ item }: { item: typeof movies[0] }) => (
      <MovieCard movie={item} onPress={handleMoviePress} />
    ),
    [handleMoviePress]
  );

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: typeof movies[0]) => item.id.toString(), []);

  // Show error state
  if (error && !loading) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={handleRetry} />
        <FAB
          icon="filter-variant"
          style={styles.fab}
          onPress={handleFilterPress}
          label="Filter"
        />
      </View>
    );
  }

  // Show loading state (initial load only)
  if (loading && movies.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Loading movies..." />
      </View>
    );
  }

  // Show empty state
  if (!loading && movies.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No movies found
          </Text>
          <Text variant="bodyMedium" style={styles.emptyMessage}>
            Try adjusting your filters to see more movies
          </Text>
        </View>
        <FAB
          icon="filter-variant"
          style={styles.fab}
          onPress={handleFilterPress}
          label="Filter"
        />
      </View>
    );
  }

  // Show movie grid
  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      {isOffline && (
        <Banner visible={true} icon="wifi-off">
          No internet connection. Showing cached data.
        </Banner>
      )}

      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={['#1976D2']}
            tintColor="#1976D2"
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        // Accessibility
        accessible={true}
        accessibilityLabel="Movie grid"
      />

      {/* Floating Action Button for Filter */}
      <FAB
        icon="filter-variant"
        style={styles.fab}
        onPress={handleFilterPress}
        label="Filter"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gridContent: {
    padding: 8,
    paddingBottom: 80, // Space for FAB
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginBottom: 8,
    color: '#666',
  },
  emptyMessage: {
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976D2',
  },
});
