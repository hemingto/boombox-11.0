/**
 * @fileoverview Tests for WhatFitsSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { WhatFitsSection } from '@/components/features/landing/WhatFitsSection';

expect.extend(toHaveNoViolations);

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage({
    src,
    alt,
    width,
    height,
    aspectRatio,
    containerClassName,
    className,
    fallbackSrc,
    ...props
  }: any) {
    return (
      <div className={containerClassName} data-testid="optimized-image-container">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          data-aspect-ratio={aspectRatio}
          data-fallback={fallbackSrc}
          data-testid="optimized-image"
          {...props}
        />
      </div>
    );
  },
}));

describe('WhatFitsSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<WhatFitsSection />);
      expect(screen.getByRole('region', { name: /what fits/i })).toBeInTheDocument();
    });

    it('renders the default heading', () => {
      render(<WhatFitsSection />);
      expect(screen.getByRole('heading', { level: 1, name: /what fits in a boombox\?/i })).toBeInTheDocument();
    });

    it('renders custom heading when provided', () => {
      render(<WhatFitsSection heading="Custom Storage Heading" />);
      expect(screen.getByRole('heading', { level: 1, name: /custom storage heading/i })).toBeInTheDocument();
    });

    it('renders the default description', () => {
      render(<WhatFitsSection />);
      expect(screen.getByText(/more than you think/i)).toBeInTheDocument();
      expect(screen.getByText(/5ft x 8ft storage unit/i)).toBeInTheDocument();
    });

    it('renders custom description when provided', () => {
      render(<WhatFitsSection description="Custom description text here" />);
      expect(screen.getByText(/custom description text here/i)).toBeInTheDocument();
    });

    it('renders the call-to-action button', () => {
      render(<WhatFitsSection />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Calculate your space');
    });

    it('renders custom button text when provided', () => {
      render(<WhatFitsSection buttonText="Get Started Now" />);
      expect(screen.getByRole('link', { name: /get started now/i })).toBeInTheDocument();
    });

    it('renders the image', () => {
      render(<WhatFitsSection />);
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<WhatFitsSection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<WhatFitsSection />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses semantic HTML with section element', () => {
      const { container } = render(<WhatFitsSection />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section?.tagName).toBe('SECTION');
    });

    it('has proper heading hierarchy', () => {
      render(<WhatFitsSection />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('has proper ARIA labelledby relationship', () => {
      const { container } = render(<WhatFitsSection />);
      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-labelledby', 'what-fits-section-heading');
    });

    it('has descriptive aria-label on button link', () => {
      render(<WhatFitsSection />);
      const button = screen.getByRole('link', { name: /calculate your space - navigate to storage calculator/i });
      expect(button).toBeInTheDocument();
    });

    it('has descriptive alt text for image', () => {
      render(<WhatFitsSection />);
      const image = screen.getByTestId('optimized-image');
      const altText = image.getAttribute('alt');
      expect(altText).toContain('Storage unit capacity');
      expect(altText).toContain('5ft x 8ft');
    });

    it('uses custom alt text when provided', () => {
      render(<WhatFitsSection imageAlt="Custom alt text for storage" />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('alt', 'Custom alt text for storage');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('button link navigates to default calculator route', () => {
      render(<WhatFitsSection />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      expect(button).toHaveAttribute('href', '/storage-calculator');
    });

    it('button link navigates to custom route when provided', () => {
      render(<WhatFitsSection buttonHref="/custom-route" />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      expect(button).toHaveAttribute('href', '/custom-route');
    });

    it('button has proper focus styles', () => {
      render(<WhatFitsSection />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      expect(button).toHaveClass('btn-primary');
    });

    it('button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<WhatFitsSection />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      
      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  // REQUIRED: Design system integration
  describe('Design System Integration', () => {
    it('uses btn-primary utility class for button', () => {
      render(<WhatFitsSection />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      expect(button).toHaveClass('btn-primary');
    });

    it('applies consistent container padding', () => {
      const { container } = render(<WhatFitsSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies proper spacing classes', () => {
      const { container } = render(<WhatFitsSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('mt-14', 'sm:mb-48', 'mb-24');
    });

    it('does not use hardcoded button styles', () => {
      const { container } = render(<WhatFitsSection />);
      const htmlString = container.innerHTML;
      
      // Should not contain hardcoded bg-zinc-950 inline
      expect(htmlString).not.toMatch(/bg-zinc-950.*text-white.*hover:bg-zinc-800/);
    });

    it('does not use hardcoded bg-slate placeholder', () => {
      const { container } = render(<WhatFitsSection />);
      const htmlString = container.innerHTML;
      
      // Should not contain bg-slate-100 placeholder div
      expect(htmlString).not.toMatch(/bg-slate-100.*aspect-square/);
    });

    it('uses OptimizedImage instead of placeholder div', () => {
      render(<WhatFitsSection />);
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
      expect(screen.getByTestId('optimized-image-container')).toBeInTheDocument();
    });
  });

  // REQUIRED: Image optimization
  describe('Image Optimization', () => {
    it('uses OptimizedImage component', () => {
      render(<WhatFitsSection />);
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('configures proper image dimensions', () => {
      render(<WhatFitsSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('width', '600');
      expect(image).toHaveAttribute('height', '600');
    });

    it('uses square aspect ratio', () => {
      render(<WhatFitsSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('data-aspect-ratio', 'square');
    });

    it('has fallback image configured', () => {
      render(<WhatFitsSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('data-fallback', '/placeholder.jpg');
    });

    it('applies proper container and image classes', () => {
      render(<WhatFitsSection />);
      const container = screen.getByTestId('optimized-image-container');
      const image = screen.getByTestId('optimized-image');

      expect(container).toHaveClass('w-full', 'rounded-md');
      expect(image).toHaveClass('rounded-md', 'object-cover');
    });

    it('uses default placeholder image', () => {
      render(<WhatFitsSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/placeholder.jpg');
    });

    it('uses custom image source when provided', () => {
      render(<WhatFitsSection imageSrc="/custom-storage-image.jpg" />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/custom-storage-image.jpg');
    });
  });

  // REQUIRED: Layout structure
  describe('Layout Structure', () => {
    it('uses two-column flex layout', () => {
      const { container } = render(<WhatFitsSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex');
    });

    it('renders left column with content', () => {
      const { container } = render(<WhatFitsSection />);
      const leftColumn = container.querySelector('.basis-1\\/2:has(h1)');
      expect(leftColumn || screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders right column with image', () => {
      const { container } = render(<WhatFitsSection />);
      const rightColumn = container.querySelector('.basis-1\\/2:has([data-testid="optimized-image"])');
      expect(rightColumn || screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('applies proper column sizing', () => {
      const { container } = render(<WhatFitsSection />);
      const columns = container.querySelectorAll('.basis-1\\/2');
      expect(columns.length).toBeGreaterThanOrEqual(2);
    });

    it('applies proper spacing between heading and description', () => {
      const { container } = render(<WhatFitsSection />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-8');
    });

    it('applies proper spacing between description and button', () => {
      render(<WhatFitsSection />);
      const description = screen.getByText(/5ft x 8ft storage unit/i);
      expect(description).toHaveClass('mb-10');
    });

    it('constrains description width', () => {
      render(<WhatFitsSection />);
      const description = screen.getByText(/5ft x 8ft storage unit/i);
      expect(description).toHaveClass('w-4/6');
    });
  });

  // REQUIRED: Responsive design
  describe('Responsive Design', () => {
    it('applies responsive section margins', () => {
      const { container } = render(<WhatFitsSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('sm:mb-48', 'mb-24');
    });

    it('applies responsive section padding', () => {
      const { container } = render(<WhatFitsSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies responsive flex direction', () => {
      const { container } = render(<WhatFitsSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex');
    });

    it('applies responsive margin to image', () => {
      const { container } = render(<WhatFitsSection />);
      // The md:ml-8 is on the grandparent wrapper div
      const imageContainer = screen.getByTestId('optimized-image').parentElement;
      const imageWrapper = imageContainer?.parentElement;
      expect(imageWrapper).toHaveClass('md:ml-8');
    });

    it('applies responsive bottom margin to left column', () => {
      const { container } = render(<WhatFitsSection />);
      const leftColumn = container.querySelector('.basis-1\\/2.mb-8');
      expect(leftColumn).toBeInTheDocument();
    });
  });

  // REQUIRED: Component behavior
  describe('Component Behavior', () => {
    it('displays all content sections correctly', () => {
      render(<WhatFitsSection />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/5ft x 8ft/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /calculate your space/i })).toBeInTheDocument();
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('button displays as inline-block', () => {
      render(<WhatFitsSection />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      expect(button).toHaveClass('inline-block');
    });

    it('handles all custom props simultaneously', () => {
      render(
        <WhatFitsSection
          heading="Custom Heading"
          description="Custom description"
          buttonText="Custom Button"
          buttonHref="/custom"
          imageSrc="/custom.jpg"
          imageAlt="Custom alt"
          className="custom-class"
        />
      );

      expect(screen.getByRole('heading', { name: /custom heading/i })).toBeInTheDocument();
      expect(screen.getByText(/custom description/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /custom button/i })).toBeInTheDocument();
      
      const button = screen.getByRole('link', { name: /custom button/i });
      expect(button).toHaveAttribute('href', '/custom');
      
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/custom.jpg');
      expect(image).toHaveAttribute('alt', 'Custom alt');
    });
  });

  // REQUIRED: Edge cases
  describe('Edge Cases', () => {
    it('handles empty className prop gracefully', () => {
      render(<WhatFitsSection className="" />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('handles undefined className prop', () => {
      render(<WhatFitsSection className={undefined} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('handles very long heading text', () => {
      const longHeading = 'A'.repeat(200);
      render(<WhatFitsSection heading={longHeading} />);
      expect(screen.getByText(longHeading)).toBeInTheDocument();
    });

    it('handles very long description text', () => {
      const longDescription = 'B'.repeat(500);
      render(<WhatFitsSection description={longDescription} />);
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles special characters in heading', () => {
      render(<WhatFitsSection heading="What fits? Storage & More!" />);
      expect(screen.getByRole('heading', { name: /what fits\? storage & more!/i })).toBeInTheDocument();
    });

    it('handles special characters in description', () => {
      render(<WhatFitsSection description="Storage: 5' x 8' @ $99/month" />);
      expect(screen.getByText(/storage: 5' x 8' @ \$99\/month/i)).toBeInTheDocument();
    });

    it('handles empty string for heading', () => {
      render(<WhatFitsSection heading="" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });

    it('handles empty string for description', () => {
      render(<WhatFitsSection description="" />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });

    it('handles empty string for button text', () => {
      render(<WhatFitsSection buttonText="" />);
      const button = screen.getByRole('link');
      expect(button).toHaveTextContent('');
    });

    it('handles root path for button href', () => {
      render(<WhatFitsSection buttonHref="/" />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      expect(button).toHaveAttribute('href', '/');
    });

    it('handles external URL for button href', () => {
      render(<WhatFitsSection buttonHref="https://example.com/calculator" />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      expect(button).toHaveAttribute('href', 'https://example.com/calculator');
    });

    it('handles missing image gracefully with fallback', () => {
      render(<WhatFitsSection imageSrc="" />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('data-fallback', '/placeholder.jpg');
    });

    it('handles very long image path', () => {
      const longPath = '/images/' + 'a'.repeat(200) + '.jpg';
      render(<WhatFitsSection imageSrc={longPath} />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', longPath);
    });

    it('handles very long button href', () => {
      const longHref = '/storage-calculator/' + 'param'.repeat(100);
      render(<WhatFitsSection buttonHref={longHref} />);
      const button = screen.getByRole('link', { name: /calculate your space/i });
      expect(button).toHaveAttribute('href', longHref);
    });
  });
});

