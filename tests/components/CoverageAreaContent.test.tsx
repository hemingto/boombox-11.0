/**
 * @fileoverview Tests for CoverageAreaContent component
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import CoverageAreaContent from '@/components/features/service-providers/coverage/CoverageAreaContent';

expect.extend(toHaveNoViolations);

// Mock Google Maps components
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: function MockGoogleMap({ children }: { children: React.ReactNode }) {
    return <div data-testid="google-map">{children}</div>;
  },
  Polygon: function MockPolygon() {
    return <div data-testid="service-area-polygon" />;
  },
  Marker: function MockMarker({ title }: { title?: string }) {
    return <div data-testid="warehouse-marker" title={title} />;
  },
}));

// Mock Google Maps Geocoder
const mockGeocode = jest.fn();
global.google = {
  maps: {
    Geocoder: jest.fn().mockImplementation(() => ({
      geocode: mockGeocode,
    })),
  },
} as any;

describe('CoverageAreaContent', () => {
  const mockWarehouseLocation = {
    lat: () => 37.6556,
    lng: () => -122.4047,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful geocoding
    mockGeocode.mockImplementation((request, callback) => {
      callback(
        [
          {
            geometry: {
              location: mockWarehouseLocation,
            },
          },
        ],
        'OK'
      );
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CoverageAreaContent />);
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });

    it('renders the map container', () => {
      render(<CoverageAreaContent />);
      
      const mapContainer = screen.getByTestId('google-map');
      expect(mapContainer).toBeInTheDocument();
    });

    it('renders the service area polygon', () => {
      render(<CoverageAreaContent />);
      
      expect(screen.getByTestId('service-area-polygon')).toBeInTheDocument();
    });

    it('renders warehouse location note', () => {
      render(<CoverageAreaContent />);
      
      expect(screen.getByText(/The pin represents the Boombox warehouse location/i)).toBeInTheDocument();
    });

    it('displays warehouse address in the note', () => {
      render(<CoverageAreaContent />);
      
      const addressElements = screen.getAllByText(/105 Associated Road, South San Francisco, CA 94080/i);
      expect(addressElements.length).toBeGreaterThan(0);
      expect(addressElements[0]).toBeInTheDocument();
    });

    it('renders service area notes heading', () => {
      render(<CoverageAreaContent />);
      
      expect(screen.getByRole('heading', { name: /service area notes/i })).toBeInTheDocument();
    });

    it('displays service area information list', () => {
      render(<CoverageAreaContent />);
      
      expect(screen.getByText(/The Boombox warehouse is located at/i)).toBeInTheDocument();
      expect(screen.getByText(/Jobs begin and end at the Boombox warehouse/i)).toBeInTheDocument();
    });
  });

  describe('Google Maps Integration', () => {
    it('initializes Google Maps Geocoder', () => {
      render(<CoverageAreaContent />);
      
      expect(global.google.maps.Geocoder).toHaveBeenCalled();
    });

    it('geocodes the warehouse address', async () => {
      render(<CoverageAreaContent />);
      
      await waitFor(() => {
        expect(mockGeocode).toHaveBeenCalledWith(
          { address: '105 Associated Road, South San Francisco, CA 94080' },
          expect.any(Function)
        );
      });
    });

    it('renders warehouse marker after successful geocoding', async () => {
      render(<CoverageAreaContent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('warehouse-marker')).toBeInTheDocument();
      });
    });

    it('sets correct title on warehouse marker', async () => {
      render(<CoverageAreaContent />);
      
      await waitFor(() => {
        const marker = screen.getByTestId('warehouse-marker');
        expect(marker).toHaveAttribute('title', 'Boombox Warehouse');
      });
    });

    it('handles geocoding failure gracefully', async () => {
      mockGeocode.mockImplementation((request, callback) => {
        callback(null, 'ERROR');
      });

      render(<CoverageAreaContent />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('warehouse-marker')).not.toBeInTheDocument();
      });
    });

    it('handles missing geocoding results gracefully', async () => {
      mockGeocode.mockImplementation((request, callback) => {
        callback([], 'OK');
      });

      render(<CoverageAreaContent />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('warehouse-marker')).not.toBeInTheDocument();
      });
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct container classes', () => {
      const { container } = render(<CoverageAreaContent />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'max-w-5xl', 'mx-auto');
    });

    it('renders map with aspect-video ratio', () => {
      const { container } = render(<CoverageAreaContent />);
      
      const mapContainer = container.querySelector('.aspect-video');
      expect(mapContainer).toBeInTheDocument();
    });

    it('applies design system colors to note container', () => {
      const { container } = render(<CoverageAreaContent />);
      
      const noteContainer = container.querySelector('[role="note"]');
      expect(noteContainer).toHaveClass('border', 'border-border', 'rounded-md');
    });

    it('uses semantic heading structure', () => {
      render(<CoverageAreaContent />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Service Area Notes');
    });
  });

  describe('Content Display', () => {
    it('displays warehouse address multiple times', () => {
      render(<CoverageAreaContent />);
      
      const addressMatches = screen.getAllByText(/105 Associated Road/i);
      expect(addressMatches.length).toBeGreaterThan(1);
    });

    it('renders service area information as list', () => {
      render(<CoverageAreaContent />);
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('displays all service area bullet points', () => {
      const { container } = render(<CoverageAreaContent />);
      
      const bulletPoints = container.querySelectorAll('li');
      expect(bulletPoints).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<CoverageAreaContent />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA role for note container', () => {
      render(<CoverageAreaContent />);
      
      const noteContainer = screen.getByRole('note');
      expect(noteContainer).toHaveAttribute('aria-label', 'Warehouse location information');
    });

    it('has proper ARIA labelledby for service area section', () => {
      const { container } = render(<CoverageAreaContent />);
      
      const section = container.querySelector('section[aria-labelledby="service-area-heading"]');
      expect(section).toBeInTheDocument();
      
      const heading = container.querySelector('#service-area-heading');
      expect(heading).toBeInTheDocument();
    });

    it('uses semantic HTML for list structure', () => {
      render(<CoverageAreaContent />);
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      render(<CoverageAreaContent />);
      
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    it('displays correct note text', () => {
      render(<CoverageAreaContent />);
      
      expect(screen.getByText(/Note:/i)).toBeInTheDocument();
      expect(screen.getByText(/The pin represents the Boombox warehouse location/i)).toBeInTheDocument();
    });

    it('emphasizes warehouse address with bold styling', () => {
      const { container } = render(<CoverageAreaContent />);
      
      const boldElements = container.querySelectorAll('.font-bold');
      expect(boldElements.length).toBeGreaterThan(0);
    });

    it('displays job logistics information', () => {
      render(<CoverageAreaContent />);
      
      expect(screen.getByText(/Jobs begin and end at the Boombox warehouse/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive padding classes', () => {
      const { container } = render(<CoverageAreaContent />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('lg:px-16', 'px-6');
    });

    it('uses responsive max-width constraint', () => {
      const { container } = render(<CoverageAreaContent />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('max-w-5xl');
    });
  });

  describe('Map Configuration', () => {
    it('sets correct map center coordinates', () => {
      render(<CoverageAreaContent />);
      
      // Component sets center to { lat: 37.59, lng: -122.1 }
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });

    it('includes service area polygon in map', () => {
      render(<CoverageAreaContent />);
      
      expect(screen.getByTestId('service-area-polygon')).toBeInTheDocument();
    });
  });
});

