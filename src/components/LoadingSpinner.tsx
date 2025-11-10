import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

/**
 * LoadingSpinner Props
 */
export interface LoadingSpinnerProps {
  /** Optional loading message */
  message?: string;
  /** Whether to show as overlay (default: false) */
  overlay?: boolean;
}

/**
 * LoadingSpinner Component
 * Displays a centered loading indicator with optional message
 * Can be used as an overlay or inline
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, overlay = false }) => {
  const containerStyle = overlay ? styles.overlayContainer : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size="large" color="#1976D2" />
      {message && (
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
      )}
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
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  message: {
    marginTop: 16,
    color: '#666',
  },
});

export default LoadingSpinner;
