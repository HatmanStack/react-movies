import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { View, StyleSheet, FlatList, Linking, Alert } from "react-native";
import { Text, IconButton, Divider } from "react-native-paper";
import { Image } from "expo-image";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import { useLocalSearchParams, router } from "expo-router";
import Head from "expo-router/head";
import { MaterialIcons } from "@expo/vector-icons";
import {
  MovieDetails,
  VideoDetails,
  ReviewDetails,
} from "../../src/models/types";
import {
  getMovieById,
  getTrailersForMovie,
  getReviewsForMovie,
  insertVideos,
  insertReviews,
} from "../../src/database/queries";
import { useMovieStore } from "../../src/store/movieStore";
import { TMDbService } from "../../src/api/tmdb";
import { YouTubeService } from "../../src/api/youtube";
import VideoCard from "../../src/components/VideoCard";
import ReviewCard from "../../src/components/ReviewCard";
import LoadingSpinner from "../../src/components/LoadingSpinner";
import ErrorMessage from "../../src/components/ErrorMessage";
import {
  SEO_CONFIG,
  generateTitle,
  truncateDescription,
  generateCanonicalUrl,
  generateOgImageUrl,
  generateMovieJsonLd,
} from "../../src/utils/seo";
import { logError, logWarn, isAbortError } from "../../src/utils/errorHandler";
import {
  mapTMDbVideosToVideoDetails,
  mapTMDbReviewsToReviewDetails,
} from "../../src/utils/mappers";
import { COLORS } from "../../src/constants";

const HEADER_HEIGHT = 500;

/**
 * Movie Details Screen
 * Displays full movie information, trailers, and reviews
 * Features parallelized API fetching and request cancellation
 */
