/**
 * Type augmentation for react-native-reanimated
 * Adds support for undocumented but valid props
 */

import 'react-native-reanimated';

declare module 'react-native-reanimated' {
  interface AnimatedViewProps {
    /**
     * Shared element transition tag for cross-screen animations
     * Used with Expo Router's shared element transitions
     */
    sharedTransitionTag?: string;
  }
}
