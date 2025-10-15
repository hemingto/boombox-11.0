/**
 * @fileoverview Tests for BlogContent component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { BlogContent } from '@/components/features/content/BlogContent';
import { BlogContentBlockType } from '@prisma/client';

expect.extend(toHaveNoViolations);

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage(props: any) {
    return <img data-testid="optimized-image" {...props} />;
  }
}));

// Mock Skeleton component
jest.mock('@/components/ui/primitives/Skeleton', () => ({
  Skeleton: function MockSkeleton(props: any) {
    return <div data-testid="skeleton" className={props.className} />;
  }
}));

describe('BlogContent', () => {
  const mockContentBlocks = [
    {
      id: 1,
      type: BlogContentBlockType.PARAGRAPH,
      content: 'This is a test paragraph with some content.',
      order: 1,
    },
    {
      id: 2,
      type: BlogContentBlockType.HEADING,
      content: 'Test Heading',
      metadata: { level: 2 },
      order: 2,
    },
    {
      id: 3,
      type: BlogContentBlockType.IMAGE,
      content: '/img/test-image.jpg',
      metadata: { alt: 'Test image', width: 400, height: 300 },
      order: 3,
    },
    {
      id: 4,
      type: BlogContentBlockType.QUOTE,
      content: 'This is a test quote that should be styled differently.',
      order: 4,
    },
    {
      id: 5,
      type: BlogContentBlockType.LIST,
      content: '- First item\n- Second item\n- Third item',
      metadata: { ordered: false },
      order: 5,
    },
    {
      id: 6,
      type: BlogContentBlockType.CODE,
      content: 'const test = "Hello World";\nconsole.log(test);',
      metadata: { language: 'javascript' },
      order: 6,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        contentBlocks: mockContentBlocks,
        title: 'Test Blog Post',
        slug: 'test-blog-post',
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<BlogContent slug="test-slug" />);
      expect(screen.getAllByTestId('skeleton')).toHaveLength(8); // Loading skeletons
    });

    it('displays loading skeletons initially', () => {
      render(<BlogContent slug="test-slug" />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders content blocks after successful fetch', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        expect(screen.getByText('This is a test paragraph with some content.')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Test Heading')).toBeInTheDocument();
      expect(screen.getByText('This is a test quote that should be styled differently.')).toBeInTheDocument();
    });

    it('renders content blocks in correct order', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        expect(screen.getByText('This is a test paragraph with some content.')).toBeInTheDocument();
      });
      
      const article = screen.getByRole('article');
      const children = Array.from(article.children);
      
      // Check that heading comes after paragraph (based on order)
      const paragraphIndex = children.findIndex(child => 
        child.textContent?.includes('This is a test paragraph')
      );
      const headingIndex = children.findIndex(child => 
        child.textContent?.includes('Test Heading')
      );
      
      expect(paragraphIndex).toBeLessThan(headingIndex);
    });
  });

  describe('Content Block Types', () => {
    it('renders paragraph blocks correctly', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const paragraph = screen.getByText('This is a test paragraph with some content.');
        expect(paragraph).toBeInTheDocument();
        expect(paragraph.closest('div')).toHaveClass('text-text-primary', 'leading-relaxed');
      });
    });

    it('renders heading blocks with correct level', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('Test Heading');
        expect(heading).toHaveClass('text-text-primary', 'font-semibold', 'mb-4');
      });
    });

    it('renders image blocks with proper attributes', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const image = screen.getByTestId('optimized-image');
        expect(image).toHaveAttribute('src', '/img/test-image.jpg');
        expect(image).toHaveAttribute('alt', 'Test image');
        expect(image).toHaveAttribute('width', '400');
        expect(image).toHaveAttribute('height', '300');
      });
    });

    it('renders quote blocks with proper styling', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const quote = screen.getByText('This is a test quote that should be styled differently.');
        expect(quote.closest('blockquote')).toHaveClass(
          'border-l-4', 'border-primary', 'pl-4', 'py-2', 'my-6', 'text-text-secondary', 'italic'
        );
      });
    });

    it('renders unordered list blocks correctly', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list.tagName).toBe('UL');
        expect(list).toHaveClass('list-disc', 'list-inside');
        
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);
        expect(listItems[0]).toHaveTextContent('First item');
        expect(listItems[1]).toHaveTextContent('Second item');
        expect(listItems[2]).toHaveTextContent('Third item');
      });
    });

    it('renders ordered list when metadata specifies', async () => {
      const orderedListBlocks = [
        {
          id: 1,
          type: BlogContentBlockType.LIST,
          content: '1. First item\n2. Second item\n3. Third item',
          metadata: { ordered: true },
          order: 1,
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          contentBlocks: orderedListBlocks,
        }),
      });

      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list.tagName).toBe('OL');
        expect(list).toHaveClass('list-decimal', 'list-inside');
      });
    });

    it('renders code blocks with proper styling', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const codeElement = screen.getByText((content, element) => {
          return element?.tagName.toLowerCase() === 'code' && 
                 content.includes('const test = "Hello World"') &&
                 content.includes('console.log(test)');
        });
        expect(codeElement.closest('pre')).toHaveClass(
          'bg-surface-tertiary', 'p-4', 'rounded-md', 'overflow-x-auto', 'my-6'
        );
        expect(codeElement).toHaveClass('text-sm', 'text-text-primary', 'font-mono');
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        expect(screen.getByText('This is a test paragraph with some content.')).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with error state', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const renderResult = render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });

    it('has proper article structure', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        expect(screen.getByRole('article')).toBeInTheDocument();
      });
    });

    it('has proper heading hierarchy', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Error Loading Content');
        expect(alert).toHaveTextContent('Network error');
      });
    });

    it('displays 404 error for missing posts', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });
      
      render(<BlogContent slug="nonexistent-slug" />);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Blog post not found');
      });
    });

    it('displays empty state when no content blocks available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          contentBlocks: [],
        }),
      });
      
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        expect(screen.getByText('No content available for this blog post.')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('calls correct API endpoint with slug', async () => {
      render(<BlogContent slug="my-test-slug" />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts/my-test-slug');
      });
    });

    it('URL encodes slug properly', async () => {
      render(<BlogContent slug="slug with spaces & symbols" />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts/slug%20with%20spaces%20%26%20symbols');
      });
    });

    it('does not fetch when slug is empty', () => {
      render(<BlogContent slug="" />);
      
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className', async () => {
      const { container } = render(<BlogContent slug="test-slug" className="custom-class" />);
      
      await waitFor(() => {
        expect(screen.getByText('This is a test paragraph with some content.')).toBeInTheDocument();
      });
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has proper article spacing', async () => {
      render(<BlogContent slug="test-slug" />);
      
      await waitFor(() => {
        const article = screen.getByRole('article');
        expect(article).toHaveClass('flex-col', 'space-y-6', 'mb-10');
      });
    });
  });
});
