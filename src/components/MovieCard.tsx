import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { MovieDetails } from '../models/types';

/**
 * MovieCard Props
 */
export interface MovieCardProps {
  movie: MovieDetails;
  onPress: (id: number) => void;
}

/**
 * MovieCard Component
 * Displays a movie poster card with title, rating, and favorite indicator
 * Replaces Android's PosterRecycler item layout
 */
const MovieCard: React.FC<MovieCardProps> = React.memo(({ movie, onPress }) => {
  const { id, title, poster_path, vote_average, favorite } = movie;

  // TMDb image base URL (w342 for optimal card size)
  const posterUrl = `https://image.tmdb.org/t/p/w342${poster_path}`;

  return (
    <Pressable
      onPress={() => onPress(id)}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
      ]}
    >
      <Card mode="elevated" style={styles.card}>
        {/* Movie Poster */}
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          priority="high"
        />

        {/* Favorite Indicator (Star Icon) */}
        {favorite && (
          <View style={styles.favoriteIndicator}>
            <MaterialIcons name="star" size={24} color="#FFC107" />
          </View>
        )}

        {/* Movie Info */}
        <Card.Content style={styles.content}>
          <Text variant="titleSmall" numberOfLines={2} style={styles.title}>
            {title}
          </Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color="#FFC107" />
            <Text variant="bodySmall" style={styles.rating}>
              {vote_average.toFixed(1)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
});

MovieCard.displayName = 'MovieCard';

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    margin: 8,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: 240,
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
