import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useFilterStore } from '../store/filterStore';

interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterPill({ label, active, onPress }: FilterPillProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function FilterPills(): React.JSX.Element {
  const showPopular = useFilterStore((state) => state.showPopular);
  const showTopRated = useFilterStore((state) => state.showTopRated);
  const showFavorites = useFilterStore((state) => state.showFavorites);
  const togglePopular = useFilterStore((state) => state.togglePopular);
  const toggleTopRated = useFilterStore((state) => state.toggleTopRated);
  const toggleFavorites = useFilterStore((state) => state.toggleFavorites);

  return (
    <View style={styles.container}>
      <FilterPill label="Popular" active={showPopular} onPress={togglePopular} />
      <FilterPill label="Ratings" active={showTopRated} onPress={toggleTopRated} />
      <FilterPill label="Favorites" active={showFavorites} onPress={toggleFavorites} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1565C0',
    borderRadius: 24,
    padding: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: '#0D47A1',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  pillTextActive: {
    color: '#ffffff',
  },
});
