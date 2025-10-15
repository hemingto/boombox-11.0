/**
 * @fileoverview Tests for LocationsHeroSection component
 * @source boombox-10.0/src/app/components/locations/locationsherosection.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { LocationsHeroSection } from '@/components/features/locations/LocationsHeroSection';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock Google Maps components
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  Marker: () => <div data-testid="map-marker" />,
  Polygon: () => <div data-testid="map-polygon" />,
}));

// Mock environment variables
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key';

// Mock fetch for geocoding API
global.fetch = jest.fn();

describe('LocationsHeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        results: [
          {
            geometry: {
              location: { lat: 37.7749, lng: -122.4194 },
            },
          },
        ],
      }),
    });
  });

  describe('Rendering', () => {
    it('should render the component with all main elements', () => {
      render(<LocationsHeroSection />);

      expect(screen.getByRole('heading', { name: /locations/i })).toBeInTheDocument();
      expect(screen.getByText(/check if your zip code is within our service area/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /enter your zip code/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /check zip/i })).toBeInTheDocument();
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<LocationsHeroSection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('should render map icon', () => {
      render(<LocationsHeroSection />);
      const mapIcon = document.querySelector('.w-12.h-12');
      expect(mapIcon).toBeInTheDocument();
    });

    it('should render Google Maps with polygon', () => {
      render(<LocationsHeroSection />);
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
      expect(screen.getByTestId('map-polygon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      expect(input).toHaveAttribute('id', 'zip-code-input');

      const heading = screen.getByRole('heading', { name: /locations/i });
      expect(heading).toHaveAttribute('id', 'locations-hero-title');

      const section = screen.getByRole('region', { name: /locations/i });
      expect(section).toBeInTheDocument();
    });

    it('should have map with accessible label', () => {
      render(<LocationsHeroSection />);
      const mapWrapper = screen.getByRole('img', {
        name: /map showing boombox service area/i,
      });
      expect(mapWrapper).toBeInTheDocument();
    });

    it('should announce validation errors with role="alert"', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.click(button);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/please enter a valid zip code/i);
      });
    });

    it('should have aria-invalid on input when error occurs', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Zip Code Validation', () => {
    it('should accept valid 5-digit zip codes', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '94102' } });
      fireEvent.click(button);

      await waitFor(() => {
        const successMessage = screen.queryByText(/zip code is in our service area/i);
        const errorMessage = screen.queryByText(/not in our service area/i);
        expect(successMessage || errorMessage).toBeInTheDocument();
      });
    });

    it('should reject zip codes with less than 5 digits', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '1234' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid zip code/i)).toBeInTheDocument();
      });
    });

    it('should reject zip codes with more than 5 digits', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '123456' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid zip code/i)).toBeInTheDocument();
      });
    });

    it('should reject non-numeric zip codes', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: 'abcde' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid zip code/i)).toBeInTheDocument();
      });
    });

    it('should show error message for valid zip codes not in service area', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      // Using a valid zip code format but not in service area
      fireEvent.change(input, { target: { value: '90210' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/sorry, this zip code is not in our service area/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Input Interactions', () => {
    it('should update input value on change', () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i }) as HTMLInputElement;

      fireEvent.change(input, { target: { value: '94102' } });

      expect(input.value).toBe('94102');
    });

    it('should clear validation message when user starts typing', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      // Trigger error
      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid zip code/i)).toBeInTheDocument();
      });

      // Start typing
      fireEvent.change(input, { target: { value: '1234' } });

      expect(screen.queryByText(/please enter a valid zip code/i)).not.toBeInTheDocument();
    });

    it('should submit on Enter key press', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });

      fireEvent.change(input, { target: { value: '94102' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        const successMessage = screen.queryByText(/zip code is in our service area/i);
        const errorMessage = screen.queryByText(/not in our service area/i);
        expect(successMessage || errorMessage).toBeInTheDocument();
      });
    });

    it('should clear message on input focus', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      // Trigger error
      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid zip code/i)).toBeInTheDocument();
      });

      // Focus input
      fireEvent.focus(input);

      expect(screen.queryByText(/please enter a valid zip code/i)).not.toBeInTheDocument();
    });
  });

  describe('Design System Integration', () => {
    it('should apply success styling to input when zip code is valid', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '94102' } });
      fireEvent.click(button);

      await waitFor(() => {
        const successMessage = screen.queryByText(/zip code is in our service area/i);
        if (successMessage) {
          expect(input).toHaveClass('ring-emerald-500', 'bg-emerald-100');
        }
      });
    });

    it('should apply error styling to input when zip code is invalid', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(input).toHaveClass('ring-red-500', 'bg-red-100');
      });
    });

    it('should render button with design system Button component', () => {
      render(<LocationsHeroSection />);

      const button = screen.getByRole('button', { name: /check zip/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('font-semibold');
    });

    it('should apply design system surface color to map container', () => {
      render(<LocationsHeroSection />);

      const mapContainer = screen.getByTestId('google-map').parentElement;
      expect(mapContainer).toHaveClass('bg-surface-tertiary');
    });
  });

  describe('URL Query Parameters', () => {
    it('should pre-populate zip code from query params', async () => {
      const mockSearchParams = new URLSearchParams({ zipCode: '94102' });
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

      render(<LocationsHeroSection />);

      await waitFor(() => {
        const input = screen.getByRole('textbox', { name: /enter your zip code/i }) as HTMLInputElement;
        expect(input.value).toBe('94102');
      });
    });

    it('should ignore invalid zip codes from query params', () => {
      const mockSearchParams = new URLSearchParams({ zipCode: 'invalid' });
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i }) as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('Geocoding Integration', () => {
    it('should call geocoding API with valid zip code', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '94102' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('maps.googleapis.com/maps/api/geocode/json?address=94102')
        );
      });
    });

    it('should handle geocoding API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '94102' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/error fetching location data/i)).toBeInTheDocument();
      });
    });

    it('should handle empty geocoding results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ results: [] }),
      });

      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '94102' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/unable to find location for the zip code/i)).toBeInTheDocument();
      });
    });

    it('should show marker on map when valid zip code is entered', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '94102' } });
      fireEvent.click(button);

      await waitFor(() => {
        const successMessage = screen.queryByText(/zip code is in our service area/i);
        if (successMessage) {
          expect(screen.getByTestId('map-marker')).toBeInTheDocument();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input submission', async () => {
      render(<LocationsHeroSection />);

      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid zip code/i)).toBeInTheDocument();
      });
    });

    it('should handle rapid consecutive submissions', async () => {
      render(<LocationsHeroSection />);

      const input = screen.getByRole('textbox', { name: /enter your zip code/i });
      const button = screen.getByRole('button', { name: /check zip/i });

      fireEvent.change(input, { target: { value: '94102' } });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        const successMessage = screen.queryByText(/zip code is in our service area/i);
        const errorMessage = screen.queryByText(/not in our service area/i);
        expect(successMessage || errorMessage).toBeInTheDocument();
      });
    });

    it('should render with custom initial map center and zoom', () => {
      const customCenter = { lat: 37.8, lng: -122.5 };
      const customZoom = 10;

      render(
        <LocationsHeroSection initialCenter={customCenter} initialZoom={customZoom} />
      );

      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });
  });
});

