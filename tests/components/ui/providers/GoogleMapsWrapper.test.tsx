import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleMapsWrapper from '@/components/ui/providers/GoogleMapsWrapper';

// Mock the Spinner component
jest.mock('@/components/ui/primitives/Spinner', () => ({
  __esModule: true,
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

let mockOnLoad: () => void = () => {};

jest.mock('@react-google-maps/api', () => ({
  __esModule: true,
  LoadScript: ({ children, onLoad, loadingElement }: { children: React.ReactNode, onLoad: () => void, loadingElement: React.ReactElement }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    mockOnLoad = () => {
      setIsLoaded(true);
      onLoad();
    };
    return isLoaded ? <>{children}</> : loadingElement;
  },
}));

describe('GoogleMapsWrapper', () => {
  it('renders a loading spinner initially', () => {
    render(
      <GoogleMapsWrapper>
        <div>Child Content</div>
      </GoogleMapsWrapper>
    );
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renders children after the script has loaded', async () => {
    render(
      <GoogleMapsWrapper>
        <div>Child Content</div>
      </GoogleMapsWrapper>
    );

    act(() => {
      mockOnLoad();
    });

    await waitFor(() => {
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});
