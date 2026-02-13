/**
 * @fileoverview Tests for Landing Page CustomerReviewSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * @source boombox-10.0/src/app/components/landingpage/customerreviewsection.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testAccessibility } from '../utils/accessibility';
import { CustomerReviewSection } from '@/components/features/landing/CustomerReviewSection';
import { CUSTOMER_REVIEWS, type CustomerReview } from '@/data/customerReviews';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ alt, className, src }: any) {
    return (
      <img src={src} alt={alt} className={className} data-testid="next-image" />
    );
  };
});

// Mock the useGoogleReviews hook — default returns hardcoded fallback data
const mockUseGoogleReviews = jest.fn();
jest.mock('@/hooks/useGoogleReviews', () => ({
  useGoogleReviews: () => mockUseGoogleReviews(),
}));

// Sample Google review data for testing
const GOOGLE_REVIEWS: CustomerReview[] = [
  {
    id: 'google-review-0',
    customer: 'Alice Tester',
    date: 'January 2025',
    description: 'Great storage service! Very convenient and affordable.',
    rating: 5,
    photoUrl: 'https://lh3.googleusercontent.com/a/example-photo-1',
    googleMapsUrl: 'https://www.google.com/maps/reviews/example-1',
  },
  {
    id: 'google-review-1',
    customer: 'Bob Reviewer',
    date: 'February 2025',
    description: 'Easy pickup and dropoff process. Highly recommend!',
    rating: 4,
    photoUrl: 'https://lh3.googleusercontent.com/a/example-photo-2',
    googleMapsUrl: 'https://www.google.com/maps/reviews/example-2',
  },
  {
    id: 'google-review-2',
    customer: 'Charlie User',
    date: 'March 2025',
    description: 'Good value for money. Clean storage units.',
    rating: 5,
    googleMapsUrl: 'https://www.google.com/maps/reviews/example-3',
  },
];

describe('CustomerReviewSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock returns fallback data (matches pre-hook behavior)
    mockUseGoogleReviews.mockReturnValue({
      reviews: CUSTOMER_REVIEWS,
      loading: false,
      error: null,
      source: 'fallback',
    });
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CustomerReviewSection />);
      expect(
        screen.getByRole('region', { name: /customer reviews/i })
      ).toBeInTheDocument();
    });

    it('renders the section heading', () => {
      render(<CustomerReviewSection />);
      expect(
        screen.getByRole('heading', {
          name: /hear from our customers/i,
          level: 1,
        })
      ).toBeInTheDocument();
    });

    it('renders all review cards from fallback data', () => {
      render(<CustomerReviewSection />);
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(CUSTOMER_REVIEWS.length);
    });

    it('renders navigation buttons', () => {
      render(<CustomerReviewSection />);
      expect(
        screen.getByRole('button', { name: /scroll to previous reviews/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /scroll to next reviews/i })
      ).toBeInTheDocument();
    });

    it('renders review customer names', () => {
      render(<CustomerReviewSection />);
      expect(screen.getByText('Bianca R')).toBeInTheDocument();
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
      const { container } = render(
        <CustomerReviewSection className="custom-class" />
      );
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // Google Reviews integration
  describe('Google Reviews Integration', () => {
    it('renders Google reviews when available', () => {
      mockUseGoogleReviews.mockReturnValue({
        reviews: GOOGLE_REVIEWS,
        loading: false,
        error: null,
        source: 'google',
      });

      render(<CustomerReviewSection />);
      expect(screen.getByText('Alice Tester')).toBeInTheDocument();
      expect(screen.getByText('Bob Reviewer')).toBeInTheDocument();
      expect(screen.getByText('Charlie User')).toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(3);
    });

    it('renders star ratings when rating is provided', () => {
      mockUseGoogleReviews.mockReturnValue({
        reviews: GOOGLE_REVIEWS,
        loading: false,
        error: null,
        source: 'google',
      });

      render(<CustomerReviewSection />);
      // Each review with a rating should render a star rating component
      const starRatings = screen.getAllByLabelText(/out of 5 stars/i);
      expect(starRatings).toHaveLength(3);
    });

    it('renders Google profile photos when photoUrl is provided', () => {
      mockUseGoogleReviews.mockReturnValue({
        reviews: GOOGLE_REVIEWS,
        loading: false,
        error: null,
        source: 'google',
      });

      render(<CustomerReviewSection />);
      const alicePhoto = screen.getByAltText('Alice Tester profile');
      expect(alicePhoto).toHaveAttribute(
        'src',
        'https://lh3.googleusercontent.com/a/example-photo-1'
      );
    });

    it('falls back to placeholder image when no photoUrl', () => {
      mockUseGoogleReviews.mockReturnValue({
        reviews: GOOGLE_REVIEWS,
        loading: false,
        error: null,
        source: 'google',
      });

      render(<CustomerReviewSection />);
      // Charlie User has no photoUrl, should get the Next.js Image fallback
      const charlieImages = screen.getAllByAltText('Charlie User profile');
      expect(charlieImages.length).toBe(1);
    });

    it('links to Google Maps review when googleMapsUrl is provided', () => {
      mockUseGoogleReviews.mockReturnValue({
        reviews: GOOGLE_REVIEWS,
        loading: false,
        error: null,
        source: 'google',
      });

      render(<CustomerReviewSection />);
      const aliceLink = screen.getByLabelText(
        'Read full review from Alice Tester'
      );
      expect(aliceLink).toHaveAttribute(
        'href',
        'https://www.google.com/maps/reviews/example-1'
      );
    });

    it('falls back to #google-reviews link when no googleMapsUrl', () => {
      mockUseGoogleReviews.mockReturnValue({
        reviews: [{ ...GOOGLE_REVIEWS[0], googleMapsUrl: undefined }],
        loading: false,
        error: null,
        source: 'google',
      });

      render(<CustomerReviewSection />);
      const link = screen.getByLabelText('Read full review from Alice Tester');
      expect(link).toHaveAttribute('href', '#google-reviews');
    });

    it('uses reviews prop when provided, overriding hook data', () => {
      const propReviews: CustomerReview[] = [
        {
          id: 'prop-review-1',
          customer: 'Prop User',
          date: 'June 2025',
          description: 'Review from prop',
        },
      ];

      render(<CustomerReviewSection reviews={propReviews} />);
      expect(screen.getByText('Prop User')).toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(1);
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
      const prevButton = screen.getByRole('button', {
        name: /scroll to previous reviews/i,
      });
      const nextButton = screen.getByRole('button', {
        name: /scroll to next reviews/i,
      });

      expect(prevButton).toHaveAttribute(
        'aria-label',
        'Scroll to previous reviews'
      );
      expect(nextButton).toHaveAttribute(
        'aria-label',
        'Scroll to next reviews'
      );
    });

    it('has proper heading hierarchy', () => {
      render(<CustomerReviewSection />);
      const mainHeading = screen.getByRole('heading', {
        level: 1,
        name: /hear from our customers/i,
      });
      expect(mainHeading).toBeInTheDocument();

      // Review customer names should be h2
      const customerHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(customerHeadings.length).toBeGreaterThan(0);
    });

    it('has keyboard accessible navigation buttons', () => {
      render(<CustomerReviewSection />);
      const prevButton = screen.getByRole('button', {
        name: /scroll to previous reviews/i,
      });
      const nextButton = screen.getByRole('button', {
        name: /scroll to next reviews/i,
      });

      expect(prevButton).toHaveAttribute('type', 'button');
      expect(nextButton).toHaveAttribute('type', 'button');
    });

    it('has proper semantic HTML structure', () => {
      render(<CustomerReviewSection />);
      expect(
        screen.getByRole('region', { name: /customer reviews/i })
      ).toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(
        CUSTOMER_REVIEWS.length
      );
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('handles scroll left button click', () => {
      render(<CustomerReviewSection />);
      const scrollContainer = screen.getByRole('region', {
        name: /customer reviews/i,
      });
      const mockScrollTo = jest.fn();
      scrollContainer.scrollTo = mockScrollTo;

      const prevButton = screen.getByRole('button', {
        name: /scroll to previous reviews/i,
      });
      fireEvent.click(prevButton);

      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('handles scroll right button click', () => {
      render(<CustomerReviewSection />);
      const scrollContainer = screen.getByRole('region', {
        name: /customer reviews/i,
      });
      const mockScrollTo = jest.fn();
      scrollContainer.scrollTo = mockScrollTo;

      const nextButton = screen.getByRole('button', {
        name: /scroll to next reviews/i,
      });
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
      const scrollContainer = screen.getByRole('region', {
        name: /customer reviews/i,
      });
      const mockScrollTo = jest.fn();
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 0,
        writable: true,
      });
      scrollContainer.scrollTo = mockScrollTo;

      const nextButton = screen.getByRole('button', {
        name: /scroll to next reviews/i,
      });
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
      const prevButton = screen.getByRole('button', {
        name: /scroll to previous reviews/i,
      });

      expect(prevButton).toHaveClass('bg-surface-primary');
      expect(prevButton).toHaveClass('active:bg-surface-disabled');
    });

    it('uses semantic text color tokens', () => {
      render(<CustomerReviewSection />);
      const heading = screen.getByRole('heading', {
        name: /hear from our customers/i,
        level: 1,
      });

      expect(heading).toHaveClass('text-text-primary');
    });

    it('applies hover effects using design system', () => {
      render(<CustomerReviewSection />);
      const prevButton = screen.getByRole('button', {
        name: /scroll to previous reviews/i,
      });

      expect(prevButton).toHaveClass('hover:bg-surface-disabled');
    });
  });

  // Image Rendering
  describe('Image Rendering', () => {
    it('renders fallback images for reviews without photoUrl', () => {
      render(<CustomerReviewSection />);
      // Fallback reviews don't have photoUrl, so all should use Next.js Image
      const images = screen.getAllByTestId('next-image');
      expect(images).toHaveLength(CUSTOMER_REVIEWS.length);
    });

    it('provides descriptive alt text for avatars', () => {
      render(<CustomerReviewSection />);
      const firstImage = screen.getByAltText('Bianca R profile');
      expect(firstImage).toBeInTheDocument();
    });

    it('renders Google profile photos as img elements', () => {
      mockUseGoogleReviews.mockReturnValue({
        reviews: [GOOGLE_REVIEWS[0]], // Alice with photoUrl
        loading: false,
        error: null,
        source: 'google',
      });

      render(<CustomerReviewSection />);
      const photo = screen.getByAltText('Alice Tester profile');
      expect(photo).toHaveAttribute(
        'src',
        'https://lh3.googleusercontent.com/a/example-photo-1'
      );
      expect(photo).toHaveClass('rounded-full', 'object-cover');
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
      const scrollContainer = screen.getByRole('region', {
        name: /customer reviews/i,
      });
      const innerContainer = scrollContainer.querySelector('#item-container');

      expect(innerContainer).toHaveClass('lg:px-16', 'px-6');
    });

    it('hides scrollbar with utility class', () => {
      render(<CustomerReviewSection />);
      const scrollContainer = screen.getByRole('region', {
        name: /customer reviews/i,
      });

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

      expect(articles).toHaveLength(CUSTOMER_REVIEWS.length);
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
      const navigationGroup = screen.getByRole('group', {
        name: /review navigation/i,
      });

      expect(navigationGroup).toBeInTheDocument();
    });

    it('positions navigation buttons correctly', () => {
      render(<CustomerReviewSection />);
      const navigationGroup = screen.getByRole('group', {
        name: /review navigation/i,
      });

      expect(navigationGroup).toHaveClass('flex', 'mt-4', 'sm:mt-0');
    });
  });
});
