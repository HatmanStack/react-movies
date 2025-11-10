import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { VideoDetails } from '../models/types';

/**
 * VideoCard Props
 */
export interface VideoCardProps {
  video: VideoDetails;
  onPress: (key: string) => void;
}

/**
 * VideoCard Component
 * Displays a YouTube video thumbnail with play icon overlay
 * Horizontal layout for trailer carousel
 */
const VideoCard: React.FC<VideoCardProps> = React.memo(({ video, onPress }) => {
  const { key, image_url, type } = video;

  return (
    <Pressable onPress={() => onPress(key)} style={styles.pressable}>
      <Card mode="outlined" style={styles.card}>
        {/* Video Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: image_url }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />

          {/* Play Icon Overlay */}
          <View style={styles.playIconOverlay}>
            <MaterialIcons name="play-circle-filled" size={48} color="rgba(255, 255, 255, 0.9)" />
          </View>
        </View>

        {/* Video Type Label */}
        <Card.Content style={styles.content}>
          <Text variant="bodySmall" numberOfLines={1} style={styles.typeLabel}>
            {type}
          </Text>
        </Card.Content>
      </Card>
    </Pressable>
  );
});

VideoCard.displayName = 'VideoCard';

const styles = StyleSheet.create({
  pressable: {
    marginRight: 12,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    width: 200,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 112, // 16:9 aspect ratio for 200px width
    backgroundColor: '#000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    paddingVertical: 8,
  },
  typeLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VideoCard;
