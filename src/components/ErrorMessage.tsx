import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * ErrorMessage Props
 */
export interface ErrorMessageProps {
  /** Error message to display */
  message: string;
  /** Optional retry callback */
  onRetry?: () => void;
}

/**
 * ErrorMessage Component
 * Displays an error message with optional retry button
 * Uses Material Design error styling
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <Card mode="outlined" style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Error Icon */}
          <MaterialIcons name="error-outline" size={48} color="#D32F2F" style={styles.icon} />

          {/* Error Message */}
          <Text variant="titleMedium" style={styles.title}>
            Oops! Something went wrong
          </Text>
          <Text variant="bodyMedium" style={styles.message}>
            {message}
          </Text>

          {/* Retry Button */}
          {onRetry && (
            <Button
              mode="contained"
              onPress={onRetry}
              style={styles.button}
              icon="refresh"
            >
              Try Again
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 8,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    maxWidth: 400,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});

export default ErrorMessage;
