import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import "react-native-reanimated";
import FilterPills from "../src/components/FilterPills";
import { COLORS } from "../src/constants";
import { initNetworkListener } from "../src/store/movieStore";
import { ErrorBoundary as AppErrorBoundary } from "../src/components/ErrorBoundary";
import { validateEnvironment } from "../src/utils/envValidation";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Validate environment variables at startup (fail fast on missing API keys)
try {
  validateEnvironment();
} catch {
  // Error already logged by validateEnvironment; app will fail on first API call
}

// Customize Material Design 3 theme to match Android app
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.PRIMARY,
    secondary: COLORS.ACCENT,
    tertiary: COLORS.SECONDARY,
  },
};

export default function RootLayout(): React.JSX.Element | null {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
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

  // Initialize network listener with proper cleanup
  useEffect(() => {
    const unsubscribe = initNetworkListener();
    return unsubscribe;
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav(): React.JSX.Element {
  return (
    <PaperProvider theme={theme}>
      <AppErrorBoundary>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "Movies",
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "bold" },
              animation: "default",
              headerTitle: () => <FilterPills />,
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="details/[id]"
            options={{
              title: "Movie Details",
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: "#fff",
              headerBackTitle: "Back",
              animation: "slide_from_right",
              animationDuration: 300,
            }}
          />
        </Stack>
      </AppErrorBoundary>
    </PaperProvider>
  );
}
