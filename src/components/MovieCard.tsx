import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MovieDetails } from '../models/types';
import { ANIMATION, COLORS } from '../constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * MovieCard Props
 */
interface MovieCardProps {
  movie: MovieDetails;
  onPress: (id: number) => void;
}

/**
 * MovieCard Component
 * Displays a movie poster card with title, rating, and favorite indicator
 * Replaces Android's PosterRecycler item layout
 * Features smooth spring animation on press
 */
const MovieCard: React.FC<MovieCardProps> = React.memo(({ movie, onPress }) => {
  const { id, title, poster_path, vote_average, favorite } = movie;

  // Animation values
  const scale = useSharedValue(1);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // TMDb image base URL (w342 for optimal card size)
  const posterUrl = `https://image.tmdb.org/t/p/w342${poster_path}`;

  return (
    <AnimatedPressable
      onPress={() => onPress(id)}
      onPressIn={() => {
        // Reanimated shared value is mutable by design
        scale.value = withSpring(ANIMATION.SCALE_PRESSED, {
          damping: ANIMATION.SPRING_DAMPING,
          stiffness: ANIMATION.SPRING_STIFFNESS,
        });
      }}
      onPressOut={() => {
        // Reanimated shared value is mutable by design
        scale.value = withSpring(ANIMATION.SCALE_NORMAL, {
          damping: ANIMATION.SPRING_DAMPING,
          stiffness: ANIMATION.SPRING_STIFFNESS,
        });
      }}
      style={[styles.pressable, animatedStyle]}
    >
      <Card mode="elevated" style={styles.card}>
        {/* Movie Poster with Shared Element Transition */}
        <Animated.View
          {...({ sharedTransitionTag: `movie-poster-${id}` } as object)}
          style={styles.posterContainer}
        >
          <Image
            source={{ uri: posterUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            priority="high"
          />
        </Animated.View>

        {/* Favorite Indicator (Heart Icon) */}
        {favorite && (
          <View style={styles.favoriteIndicator}>
            <MaterialIcons name="favorite" size={24} color={COLORS.FAVORITE} />
          </View>
        )}

        {/* Movie Info */}
        <Card.Content style={styles.content}>
          <Text variant="titleSmall" numberOfLines={2} style={styles.title}>
            {title}
          </Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color={COLORS.RATING} />
            <Text variant="bodySmall" style={styles.rating}>
              {vote_average.toFixed(1)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </AnimatedPressable>
  );
});

MovieCard.displayName = 'MovieCard';

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    margin: 8,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  posterContainer: {
    width: '100%',
    height: 240,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 4,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    color: '#666',
  },
});

export default MovieCard;
