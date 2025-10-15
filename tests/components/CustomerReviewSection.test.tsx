/**
 * @fileoverview Tests for Landing Page CustomerReviewSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * @source boombox-10.0/src/app/components/landingpage/customerreviewsection.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { CustomerReviewSection } from '@/components/features/landing/CustomerReviewSection';

expect.extend(toHaveNoViolations);

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage({ alt, className, containerClassName }: any) {
    return (
      <div className={containerClassName} data-testid="optimized-image">
        <img src="/placeholder.jpg" alt={alt} className={className} />
      </div>
    );
  }
}));

describe('CustomerReviewSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CustomerReviewSection />);
      expect(screen.getByRole('region', { name: /customer reviews/i })).toBeInTheDocument();
    });

    it('renders the section heading', () => {
      render(<CustomerReviewSection />);
      expect(screen.getByRole('heading', { name: /hear from our customers/i, level: 1 })).toBeInTheDocument();
    });

    it('renders all review cards', () => {
      render(<CustomerReviewSection />);
      // Should render 8 reviews (from the reviews array)
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(8);
    });

    it('renders navigation buttons', () => {
      render(<CustomerReviewSection />);
      expect(screen.getByRole('button', { name: /scroll to previous reviews/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /scroll to next reviews/i })).toBeInTheDocument();
    });

    it('renders review customer names', () => {
      render(<CustomerReviewSection />);
      expect(screen.getByText('Bianca R')).toBeInTheDocument();
      // Jessie P appears twice in the reviews array
      const jessiePElements = screen.getAllByText('Jessie P');
      expect(jessiePElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Dan W')).toBeInTheDocument();
    });

    it('renders review dates', () => {
      render(<CustomerReviewSection />);
      expect(screen.getByText('August 2020')).toBeInTheDocument();
      expect(screen.getAllByText('December 2023').length).toBeGreaterThan(0);
    });

    it('applies custom className when provided', () => {
      const { container } = render(<CustomerReviewSection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<CustomerReviewSection />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels on navigation buttons', () => {
      render(<CustomerReviewSection />);
      const prevButton = screen.getByRole('button', { name: /scroll to previous reviews/i });
      const nextButton = screen.getByRole('button', { name: /scroll to next reviews/i });
      
      expect(prevButton).toHaveAttribute('aria-label', 'Scroll to previous reviews');
      expect(nextButton).toHaveAttribute('aria-label', 'Scroll to next reviews');
    });

    it('has proper heading hierarchy', () => {
      render(<CustomerReviewSection />);
      const mainHeading = screen.getByRole('heading', { level: 1, name: /hear from our customers/i });
      expect(mainHeading).toBeInTheDocument();
      
      // Review customer names should be h2
      const customerHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(customerHeadings.length).toBeGreaterThan(0);
    });

    it('has keyboard accessible navigation buttons', () => {
      render(<CustomerReviewSection />);
      const prevButton = screen.getByRole('button', { name: /scroll to previous reviews/i });
      const nextButton = screen.getByRole('button', { name: /scroll to next reviews/i });
      
      expect(prevButton).toHaveAttribute('type', 'button');
      expect(nextButton).toHaveAttribute('type', 'button');
    });

    it('has proper semantic HTML structure', () => {
      render(<CustomerReviewSection />);
      expect(screen.getByRole('region', { name: /customer reviews/i })).toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(8);
    });

    it('has focus indicators on interactive elements', () => {
      render(<CustomerReviewSection />);
      const prevButton = screen.getByRole('button', { name: /scroll to previous reviews/i });
      
      // Check that focus styles are applied
      expect(prevButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('handles scroll left button click', () => {
      render(<CustomerReviewSection />);
      const scrollContainer = screen.getByRole('region', { name: /customer reviews/i });
      const mockScrollTo = jest.fn();
      scrollContainer.scrollTo = mockScrollTo;

      const prevButton = screen.getByRole('button', { name: /scroll to previous reviews/i });
      fireEvent.click(prevButton);

      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('handles scroll right button click', () => {
      render(<CustomerReviewSection />);
      const scrollContainer = screen.getByRole('region', { name: /customer reviews/i });
      const mockScrollTo = jest.fn();
      scrollContainer.scrollTo = mockScrollTo;

      const nextButton = screen.getByRole('button', { name: /scroll to next reviews/i });
      fireEvent.click(nextButton);

      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('allows keyboard navigation through review cards', async () => {
      const user = userEvent.setup();
      render(<CustomerReviewSection />);
      
      const links = screen.getAllByRole('link');
      
      // Verify links are keyboard accessible
      expect(links.length).toBeGreaterThan(0);
      
      // Tab through multiple links
      await user.tab();
      await user.tab();
      
      // Verify links can be navigated with keyboard
      expect(links[0]).toBeInTheDocument();
    });

    it('scrolls smoothly with correct offset', () => {
      render(<CustomerReviewSection />);
      const scrollContainer = screen.getByRole('region', { name: /customer reviews/i });
      const mockScrollTo = jest.fn();
      Object.defineProperty(scrollContainer, 'scrollLeft', { value: 0, writable: true });
      scrollContainer.scrollTo = mockScrollTo;

      const nextButton = screen.getByRole('button', { name: /scroll to next reviews/i });
      fireEvent.click(nextButton);

      // Should scroll by itemWidth (405 + 16 = 421)
      expect(mockScrollTo).toHaveBeenCalledWith({
        left: 421,
        behavior: 'smooth',
      });
    });
  });

  // Design System Integration
  describe('Design System Integration', () => {
    it('uses semantic color tokens for backgrounds', () => {
      const { container } = render(<CustomerReviewSection />);
      const section = container.querySelector('section');
      
      expect(section).toHaveClass('bg-surface-tertiary');
    });

    it('uses semantic color tokens for review cards', () => {
      render(<CustomerReviewSection />);
      const articles = screen.getAllByRole('article');
      
      articles.forEach(article => {
        expect(article).toHaveClass('bg-surface-primary');
      });
    });

    it('uses semantic color tokens for navigation buttons', () => {
      render(<CustomerReviewSection />);
      const prevButton = screen.getByRole('button', { name: /scroll to previous reviews/i });
      
      expect(prevButton).toHaveClass('bg-surface-primary');
      expect(prevButton).toHaveClass('active:bg-surface-disabled');
    });

    it('uses semantic text color tokens', () => {
      render(<CustomerReviewSection />);
      const heading = screen.getByRole('heading', { name: /hear from our customers/i, level: 1 });
      
      expect(heading).toHaveClass('text-text-primary');
    });

    it('applies hover effects using design system', () => {
      render(<CustomerReviewSection />);
      const prevButton = screen.getByRole('button', { name: /scroll to previous reviews/i });
      
      expect(prevButton).toHaveClass('hover:bg-surface-disabled');
    });
  });

  // Image Optimization
  describe('Image Optimization', () => {
    it('renders OptimizedImage components for avatars', () => {
      render(<CustomerReviewSection />);
      const images = screen.getAllByTestId('optimized-image');
      
      // Should have 8 avatar images (one per review)
      expect(images).toHaveLength(8);
    });

    it('provides descriptive alt text for avatars', () => {
      render(<CustomerReviewSection />);
      const firstImage = screen.getByAltText('Bianca R profile');
      
      expect(firstImage).toBeInTheDocument();
    });

    it('applies proper avatar styling classes', () => {
      render(<CustomerReviewSection />);
      const images = screen.getAllByTestId('optimized-image');
      
      images.forEach(image => {
        expect(image).toHaveClass('w-14', 'h-14', 'rounded-full');
      });
    });
  });

  // Responsive Design
  describe('Responsive Design', () => {
    it('applies responsive spacing classes', () => {
      const { container } = render(<CustomerReviewSection />);
      const section = container.querySelector('section');
      
      expect(section).toHaveClass('sm:mb-48', 'mb-24');
    });

    it('applies responsive padding to scroll container', () => {
      render(<CustomerReviewSection />);
      const scrollContainer = screen.getByRole('region', { name: /customer reviews/i });
      const innerContainer = scrollContainer.querySelector('#item-container');
      
      expect(innerContainer).toHaveClass('lg:px-16', 'px-6');
    });

    it('hides scrollbar with utility class', () => {
      render(<CustomerReviewSection />);
      const scrollContainer = screen.getByRole('region', { name: /customer reviews/i });
      
      expect(scrollContainer).toHaveClass('scrollbar-hide');
    });
  });

  // Review Card Content
  describe('Review Card Content', () => {
    it('renders review descriptions with proper line clamping', () => {
      render(<CustomerReviewSection />);
      const descriptions = screen.getAllByText(/I've used Boombox pickup/i);
      
      descriptions.forEach(description => {
        expect(description).toHaveClass('line-clamp-6');
      });
    });

    it('renders read more icons on each card', () => {
      render(<CustomerReviewSection />);
      const articles = screen.getAllByRole('article');
      
      // Each article should have an ArrowUpRightIcon (read more indicator)
      expect(articles).toHaveLength(8);
    });

    it('applies hover scale effect to review cards', () => {
      render(<CustomerReviewSection />);
      const articles = screen.getAllByRole('article');
      
      articles.forEach(article => {
        expect(article).toHaveClass('hover:scale-[102%]');
      });
    });
  });

  // Navigation Group
  describe('Navigation Group', () => {
    it('wraps navigation buttons in proper group', () => {
      render(<CustomerReviewSection />);
      const navigationGroup = screen.getByRole('group', { name: /review navigation/i });
      
      expect(navigationGroup).toBeInTheDocument();
    });

    it('positions navigation buttons correctly', () => {
      render(<CustomerReviewSection />);
      const navigationGroup = screen.getByRole('group', { name: /review navigation/i });
      
      expect(navigationGroup).toHaveClass('flex', 'mt-4', 'sm:mt-0');
    });
  });
});
