/**
 * Unit tests for ErrorMessage component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import ErrorMessage from '../../src/components/ErrorMessage';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('ErrorMessage', () => {
  it('should render error message', () => {
    const { getByText } = render(<ErrorMessage message="Something went wrong" />, { wrapper });

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should render without retry button when onRetry not provided', () => {
    const { queryByText } = render(<ErrorMessage message="Test error" />, { wrapper });

    expect(queryByText('Try Again')).toBeNull();
  });

  it('should render retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorMessage message="Test error" onRetry={onRetry} />, {
      wrapper,
    });

    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should call onRetry when retry button pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorMessage message="Test error" onRetry={onRetry} />, {
      wrapper,
    });

    fireEvent.press(getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should display custom error message', () => {
    const customMessage = 'Failed to load movies from API';
    const { getByText } = render(<ErrorMessage message={customMessage} />, { wrapper });

    expect(getByText(customMessage)).toBeTruthy();
  });
});
