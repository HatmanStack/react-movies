import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Switch, Text, Divider } from 'react-native-paper';
import { useFilterStore } from '../src/store/filterStore';

/**
 * Filter Screen
 * Allows users to toggle which movie categories to display
 * Replaces Android's SearchFragment
 */
export default function FilterScreen(): React.JSX.Element {
  // Subscribe to filter store
  const showPopular = useFilterStore((state) => state.showPopular);
  const showTopRated = useFilterStore((state) => state.showTopRated);
  const showFavorites = useFilterStore((state) => state.showFavorites);
  const togglePopular = useFilterStore((state) => state.togglePopular);
  const toggleTopRated = useFilterStore((state) => state.toggleTopRated);
  const toggleFavorites = useFilterStore((state) => state.toggleFavorites);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Filter Movies
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Choose which movies to display
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Filter Options */}
      <List.Section>
        <List.Subheader>Movie Categories</List.Subheader>

        {/* Popular Movies Filter */}
        <List.Item
          title="Show Popular Movies"
          description="Display movies from the popular collection"
          left={(props) => <List.Icon {...props} icon="fire" color="#FF5722" />}
          right={() => (
            <Switch
              value={showPopular}
              onValueChange={togglePopular}
              color="#1976D2"
            />
          )}
        />

        {/* Top Rated Movies Filter */}
        <List.Item
          title="Show Top Rated Movies"
          description="Display movies from the top rated collection"
          left={(props) => <List.Icon {...props} icon="star" color="#FFC107" />}
          right={() => (
            <Switch
              value={showTopRated}
              onValueChange={toggleTopRated}
              color="#1976D2"
            />
          )}
        />

        {/* Favorites Filter */}
        <List.Item
          title="Show Favorites"
          description="Display only your favorite movies"
          left={(props) => <List.Icon {...props} icon="heart" color="#E91E63" />}
          right={() => (
            <Switch
              value={showFavorites}
              onValueChange={toggleFavorites}
              color="#1976D2"
            />
          )}
        />
      </List.Section>

      <Divider style={styles.divider} />

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text variant="bodySmall" style={styles.infoText}>
          Multiple filters can be active at the same time. Movies matching any of the active filters will be displayed.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  divider: {
    marginVertical: 8,
  },
  infoSection: {
    padding: 20,
    paddingTop: 8,
  },
  infoText: {
    color: '#999',
    lineHeight: 20,
    textAlign: 'center',
  },
});
