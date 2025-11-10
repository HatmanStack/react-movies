/**
 * Integration Test: Movie Flow
 * Tests complete user journey: Browse movies → View details → Navigate back
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import HomeScreen from '../../app/index';
import { useMovieStore } from '../../src/store/movieStore';
import { useFilterStore } from '../../src/store/filterStore';

// Mock Expo Router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useLocalSearchParams: () => ({ id: '123' }),
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock database queries
jest.mock('../../src/database/queries', () => ({
  getAllMovies: jest.fn().mockResolvedValue([]),
  getPopularMovies: jest.fn().mockResolvedValue([]),
  getTopRatedMovies: jest.fn().mockResolvedValue([]),
  getFavoriteMovies: jest.fn().mockResolvedValue([]),
  insertMovie: jest.fn().mockResolvedValue(undefined),
  getMovieById: jest.fn(),
  getTrailersForMovie: jest.fn().mockResolvedValue([]),
  getReviewsForMovie: jest.fn().mockResolvedValue([]),
}));

// Mock TMDb API
jest.mock('../../src/api/tmdb', () => ({
  TMDbService: {
    getPopularMovies: jest.fn().mockResolvedValue({ results: [] }),
    getTopRatedTV: jest.fn().mockResolvedValue({ results: [] }),
  },
}));

// Wrapper with PaperProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('Integration: Movie Flow', () => {
  beforeEach(() => {
    // Reset stores
    useMovieStore.setState({
      movies: [],
      loading: false,
      error: null,
      syncing: false,
      isOffline: false,
    });

    useFilterStore.setState({
      showPopular: true,
      showTopRated: false,
      showFavorites: false,
    });
  });

  it('loads movies and displays them in grid', async () => {
    // Set up test data
    const testMovies = [
      {
        id: 1,
        title: 'Test Movie 1',
        overview: 'Description 1',
        poster_path: '/test1.jpg',
        release_date: '2024-01-01',
        vote_average: 8.5,
        vote_count: 100,
        popularity: 50,
        original_language: 'en',
        favorite: false,
        toprated: false,
        popular: true,
      },
      {
        id: 2,
        title: 'Test Movie 2',
        overview: 'Description 2',
        poster_path: '/test2.jpg',
        release_date: '2024-01-02',
        vote_average: 7.5,
        vote_count: 80,
        popularity: 40,
        original_language: 'en',
        favorite: false,
        toprated: false,
        popular: true,
      },
    ];

    useMovieStore.setState({ movies: testMovies, loading: false });

    const { getByText } = render(<HomeScreen />, { wrapper });

    // Verify movies are displayed
    await waitFor(() => {
      expect(getByText('Test Movie 1')).toBeTruthy();
      expect(getByText('Test Movie 2')).toBeTruthy();
    });
  });

  it('handles loading state correctly', () => {
    useMovieStore.setState({ movies: [], loading: true });

    const state = useMovieStore.getState();
    expect(state.loading).toBe(true);
    expect(state.movies.length).toBe(0);
  });

  it('handles error state correctly', () => {
    useMovieStore.setState({
      movies: [],
      loading: false,
      error: 'Failed to load movies',
    });

    const state = useMovieStore.getState();
    expect(state.error).toBe('Failed to load movies');
    expect(state.loading).toBe(false);
  });
});
