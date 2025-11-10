import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Linking, Alert } from 'react-native';
import { Text, IconButton, Divider } from 'react-native-paper';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MovieDetails, VideoDetails, ReviewDetails } from '../../src/models/types';
import { getMovieById, getTrailersForMovie, getReviewsForMovie, insertVideo, insertReview } from '../../src/database/queries';
import { useMovieStore } from '../../src/store/movieStore';
import { TMDbService } from '../../src/api/tmdb';
import { YouTubeService } from '../../src/api/youtube';
import VideoCard from '../../src/components/VideoCard';
import ReviewCard from '../../src/components/ReviewCard';
import LoadingSpinner from '../../src/components/LoadingSpinner';
import ErrorMessage from '../../src/components/ErrorMessage';

/**
 * Movie Details Screen
 * Displays full movie information, trailers, and reviews
 * Replaces Android's DetailsActivity
 */
export default function DetailsScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ id: string }>();
  const movieId = parseInt(params.id, 10);

  // Local state
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [trailers, setTrailers] = useState<VideoDetails[]>([]);
  const [reviews, setReviews] = useState<ReviewDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Movie store actions
  const toggleFavorite = useMovieStore((state) => state.toggleFavorite);

  // Load movie details, trailers, and reviews
  const loadMovieDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load movie details from database
      const movieData = await getMovieById(movieId);
      if (movieData) {
        setMovie(movieData);
      }

      // Load trailers from database
      let trailersData = await getTrailersForMovie(movieId);

      // If no trailers in database, fetch from API
      if (trailersData.length === 0) {
        try {
          const videosResponse = await TMDbService.getMovieVideos(movieId);

          // Map and insert videos into database
          for (const video of videosResponse.results) {
            // Fetch YouTube thumbnail
            const thumbnailUrl = await YouTubeService.getVideoThumbnail(video.key);

            const videoDetails: Omit<VideoDetails, 'identity'> = {
              id: movieId,
              image_url: thumbnailUrl,
              iso_639_1: video.iso_639_1,
              iso_3166_1: video.iso_3166_1,
              key: video.key,
              site: video.site,
              size: video.size.toString(),
              type: video.type,
            };

            await insertVideo(videoDetails);
          }

          // Reload trailers from database
          trailersData = await getTrailersForMovie(movieId);
        } catch (apiError) {
          console.warn('Failed to fetch videos from API:', apiError);
          // Continue with empty trailers
        }
      } else {
        // Update thumbnails if missing
        for (const trailer of trailersData) {
          if (!trailer.image_url || trailer.image_url === '') {
            const thumbnailUrl = await YouTubeService.getVideoThumbnail(trailer.key);
            await insertVideo({ ...trailer, image_url: thumbnailUrl });
          }
        }
        // Reload to get updated thumbnails
        trailersData = await getTrailersForMovie(movieId);
      }

      setTrailers(trailersData);

      // Load reviews from database
      let reviewsData = await getReviewsForMovie(movieId);

      // If no reviews in database, fetch from API
      if (reviewsData.length === 0) {
        try {
          const reviewsResponse = await TMDbService.getMovieReviews(movieId);

          // Map and insert reviews into database
          for (const review of reviewsResponse.results) {
            const reviewDetails: Omit<ReviewDetails, 'identity'> = {
              id: movieId,
              author: review.author,
              content: review.content,
            };

            await insertReview(reviewDetails);
          }

          // Reload reviews from database
          reviewsData = await getReviewsForMovie(movieId);
        } catch (apiError) {
          console.warn('Failed to fetch reviews from API:', apiError);
          // Continue with empty reviews
        }
      }

      setReviews(reviewsData);

      // If movie not found in database and not fetched from API yet, show error
      if (!movieData) {
        throw new Error(`Movie with ID ${movieId} not found in database`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load movie details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  // Load data on mount
  useEffect(() => {
    loadMovieDetails();
  }, [loadMovieDetails]);

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
      console.error('Failed to toggle favorite:', err);
    }
  }, [movie, movieId, toggleFavorite]);

  // Handle trailer press - open YouTube video
  const handleTrailerPress = useCallback(async (videoKey: string) => {
    try {
      // Get YouTube watch URL
      const youtubeUrl = YouTubeService.getWatchUrl(videoKey);

      // Check if can open URL
      const canOpen = await Linking.canOpenURL(youtubeUrl);

      if (canOpen) {
        // Open YouTube app or browser
        await Linking.openURL(youtubeUrl);
      } else {
        Alert.alert(
          'Cannot Open Video',
          'Unable to open YouTube video. Please check if YouTube is installed.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening YouTube video:', error);
      Alert.alert(
        'Error',
        'Failed to open video. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Render trailer item
  const renderTrailerItem = useCallback(
    ({ item }: { item: VideoDetails }) => <VideoCard video={item} onPress={handleTrailerPress} />,
    [handleTrailerPress]
  );

  // Show loading state
  if (loading) {
    return <LoadingSpinner message="Loading movie details..." />;
  }

  // Show error state
  if (error || !movie) {
    return (
      <ErrorMessage
        message={error || 'Movie not found'}
        onRetry={loadMovieDetails}
      />
    );
  }

  // Build poster URL
  const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Movie Header Section */}
      <View style={styles.header}>
        {/* Poster Image */}
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
          contentFit="cover"
          transition={200}
        />

        {/* Favorite Button (Overlay) */}
        <IconButton
          icon={movie.favorite ? 'star' : 'star-outline'}
          iconColor={movie.favorite ? '#FFC107' : '#fff'}
          size={32}
          style={styles.favoriteButton}
          onPress={handleFavoriteToggle}
        />
      </View>

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
            <MaterialIcons name="calendar-today" size={16} color="#666" />
            <Text variant="bodyMedium" style={styles.metadataText}>
              {movie.release_date}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.metadataItem}>
            <MaterialIcons name="star" size={16} color="#FFC107" />
            <Text variant="bodyMedium" style={styles.metadataText}>
              {movie.vote_average.toFixed(1)} ({movie.vote_count} votes)
            </Text>
          </View>

          {/* Language */}
          <View style={styles.metadataItem}>
            <MaterialIcons name="language" size={16} color="#666" />
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
            <ReviewCard key={review.identity || review.author} review={review} />
          ))
        ) : (
          <Text variant="bodyMedium" style={styles.noReviews}>
            No reviews yet
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    position: 'relative',
    width: '100%',
    height: 500,
  },
  poster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  infoSection: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    color: '#666',
  },
  overview: {
    lineHeight: 24,
    color: '#333',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  trailersContent: {
    paddingRight: 16,
  },
  noReviews: {
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