export default function DetailsScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ id: string }>();
  const movieId = parseInt(params.id, 10);
  const isValidId = Number.isFinite(movieId) && movieId > 0;

  // AbortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Local state
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [trailers, setTrailers] = useState<VideoDetails[]>([]);
  const [reviews, setReviews] = useState<ReviewDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Movie store actions
  const toggleFavorite = useMovieStore((state) => state.toggleFavorite);

  // Parallax scroll
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
        ),
      },
      {
        scale: interpolate(
          scrollOffset.value,
          [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          [2, 1, 1],
        ),
      },
    ],
  }));

  // SEO metadata - memoized
  const seoData = useMemo(() => {
    if (!movie) {
      return {
        title: generateTitle("Movie Details"),
        description: SEO_CONFIG.defaultDescription,
        canonicalUrl: generateCanonicalUrl(`/details/${movieId}`),
        ogImage: `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`,
        jsonLd: null,
      };
    }
    const releaseYear = movie.release_date?.split("-")[0] || "";
    const titleWithYear = releaseYear
      ? `${movie.title} (${releaseYear})`
      : movie.title;
    return {
      title: generateTitle(movie.title),
      description: truncateDescription(`${titleWithYear} - ${movie.overview}`),
      canonicalUrl: generateCanonicalUrl(`/details/${movieId}`),
      ogImage: generateOgImageUrl(movie.poster_path),
      jsonLd: generateMovieJsonLd(movie),
    };
  }, [movie, movieId]);

  // Load movie details, trailers, and reviews with parallelization
  const loadMovieDetails = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        // Load movie details from database
        const movieData = await getMovieById(movieId);
        if (signal?.aborted) return;

        if (movieData) {
          setMovie(movieData);
        }

        // Load trailers and reviews from database in parallel
        const [cachedTrailers, cachedReviews] = await Promise.all([
          getTrailersForMovie(movieId),
          getReviewsForMovie(movieId),
        ]);

        if (signal?.aborted) return;

        // Fetch missing data from API in parallel
        const apiPromises: Promise<void>[] = [];

        // Fetch videos if not cached
        if (cachedTrailers.length === 0) {
          apiPromises.push(
            (async () => {
              try {
                const videosResponse = await TMDbService.getMovieVideos(
                  movieId,
                  signal,
                );
                if (signal?.aborted) return;

                // Map videos with parallel thumbnail fetching
                const videoDetails = await mapTMDbVideosToVideoDetails(
                  videosResponse.results,
                  movieId,
                );

                if (signal?.aborted) return;

                // Batch insert videos
                await insertVideos(movieId, videoDetails);

                // Reload from database
                const freshTrailers = await getTrailersForMovie(movieId);
                if (!signal?.aborted) {
                  setTrailers(freshTrailers);
                }
              } catch (apiError) {
                if (!isAbortError(apiError)) {
                  logWarn("Failed to fetch videos from API", "DetailsScreen", {
                    movieId,
                    error:
                      apiError instanceof Error
                        ? apiError.message
                        : String(apiError),
                  });
                }
              }
            })(),
          );
        } else {
          setTrailers(cachedTrailers);
        }

        // Fetch reviews if not cached
        if (cachedReviews.length === 0) {
          apiPromises.push(
            (async () => {
              try {
                const reviewsResponse = await TMDbService.getMovieReviews(
                  movieId,
                  1,
                  signal,
                );
                if (signal?.aborted) return;

                // Map reviews
                const reviewDetails = mapTMDbReviewsToReviewDetails(
                  reviewsResponse.results,
                  movieId,
                );

                // Batch insert reviews
                await insertReviews(movieId, reviewDetails);

                // Reload from database
                const freshReviews = await getReviewsForMovie(movieId);
                if (!signal?.aborted) {
                  setReviews(freshReviews);
                }
              } catch (apiError) {
                if (!isAbortError(apiError)) {
                  logWarn("Failed to fetch reviews from API", "DetailsScreen", {
                    movieId,
                    error:
                      apiError instanceof Error
                        ? apiError.message
                        : String(apiError),
                  });
                }
              }
            })(),
          );
        } else {
          setReviews(cachedReviews);
        }

        // Wait for all API fetches to complete
        await Promise.allSettled(apiPromises);

        if (signal?.aborted) return;

        // If movie not found, show error
        if (!movieData) {
          throw new Error(`Movie with ID ${movieId} not found in database`);
        }
      } catch (err) {
        if (isAbortError(err)) return;

        logError(err, "loadMovieDetails");
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load movie details";
        setError(errorMessage);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [movieId],
  );

  // Handle invalid movie ID
  useEffect(() => {
    if (!isValidId) {
      logWarn("Invalid movie ID", "DetailsScreen", { id: params.id });
      router.replace("/");
    }
  }, [isValidId, params.id]);

  // Load data on mount with cleanup
  useEffect(() => {
    if (!isValidId) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    loadMovieDetails(controller.signal);

    return () => {
      controller.abort();
      abortControllerRef.current = null;
    };
  }, [loadMovieDetails, isValidId]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(async () => {
    if (!movie) return;

    // Optimistic update
    setMovie({ ...movie, favorite: !movie.favorite });

    try {
      await toggleFavorite(movieId);
    } catch (err) {
      // Rollback on error
      setMovie(movie);
      logError(err, "handleFavoriteToggle");
    }
  }, [movie, movieId, toggleFavorite]);

  // Handle trailer press - open YouTube video
  const handleTrailerPress = useCallback(async (videoKey: string) => {
    try {
      const youtubeUrl = YouTubeService.getWatchUrl(videoKey);
      const canOpen = await Linking.canOpenURL(youtubeUrl);

      if (canOpen) {
        await Linking.openURL(youtubeUrl);
      } else {
        Alert.alert(
          "Cannot Open Video",
          "Unable to open YouTube video. Please check if YouTube is installed.",
          [{ text: "OK" }],
        );
      }
    } catch (err) {
      logError(err, "handleTrailerPress");
      Alert.alert("Error", "Failed to open video. Please try again later.", [
        { text: "OK" },
      ]);
    }
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (!isValidId) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    loadMovieDetails(controller.signal);
  }, [loadMovieDetails, isValidId]);

  // Render trailer item
  const renderTrailerItem = useCallback(
    ({ item }: { item: VideoDetails }) => (
      <VideoCard video={item} onPress={handleTrailerPress} />
    ),
    [handleTrailerPress],
  );

  // Show loading state or redirecting
  if (!isValidId || loading) {
    return (
      <LoadingSpinner
        message={isValidId ? "Loading movie details..." : "Redirecting..."}
      />
    );
  }

  // Show error state
  if (error || !movie) {
    return (
      <ErrorMessage
        message={error || "Movie not found"}
        onRetry={handleRetry}
      />
    );
  }

  // Build poster URL
  const posterUrl = TMDbService.getPosterUrl(movie.poster_path, "LARGE");

  return (
    <Animated.ScrollView
      ref={scrollRef}
      scrollEventThrottle={16}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Dynamic SEO Head */}
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <link rel="canonical" href={seoData.canonicalUrl} />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:url" content={seoData.canonicalUrl} />
        <meta property="og:image" content={seoData.ogImage} />
        <meta property="og:type" content="video.movie" />
        <meta name="twitter:title" content={seoData.title} />
        <meta name="twitter:description" content={seoData.description} />
        <meta name="twitter:image" content={seoData.ogImage} />
        {seoData.jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.jsonLd) }}
          />
        )}
      </Head>

      {/* Movie Header Section with Parallax */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        {/* Poster Image with Shared Element Transition */}
        <Animated.View
          {...({ sharedTransitionTag: `movie-poster-${movieId}` } as object)}
          style={styles.posterContainer}
        >
          <Image
            source={{ uri: posterUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        </Animated.View>

        {/* Favorite Button (Overlay) */}
        <IconButton
          icon={movie.favorite ? "heart" : "heart-outline"}
          iconColor={movie.favorite ? COLORS.FAVORITE : "#fff"}
          size={32}
          style={styles.favoriteButton}
          onPress={handleFavoriteToggle}
        />
      </Animated.View>

      {/* Movie Info Section */}
      <View style={styles.infoSection}>
        {/* Title */}
        <Text variant="headlineMedium" style={styles.title}>
          {movie.title}
        </Text>

        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          {/* Release Date */}
          <View style={styles.metadataItem}>
            <MaterialIcons
              name="calendar-today"
              size={16}
              color={COLORS.TEXT_SECONDARY}
            />
            <Text variant="bodyMedium" style={styles.metadataText}>
              {movie.release_date}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.metadataItem}>
            <MaterialIcons name="star" size={16} color={COLORS.RATING} />
            <Text variant="bodyMedium" style={styles.metadataText}>
              {movie.vote_average.toFixed(1)} ({movie.vote_count} votes)
            </Text>
          </View>

          {/* Language */}
          <View style={styles.metadataItem}>
            <MaterialIcons
              name="language"
              size={16}
              color={COLORS.TEXT_SECONDARY}
            />
            <Text variant="bodyMedium" style={styles.metadataText}>
              {movie.original_language.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Overview */}
        <Text variant="bodyLarge" style={styles.overview}>
          {movie.overview}
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Trailers Section */}
      {trailers.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Trailers
          </Text>
          <FlatList
            data={trailers}
            renderItem={renderTrailerItem}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trailersContent}
          />
        </View>
      )}

      {trailers.length > 0 && <Divider style={styles.divider} />}

      {/* Reviews Section */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Reviews
        </Text>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.identity || review.author}
              review={review}
            />
          ))
        ) : (
          <Text variant="bodyMedium" style={styles.noReviews}>
            No reviews yet
          </Text>
        )}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    position: "relative",
    width: "100%",
    height: HEADER_HEIGHT,
    overflow: "hidden",
  },
  posterContainer: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  poster: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  infoSection: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metadataText: {
    color: COLORS.TEXT_SECONDARY,
  },
  overview: {
    lineHeight: 24,
    color: "#333",
  },
  divider: {
    display: "none",
  },
  section: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  trailersContent: {
    paddingRight: 16,
  },
  noReviews: {
    color: COLORS.TEXT_TERTIARY,
    fontStyle: "italic",
    paddingVertical: 20,
  },
});
