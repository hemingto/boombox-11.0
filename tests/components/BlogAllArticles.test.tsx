/**
 * @fileoverview Jest tests for BlogAllArticles component
 * @source Created for boombox-11.0 component testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BlogAllArticles } from '@/components/features/content/BlogAllArticles';
import { ContentService } from '@/lib/services/contentService';

// Mock the hooks
jest.mock('@/hooks/useBlogPagination');
jest.mock('@/hooks/useBlogCategories');
jest.mock('@/lib/services/contentService');

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockBlogPosts = [
  {
    category: 'Tips and Tricks' as const,
    thumbnail: '/img/san-jose.png',
    blogTitle: 'Best Neighborhoods in San Francisco for Families',
    blogDescription: 'Find out about the best San Francisco neighborhoods for families',
    author: 'Sophie',
    readTime: '15 min read',
    datePublished: 'October 8, 2023',
    link: '/blog/best-neighborhoods-in-san-francisco-for-families',
  },
  {
    category: 'Press' as const,
    thumbnail: '/img/san-jose.png',
    blogTitle: 'New Storage Units in Palo Alto',
    blogDescription: 'Check out the latest storage facilities in Palo Alto',
    author: 'John',
    readTime: '10 min read',
    datePublished: 'September 12, 2023',
    link: '/blog/new-storage-units-in-palo-alto',
  },
];

const mockCategories = ['Tips and Tricks', 'Press', 'Most Recent'] as const;

describe('BlogAllArticles', () => {
  const mockUseBlogPagination = {
    currentPosts: mockBlogPosts,
    currentPage: 1,
    totalPages: 2,
    hasNextPage: true,
    hasPrevPage: false,
    nextPage: jest.fn(),
    prevPage: jest.fn(),
    handleCategoryChange: jest.fn(),
  };

  const mockUseBlogCategories = {
    categories: mockCategories,
    selectedCategory: 'Tips and Tricks' as const,
    setSelectedCategory: jest.fn(),
    isCategorySelected: jest.fn((category: string) => category === 'Tips and Tricks'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock ContentService
    (ContentService.getAllBlogPosts as jest.Mock) = jest.fn().mockReturnValue(mockBlogPosts);
    
    // Mock hooks
    const { useBlogPagination } = require('@/hooks/useBlogPagination');
    const { useBlogCategories } = require('@/hooks/useBlogCategories');
    
    useBlogPagination.mockReturnValue(mockUseBlogPagination);
    useBlogCategories.mockReturnValue(mockUseBlogCategories);
  });

  describe('Rendering', () => {
    it('renders the page title', () => {
      render(<BlogAllArticles />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('All Articles');
    });

    it('renders category tabs', () => {
      render(<BlogAllArticles />);
      
      const tablist = screen.getByRole('tablist', { name: /blog categories/i });
      expect(tablist).toBeInTheDocument();
      
      mockCategories.forEach(category => {
        expect(screen.getByRole('tab', { name: category })).toBeInTheDocument();
      });
    });

    it('renders blog posts', () => {
      render(<BlogAllArticles />);
      
      mockBlogPosts.forEach(post => {
        expect(screen.getByText(post.blogTitle)).toBeInTheDocument();
        expect(screen.getByText(post.blogDescription)).toBeInTheDocument();
        expect(screen.getByText(`by ${post.author} | ${post.readTime}`)).toBeInTheDocument();
      });
    });

    it('renders pagination controls when totalPages > 1', () => {
      render(<BlogAllArticles />);
      
      expect(screen.getByLabelText(/blog pagination/i)).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByLabelText(/go to next page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/previous page \(disabled\)/i)).toBeInTheDocument();
    });

    it('does not render pagination when totalPages <= 1', () => {
      const singlePagePagination = {
        ...mockUseBlogPagination,
        totalPages: 1,
        hasNextPage: false,
      };
      
      const { useBlogPagination } = require('@/hooks/useBlogPagination');
      useBlogPagination.mockReturnValue(singlePagePagination);
      
      render(<BlogAllArticles />);
      
      expect(screen.queryByLabelText(/blog pagination/i)).not.toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('highlights the selected category', () => {
      render(<BlogAllArticles />);
      
      const selectedTab = screen.getByRole('tab', { name: 'Tips and Tricks' });
      expect(selectedTab).toHaveAttribute('aria-selected', 'true');
      
      const unselectedTab = screen.getByRole('tab', { name: 'Press' });
      expect(unselectedTab).toHaveAttribute('aria-selected', 'false');
    });

    it('calls category change handlers when category is clicked', () => {
      render(<BlogAllArticles />);
      
      const pressTab = screen.getByRole('tab', { name: 'Press' });
      fireEvent.click(pressTab);
      
      expect(mockUseBlogCategories.setSelectedCategory).toHaveBeenCalledWith('Press');
      expect(mockUseBlogPagination.handleCategoryChange).toHaveBeenCalledWith('Press');
    });
  });

  describe('Pagination', () => {
    it('calls nextPage when next button is clicked and hasNextPage is true', () => {
      render(<BlogAllArticles />);
      
      const nextButton = screen.getByLabelText(/go to next page/i);
      fireEvent.click(nextButton);
      
      expect(mockUseBlogPagination.nextPage).toHaveBeenCalled();
    });

    it('calls prevPage when previous button is clicked and hasPrevPage is true', () => {
      const paginationWithPrev = {
        ...mockUseBlogPagination,
        currentPage: 2,
        hasPrevPage: true,
      };
      
      const { useBlogPagination } = require('@/hooks/useBlogPagination');
      useBlogPagination.mockReturnValue(paginationWithPrev);
      
      render(<BlogAllArticles />);
      
      const prevButton = screen.getByLabelText(/go to previous page/i);
      fireEvent.click(prevButton);
      
      expect(mockUseBlogPagination.prevPage).toHaveBeenCalled();
    });

    it('disables previous button when hasPrevPage is false', () => {
      render(<BlogAllArticles />);
      
      const prevButton = screen.getByLabelText(/previous page \(disabled\)/i);
      expect(prevButton).toBeDisabled();
    });

    it('disables next button when hasNextPage is false', () => {
      const lastPagePagination = {
        ...mockUseBlogPagination,
        currentPage: 2,
        hasNextPage: false,
      };
      
      const { useBlogPagination } = require('@/hooks/useBlogPagination');
      useBlogPagination.mockReturnValue(lastPagePagination);
      
      render(<BlogAllArticles />);
      
      const nextButton = screen.getByLabelText(/next page \(disabled\)/i);
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<BlogAllArticles />);
      
      // Check tablist and tabs
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Blog categories');
      
      // Check tabpanel
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-tips-and-tricks');
      
      // Check pagination navigation
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Blog pagination');
    });

    it('has proper focus management', () => {
      render(<BlogAllArticles />);
      
      // Check that interactive elements have focus styles
      const categoryTab = screen.getByRole('tab', { name: 'Tips and Tricks' });
      expect(categoryTab).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });

    it('provides proper alt text for images', () => {
      render(<BlogAllArticles />);
      
      mockBlogPosts.forEach(post => {
        const image = screen.getByAltText(post.blogTitle);
        expect(image).toBeInTheDocument();
      });
    });

    it('has proper semantic HTML structure', () => {
      render(<BlogAllArticles />);
      
      // Check for article elements
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(mockBlogPosts.length);
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for different screen sizes', () => {
      render(<BlogAllArticles />);
      
      // Check that responsive classes are applied
      const container = screen.getByText('All Articles').parentElement;
      expect(container).toHaveClass('lg:px-16', 'px-6', 'sm:mb-48', 'mb-24');
    });

    it('shows author info only on larger screens', () => {
      render(<BlogAllArticles />);
      
      const authorInfo = screen.getByText(`by ${mockBlogPosts[0].author} | ${mockBlogPosts[0].readTime}`);
      expect(authorInfo).toHaveClass('hidden', 'sm:block');
    });
  });

  describe('Error Handling', () => {
    it('handles empty blog posts gracefully', () => {
      const emptyPagination = {
        ...mockUseBlogPagination,
        currentPosts: [],
        totalPages: 0,
      };
      
      const { useBlogPagination } = require('@/hooks/useBlogPagination');
      useBlogPagination.mockReturnValue(emptyPagination);
      
      render(<BlogAllArticles />);
      
      // Should still render the title and categories
      expect(screen.getByText('All Articles')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      
      // Should not render pagination
      expect(screen.queryByLabelText(/blog pagination/i)).not.toBeInTheDocument();
    });
  });
});
