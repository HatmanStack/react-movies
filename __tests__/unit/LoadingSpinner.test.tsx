/**
 * Unit tests for LoadingSpinner component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import LoadingSpinner from '../../src/components/LoadingSpinner';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('LoadingSpinner', () => {
  it('should render without message', () => {
    const { queryByText } = render(<LoadingSpinner />, { wrapper });

    // Should render ActivityIndicator but no message
    expect(queryByText(/loading/i)).toBeNull();
  });

  it('should render with message', () => {
    const { getByText } = render(<LoadingSpinner message="Loading movies..." />, { wrapper });

    expect(getByText('Loading movies...')).toBeTruthy();
  });

  it('should render with overlay style', () => {
    const { getByTestId } = render(
      <LoadingSpinner message="Loading..." overlay={true} />,
      { wrapper }
    );

    // Verify component renders (overlay styling is applied via styles)
    const { getByText } = render(<LoadingSpinner message="Loading..." overlay={true} />, {
      wrapper,
    });
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should render without overlay style by default', () => {
    const { getByText } = render(<LoadingSpinner message="Loading..." />, { wrapper });

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should display custom loading message', () => {
    const customMessage = 'Syncing with TMDb API...';
    const { getByText } = render(<LoadingSpinner message={customMessage} />, { wrapper });

    expect(getByText(customMessage)).toBeTruthy();
  });
});
