/**
 * @fileoverview Tests for ZipCodeSection component
 * @source boombox-10.0/src/app/components/locations/zipcodesection.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ZipCodeSection } from '@/components/features/locations/ZipCodeSection';
import { zipCodePrices } from '@/data/zipcodeprices';

// Mock window.innerWidth for responsive pagination
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('ZipCodeSection', () => {
  beforeEach(() => {
    // Reset to desktop width
    mockInnerWidth(1024);
  });

  describe('Rendering', () => {
    it('should render the component with heading', () => {
      render(<ZipCodeSection />);

      expect(screen.getByRole('heading', { name: /complete zip code list/i })).toBeInTheDocument();
    });

    it('should render with custom heading', () => {
      render(<ZipCodeSection heading="Service Area Zip Codes" />);

      expect(screen.getByRole('heading', { name: /service area zip codes/i })).toBeInTheDocument();
    });

    it('should render zip codes from zipCodePrices data', () => {
      render(<ZipCodeSection />);

      const zipCodes = Object.keys(zipCodePrices);
      const firstZipCode = zipCodes[0];

      expect(screen.getByText(firstZipCode)).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<ZipCodeSection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('should render grid with proper role attributes', () => {
      render(<ZipCodeSection />);

      const grid = screen.getByRole('list', { name: /available service area zip codes/i });
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<ZipCodeSection />);

      const section = screen.getByRole('region', { name: /complete zip code list/i });
      expect(section).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: /complete zip code list/i });
      expect(heading).toHaveAttribute('id', 'zip-code-section-title');

      const list = screen.getByRole('list', { name: /available service area zip codes/i });
      expect(list).toBeInTheDocument();
    });

    it('should have navigation with proper ARIA labels', () => {
      render(<ZipCodeSection />);

      const nav = screen.getByRole('navigation', { name: /zip codes pagination/i });
      expect(nav).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /previous page of zip codes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page of zip codes/i })).toBeInTheDocument();
    });

    it('should announce pagination status to screen readers', () => {
      render(<ZipCodeSection />);

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/page \d+ of \d+/i);
      expect(status).toHaveClass('sr-only');
    });

    it('should have descriptive link labels for zip codes', () => {
      render(<ZipCodeSection />);

      const zipCodes = Object.keys(zipCodePrices);
      const firstZipCode = zipCodes[0];

      const link = screen.getByRole('link', { name: new RegExp(`check availability for zip code ${firstZipCode}`, 'i') });
      expect(link).toBeInTheDocument();
    });

    it('should have proper list and listitem roles', () => {
      render(<ZipCodeSection />);

      const list = screen.getByRole('list');
      const listItems = screen.getAllByRole('listitem');

      expect(list).toBeInTheDocument();
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('should have focus-visible styling on links', () => {
      render(<ZipCodeSection />);

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveClass('focus-visible');
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      render(<ZipCodeSection />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      render(<ZipCodeSection />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();
      expect(prevButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should enable next button when more pages available', () => {
      render(<ZipCodeSection />);

      const zipCodesCount = Object.keys(zipCodePrices).length;
      
      if (zipCodesCount > 42) {
        const nextButton = screen.getByRole('button', { name: /next page/i });
        expect(nextButton).not.toBeDisabled();
        expect(nextButton).toHaveClass('cursor-pointer');
      }
    });

    it('should navigate to next page', async () => {
      render(<ZipCodeSection />);

      const zipCodes = Object.keys(zipCodePrices);
      const firstPageFirstZip = zipCodes[0];
      
      expect(screen.getByText(firstPageFirstZip)).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: /next page/i }) as HTMLButtonElement;
      
      if (!nextButton.disabled) {
        fireEvent.click(nextButton);

        await waitFor(() => {
          const status = screen.getByRole('status');
          expect(status).toHaveTextContent(/page 2/i);
        });

        expect(screen.queryByText(firstPageFirstZip)).not.toBeInTheDocument();
      }
    });

    it('should navigate back to previous page', async () => {
      render(<ZipCodeSection />);

      const nextButton = screen.getByRole('button', { name: /next page/i }) as HTMLButtonElement;
      
      if (!nextButton.disabled) {
        fireEvent.click(nextButton);

        await waitFor(() => {
          const status = screen.getByRole('status');
          expect(status).toHaveTextContent(/page 2/i);
        });

        const prevButton = screen.getByRole('button', { name: /previous page/i });
        fireEvent.click(prevButton);

        await waitFor(() => {
          const status = screen.getByRole('status');
          expect(status).toHaveTextContent(/page 1/i);
        });
      }
    });

    it('should update pagination status when navigating', async () => {
      render(<ZipCodeSection />);

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/page 1/i);

      const nextButton = screen.getByRole('button', { name: /next page/i }) as HTMLButtonElement;
      
      if (!nextButton.disabled) {
        fireEvent.click(nextButton);

        await waitFor(() => {
          expect(status).toHaveTextContent(/page 2/i);
        });
      }
    });
  });

  describe('Chip Component Integration', () => {
    it('should render Chip components for each zip code', () => {
      render(<ZipCodeSection />);

      const zipCodes = Object.keys(zipCodePrices);
      const listItems = screen.getAllByRole('listitem');

      expect(listItems.length).toBeGreaterThan(0);
      expect(listItems.length).toBeLessThanOrEqual(42); // Max items per page on desktop
    });

    it('should render zip codes as clickable chips', () => {
      render(<ZipCodeSection />);

      const zipCodes = Object.keys(zipCodePrices);
      const firstZipCode = zipCodes[0];

      const chip = screen.getByText(firstZipCode);
      expect(chip).toBeInTheDocument();

      const link = chip.closest('a');
      expect(link).toHaveAttribute('href', `/locations?zipCode=${firstZipCode}`);
    });

    it('should link to locations page with zipCode query parameter', () => {
      render(<ZipCodeSection />);

      const links = screen.getAllByRole('link');
      const firstLink = links[0];

      expect(firstLink).toHaveAttribute('href');
      expect(firstLink.getAttribute('href')).toContain('/locations?zipCode=');
    });
  });

  describe('Design System Integration', () => {
    it('should apply design system colors to navigation buttons', () => {
      render(<ZipCodeSection />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      const nextButton = screen.getByRole('button', { name: /next page/i });

      expect(prevButton).toHaveClass('bg-surface-tertiary');
      expect(nextButton).toHaveClass('bg-surface-tertiary');
    });

    it('should apply hover styles to enabled buttons', () => {
      render(<ZipCodeSection />);

      const nextButton = screen.getByRole('button', { name: /next page/i }) as HTMLButtonElement;

      if (!nextButton.disabled) {
        expect(nextButton).toHaveClass('hover:bg-surface-disabled');
      }
    });

    it('should apply focus-visible styles to buttons', () => {
      render(<ZipCodeSection />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toHaveClass('focus-visible');
    });

    it('should apply consistent spacing classes', () => {
      render(<ZipCodeSection />);

      const section = screen.getByRole('region');
      expect(section).toHaveClass('mt-12', 'sm:mt-24', 'sm:mb-48', 'mb-24');
    });

    it('should apply gap classes to grid', () => {
      render(<ZipCodeSection />);

      const grid = screen.getByRole('list');
      expect(grid).toHaveClass('gap-4', 'lg:gap-6');
    });
  });

  describe('Responsive Grid Pagination Hook Integration', () => {
    it('should display different number of zip codes based on screen size', async () => {
      mockInnerWidth(1024);
      render(<ZipCodeSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        // Desktop: up to 42 items (6 rows × 7 columns)
        expect(listItems.length).toBeLessThanOrEqual(42);
      });
    });

    it('should update grid columns on mobile', async () => {
      mockInnerWidth(500);
      render(<ZipCodeSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        // Mobile: up to 15 items (5 rows × 3 columns)
        expect(listItems.length).toBeLessThanOrEqual(15);
      });
    });

    it('should update grid columns on tablet', async () => {
      mockInnerWidth(768);
      render(<ZipCodeSection />);

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        // Tablet: up to 30 items (5 rows × 6 columns)
        expect(listItems.length).toBeLessThanOrEqual(30);
      });
    });

    it('should apply correct grid class based on columns', () => {
      render(<ZipCodeSection />);

      const grid = screen.getByRole('list');
      // Desktop default should be grid-cols-7
      expect(grid.className).toMatch(/grid-cols-\d/);
    });
  });

  describe('Custom Props', () => {
    it('should accept custom heading container className', () => {
      render(<ZipCodeSection headingContainerClassName="custom-heading" />);

      const headingContainer = screen.getByRole('heading', { name: /complete zip code list/i }).parentElement;
      expect(headingContainer).toHaveClass('custom-heading');
    });

    it('should accept custom grid className', () => {
      render(<ZipCodeSection gridClassName="custom-grid" />);

      const grid = screen.getByRole('list');
      expect(grid).toHaveClass('custom-grid');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty zip code data gracefully', () => {
      // Mock empty zipCodePrices
      jest.mock('@/app/data/zipcodeprices', () => ({
        zipCodePrices: {},
      }));

      render(<ZipCodeSection />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('should not break when navigating past last page', () => {
      render(<ZipCodeSection />);

      const nextButton = screen.getByRole('button', { name: /next page/i }) as HTMLButtonElement;

      // Try clicking disabled button
      if (nextButton.disabled) {
        fireEvent.click(nextButton);
        
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/page 1/i);
      }
    });

    it('should not break when navigating before first page', () => {
      render(<ZipCodeSection />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });

      // Try clicking disabled button
      fireEvent.click(prevButton);
      
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/page 1/i);
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<ZipCodeSection />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Data Integration', () => {
    it('should display zip codes from zipCodePrices', () => {
      render(<ZipCodeSection />);

      const zipCodes = Object.keys(zipCodePrices);
      expect(zipCodes.length).toBeGreaterThan(0);

      // Check first few zip codes are rendered
      const firstZip = zipCodes[0];
      expect(screen.getByText(firstZip)).toBeInTheDocument();
    });

    it('should calculate correct total pages based on zip code count', () => {
      render(<ZipCodeSection />);

      const status = screen.getByRole('status');
      const totalPages = Math.ceil(Object.keys(zipCodePrices).length / 42); // Desktop: 42 items per page

      expect(status).toHaveTextContent(new RegExp(`of ${totalPages}`, 'i'));
    });
  });
});

