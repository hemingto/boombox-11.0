/**
 * @fileoverview Tests for BlogPostHero component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { BlogPostHero } from '@/components/features/content/BlogPostHero';

expect.extend(toHaveNoViolations);

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage(props: any) {
    return <img 
      data-testid="optimized-image" 
      {...props} 
      priority={props.priority ? 'true' : undefined}
      fill={props.fill ? 'true' : undefined}
    />;
  }
}));

// Mock Skeleton component
jest.mock('@/components/ui/primitives/Skeleton', () => ({
  Skeleton: function MockSkeleton(props: any) {
    return <div data-testid="skeleton" className={props.className} />;
  }
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock Heroicons
jest.mock('@heroicons/react/20/solid', () => ({
  ChevronLeftIcon: function MockChevronLeftIcon(props: any) {
    return <svg data-testid="chevron-left-icon" {...props} />;
  }
}));

describe('BlogPostHero', () => {
  const mockFeaturedArticle = {
    title: 'How to store paintings the right way',
    author: 'Sophie',
    date: 'June 15, 2023',
    readTime: '10 min read',
    description: 'You can never have enough artwork! Not only do paintings liven up a room...',
    authorImage: '/img/berkeley.png',
    articleImage: '/img/palo-alto.png',
    link: '/blog/how-to-store-paintings-the-right-way',
  };

  const mockBlogPost = {
    title: 'Test Blog Post Title',
    slug: 'test-blog-post',
    excerpt: 'This is a test excerpt for the blog post.',
    featuredImage: '/img/test-featured.jpg',
    authorName: 'John Doe',
    authorImage: '/img/john-doe.jpg',
    publishedAt: '2023-10-15T10:00:00Z',
    readTime: 8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      expect(screen.getAllByTestId('skeleton')).toHaveLength(4); // Loading skeletons
    });

    it('displays loading skeletons initially', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders featured article after successful fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        expect(screen.getByText('How to store paintings the right way')).toBeInTheDocument();
      });
      
      expect(screen.getByText('by Sophie | June 15, 2023 | 10 min read')).toBeInTheDocument();
    });

    it('renders back navigation by default', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        expect(screen.getByText('Blog')).toBeInTheDocument();
      });
      
      const backLink = screen.getByRole('link', { name: /blog/i });
      expect(backLink).toHaveAttribute('href', '/blog');
    });

    it('hides back navigation when showBackNavigation is false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero showBackNavigation={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('How to store paintings the right way')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Blog')).not.toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('fetches featured article when no slug provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/blog/featured');
      });
    });

    it('fetches specific post when slug provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlogPost),
      });

      render(<BlogPostHero slug="test-slug" />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts/test-slug');
      });
    });

    it('URL encodes slug properly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlogPost),
      });

      render(<BlogPostHero slug="slug with spaces & symbols" />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts/slug%20with%20spaces%20%26%20symbols');
      });
    });

    it('handles individual post response format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlogPost),
      });

      render(<BlogPostHero slug="test-slug" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Blog Post Title')).toBeInTheDocument();
      });
      
      expect(screen.getByText('by John Doe | 2023-10-15T10:00:00Z | 8 min read')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      const renderResult = render(<BlogPostHero />);
      
      await waitFor(() => {
        expect(screen.getByText('How to store paintings the right way')).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with error state', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const renderResult = render(<BlogPostHero />);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });

    it('has proper header structure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        const header = screen.getByRole('banner');
        expect(header).toBeInTheDocument();
      });
    });

    it('has proper navigation structure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
        expect(nav).toBeInTheDocument();
      });
    });

    it('has proper heading hierarchy', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('How to store paintings the right way');
      });
    });

    it('has proper image alt text', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        const images = screen.getAllByTestId('optimized-image');
        const authorImage = images.find(img => img.getAttribute('alt') === 'Sophie profile picture');
        expect(authorImage).toHaveAttribute('alt', 'Sophie profile picture');
      });
      
      const images = screen.getAllByTestId('optimized-image');
      const featuredImage = images.find(img => img.getAttribute('alt') === 'How to store paintings the right way');
      expect(featuredImage).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<BlogPostHero />);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Error Loading Article');
        expect(alert).toHaveTextContent('Network error');
      });
    });

    it('displays 404 error for missing articles', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });
      
      render(<BlogPostHero slug="nonexistent-slug" />);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Article not found');
      });
    });

    it('displays empty state when no article available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      });
      
      render(<BlogPostHero />);
      
      await waitFor(() => {
        expect(screen.getByText('No featured article available.')).toBeInTheDocument();
      });
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      const { container } = render(<BlogPostHero className="custom-class" />);
      
      await waitFor(() => {
        expect(screen.getByText('How to store paintings the right way')).toBeInTheDocument();
      });
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has proper responsive layout classes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        const header = screen.getByRole('banner');
        expect(header).toHaveClass('w-full', 'mt-8', 'mb-8', 'lg:px-16', 'px-6');
      });
    });

    it('has proper image container styling', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        const images = screen.getAllByTestId('optimized-image');
        const featuredImage = images.find(img => img.hasAttribute('fill'));
        const imageContainer = featuredImage?.closest('div');
        expect(imageContainer).toHaveClass(
          'relative', 'bg-surface-tertiary', 'w-full', 
          'sm:h-[450px]', 'h-[300px]', 'xl:h-[500px]', 
          'rounded-md', 'overflow-hidden'
        );
      });
    });

    it('prioritizes featured image loading', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFeaturedArticle),
      });

      render(<BlogPostHero />);
      
      await waitFor(() => {
        const images = screen.getAllByTestId('optimized-image');
        const featuredImage = images.find(img => img.hasAttribute('fill'));
        expect(featuredImage).toHaveAttribute('priority', 'true');
      });
    });
  });
});
