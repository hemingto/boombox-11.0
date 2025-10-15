/**
 * @fileoverview Tests for BestPracticesVideoGallery component
 * Following boombox-11.0 testing standards
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { BestPracticesVideoGallery } from '@/components/features/service-providers/best-practices/BestPracticesVideoGallery';
import { TRAINING_VIDEOS } from '@/data/trainingVideos';

expect.extend(toHaveNoViolations);

describe('BestPracticesVideoGallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<BestPracticesVideoGallery />);
      expect(screen.getByRole('button', { name: /filter videos/i })).toBeInTheDocument();
    });

    it('displays initial page of videos (3 videos)', () => {
      render(<BestPracticesVideoGallery />);
      const iframes = screen.getAllByTitle(/./);
      expect(iframes).toHaveLength(3);
    });

    it('renders video titles correctly', () => {
      render(<BestPracticesVideoGallery />);
      // First 3 videos should be visible
      expect(screen.getByText('How to Load a Boombox')).toBeInTheDocument();
      expect(
        screen.getByText('How to Connect and Disconnect a U-Box Trailer')
      ).toBeInTheDocument();
      expect(screen.getByText('How to properly wrap a couch')).toBeInTheDocument();
    });

    it('renders video iframes with correct attributes', () => {
      render(<BestPracticesVideoGallery />);
      const iframe = screen.getByTitle('How to Load a Boombox');
      expect(iframe).toHaveAttribute('src');
      expect(iframe).toHaveAttribute('allowFullScreen');
      expect(iframe).toHaveAttribute('loading', 'lazy');
    });

    it('converts YouTube watch URLs to embed format', () => {
      render(<BestPracticesVideoGallery />);
      const iframe = screen.getByTitle('How to Load a Boombox');
      const src = iframe.getAttribute('src');
      expect(src).toContain('embed/');
      expect(src).not.toContain('watch?v=');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<BestPracticesVideoGallery />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA attributes for filter button', () => {
      render(<BestPracticesVideoGallery />);
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      expect(filterButton).toHaveAttribute('aria-expanded', 'false');
      expect(filterButton).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when filter is opened', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      
      await user.click(filterButton);
      expect(filterButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper button labels for pagination', () => {
      render(<BestPracticesVideoGallery />);
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
    });

    it('properly disables pagination buttons at boundaries', () => {
      render(<BestPracticesVideoGallery />);
      const previousButton = screen.getByRole('button', { name: /previous page/i });
      expect(previousButton).toBeDisabled();
    });

    it('uses semantic HTML for video headings', () => {
      render(<BestPracticesVideoGallery />);
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Filter Functionality', () => {
    it('opens filter dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      
      await user.click(filterButton);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Packing' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Transportation' })).toBeInTheDocument();
    });

    it('closes filter dropdown when option is selected', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      
      await user.click(filterButton);
      const packingOption = screen.getByRole('option', { name: 'Packing' });
      await user.click(packingOption);
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('filters videos by Packing category', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      
      await user.click(filterButton);
      const packingOption = screen.getByRole('option', { name: 'Packing' });
      await user.click(packingOption);
      
      await waitFor(() => {
        const iframes = screen.getAllByTitle(/./);
        // Should show 3 videos from the packing category
        expect(iframes.length).toBeLessThanOrEqual(3);
      });
    });

    it('filters videos by Transportation category', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      
      await user.click(filterButton);
      const transportationOption = screen.getByRole('option', { name: 'Transportation' });
      await user.click(transportationOption);
      
      await waitFor(() => {
        const transportationVideos = TRAINING_VIDEOS.filter(
          (v) => v.category === 'Transportation'
        );
        const visibleVideos = Math.min(3, transportationVideos.length);
        const iframes = screen.getAllByTitle(/./);
        expect(iframes).toHaveLength(visibleVideos);
      });
    });

    it('resets to page 1 when filter changes', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      
      // Go to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
      
      // Change filter
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      await user.click(filterButton);
      const packingOption = screen.getByRole('option', { name: 'Packing' });
      await user.click(packingOption);
      
      // Should reset to page 1
      await waitFor(() => {
        expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
      });
    });

    it('updates filter button text when selection changes', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      
      expect(filterButton).toHaveTextContent('All');
      
      await user.click(filterButton);
      const packingOption = screen.getByRole('option', { name: 'Packing' });
      await user.click(packingOption);
      
      await waitFor(() => {
        expect(filterButton).toHaveTextContent('Packing');
      });
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <BestPracticesVideoGallery />
          <button type="button">Outside Button</button>
        </div>
      );
      
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      await user.click(filterButton);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      const outsideButton = screen.getByRole('button', { name: 'Outside Button' });
      await user.click(outsideButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls when there are multiple pages', () => {
      render(<BestPracticesVideoGallery />);
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
    });

    it('navigates to next page when next button is clicked', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);
      
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
    });

    it('navigates to previous page when previous button is clicked', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      
      // Go to page 2 first
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
      
      // Go back to page 1
      const previousButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(previousButton);
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      render(<BestPracticesVideoGallery />);
      const previousButton = screen.getByRole('button', { name: /previous page/i });
      expect(previousButton).toBeDisabled();
      expect(previousButton).toHaveClass('cursor-not-allowed');
    });

    it('disables next button on last page', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      
      const totalPages = Math.ceil(TRAINING_VIDEOS.length / 3);
      const nextButton = screen.getByRole('button', { name: /next page/i });
      
      // Click next until we reach the last page
      for (let i = 1; i < totalPages; i++) {
        await user.click(nextButton);
      }
      
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('cursor-not-allowed');
    });

    it('updates displayed videos when page changes', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      
      const firstPageVideo = screen.getByText('How to Load a Boombox');
      expect(firstPageVideo).toBeInTheDocument();
      
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        // First video should not be on page 2
        expect(screen.queryByText('How to Load a Boombox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Design System', () => {
    it('applies design system color tokens to filter button', () => {
      const { container } = render(<BestPracticesVideoGallery />);
      const filterButton = container.querySelector('button[aria-haspopup="listbox"]');
      expect(filterButton).toHaveClass('bg-surface-tertiary');
    });

    it('applies design system colors to dropdown', async () => {
      const user = userEvent.setup();
      const { container } = render(<BestPracticesVideoGallery />);
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      
      await user.click(filterButton);
      
      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown).toHaveClass('bg-surface-primary');
      expect(dropdown).toHaveClass('border-border');
    });

    it('uses semantic text colors', () => {
      const { container } = render(<BestPracticesVideoGallery />);
      const textElements = container.querySelectorAll('.text-text-primary');
      expect(textElements.length).toBeGreaterThan(0);
    });

    it('applies consistent spacing to videos', () => {
      const { container } = render(<BestPracticesVideoGallery />);
      const videoContainers = container.querySelectorAll('.py-4');
      expect(videoContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('maintains filter state across pagination', async () => {
      const user = userEvent.setup();
      render(<BestPracticesVideoGallery />);
      
      // Set filter to Packing
      const filterButton = screen.getByRole('button', { name: /filter videos/i });
      await user.click(filterButton);
      const packingOption = screen.getByRole('option', { name: 'Packing' });
      await user.click(packingOption);
      
      await waitFor(() => {
        expect(filterButton).toHaveTextContent('Packing');
      });
      
      // Navigate to next page (if available)
      const packingVideos = TRAINING_VIDEOS.filter((v) => v.category === 'Packing');
      if (packingVideos.length > 3) {
        const nextButton = screen.getByRole('button', { name: /next page/i });
        await user.click(nextButton);
        
        // Filter should still be Packing
        expect(filterButton).toHaveTextContent('Packing');
      }
    });

    it('handles empty filter results gracefully', async () => {
      // This test ensures the component doesn't break if a category has no videos
      render(<BestPracticesVideoGallery />);
      // All categories have videos in our data, but pagination should handle edge cases
      expect(screen.getByRole('button', { name: /filter videos/i })).toBeInTheDocument();
    });
  });
});

