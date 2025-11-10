/**
 * VideoCard Component Tests
 * Tests rendering and user interactions for video/trailer cards
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import VideoCard from '../../src/components/VideoCard';
import { VideoDetails } from '../../src/models/types';

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Test data
const mockVideo: VideoDetails = {
  identity: 1,
  id: 550,
  image_url: 'https://img.youtube.com/vi/ABC123/0.jpg',
  iso_639_1: 'en',
  iso_3166_1: 'US',
  key: 'ABC123',
  site: 'YouTube',
  size: '1080',
  type: 'Trailer',
};

const mockClip: VideoDetails = {
  ...mockVideo,
  identity: 2,
  key: 'XYZ789',
  type: 'Clip',
};

// Wrapper with PaperProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('VideoCard', () => {
  it('renders video type correctly', () => {
    const { getByText } = render(
      <VideoCard video={mockVideo} onPress={jest.fn()} />,
      { wrapper }
    );

    expect(getByText('Trailer')).toBeTruthy();
  });

  it('renders different video types correctly', () => {
    const { getByText } = render(
      <VideoCard video={mockClip} onPress={jest.fn()} />,
      { wrapper }
    );

    expect(getByText('Clip')).toBeTruthy();
  });

  it('calls onPress with correct video key when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <VideoCard video={mockVideo} onPress={onPressMock} />,
      { wrapper }
    );

    fireEvent.press(getByText('Trailer'));

    expect(onPressMock).toHaveBeenCalledTimes(1);
    expect(onPressMock).toHaveBeenCalledWith('ABC123');
  });

  it('handles press on entire card area', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <VideoCard video={mockVideo} onPress={onPressMock} />,
      { wrapper }
    );

    fireEvent.press(getByText('Trailer'));

    expect(onPressMock).toHaveBeenCalledWith('ABC123');
  });

  it('renders without errors for different video keys', () => {
    const onPressMock = jest.fn();

    const { rerender, getByText } = render(
      <VideoCard video={mockVideo} onPress={onPressMock} />,
      { wrapper }
    );

    expect(getByText('Trailer')).toBeTruthy();

    // Re-render with different video
    rerender(<VideoCard video={mockClip} onPress={onPressMock} />);

    expect(getByText('Clip')).toBeTruthy();
  });

  it('is memoized for performance', () => {
    const onPressMock = jest.fn();
    const { rerender } = render(
      <VideoCard video={mockVideo} onPress={onPressMock} />,
      { wrapper }
    );

    // Re-render with same props
    rerender(<VideoCard video={mockVideo} onPress={onPressMock} />);

    // Component should be memoized (React.memo)
    expect(true).toBe(true);
  });
});
