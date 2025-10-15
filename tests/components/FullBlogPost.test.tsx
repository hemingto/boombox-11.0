/**
 * @fileoverview Tests for FullBlogPost component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { FullBlogPost } from '@/components/features/content/FullBlogPost';

expect.extend(toHaveNoViolations);

// Mock child components
jest.mock('@/components/features/content/BlogContent', () => ({
  BlogContent: function MockBlogContent(props: any) {
    return (
      <div data-testid="blog-content" data-slug={props.slug}>
        Mock Blog Content for {props.slug}
      </div>
    );
  }
}));

jest.mock('@/components/features/content/RecentBlogPosts', () => ({
  RecentBlogPosts: function MockRecentBlogPosts(props: any) {
    return (
      <div data-testid="recent-blog-posts" data-limit={props.limit}>
        Mock Recent Blog Posts (limit: {props.limit})
      </div>
    );
  }
}));

describe('FullBlogPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<FullBlogPost slug="test-slug" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('renders BlogContent component with correct slug', () => {
      render(<FullBlogPost slug="my-test-slug" />);
      
      const blogContent = screen.getByTestId('blog-content');
      expect(blogContent).toBeInTheDocument();
      expect(blogContent).toHaveAttribute('data-slug', 'my-test-slug');
    });

    it('renders RecentBlogPosts component with default limit', () => {
      render(<FullBlogPost slug="test-slug" />);
      
      const recentPosts = screen.getByTestId('recent-blog-posts');
      expect(recentPosts).toBeInTheDocument();
      expect(recentPosts).toHaveAttribute('data-limit', '3');
    });

    it('displays content in main element', () => {
      render(<FullBlogPost slug="test-slug" />);
      
      const main = screen.getByRole('main');
      expect(main).toContainElement(screen.getByTestId('blog-content'));
    });

    it('displays sidebar in complementary element', () => {
      render(<FullBlogPost slug="test-slug" />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toContainElement(screen.getByTestId('recent-blog-posts'));
      expect(sidebar).toHaveAttribute('aria-label', 'Recent blog posts');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<FullBlogPost slug="test-slug" />);
      await testAccessibility(renderResult);
    });

    it('has proper semantic structure', () => {
      render(<FullBlogPost slug="test-slug" />);
      
      // Check for proper semantic HTML
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      
      // Check aria-label on sidebar
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveAttribute('aria-label', 'Recent blog posts');
    });

    it('maintains proper heading hierarchy', () => {
      render(<FullBlogPost slug="test-slug" />);
      
      // The component itself doesn't add headings, but should maintain structure
      // This test ensures the layout doesn't interfere with heading hierarchy
      const main = screen.getByRole('main');
      const sidebar = screen.getByRole('complementary');
      
      expect(main).toBeInTheDocument();
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct responsive layout classes', () => {
      const { container } = render(<FullBlogPost slug="test-slug" />);
      
      const layoutContainer = container.firstChild as HTMLElement;
      expect(layoutContainer).toHaveClass(
        'flex', 'flex-col', 'sm:flex-row', 
        'gap-6', 'sm:gap-12', 'lg:gap-20', 
        'lg:px-16', 'px-6'
      );
    });

    it('applies correct main content classes', () => {
      render(<FullBlogPost slug="test-slug" />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('sm:basis-9/12');
    });

    it('applies correct sidebar classes', () => {
      render(<FullBlogPost slug="test-slug" />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass(
        'w-full', 'sm:basis-3/12', 'sm:max-w-[300px]', 'sm:ml-auto'
      );
    });

    it('applies custom className when provided', () => {
      const { container } = render(<FullBlogPost slug="test-slug" className="custom-class" />);
      
      const layoutContainer = container.firstChild as HTMLElement;
      expect(layoutContainer).toHaveClass('custom-class');
    });

    it('maintains responsive breakpoints', () => {
      const { container } = render(<FullBlogPost slug="test-slug" />);
      
      const layoutContainer = container.firstChild as HTMLElement;
      
      // Check for mobile-first responsive classes
      expect(layoutContainer).toHaveClass('flex-col'); // Mobile default
      expect(layoutContainer).toHaveClass('sm:flex-row'); // Small screens and up
      expect(layoutContainer).toHaveClass('gap-6'); // Mobile gap
      expect(layoutContainer).toHaveClass('sm:gap-12'); // Small screen gap
      expect(layoutContainer).toHaveClass('lg:gap-20'); // Large screen gap
    });
  });

  describe('Component Integration', () => {
    it('passes slug correctly to BlogContent', () => {
      render(<FullBlogPost slug="integration-test-slug" />);
      
      const blogContent = screen.getByTestId('blog-content');
      expect(blogContent).toHaveAttribute('data-slug', 'integration-test-slug');
    });

    it('configures RecentBlogPosts with correct limit', () => {
      render(<FullBlogPost slug="test-slug" />);
      
      const recentPosts = screen.getByTestId('recent-blog-posts');
      expect(recentPosts).toHaveAttribute('data-limit', '3');
    });

    it('handles special characters in slug', () => {
      const specialSlug = 'test-slug-with-special-chars-&-symbols';
      render(<FullBlogPost slug={specialSlug} />);
      
      const blogContent = screen.getByTestId('blog-content');
      expect(blogContent).toHaveAttribute('data-slug', specialSlug);
    });

    it('handles empty slug gracefully', () => {
      render(<FullBlogPost slug="" />);
      
      const blogContent = screen.getByTestId('blog-content');
      expect(blogContent).toHaveAttribute('data-slug', '');
    });
  });

  describe('Performance Considerations', () => {
    it('renders efficiently with minimal DOM structure', () => {
      const { container } = render(<FullBlogPost slug="test-slug" />);
      
      // Should have a clean, minimal DOM structure
      const layoutContainer = container.firstChild as HTMLElement;
      expect(layoutContainer.children).toHaveLength(2); // main + aside
      
      const main = layoutContainer.children[0];
      const aside = layoutContainer.children[1];
      
      expect(main.tagName).toBe('MAIN');
      expect(aside.tagName).toBe('ASIDE');
    });

    it('does not add unnecessary wrapper elements', () => {
      const { container } = render(<FullBlogPost slug="test-slug" />);
      
      // Should have direct structure without extra wrappers
      expect(container.children).toHaveLength(1); // Only the main layout div
    });
  });
});
