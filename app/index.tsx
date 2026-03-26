import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { Text, Banner } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import Head from 'expo-router/head';
import { useMovieStore } from '../src/store/movieStore';
import { useFilterStore } from '../src/store/filterStore';
import MovieCard from '../src/components/MovieCard';
import LoadingSpinner from '../src/components/LoadingSpinner';
import ErrorMessage from '../src/components/ErrorMessage';
import { SEO_CONFIG, generateCanonicalUrl } from '../src/utils/seo';
import { BREAKPOINTS, GRID_COLUMNS, COLORS, PAGINATION } from '../src/constants';

/**
 * Calculate number of columns based on screen width
 */
const getNumColumns = (width: number): number => {
  if (width >= BREAKPOINTS.XL) return GRID_COLUMNS.XL;
  if (width >= BREAKPOINTS.LG) return GRID_COLUMNS.LG;
  if (width >= BREAKPOINTS.MD) return GRID_COLUMNS.MD;
  if (width >= BREAKPOINTS.SM) return GRID_COLUMNS.SM;
  return GRID_COLUMNS.XS;
};

/**
 * Home Screen - Main movie browsing screen
 * Displays a responsive grid of movies with filtering and infinite scroll
 */
export default function HomeScreen(): React.JSX.Element {
  // Ref to track mounted state and AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

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
  const loadMoreMovies = useMovieStore((state) => state.loadMoreMovies);
  const clearError = useMovieStore((state) => state.clearError);

  // Subscribe to filter store state
  const showPopular = useFilterStore((state) => state.showPopular);
  const showTopRated = useFilterStore((state) => state.showTopRated);
  const showFavorites = useFilterStore((state) => state.showFavorites);
  const getActiveFilters = useFilterStore((state) => state.getActiveFilters);

  // Track whether the initial mount effect has run
  const isInitialMount = useRef(true);
  const isInitialFocus = useRef(true);

  // Initial data sync on mount with cleanup
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const initializeData = async () => {
      const activeFilters = getActiveFilters();
      await loadMoviesFromFilters(activeFilters, controller.signal);

      // If no movies in database, sync with API
      const currentMovies = useMovieStore.getState().movies;
      if (currentMovies.length === 0 && !controller.signal.aborted) {
        await syncMoviesWithAPI(controller.signal);
      }
    };

    initializeData();

    // Cleanup: abort any pending requests
    return () => {
      controller.abort();
      abortControllerRef.current = null;
    };
  }, [loadMoviesFromFilters, getActiveFilters, syncMoviesWithAPI]);

  // Reload movies when filters change (skip initial render)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const controller = new AbortController();
    const activeFilters = getActiveFilters();
    loadMoviesFromFilters(activeFilters, controller.signal);
    return () => controller.abort();
  }, [showPopular, showTopRated, showFavorites, getActiveFilters, loadMoviesFromFilters]);

  // Reload movies when screen comes into focus (skip initial focus)
  useFocusEffect(
    useCallback(() => {
      if (isInitialFocus.current) {
        isInitialFocus.current = false;
        return;
      }
      const controller = new AbortController();
      const activeFilters = getActiveFilters();
      loadMoviesFromFilters(activeFilters, controller.signal);
      return () => controller.abort();
    }, [getActiveFilters, loadMoviesFromFilters])
  );

  // Handle pull-to-refresh with cancellation
  const handleRefresh = useCallback(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    syncMoviesWithAPI(controller.signal, { preserveFavorites: true });
  }, [syncMoviesWithAPI]);

  // Handle infinite scroll with cancellation
  const handleEndReached = useCallback(() => {
    if (!loadingMore && !loading) {
      const controller = new AbortController();
      loadMoreMovies(controller.signal);
    }
  }, [loadingMore, loading, loadMoreMovies]);

  // Handle movie card press - navigate to details
  const handleMoviePress = useCallback((movieId: number) => {
    router.push(`/details/${movieId}`);
  }, []);

  // Handle error retry
  const handleRetry = useCallback(() => {
    clearError();
    const controller = new AbortController();
    const activeFilters = getActiveFilters();
    loadMoviesFromFilters(activeFilters, controller.signal);
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
        key={`grid-${numColumns}`}
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        // Infinite scroll
        onEndReached={handleEndReached}
        onEndReachedThreshold={PAGINATION.INFINITE_SCROLL_THRESHOLD}
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  gridContent: {
    padding: 8,
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginBottom: 8,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyMessage: {
    color: COLORS.TEXT_TERTIARY,
    textAlign: 'center',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    color: COLORS.PRIMARY,
  },
});
