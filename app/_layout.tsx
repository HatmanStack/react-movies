import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import 'react-native-reanimated';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Customize Material Design 3 theme to match Android app
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976D2', // Blue primary color (matching Android)
    secondary: '#FF5722', // Orange-red accent color
    tertiary: '#FFC107', // Amber for favorites/stars
  },
};

export default function RootLayout(): React.JSX.Element | null {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav(): React.JSX.Element {
  return (
    <PaperProvider theme={theme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Movies',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            animation: 'default',
          }}
        />
        <Stack.Screen
          name="details/[id]"
          options={{
            title: 'Movie Details',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="filter"
          options={{
            title: 'Filter Movies',
            presentation: 'modal',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
            animation: 'slide_from_bottom',
            animationDuration: 300,
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
