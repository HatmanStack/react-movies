/**
 * ErrorBoundary Component
 * Catches and handles React component errors
 */

import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { logError } from '../utils/errorHandler';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches React component errors
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console or error tracking service
    logError(error, `ErrorBoundary: ${errorInfo.componentStack}`);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <Card mode="outlined" style={styles.card}>
            <Card.Content style={styles.content}>
              {/* Error Icon */}
              <MaterialIcons name="error-outline" size={64} color="#D32F2F" style={styles.icon} />

              {/* Error Title */}
              <Text variant="headlineMedium" style={styles.title}>
                Oops! Something went wrong
              </Text>

              {/* Error Message */}
              <Text variant="bodyMedium" style={styles.message}>
                {this.state.error.message || 'An unexpected error occurred'}
              </Text>

              {/* Details (dev mode only) */}
              {__DEV__ && this.state.error.stack && (
                <View style={styles.detailsContainer}>
                  <Text variant="bodySmall" style={styles.detailsLabel}>
                    Error Details:
                  </Text>
                  <Text variant="bodySmall" style={styles.details}>
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </Text>
                </View>
              )}

              {/* Reset Button */}
              <Button
                mode="contained"
                onPress={this.handleReset}
                style={styles.button}
                icon="refresh"
              >
                Try Again
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    borderRadius: 8,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    maxWidth: 500,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    width: '100%',
    marginBottom: 16,
  },
  detailsLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  details: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#999',
  },
  button: {
    marginTop: 8,
  },
});

export default ErrorBoundary;
