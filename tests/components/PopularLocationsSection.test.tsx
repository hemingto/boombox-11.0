/**
 * @fileoverview Tests for PopularLocationsSection component
 * @source boombox-10.0/src/app/components/locations/popularlocationssection.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PopularLocationsSection } from '@/components/features/locations/PopularLocationsSection';
import { popularLocations } from '@/data/popularlocations';

// Mock window.innerWidth for mobile detection
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('PopularLocationsSection', () => {
  beforeEach(() => {
    // Reset to desktop width
    mockInnerWidth(1024);
  });

  describe('Rendering', () => {
    it('should render the component with heading', () => {
      render(<PopularLocationsSection />);

      expect(screen.getByRole('heading', { name: /popular storage locations/i })).toBeInTheDocument();
    });

    it('should render with custom heading', () => {
      render(<PopularLocationsSection heading="Featured Locations" />);

      expect(screen.getByRole('heading', { name: /featured locations/i })).toBeInTheDocument();
    });

    it('should render all locations on desktop', () => {
      mockInnerWidth(1024);
      render(<PopularLocationsSection />);

      // Should show all 6 default locations
      expect(screen.getByText(/san francisco/i)).toBeInTheDocument();
      expect(screen.getByText(/oakland/i)).toBeInTheDocument();
      expect(screen.getByText(/berkeley/i)).toBeInTheDocument();
      expect(screen.getByText(/mountain view/i)).toBeInTheDocument();
      expect(screen.getByText(/palo alto/i)).toBeInTheDocument();
      expect(screen.getByText(/san jose/i)).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<PopularLocationsSection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('should render grid with proper layout classes', () => {
      render(<PopularLocationsSection />);

      const grid = screen.getByRole('list', { name: /popular storage locations/i });
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      const section = screen.getByRole('region', { name: /popular storage locations/i });
      expect(section).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: /popular storage locations/i });
      expect(heading).toHaveAttribute('id', 'popular-locations-heading');

      const list = screen.getByRole('list', { name: /popular storage locations/i });
      expect(list).toBeInTheDocument();
    });

    it('should have navigation with proper ARIA label on mobile', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      // Trigger resize to update state
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const nav = screen.queryByRole('navigation', { name: /popular locations pagination/i });
        expect(nav).toBeInTheDocument();
      });
    });

    it('should have descriptive button labels', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous page of locations/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next page of locations/i })).toBeInTheDocument();
      });
    });

    it('should announce pagination status to screen readers', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/page 1 of 2/i);
        expect(status).toHaveClass('sr-only');
      });
    });

    it('should have proper list and listitem roles', () => {
      render(<PopularLocationsSection />);

      const list = screen.getByRole('list');
      const listItems = screen.getAllByRole('listitem');

      expect(list).toBeInTheDocument();
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Pagination', () => {
    it('should show pagination controls on mobile', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      });
    });

    it('should not show pagination controls on desktop', () => {
      mockInnerWidth(1024);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      const prevButton = screen.queryByRole('button', { name: /previous page/i });
      const nextButton = screen.queryByRole('button', { name: /next page/i });

      expect(prevButton).not.toBeInTheDocument();
      expect(nextButton).not.toBeInTheDocument();
    });

    it('should show 3 locations per page on mobile by default', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);
      });
    });

    it('should navigate to next page on mobile', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByText(/san francisco/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next page/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/mountain view/i)).toBeInTheDocument();
        expect(screen.queryByText(/san francisco/i)).not.toBeInTheDocument();
      });
    });

    it('should navigate to previous page on mobile', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      // Go to page 2
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next page/i });
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/mountain view/i)).toBeInTheDocument();
      });

      // Go back to page 1
      const prevButton = screen.getByRole('button', { name: /previous page/i });
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText(/san francisco/i)).toBeInTheDocument();
        expect(screen.queryByText(/mountain view/i)).not.toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous page/i });
        expect(prevButton).toBeDisabled();
        expect(prevButton).toHaveClass('opacity-50', 'cursor-not-allowed');
      });
    });

    it('should disable next button on last page', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      // Navigate to last page
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next page/i });
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next page/i });
        expect(nextButton).toBeDisabled();
        expect(nextButton).toHaveClass('opacity-50', 'cursor-not-allowed');
      });
    });

    it('should update pagination status when navigating', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/page 1 of 2/i);
      });

      const nextButton = screen.getByRole('button', { name: /next page/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/page 2 of 2/i);
      });
    });
  });

  describe('Card Integration', () => {
    it('should render Card components with correct props', () => {
      render(<PopularLocationsSection />);

      // Check that location names are rendered (Card displays location prop)
      expect(screen.getByText(/san francisco/i)).toBeInTheDocument();
      expect(screen.getByText(/1,032/i)).toBeInTheDocument();
      expect(screen.getByText(/happy customers/i)).toBeInTheDocument();
    });

    it('should pass all required props to Card components', () => {
      render(<PopularLocationsSection />);

      // Verify images are rendered with proper alt text
      const images = document.querySelectorAll('img');
      const goldenGateImage = Array.from(images).find(
        img => img.alt === 'Golden Gate Bridge'
      );
      expect(goldenGateImage).toBeInTheDocument();
    });

    it('should render cards as links', () => {
      render(<PopularLocationsSection />);

      // Cards should be wrapped in links
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Design System Integration', () => {
    it('should apply design system colors to navigation buttons', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous page/i });
        const nextButton = screen.getByRole('button', { name: /next page/i });

        expect(prevButton).toHaveClass('bg-surface-tertiary');
        expect(nextButton).toHaveClass('bg-surface-tertiary');
      });
    });

    it('should apply hover styles to enabled buttons', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next page/i });
        expect(nextButton).toHaveClass('hover:bg-surface-disabled');
      });
    });

    it('should apply consistent spacing classes', () => {
      render(<PopularLocationsSection />);

      const section = screen.getByRole('region');
      expect(section).toHaveClass('mt-12', 'sm:mt-24', 'sm:mb-48', 'mb-24');
    });
  });

  describe('Responsive Behavior', () => {
    it('should detect mobile screen size', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3); // Mobile shows 3 items
      });
    });

    it('should detect desktop screen size', async () => {
      mockInnerWidth(1024);
      render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(6); // Desktop shows all items
      });
    });

    it('should update on window resize', async () => {
      mockInnerWidth(1024);
      const { rerender } = render(<PopularLocationsSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(6);
      });

      // Switch to mobile
      mockInnerWidth(500);
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);
      });
    });

    it('should clean up resize listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<PopularLocationsSection />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Custom Props', () => {
    it('should accept custom locations array', () => {
      const customLocations = [
        {
          location: 'Test City',
          customerCount: '100',
          description: 'test users',
          imageSrc: '/test.png',
          imageAlt: 'Test image',
          link: '/test',
        },
      ];

      render(<PopularLocationsSection locations={customLocations} />);

      expect(screen.getByText(/test city/i)).toBeInTheDocument();
      expect(screen.getByText(/100/i)).toBeInTheDocument();
      expect(screen.getByText(/test users/i)).toBeInTheDocument();
    });

    it('should accept custom locationsPerPage', async () => {
      mockInnerWidth(500);
      render(<PopularLocationsSection locationsPerPage={2} />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(2); // Custom: 2 items per page
      });
    });

    it('should accept custom grid className', () => {
      render(<PopularLocationsSection gridClassName="custom-grid" />);

      const grid = screen.getByRole('list');
      expect(grid).toHaveClass('custom-grid');
    });

    it('should accept custom heading container className', () => {
      render(<PopularLocationsSection headingContainerClassName="custom-heading" />);

      const headingContainer = screen.getByRole('heading', { name: /popular storage locations/i }).parentElement;
      expect(headingContainer).toHaveClass('custom-heading');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty locations array', () => {
      render(<PopularLocationsSection locations={[]} />);

      const list = screen.getByRole('list');
      const listItems = screen.queryAllByRole('listitem');

      expect(list).toBeInTheDocument();
      expect(listItems).toHaveLength(0);
    });

    it('should handle single location', async () => {
      mockInnerWidth(500);
      const singleLocation = [popularLocations[0]];

      render(<PopularLocationsSection locations={singleLocation} />);

      fireEvent(window, new Event('resize'));

      // Should not show pagination for single location
      await waitFor(() => {
        const prevButton = screen.queryByRole('button', { name: /previous page/i });
        const nextButton = screen.queryByRole('button', { name: /next page/i });

        expect(prevButton).not.toBeInTheDocument();
        expect(nextButton).not.toBeInTheDocument();
      });
    });

    it('should handle exactly locationsPerPage items', async () => {
      mockInnerWidth(500);
      const threeLocations = popularLocations.slice(0, 3);

      render(<PopularLocationsSection locations={threeLocations} locationsPerPage={3} />);

      fireEvent(window, new Event('resize'));

      // Should not show pagination when items exactly match locationsPerPage
      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);

        const prevButton = screen.queryByRole('button', { name: /previous page/i });
        expect(prevButton).not.toBeInTheDocument();
      });
    });
  });
});

