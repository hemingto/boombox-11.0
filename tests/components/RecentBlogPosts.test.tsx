/**
 * @fileoverview Tests for RecentBlogPosts component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { RecentBlogPosts } from '@/components/features/content/RecentBlogPosts';

expect.extend(toHaveNoViolations);

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage(props: any) {
    const { priority, ...imgProps } = props;
    return <img data-testid="optimized-image" data-priority={priority} {...imgProps} />;
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

describe('RecentBlogPosts', () => {
  const mockBlogPosts = [
    {
      category: 'Tips and Tricks',
      thumbnail: '/img/san-jose.png',
      blogTitle: 'Best Neighborhoods in San Francisco for Families',
      blogDescription: 'Find out about the best San Francisco neighborhoods for families',
      author: 'Sophie',
      readTime: '15 min read',
      datePublished: 'October 8, 2023',
      link: '/blog/best-neighborhoods-in-san-francisco-for-families',
    },
    {
      category: 'Press',
      thumbnail: '/img/san-jose.png',
      blogTitle: 'New Storage Units in Palo Alto',
      blogDescription: 'Check out the latest storage facilities in Palo Alto',
      author: 'John',
      readTime: '10 min read',
      datePublished: 'September 12, 2023',
      link: '/blog/new-storage-units-in-palo-alto',
    },
    {
      category: 'Most Recent',
      thumbnail: '/img/san-jose.png',
      blogTitle: 'Moving Guide 2023: Everything You Need to Know',
      blogDescription: 'A comprehensive guide for your next big move',
      author: 'Emily',
      readTime: '20 min read',
      datePublished: 'August 25, 2023',
      link: '/blog/moving-guide-2023-everything-you-need-to-know',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        posts: mockBlogPosts,
        totalCount: 3,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<RecentBlogPosts />);
      expect(screen.getByText('Recent Blogs')).toBeInTheDocument();
    });

    it('displays loading skeletons initially', () => {
      render(<RecentBlogPosts />);
      expect(screen.getAllByTestId('skeleton')).toHaveLength(9); // 3 posts × 3 skeletons each
    });

    it('renders blog posts after successful fetch', async () => {
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByText('Best Neighborhoods in San Francisco for Families')).toBeInTheDocument();
      });
      
      expect(screen.getByText('New Storage Units in Palo Alto')).toBeInTheDocument();
      expect(screen.getByText('Moving Guide 2023: Everything You Need to Know')).toBeInTheDocument();
    });

    it('respects custom limit prop', async () => {
      render(<RecentBlogPosts limit={2} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts?limit=2&page=1');
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByText('Best Neighborhoods in San Francisco for Families')).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with error state', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const renderResult = render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });

    it('has proper article structure', async () => {
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByText('Best Neighborhoods in San Francisco for Families')).toBeInTheDocument();
      });
      
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(3);
      
      // Check that all articles have proper heading structure
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(3);
      
      // Check first article contains its heading
      const firstArticle = articles[0];
      const firstHeading = headings[0];
      expect(firstArticle).toContainElement(firstHeading);
    });

    it('has proper link accessibility', async () => {
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByText('Best Neighborhoods in San Francisco for Families')).toBeInTheDocument();
      });
      
      const imageLink = screen.getByLabelText('Read article: Best Neighborhoods in San Francisco for Families');
      expect(imageLink).toBeInTheDocument();
      expect(imageLink).toHaveAttribute('href', '/blog/best-neighborhoods-in-san-francisco-for-families');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load recent posts');
      });
    });

    it('displays error message for HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load recent posts');
      });
    });

    it('displays empty state when no posts available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          posts: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }),
      });
      
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByText('No recent blog posts available.')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('calls correct API endpoint with default parameters', async () => {
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts?limit=3&page=1');
      });
    });

    it('calls API with custom limit', async () => {
      render(<RecentBlogPosts limit={5} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts?limit=5&page=1');
      });
    });

    it('handles malformed API response gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}), // Missing posts array
      });
      
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByText('No recent blog posts available.')).toBeInTheDocument();
      });
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className', async () => {
      const { container } = render(<RecentBlogPosts className="custom-class" />);
      
      await waitFor(() => {
        expect(screen.getByText('Best Neighborhoods in San Francisco for Families')).toBeInTheDocument();
      });
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has responsive layout classes', async () => {
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByText('Best Neighborhoods in San Francisco for Families')).toBeInTheDocument();
      });
      
      const articles = screen.getAllByRole('article');
      expect(articles[0]).toHaveClass('flex', 'flex-row', 'sm:flex-col');
    });

    it('prioritizes first image loading', async () => {
      render(<RecentBlogPosts />);
      
      await waitFor(() => {
        expect(screen.getByText('Best Neighborhoods in San Francisco for Families')).toBeInTheDocument();
      });
      
      const images = screen.getAllByTestId('optimized-image');
      expect(images[0]).toHaveAttribute('data-priority', 'true');
      expect(images[1]).toHaveAttribute('data-priority', 'false');
      expect(images[2]).toHaveAttribute('data-priority', 'false');
    });
  });
});
