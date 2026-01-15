/**
 * @fileoverview Jest tests for BlogPopularArticles component
 * @source Created for boombox-11.0 component testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BlogPopularArticles } from '@/components/features/content/BlogPopularArticles';

// Mock the hooks and services
jest.mock('@/hooks/usePopularArticlesPagination');
jest.mock('@/components/ui/primitives/Card');

// Mock Heroicons
jest.mock('@heroicons/react/20/solid', () => ({
  ArrowLeftIcon: ({ className, ...props }: any) => (
    <svg className={className} {...props} data-testid="arrow-left-icon">
      <title>Previous</title>
    </svg>
  ),
  ArrowRightIcon: ({ className, ...props }: any) => (
    <svg className={className} {...props} data-testid="arrow-right-icon">
      <title>Next</title>
    </svg>
  ),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockUsePopularArticlesPagination = require('@/hooks/usePopularArticlesPagination').usePopularArticlesPagination as jest.Mock;
const mockCard = require('@/components/ui/primitives/Card').Card as jest.Mock;

const mockArticles = [
  {
    title: 'Moving Costs in San Francisco',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/placeholder.jpg',
    imageAlt: 'Golden Gate Bridge',
    link: '/locations/san-francisco',
  },
  {
    title: '5 Best Ways to Store Trading Cards',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/oakland.png',
    imageAlt: 'Runners at Lake Merritt',
    link: '/locations/oakland',
  },
  {
    title: 'Moving to San Francisco: Advice & Tips',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/berkeley.png',
    imageAlt: 'Berkeley skyline',
    link: '/locations/berkeley',
  },
];

describe('BlogPopularArticles', () => {
  const mockPrevPage = jest.fn();
  const mockNextPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUsePopularArticlesPagination.mockReturnValue({
      currentPage: 1,
      totalPages: 2,
      displayedArticles: mockArticles.slice(0, 2),
      allArticles: mockArticles,
      showPagination: true,
      hasPrevPage: false,
      hasNextPage: true,
      prevPage: mockPrevPage,
      nextPage: mockNextPage,
    });

    // Mock Card component
    mockCard.mockImplementation(({ blogtitle, author, readTime, link, ariaLabel }: any) => (
      <div data-testid="article-card" aria-label={ariaLabel}>
        <h3>{blogtitle}</h3>
        <p>{author} {readTime}</p>
        <a href={link}>Read more</a>
      </div>
    ));

    // Mock window.innerWidth for mobile detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Rendering', () => {
    it('renders the popular articles section with title', () => {
      render(<BlogPopularArticles />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Popular articles');
    });

    it('renders articles using Card components', () => {
      render(<BlogPopularArticles />);
      
      const cards = screen.getAllByTestId('article-card');
      expect(cards.length).toBeGreaterThan(0); // Should have articles
      
      // Check first card content
      expect(cards[0]).toHaveTextContent('Moving Costs in San Francisco');
      expect(cards[0]).toHaveTextContent('Sophie | 10 min read');
    });

    it('applies correct CSS classes for layout', () => {
      const { container } = render(<BlogPopularArticles />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('lg:mx-12', 'mx-6', 'sm:pb-24', 'sm:mb-24', 'pb-12', 'mb-12');
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-4');
    });
  });

  describe('Mobile Pagination', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
    });

    it('shows pagination controls on mobile when pagination is available', async () => {
      render(<BlogPopularArticles />);
      
      // Trigger mobile detection
      fireEvent.resize(window);
      
      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous page');
        const nextButton = screen.getByLabelText('Next page');
        
        expect(prevButton).toBeInTheDocument();
        expect(nextButton).toBeInTheDocument();
      });
    });

    it('handles previous page navigation', async () => {
      mockUsePopularArticlesPagination.mockReturnValue({
        currentPage: 2,
        totalPages: 2,
        displayedArticles: mockArticles.slice(2),
        allArticles: mockArticles,
        showPagination: true,
        hasPrevPage: true,
        hasNextPage: false,
        prevPage: mockPrevPage,
        nextPage: mockNextPage,
      });

      render(<BlogPopularArticles />);
      
      // Trigger mobile detection
      fireEvent.resize(window);
      
      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous page');
        expect(prevButton).not.toHaveClass('cursor-not-allowed');
        
        fireEvent.click(prevButton);
        expect(mockPrevPage).toHaveBeenCalledTimes(1);
      });
    });

    it('handles next page navigation', async () => {
      render(<BlogPopularArticles />);
      
      // Trigger mobile detection
      fireEvent.resize(window);
      
      await waitFor(() => {
        const nextButton = screen.getByLabelText('Next page');
        expect(nextButton).not.toHaveClass('cursor-not-allowed');
        
        fireEvent.click(nextButton);
        expect(mockNextPage).toHaveBeenCalledTimes(1);
      });
    });

    it('disables navigation buttons when appropriate', async () => {
      mockUsePopularArticlesPagination.mockReturnValue({
        currentPage: 1,
        totalPages: 2,
        displayedArticles: mockArticles.slice(0, 2),
        allArticles: mockArticles,
        showPagination: true,
        hasPrevPage: false,
        hasNextPage: true,
        prevPage: mockPrevPage,
        nextPage: mockNextPage,
      });

      render(<BlogPopularArticles />);
      
      // Trigger mobile detection
      fireEvent.resize(window);
      
      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous page');
        const nextButton = screen.getByLabelText('Next page');
        
        expect(prevButton).toHaveClass('cursor-not-allowed');
        expect(prevButton).toBeDisabled();
        expect(nextButton).not.toHaveClass('cursor-not-allowed');
        expect(nextButton).not.toBeDisabled();
      });
    });
  });

  describe('Desktop Display', () => {
    beforeEach(() => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('shows all articles on desktop', async () => {
      render(<BlogPopularArticles />);
      
      await waitFor(() => {
        const cards = screen.getAllByTestId('article-card');
        expect(cards.length).toBeGreaterThan(0); // Should show articles
      });
    });

    it('hides pagination controls on desktop', async () => {
      render(<BlogPopularArticles />);
      
      await waitFor(() => {
        const prevButton = screen.queryByLabelText('Previous page');
        const nextButton = screen.queryByLabelText('Next page');
        
        expect(prevButton).not.toBeInTheDocument();
        expect(nextButton).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<BlogPopularArticles />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Popular articles');
    });

    it('provides proper navigation landmarks', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      render(<BlogPopularArticles />);
      
      // Trigger mobile detection
      fireEvent.resize(window);
      
      await waitFor(() => {
        const navigation = screen.getByRole('navigation', { name: 'Popular articles pagination' });
        expect(navigation).toBeInTheDocument();
      });
    });

    it('provides screen reader updates for pagination', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const { container } = render(<BlogPopularArticles />);
      
      // Trigger mobile detection
      fireEvent.resize(window);
      
      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeInTheDocument();
        expect(liveRegion).toHaveTextContent('Page 1 of 2');
      });
    });

    it('passes proper aria-labels to Card components', () => {
      render(<BlogPopularArticles />);
      
      // Check that mockCard was called with the expected props
      const calls = mockCard.mock.calls;
      const firstCall = calls[0];
      
      expect(firstCall[0]).toEqual(expect.objectContaining({
        ariaLabel: 'Read article: Moving Costs in San Francisco by Sophie',
      }));
    });
  });

  describe('Responsive Behavior', () => {
    it('responds to window resize events', async () => {
      render(<BlogPopularArticles />);
      
      // Start with desktop
      expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
      
      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      fireEvent.resize(window);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      });
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<BlogPopularArticles />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Hook Integration', () => {
    it('calls usePopularArticlesPagination with correct parameters', () => {
      render(<BlogPopularArticles />);
      
      expect(mockUsePopularArticlesPagination).toHaveBeenCalledWith({
        articlesPerPage: 3,
        mobileOnly: true,
      });
    });

    it('handles empty articles gracefully', () => {
      mockUsePopularArticlesPagination.mockReturnValue({
        currentPage: 1,
        totalPages: 0,
        displayedArticles: [],
        allArticles: [],
        showPagination: false,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: mockPrevPage,
        nextPage: mockNextPage,
      });

      render(<BlogPopularArticles />);
      
      const cards = screen.queryAllByTestId('article-card');
      expect(cards).toHaveLength(0);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Popular articles');
    });
  });
});
