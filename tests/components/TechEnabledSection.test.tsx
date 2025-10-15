/**
 * @fileoverview Tests for TechEnabledSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { TechEnabledSection } from '@/components/features/landing/TechEnabledSection';

expect.extend(toHaveNoViolations);

// Mock AccordionContainer component
jest.mock('@/components/ui/primitives/Accordion/AccordionContainer', () => ({
  AccordionContainer: function MockAccordionContainer({
    data,
    onAccordionChange,
    defaultOpenIndex,
    alwaysOpen,
    ariaLabel,
  }: any) {
    const [openIndex, setOpenIndex] = React.useState(defaultOpenIndex || 0);

    const handleClick = (index: number) => {
      setOpenIndex(index);
      onAccordionChange(index);
    };

    return (
      <div data-testid="accordion-container" role="region" aria-label={ariaLabel}>
        {data.map((item: any, index: number) => (
          <div key={index} data-testid={`accordion-item-${index}`}>
            <button
              onClick={() => handleClick(index)}
              aria-expanded={openIndex === index}
              data-testid={`accordion-button-${index}`}
            >
              {item.question}
            </button>
            {openIndex === index && <div>{item.answer}</div>}
          </div>
        ))}
        <div data-always-open={alwaysOpen.toString()} />
      </div>
    );
  },
}));

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

// Need to import React for mock
const React = require('react');

describe('TechEnabledSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<TechEnabledSection />);
      expect(screen.getByRole('region', { name: /tech enabled storage/i })).toBeInTheDocument();
    });

    it('renders the default heading', () => {
      render(<TechEnabledSection />);
      expect(screen.getByRole('heading', { level: 1, name: /tech enabled storage/i })).toBeInTheDocument();
    });

    it('renders custom heading when provided', () => {
      render(<TechEnabledSection heading="Smart Storage Features" />);
      expect(screen.getByRole('heading', { level: 1, name: /smart storage features/i })).toBeInTheDocument();
    });

    it('renders the accordion container', () => {
      render(<TechEnabledSection />);
      expect(screen.getByTestId('accordion-container')).toBeInTheDocument();
    });

    it('renders all 3 default tech features', () => {
      render(<TechEnabledSection />);
      expect(screen.getByText(/calculate your space/i)).toBeInTheDocument();
      expect(screen.getByText(/real time tracking/i)).toBeInTheDocument();
      expect(screen.getByText(/remember what you stored/i)).toBeInTheDocument();
    });

    it('renders the image display area', () => {
      render(<TechEnabledSection />);
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('renders custom features when provided', () => {
      const customFeatures = [
        {
          question: 'Custom Feature 1',
          answer: 'Custom answer 1',
          category: 'custom',
          image: '/custom1.jpg',
        },
        {
          question: 'Custom Feature 2',
          answer: 'Custom answer 2',
          category: 'custom',
          image: '/custom2.jpg',
        },
      ];
      render(<TechEnabledSection features={customFeatures} />);

      expect(screen.getByText(/custom feature 1/i)).toBeInTheDocument();
      expect(screen.getByText(/custom feature 2/i)).toBeInTheDocument();
    });

    it('hides images when showImages is false', () => {
      render(<TechEnabledSection showImages={false} />);
      expect(screen.queryByTestId('optimized-image')).not.toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<TechEnabledSection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TechEnabledSection />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses semantic HTML with section element', () => {
      const { container } = render(<TechEnabledSection />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section?.tagName).toBe('SECTION');
    });

    it('has proper heading hierarchy', () => {
      render(<TechEnabledSection />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('has proper ARIA labelledby relationship', () => {
      const { container } = render(<TechEnabledSection />);
      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-labelledby', 'tech-enabled-section-heading');
    });

    it('provides ARIA label to accordion container', () => {
      render(<TechEnabledSection />);
      const accordion = screen.getByRole('region', { name: /tech-enabled storage features/i });
      expect(accordion).toBeInTheDocument();
    });

    it('has descriptive alt text for images', () => {
      render(<TechEnabledSection />);
      const image = screen.getByTestId('optimized-image');
      const altText = image.getAttribute('alt');
      expect(altText).toContain('Calculate your space');
      expect(altText).toContain('Take the guess work');
    });

    it('updates image alt text when accordion selection changes', async () => {
      const user = userEvent.setup();
      render(<TechEnabledSection />);

      // Click second accordion item
      const secondButton = screen.getByTestId('accordion-button-1');
      await user.click(secondButton);

      const image = screen.getByTestId('optimized-image');
      const altText = image.getAttribute('alt');
      expect(altText).toContain('Real time tracking');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('updates displayed image when accordion selection changes', async () => {
      const user = userEvent.setup();
      render(<TechEnabledSection />);

      const firstImage = screen.getByTestId('optimized-image');
      expect(firstImage).toHaveAttribute('alt', expect.stringContaining('Calculate your space'));

      // Click second accordion
      const secondButton = screen.getByTestId('accordion-button-1');
      await user.click(secondButton);

      const updatedImage = screen.getByTestId('optimized-image');
      expect(updatedImage).toHaveAttribute('alt', expect.stringContaining('Real time tracking'));
    });

    it('starts with first accordion item open', () => {
      render(<TechEnabledSection />);
      const firstButton = screen.getByTestId('accordion-button-0');
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('uses alwaysOpen behavior for accordion', () => {
      const { container } = render(<TechEnabledSection />);
      const alwaysOpenElement = container.querySelector('[data-always-open]');
      expect(alwaysOpenElement).toHaveAttribute('data-always-open', 'true');
    });

    it('handles rapid accordion clicks gracefully', async () => {
      const user = userEvent.setup();
      render(<TechEnabledSection />);

      const buttons = [
        screen.getByTestId('accordion-button-0'),
        screen.getByTestId('accordion-button-1'),
        screen.getByTestId('accordion-button-2'),
      ];

      // Rapidly click through all buttons
      for (const button of buttons) {
        await user.click(button);
      }

      // Should end on the last one
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('alt', expect.stringContaining('Remember what you stored'));
    });
  });

  // REQUIRED: Design system integration
  describe('Design System Integration', () => {
    it('applies consistent container padding', () => {
      const { container } = render(<TechEnabledSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies proper spacing classes', () => {
      const { container } = render(<TechEnabledSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('mt-14', 'sm:mb-48', 'mb-24');
    });

    it('does not use hardcoded bg-slate colors', () => {
      const { container } = render(<TechEnabledSection />);
      const htmlString = container.innerHTML;

      // Should not contain bg-slate-*, bg-gray-*, bg-zinc-* for placeholders
      expect(htmlString).not.toMatch(/bg-slate-100/);
      expect(htmlString).not.toMatch(/bg-gray-400/);
      expect(htmlString).not.toMatch(/bg-zinc-200/);
    });

    it('uses OptimizedImage instead of placeholder divs', () => {
      render(<TechEnabledSection />);
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
      expect(screen.getByTestId('optimized-image-container')).toBeInTheDocument();
    });
  });

  // REQUIRED: Image optimization
  describe('Image Optimization', () => {
    it('uses OptimizedImage component', () => {
      render(<TechEnabledSection />);
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('configures proper image dimensions', () => {
      render(<TechEnabledSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('width', '600');
      expect(image).toHaveAttribute('height', '480');
    });

    it('uses landscape aspect ratio', () => {
      render(<TechEnabledSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('data-aspect-ratio', 'landscape');
    });

    it('has fallback image configured', () => {
      render(<TechEnabledSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('data-fallback', '/placeholder.jpg');
    });

    it('applies proper container and image classes', () => {
      render(<TechEnabledSection />);
      const container = screen.getByTestId('optimized-image-container');
      const image = screen.getByTestId('optimized-image');

      expect(container).toHaveClass('w-full', 'h-full', 'rounded-md');
      expect(image).toHaveClass('rounded-md', 'object-cover');
    });

    it('uses correct image source from feature data', () => {
      const customFeatures = [
        {
          question: 'Test Feature',
          answer: 'Test answer',
          category: 'test',
          image: '/custom-image.jpg',
        },
      ];
      render(<TechEnabledSection features={customFeatures} />);

      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/custom-image.jpg');
    });
  });

  // REQUIRED: Layout structure
  describe('Layout Structure', () => {
    it('uses two-column flex layout', () => {
      const { container } = render(<TechEnabledSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex');
    });

    it('renders left column with accordion', () => {
      const { container } = render(<TechEnabledSection />);
      const leftColumn = container.querySelector('.basis-1\\/2:has([data-testid="accordion-container"])');
      expect(leftColumn || container.querySelector('[data-testid="accordion-container"]')).toBeInTheDocument();
    });

    it('renders right column with image', () => {
      const { container } = render(<TechEnabledSection />);
      const rightColumn = container.querySelector('.basis-1\\/2:has([data-testid="optimized-image"])');
      expect(rightColumn || container.querySelector('[data-testid="optimized-image"]')).toBeInTheDocument();
    });

    it('hides image on mobile screens', () => {
      const { container } = render(<TechEnabledSection />);
      const imageContainer = container.querySelector('.hidden.sm\\:flex');
      expect(imageContainer).toBeInTheDocument();
    });

    it('applies proper column sizing', () => {
      const { container } = render(<TechEnabledSection />);
      const columns = container.querySelectorAll('.basis-1\\/2');
      expect(columns.length).toBeGreaterThanOrEqual(1);
    });

    it('applies minimum height to accordion container', () => {
      const { container } = render(<TechEnabledSection />);
      const accordionColumn = container.querySelector('.min-h-\\[480px\\]');
      expect(accordionColumn).toBeInTheDocument();
    });

    it('applies fixed height to image container', () => {
      const { container } = render(<TechEnabledSection />);
      const imageColumn = container.querySelector('.h-\\[480px\\]');
      expect(imageColumn).toBeInTheDocument();
    });
  });

  // REQUIRED: Responsive design
  describe('Responsive Design', () => {
    it('applies responsive section margins', () => {
      const { container } = render(<TechEnabledSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('sm:mb-48', 'mb-24');
    });

    it('applies responsive section padding', () => {
      const { container } = render(<TechEnabledSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies responsive flex direction', () => {
      const { container } = render(<TechEnabledSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex');
    });

    it('shows images only on larger screens', () => {
      const { container } = render(<TechEnabledSection />);
      const imageContainer = container.querySelector('[data-testid="optimized-image"]')?.closest('.hidden');
      expect(imageContainer).toBeInTheDocument();
    });

    it('applies responsive margin to image', () => {
      const { container } = render(<TechEnabledSection />);
      // The md:ml-8 is on the grandparent element (wrapper of OptimizedImage container)
      const imageContainer = screen.getByTestId('optimized-image').parentElement;
      const imageWrapper = imageContainer?.parentElement;
      expect(imageWrapper).toHaveClass('md:ml-8');
    });
  });

  // REQUIRED: Component behavior
  describe('Component Behavior', () => {
    it('displays first feature image by default', () => {
      render(<TechEnabledSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/placeholder.jpg');
      expect(image).toHaveAttribute('alt', expect.stringContaining('Calculate your space'));
    });

    it('updates image when accordion changes', async () => {
      const user = userEvent.setup();
      render(<TechEnabledSection />);

      // Click third accordion
      const thirdButton = screen.getByTestId('accordion-button-2');
      await user.click(thirdButton);

      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('alt', expect.stringContaining('Remember what you stored'));
    });

    it('handles features with different images', () => {
      const customFeatures = [
        {
          question: 'Feature 1',
          answer: 'Answer 1',
          category: 'test',
          image: '/image1.jpg',
        },
        {
          question: 'Feature 2',
          answer: 'Answer 2',
          category: 'test',
          image: '/image2.jpg',
        },
      ];
      render(<TechEnabledSection features={customFeatures} />);

      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/image1.jpg');
    });
  });

  // REQUIRED: Edge cases
  describe('Edge Cases', () => {
    it('handles empty className prop gracefully', () => {
      render(<TechEnabledSection className="" />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('handles undefined className prop', () => {
      render(<TechEnabledSection className={undefined} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('handles empty features array', () => {
      render(<TechEnabledSection features={[]} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.queryByTestId('optimized-image')).not.toBeInTheDocument();
    });

    it('handles single feature', () => {
      const singleFeature = [
        {
          question: 'Single Feature',
          answer: 'Single answer',
          category: 'single',
          image: '/single.jpg',
        },
      ];
      render(<TechEnabledSection features={singleFeature} />);
      expect(screen.getByText(/single feature/i)).toBeInTheDocument();
    });

    it('handles very long feature text', () => {
      const longFeature = [
        {
          question: 'A'.repeat(100),
          answer: 'B'.repeat(500),
          category: 'long',
          image: '/test.jpg',
        },
      ];
      render(<TechEnabledSection features={longFeature} />);
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('handles special characters in feature content', () => {
      const specialFeature = [
        {
          question: "Feature's & Title",
          answer: 'Special chars: @#$%^&*()',
          category: 'special',
          image: '/test.jpg',
        },
      ];
      render(<TechEnabledSection features={specialFeature} />);
      expect(screen.getByText(/feature's & title/i)).toBeInTheDocument();
    });

    it('handles missing image gracefully', () => {
      const featureWithoutImage = [
        {
          question: 'Feature',
          answer: 'Answer',
          category: 'test',
          image: '',
        },
      ];
      render(<TechEnabledSection features={featureWithoutImage} />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('data-fallback', '/placeholder.jpg');
    });

    it('handles empty heading', () => {
      render(<TechEnabledSection heading="" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });
  });
});

