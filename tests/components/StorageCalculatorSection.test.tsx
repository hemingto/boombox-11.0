/**
 * @fileoverview Tests for StorageCalculatorSection component
 * Following boombox-11.0 testing standards
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StorageCalculatorSection } from '@/components/features/storage-calculator/StorageCalculatorSection';
import { testAccessibility } from '../utils/accessibility';

expect.extend(toHaveNoViolations);

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage({ src, alt, className, containerClassName, ...props }: any) {
    return (
      <div className={containerClassName} data-testid="optimized-image-container">
        <img
          src={src}
          alt={alt}
          className={className}
          data-testid="optimized-image"
          {...props}
        />
      </div>
    );
  }
}));

describe('StorageCalculatorSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================
  // Rendering Tests
  // ===========================
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<StorageCalculatorSection />);
      expect(screen.getByRole('region', { name: /storage calculator interactive section/i })).toBeInTheDocument();
    });

    it('renders the OptimizedImage component', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toBeInTheDocument();
    });

    it('renders container with proper structure', () => {
      render(<StorageCalculatorSection />);
      const container = screen.getByTestId('optimized-image-container');
      expect(container).toBeInTheDocument();
    });
  });

  // ===========================
  // Image Optimization Tests (CRITICAL)
  // ===========================
  describe('Image Optimization', () => {
    it('uses OptimizedImage component instead of bg-slate placeholder', () => {
      const { container } = render(<StorageCalculatorSection />);
      
      // Verify no bg-slate-100 placeholder divs exist
      const slateElements = container.querySelectorAll('.bg-slate-100');
      expect(slateElements.length).toBe(0);
      
      // Verify OptimizedImage is present
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('uses placeholder.jpg from public folder', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/placeholder.jpg');
    });

    it('has descriptive alt text for SEO and accessibility', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      const altText = image.getAttribute('alt');
      
      // Verify alt text is descriptive (not just "image" or "placeholder")
      expect(altText).toBeTruthy();
      expect(altText!.length).toBeGreaterThan(10);
      expect(altText).toContain('storage');
      expect(altText).toContain('calculator');
    });

    it('configures proper image dimensions', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('width', '800');
      expect(image).toHaveAttribute('height', '500');
    });

    it('uses lazy loading for below-the-fold content', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('sets appropriate quality for performance', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('quality', '85');
    });

    it('configures responsive sizes attribute', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('sizes');
      const sizes = image.getAttribute('sizes');
      expect(sizes).toContain('max-width');
    });

    it('applies proper aspect ratio', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('aspectRatio', 'landscape');
    });
  });

  // ===========================
  // Accessibility Tests (MANDATORY)
  // ===========================
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<StorageCalculatorSection />);
      await testAccessibility(renderResult);
    });

    it('uses semantic HTML with section landmark', () => {
      render(<StorageCalculatorSection />);
      const section = screen.getByRole('region', { name: /storage calculator interactive section/i });
      expect(section.tagName).toBe('SECTION');
    });

    it('has proper ARIA label for section', () => {
      render(<StorageCalculatorSection />);
      const section = screen.getByRole('region', { name: /storage calculator interactive section/i });
      expect(section).toHaveAttribute('aria-label', 'Storage calculator interactive section');
    });

    it('image has accessible alt text', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      const altText = image.getAttribute('alt');
      
      // Verify alt text is meaningful
      expect(altText).toBeTruthy();
      expect(altText).not.toBe('image');
      expect(altText).not.toBe('placeholder');
    });
  });

  // ===========================
  // Design System Integration Tests
  // ===========================
  describe('Design System Integration', () => {
    it('uses semantic surface color for container', () => {
      const { container } = render(<StorageCalculatorSection />);
      const innerDiv = container.querySelector('.bg-surface-tertiary');
      expect(innerDiv).toBeInTheDocument();
    });

    it('does not use hardcoded bg-slate colors', () => {
      const { container } = render(<StorageCalculatorSection />);
      const html = container.innerHTML;
      
      // Verify no bg-slate-* classes exist
      expect(html).not.toMatch(/bg-slate-\d+/);
    });

    it('does not use hardcoded text colors', () => {
      const { container } = render(<StorageCalculatorSection />);
      const html = container.innerHTML;
      
      // Check for common hardcoded color patterns
      expect(html).not.toMatch(/text-zinc-\d+/);
      expect(html).not.toMatch(/text-gray-\d+/);
    });

    it('applies proper border radius styling', () => {
      const { container } = render(<StorageCalculatorSection />);
      const roundedElements = container.querySelectorAll('.rounded-md');
      expect(roundedElements.length).toBeGreaterThan(0);
    });
  });

  // ===========================
  // Layout Structure Tests
  // ===========================
  describe('Layout Structure', () => {
    it('applies correct container spacing', () => {
      render(<StorageCalculatorSection />);
      const section = screen.getByRole('region', { name: /storage calculator interactive section/i });
      
      // Check responsive spacing classes
      expect(section).toHaveClass('lg:px-16');
      expect(section).toHaveClass('px-6');
      expect(section).toHaveClass('sm:mb-48');
      expect(section).toHaveClass('mb-24');
    });

    it('uses proper flex layout for responsive design', () => {
      render(<StorageCalculatorSection />);
      const section = screen.getByRole('region', { name: /storage calculator interactive section/i });
      expect(section).toHaveClass('md:flex');
    });

    it('applies proper padding to inner container', () => {
      const { container } = render(<StorageCalculatorSection />);
      const innerDiv = container.querySelector('.p-24');
      expect(innerDiv).toBeInTheDocument();
    });

    it('centers content with flexbox', () => {
      const { container } = render(<StorageCalculatorSection />);
      const innerDiv = container.querySelector('.flex');
      expect(innerDiv).toHaveClass('flex-col');
      expect(innerDiv).toHaveClass('items-center');
      expect(innerDiv).toHaveClass('text-center');
    });

    it('applies full width to container', () => {
      const { container } = render(<StorageCalculatorSection />);
      const innerDiv = container.querySelector('.w-full');
      expect(innerDiv).toBeInTheDocument();
    });
  });

  // ===========================
  // Image Component Props Tests
  // ===========================
  describe('Image Component Props', () => {
    it('passes correct containerClassName to OptimizedImage', () => {
      render(<StorageCalculatorSection />);
      const imageContainer = screen.getByTestId('optimized-image-container');
      expect(imageContainer).toHaveClass('w-full');
      expect(imageContainer).toHaveClass('max-w-2xl');
    });

    it('passes correct className to image element', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveClass('object-cover');
      expect(image).toHaveClass('rounded-md');
    });

    it('uses landscape aspect ratio for proper display', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('aspectRatio', 'landscape');
    });
  });

  // ===========================
  // Migration Verification Tests
  // ===========================
  describe('Migration Verification', () => {
    it('successfully replaced bg-slate-100 with OptimizedImage', () => {
      const { container } = render(<StorageCalculatorSection />);
      
      // Verify old pattern is gone
      expect(container.querySelector('.bg-slate-100')).not.toBeInTheDocument();
      
      // Verify new pattern exists
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('maintains original layout structure dimensions', () => {
      render(<StorageCalculatorSection />);
      const image = screen.getByTestId('optimized-image');
      
      // Original had h-[500px], verify image maintains similar height
      expect(image).toHaveAttribute('height', '500');
    });

    it('preserves responsive flex layout', () => {
      render(<StorageCalculatorSection />);
      const section = screen.getByRole('region', { name: /storage calculator interactive section/i });
      
      // Verify md:flex is maintained from original
      expect(section).toHaveClass('md:flex');
    });
  });

  // ===========================
  // Snapshot Test
  // ===========================
  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = render(<StorageCalculatorSection />);
      expect(container).toMatchSnapshot();
    });
  });
});

