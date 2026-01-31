import React, { useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { FAB, Text, Banner } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import Head from 'expo-router/head';
import { useMovieStore } from '../src/store/movieStore';
import { useFilterStore } from '../src/store/filterStore';
import MovieCard from '../src/components/MovieCard';
import LoadingSpinner from '../src/components/LoadingSpinner';
import ErrorMessage from '../src/components/ErrorMessage';
import { SEO_CONFIG, generateCanonicalUrl } from '../src/utils/seo';

/**
 * Calculate number of columns based on screen width
 * Responsive breakpoints:
 * - < 600px: 2 columns
 * - 600-900px: 3 columns
 * - 900-1200px: 4 columns
 * - 1200-1500px: 5 columns
 * - >= 1500px: 6 columns
 */
const getNumColumns = (width: number): number => {
  if (width >= 1500) return 6;
  if (width >= 1200) return 5;
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
};

/**
 * Home Screen - Main movie browsing screen
 * Displays a responsive grid of movies (2-6 columns) based on screen size and active filters
 * Replaces Android's MainActivity
 */
export default function HomeScreen(): React.JSX.Element {
  // Get screen dimensions for responsive layout
  const { width } = useWindowDimensions();
  const numColumns = useMemo(() => getNumColumns(width), [width]);

  // Subscribe to movie store state (individual selectors for optimal re-rendering)
  const movies = useMovieStore((state) => state.movies);
  const loading = useMovieStore((state) => state.loading);
  const loadingMore = useMovieStore((state) => state.loadingMore);
  const error = useMovieStore((state) => state.error);
  const isOffline = useMovieStore((state) => state.isOffline);
  const loadMoviesFromFilters = useMovieStore((state) => state.loadMoviesFromFilters);
  const syncMoviesWithAPI = useMovieStore((state) => state.syncMoviesWithAPI);
  const refreshMovies = useMovieStore((state) => state.refreshMovies);
  const loadMoreMovies = useMovieStore((state) => state.loadMoreMovies);
  const clearError = useMovieStore((state) => state.clearError);

  // Subscribe to filter store state - individual selectors for reactivity
  const showPopular = useFilterStore((state) => state.showPopular);
  const showTopRated = useFilterStore((state) => state.showTopRated);
  const showFavorites = useFilterStore((state) => state.showFavorites);
  const getActiveFilters = useFilterStore((state) => state.getActiveFilters);

  // Initial data sync on mount
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

  // Reload movies when filters change
  useEffect(() => {
    const activeFilters = getActiveFilters();
    loadMoviesFromFilters(activeFilters);
  }, [showPopular, showTopRated, showFavorites, getActiveFilters, loadMoviesFromFilters]);

  // Reload movies when screen comes into focus (e.g., navigating back from detail screen)
  // This ensures favorite icons update after favoriting a movie
  useFocusEffect(
    useCallback(() => {
      const activeFilters = getActiveFilters();
      loadMoviesFromFilters(activeFilters);
    }, [getActiveFilters, loadMoviesFromFilters])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshMovies();
  }, [refreshMovies]);

  // Handle infinite scroll - load more movies
  const handleEndReached = useCallback(() => {
    if (!loadingMore && !loading) {
      loadMoreMovies();
    }
  }, [loadingMore, loading, loadMoreMovies]);

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
      {/* SEO Head */}
      <Head>
        <title>{SEO_CONFIG.defaultTitle}</title>
        <meta name="description" content={SEO_CONFIG.defaultDescription} />
        <link rel="canonical" href={generateCanonicalUrl('/')} />
        <meta property="og:title" content={SEO_CONFIG.defaultTitle} />
        <meta property="og:description" content={SEO_CONFIG.defaultDescription} />
        <meta property="og:url" content={generateCanonicalUrl('/')} />
        <meta
          property="og:image"
          content={`${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`}
        />
        <meta name="twitter:title" content={SEO_CONFIG.defaultTitle} />
        <meta name="twitter:description" content={SEO_CONFIG.defaultDescription} />
        <meta
          name="twitter:image"
          content={`${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`}
        />
      </Head>

      {/* Offline Banner */}
      {isOffline && (
        <Banner visible={true} icon="wifi-off">
          No internet connection. Showing cached data.
        </Banner>
      )}

      <FlatList
        key={`grid-${numColumns}`} // Force re-render when columns change
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={['#1976D2']}
            tintColor="#1976D2"
          />
        }
        // Infinite scroll
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <Text variant="bodyMedium" style={styles.loadingMoreText}>
                Loading more movies...
              </Text>
            </View>
          ) : null
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        // Accessibility
        accessible={true}
        accessibilityLabel={`Movie grid with ${numColumns} columns`}
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
  loadingMore: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    color: '#1976D2',
  },
});
