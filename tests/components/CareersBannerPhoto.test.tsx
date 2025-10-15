/**
 * @fileoverview Tests for CareersBannerPhoto component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { CareersBannerPhoto } from '@/components/features/careers/CareersBannerPhoto';

expect.extend(toHaveNoViolations);

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage(props: any) {
    return (
      <img
        data-testid="optimized-image"
        src={props.src}
        alt={props.alt}
        className={props.className}
      />
    );
  }
}));

describe('CareersBannerPhoto', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CareersBannerPhoto />);
      expect(screen.getByLabelText(/careers banner section/i)).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<CareersBannerPhoto />);
      const section = screen.getByLabelText(/careers banner section/i);
      expect(section).toBeInTheDocument();
    });

    it('renders with custom props', () => {
      const customProps = {
        src: '/custom-image.jpg',
        alt: 'Custom alt text',
        className: 'custom-class'
      };
      
      render(<CareersBannerPhoto {...customProps} />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', customProps.src);
      expect(image).toHaveAttribute('alt', customProps.alt);
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<CareersBannerPhoto />);
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with custom props', async () => {
      const renderResult = render(
        <CareersBannerPhoto 
          src="/test-image.jpg" 
          alt="Test image description"
        />
      );
      await testAccessibility(renderResult);
    });

    it('has proper ARIA attributes', () => {
      render(<CareersBannerPhoto />);
      const section = screen.getByLabelText(/careers banner section/i);
      expect(section).toHaveAttribute('aria-label', 'Careers banner section');
    });

    it('provides meaningful alt text for images', () => {
      render(<CareersBannerPhoto />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('alt');
      expect(image.getAttribute('alt')).not.toBe('');
    });
  });

  // REQUIRED: Component behavior testing
  describe('Component Behavior', () => {
    it('applies correct CSS classes', () => {
      render(<CareersBannerPhoto />);
      const section = screen.getByLabelText(/careers banner section/i);
      expect(section).toHaveClass('md:flex', 'lg:px-16', 'px-6', 'sm:mb-48', 'mb-24');
    });

    it('passes through OptimizedImage props correctly', () => {
      render(<CareersBannerPhoto src="/test.jpg" alt="Test alt" />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/test.jpg');
      expect(image).toHaveAttribute('alt', 'Test alt');
    });
  });

  // REQUIRED: Design system integration
  describe('Design System Integration', () => {
    it('uses design system spacing classes', () => {
      render(<CareersBannerPhoto />);
      const section = screen.getByLabelText(/careers banner section/i);
      expect(section).toHaveClass('sm:mb-48', 'mb-24', 'lg:px-16', 'px-6');
    });

    it('maintains responsive design patterns', () => {
      render(<CareersBannerPhoto />);
      const section = screen.getByLabelText(/careers banner section/i);
      expect(section).toHaveClass('md:flex');
    });
  });
});
