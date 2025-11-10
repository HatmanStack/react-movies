import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { ReviewDetails } from '../models/types';

/**
 * ReviewCard Props
 */
export interface ReviewCardProps {
  review: ReviewDetails;
}

/**
 * ReviewCard Component
 * Displays a user review with author name and expandable content
 * Shows "Read more" button if content exceeds 3 lines
 */
const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { author, content } = review;
  const [expanded, setExpanded] = useState(false);

  // Determine if content is long (rough estimate: > 200 chars)
  const isLongContent = content.length > 200;

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content>
        {/* Author Name */}
        <Text variant="titleMedium" style={styles.author}>
          {author}
        </Text>

        {/* Review Content */}
        <Text
          variant="bodyMedium"
          numberOfLines={expanded ? undefined : 3}
          style={styles.content}
        >
          {content}
        </Text>

        {/* Read More Button */}
        {isLongContent && (
          <View style={styles.buttonContainer}>
            <Button
              mode="text"
              onPress={() => setExpanded(!expanded)}
              compact
            >
              {expanded ? 'Show less' : 'Read more'}
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 8,
  },
  author: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  content: {
    lineHeight: 20,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 4,
    alignItems: 'flex-start',
  },
});

export default ReviewCard;
