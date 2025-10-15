/**
 * @fileoverview Jest tests for FeaturedArticleSection component
 * @source Created for boombox-11.0 component testing
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeaturedArticleSection } from '@/components/features/content/FeaturedArticleSection';

// Mock the ContentService
jest.mock('@/lib/services/contentService');

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Button component
jest.mock('@/components/ui/primitives/Button', () => ({
  Button: ({ children, variant, size, className, ...props }: any) => (
    <button className={`btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  ),
}));

const mockContentService = require('@/lib/services/contentService').ContentService as jest.Mocked<typeof import('@/lib/services/contentService').ContentService>;

const mockFeaturedArticle = {
  title: 'How to store paintings the right way',
  author: 'Sophie',
  date: 'June 15, 2023',
  readTime: '10 min read',
  description: 'You can never have enough artwork! Not only do paintings liven up a room, but they are great family heirlooms that can be passed down from generation to generation...',
  authorImage: '/img/berkeley.png',
  articleImage: '/img/palo-alto.png',
  link: '/blog/how-to-store-paintings-the-right-way',
};

describe('FeaturedArticleSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContentService.getPrimaryFeaturedArticle.mockReturnValue(mockFeaturedArticle);
  });

  describe('Rendering', () => {
    it('renders featured article with all content elements', () => {
      render(<FeaturedArticleSection />);
      
      // Check for article title
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('How to store paintings the right way');
      
      // Check for description
      const description = screen.getByText(/You can never have enough artwork!/);
      expect(description).toBeInTheDocument();
      
      // Check for author information
      const authorInfo = screen.getByText(/by Sophie | June 15, 2023 | 10 min read/);
      expect(authorInfo).toBeInTheDocument();
      
      // Check for call-to-action button
      const readMoreButton = screen.getByRole('button', { name: /Read full article: How to store paintings the right way/ });
      expect(readMoreButton).toBeInTheDocument();
      expect(readMoreButton).toHaveTextContent('Read more');
    });

    it('renders author profile image with proper attributes', () => {
      render(<FeaturedArticleSection />);
      
      const authorImage = screen.getByAltText('Sophie profile picture');
      expect(authorImage).toBeInTheDocument();
      expect(authorImage).toHaveAttribute('src', '/img/berkeley.png');
      expect(authorImage).toHaveClass('rounded-full', 'w-8', 'h-8', 'mr-2');
    });

    it('renders featured article image with proper attributes', () => {
      render(<FeaturedArticleSection />);
      
      const articleImage = screen.getByAltText('How to store paintings the right way');
      expect(articleImage).toBeInTheDocument();
      expect(articleImage).toHaveAttribute('src', '/img/palo-alto.png');
    });

    it('applies correct CSS classes for responsive layout', () => {
      const { container } = render(<FeaturedArticleSection />);
      
      const article = container.firstChild as HTMLElement;
      expect(article).toHaveClass('md:flex', 'lg:mx-16', 'mx-6', 'sm:pb-24', 'sm:mb-24', 'pb-12', 'mb-12');
    });
  });

  describe('Links and Navigation', () => {
    it('creates proper links to the article', () => {
      render(<FeaturedArticleSection />);
      
      const titleLinks = screen.getAllByRole('link');
      const articleLinks = titleLinks.filter(link => 
        link.getAttribute('href') === '/blog/how-to-store-paintings-the-right-way'
      );
      
      expect(articleLinks.length).toBeGreaterThan(0);
    });

    it('makes title clickable with hover effects', () => {
      render(<FeaturedArticleSection />);
      
      const titleLinks = screen.getAllByRole('link', { name: /How to store paintings the right way/ });
      const titleLink = titleLinks.find(link => link.querySelector('h2'));
      
      expect(titleLink).toBeInTheDocument();
      expect(titleLink).toHaveClass('group');
      
      const heading = titleLink?.querySelector('h2');
      expect(heading).toHaveClass('group-hover:underline');
    });

    it('makes author section clickable', () => {
      render(<FeaturedArticleSection />);
      
      const authorSection = screen.getByText(/by Sophie | June 15, 2023 | 10 min read/).closest('a');
      expect(authorSection).toBeInTheDocument();
      expect(authorSection).toHaveAttribute('href', '/blog/how-to-store-paintings-the-right-way');
    });

    it('makes featured image clickable with hover effects', () => {
      const { container } = render(<FeaturedArticleSection />);
      
      const imageLinks = container.querySelectorAll('a[href="/blog/how-to-store-paintings-the-right-way"]');
      const imageLink = Array.from(imageLinks).find(link => link.querySelector('img[alt="How to store paintings the right way"]'));
      
      expect(imageLink).toBeInTheDocument();
      
      const image = imageLink?.querySelector('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveClass('group-hover:scale-[102%]');
    });
  });

  describe('Button Component', () => {
    it('renders button with correct props', () => {
      render(<FeaturedArticleSection />);
      
      const button = screen.getByRole('button', { name: /Read full article: How to store paintings the right way/ });
      expect(button).toHaveClass('btn-primary');
      expect(button).toHaveClass('font-inter');
    });

    it('wraps button in link for navigation', () => {
      render(<FeaturedArticleSection />);
      
      const button = screen.getByRole('button', { name: /Read full article: How to store paintings the right way/ });
      const linkWrapper = button.closest('a');
      
      expect(linkWrapper).toBeInTheDocument();
      expect(linkWrapper).toHaveAttribute('href', '/blog/how-to-store-paintings-the-right-way');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML structure', () => {
      render(<FeaturedArticleSection />);
      
      // Should be wrapped in article element
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      
      // Should have proper heading hierarchy
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('provides proper alt text for images', () => {
      render(<FeaturedArticleSection />);
      
      const authorImage = screen.getByAltText('Sophie profile picture');
      expect(authorImage).toBeInTheDocument();
      
      const articleImage = screen.getByAltText('How to store paintings the right way');
      expect(articleImage).toBeInTheDocument();
    });

    it('provides descriptive aria-label for call-to-action', () => {
      render(<FeaturedArticleSection />);
      
      const button = screen.getByRole('button', { name: /Read full article: How to store paintings the right way/ });
      expect(button).toBeInTheDocument();
    });

    it('uses proper text hierarchy with semantic colors', () => {
      const { container } = render(<FeaturedArticleSection />);
      
      const description = container.querySelector('p.text-text-secondary');
      expect(description).toBeInTheDocument();
      
      const authorInfo = container.querySelector('p.text-sm.text-text-secondary');
      expect(authorInfo).toBeInTheDocument();
    });
  });

  describe('Design System Integration', () => {
    it('uses design system spacing patterns', () => {
      const { container } = render(<FeaturedArticleSection />);
      
      const article = container.firstChild as HTMLElement;
      expect(article).toHaveClass('lg:mx-16', 'mx-6'); // Consistent horizontal margins
      expect(article).toHaveClass('sm:pb-24', 'sm:mb-24', 'pb-12', 'mb-12'); // Consistent vertical spacing
    });

    it('uses design system border utilities', () => {
      const { container } = render(<FeaturedArticleSection />);
      
      const article = container.firstChild as HTMLElement;
      expect(article).toHaveClass('md:border-b-2', 'md:border-border');
    });

    it('uses design system text colors', () => {
      const { container } = render(<FeaturedArticleSection />);
      
      const description = container.querySelector('.text-text-secondary');
      expect(description).toBeInTheDocument();
    });

    it('uses design system button styling', () => {
      render(<FeaturedArticleSection />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary');
    });
  });

  describe('Responsive Layout', () => {
    it('applies responsive flex layout', () => {
      const { container } = render(<FeaturedArticleSection />);
      
      const article = container.firstChild as HTMLElement;
      expect(article).toHaveClass('md:flex');
    });

    it('uses responsive basis classes for content sections', () => {
      const { container } = render(<FeaturedArticleSection />);
      
      const contentSection = container.querySelector('.basis-5\\/12');
      expect(contentSection).toBeInTheDocument();
      
      const imageSection = container.querySelector('.basis-7\\/12');
      expect(imageSection).toBeInTheDocument();
    });

    it('applies responsive margins for image section', () => {
      const { container } = render(<FeaturedArticleSection />);
      
      const imageContainer = container.querySelector('.md\\:ml-6');
      expect(imageContainer).toBeInTheDocument();
      expect(imageContainer).toHaveClass('mt-8', 'md:mt-0');
    });
  });

  describe('Error Handling', () => {
    it('renders nothing when no featured article is available', () => {
      mockContentService.getPrimaryFeaturedArticle.mockReturnValue(null);
      
      const { container } = render(<FeaturedArticleSection />);
      
      expect(container.firstChild).toBeNull();
    });

    it('handles missing article data gracefully', () => {
      const incompleteArticle = {
        ...mockFeaturedArticle,
        description: '',
      };
      
      mockContentService.getPrimaryFeaturedArticle.mockReturnValue(incompleteArticle);
      
      render(<FeaturedArticleSection />);
      
      // Should still render other elements
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Service Integration', () => {
    it('calls ContentService.getPrimaryFeaturedArticle', () => {
      render(<FeaturedArticleSection />);
      
      expect(mockContentService.getPrimaryFeaturedArticle).toHaveBeenCalledTimes(1);
    });

    it('re-renders when service data changes', () => {
      const { rerender } = render(<FeaturedArticleSection />);
      
      expect(screen.getByText('How to store paintings the right way')).toBeInTheDocument();
      
      const newArticle = {
        ...mockFeaturedArticle,
        title: 'New Featured Article',
      };
      
      mockContentService.getPrimaryFeaturedArticle.mockReturnValue(newArticle);
      
      rerender(<FeaturedArticleSection />);
      
      expect(screen.getByText('New Featured Article')).toBeInTheDocument();
    });
  });
});
