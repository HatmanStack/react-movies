/**
 * ReviewCard Component Tests
 * Tests rendering, content expansion, and user interactions
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import ReviewCard from '../../src/components/ReviewCard';
import { ReviewDetails } from '../../src/models/types';

// Test data
const shortReview: ReviewDetails = {
  identity: 1,
  id: 550,
  author: 'John Doe',
  content: 'Great movie!',
};

const longReview: ReviewDetails = {
  identity: 2,
  id: 550,
  author: 'Jane Smith',
  content:
    'This is a very long review that exceeds the normal length threshold and should show the "Read more" button. It contains detailed analysis of the plot, characters, cinematography, and overall production quality. The review goes on for quite a bit to ensure it triggers the expansion functionality.',
};

// Wrapper with PaperProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('ReviewCard', () => {
  it('renders author name correctly', () => {
    const { getByText } = render(<ReviewCard review={shortReview} />, { wrapper });

    expect(getByText('John Doe')).toBeTruthy();
  });

  it('renders review content correctly', () => {
    const { getByText } = render(<ReviewCard review={shortReview} />, { wrapper });

    expect(getByText('Great movie!')).toBeTruthy();
  });

  it('shows "Read more" button for long content', () => {
    const { getByText } = render(<ReviewCard review={longReview} />, { wrapper });

    expect(getByText('Jane Smith')).toBeTruthy();
    expect(getByText('Read more')).toBeTruthy();
  });

  it('does not show "Read more" button for short content', () => {
    const { queryByText } = render(<ReviewCard review={shortReview} />, { wrapper });

    expect(queryByText('Read more')).toBeNull();
  });

  it('expands content when "Read more" is pressed', () => {
    const { getByText } = render(<ReviewCard review={longReview} />, { wrapper });

    const readMoreButton = getByText('Read more');
    fireEvent.press(readMoreButton);

    // After expansion, should show "Show less" button
    expect(getByText('Show less')).toBeTruthy();
  });

  it('collapses content when "Show less" is pressed', () => {
    const { getByText } = render(<ReviewCard review={longReview} />, { wrapper });

    // First expand
    const readMoreButton = getByText('Read more');
    fireEvent.press(readMoreButton);

    // Then collapse
    const showLessButton = getByText('Show less');
    fireEvent.press(showLessButton);

    // Should be back to "Read more"
    expect(getByText('Read more')).toBeTruthy();
  });

  it('toggles expansion state correctly', () => {
    const { getByText } = render(<ReviewCard review={longReview} />, { wrapper });

    // Initially collapsed
    expect(getByText('Read more')).toBeTruthy();

    // Expand
    fireEvent.press(getByText('Read more'));
    expect(getByText('Show less')).toBeTruthy();

    // Collapse again
    fireEvent.press(getByText('Show less'));
    expect(getByText('Read more')).toBeTruthy();
  });

  it('renders different authors correctly', () => {
    const { rerender, getByText } = render(<ReviewCard review={shortReview} />, { wrapper });

    expect(getByText('John Doe')).toBeTruthy();

    // Re-render with different review
    rerender(<ReviewCard review={longReview} />);

    expect(getByText('Jane Smith')).toBeTruthy();
  });

  it('displays full content correctly', () => {
    const { getByText } = render(<ReviewCard review={longReview} />, { wrapper });

    // Content should be present (even if truncated initially)
    expect(
      getByText(/This is a very long review that exceeds the normal length threshold/)
    ).toBeTruthy();
  });
});
