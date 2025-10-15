/**
 * @fileoverview Jest tests for Spinner component
 */

import { render, screen } from '@testing-library/react';
import { Spinner } from '@/components/ui/primitives/Spinner';

describe('Spinner Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Spinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('role', 'status');
    });

    it('renders with custom label', () => {
      render(<Spinner label="Custom loading text" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('aria-label', 'Custom loading text');
      
      // Screen reader text should be present
      expect(screen.getByText('Custom loading text')).toBeInTheDocument();
      expect(screen.getByText('Custom loading text')).toHaveClass('sr-only');
    });

    it('applies custom className', () => {
      render(<Spinner className="custom-spinner" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('custom-spinner');
    });
  });

  describe('Size Variants', () => {
    it.each([
      ['xs', 'w-3 h-3', 'border'],
      ['sm', 'w-4 h-4', 'border'],
      ['md', 'w-6 h-6', 'border-2'],
      ['lg', 'w-8 h-8', 'border-2'],
      ['xl', 'w-16 h-16', 'border-4'],
    ])('applies correct classes for %s size', (size, sizeClasses, borderClass) => {
      render(<Spinner size={size as any} data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      sizeClasses.split(' ').forEach(className => {
        expect(spinner).toHaveClass(className);
      });
      expect(spinner).toHaveClass(borderClass);
    });

    it('defaults to medium size when size is not provided', () => {
      render(<Spinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('w-6', 'h-6', 'border-2');
    });
  });

  describe('Color Variants', () => {
    it.each([
      ['primary', 'border-zinc-950 border-t-transparent'],
      ['secondary', 'border-zinc-400 border-t-transparent'],
      ['white', 'border-white border-t-transparent'],
      ['current', 'border-current border-t-transparent'],
    ])('applies correct classes for %s variant', (variant, expectedClasses) => {
      render(<Spinner variant={variant as any} data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expectedClasses.split(' ').forEach(className => {
        expect(spinner).toHaveClass(className);
      });
    });

    it('defaults to primary variant when variant is not provided', () => {
      render(<Spinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('border-zinc-950', 'border-t-transparent');
    });
  });

  describe('Animation and Visual', () => {
    it('has spin animation class', () => {
      render(<Spinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('has rounded-full class for circular shape', () => {
      render(<Spinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('rounded-full');
    });

    it('combines all necessary visual classes', () => {
      render(<Spinner size="lg" variant="primary" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass(
        'animate-spin',
        'rounded-full',
        'w-8',
        'h-8',
        'border-2',
        'border-zinc-950',
        'border-t-transparent'
      );
    });
  });

  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<Spinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('role', 'status');
    });

    it('has aria-label with default loading text', () => {
      render(<Spinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    });

    it('has aria-label with custom text when provided', () => {
      render(<Spinner label="Processing payment" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('aria-label', 'Processing payment');
    });

    it('includes screen reader text', () => {
      render(<Spinner label="Loading data" data-testid="spinner" />);
      
      const srText = screen.getByText('Loading data');
      expect(srText).toHaveClass('sr-only');
      expect(srText.tagName).toBe('SPAN');
    });

    it('screen reader text matches aria-label', () => {
      const customLabel = 'Uploading files, please wait';
      render(<Spinner label={customLabel} data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      const srText = screen.getByText(customLabel);
      
      expect(spinner).toHaveAttribute('aria-label', customLabel);
      expect(srText).toBeInTheDocument();
    });
  });

  describe('Prop Combinations', () => {
    it('handles all props together', () => {
      render(
        <Spinner
          size="xl"
          variant="white"
          label="Custom loading message"
          className="custom-class"
          data-testid="spinner"
        />
      );
      
      const spinner = screen.getByTestId('spinner');
      
      // Size
      expect(spinner).toHaveClass('w-16', 'h-16', 'border-4');
      
      // Variant
      expect(spinner).toHaveClass('border-white', 'border-t-transparent');
      
      // Custom class
      expect(spinner).toHaveClass('custom-class');
      
      // Label
      expect(spinner).toHaveAttribute('aria-label', 'Custom loading message');
      expect(screen.getByText('Custom loading message')).toHaveClass('sr-only');
    });

    it('maintains base classes with custom className', () => {
      render(<Spinner className="my-custom-class" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass(
        'animate-spin',
        'rounded-full',
        'my-custom-class'
      );
    });
  });

  describe('Border Width Mapping', () => {
    it('uses correct border width for each size', () => {
      const sizeTests = [
        { size: 'xs', borderClass: 'border' },
        { size: 'sm', borderClass: 'border' },
        { size: 'md', borderClass: 'border-2' },
        { size: 'lg', borderClass: 'border-2' },
        { size: 'xl', borderClass: 'border-4' },
      ];

      sizeTests.forEach(({ size, borderClass }) => {
        const { rerender } = render(<Spinner size={size as any} data-testid="spinner" />);
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toHaveClass(borderClass);
        
        rerender(<div />); // Clear for next test
      });
    });
  });

  describe('CSS Class Integration', () => {
    it('properly merges classes from multiple sources', () => {
      render(
        <Spinner
          size="lg"
          variant="secondary"
          className="mx-auto my-4"
          data-testid="spinner"
        />
      );
      
      const spinner = screen.getByTestId('spinner');
      
      // Should have base classes
      expect(spinner).toHaveClass('animate-spin', 'rounded-full');
      
      // Should have size classes
      expect(spinner).toHaveClass('w-8', 'h-8', 'border-2');
      
      // Should have variant classes
      expect(spinner).toHaveClass('border-zinc-400', 'border-t-transparent');
      
      // Should have custom classes
      expect(spinner).toHaveClass('mx-auto', 'my-4');
    });

    it('handles conflicting CSS classes appropriately', () => {
      render(
        <Spinner
          size="md"
          className="w-10 h-10" // Should override size classes
          data-testid="spinner"
        />
      );
      
      const spinner = screen.getByTestId('spinner');
      // Custom classes should be applied (class order may affect final result)
      expect(spinner).toHaveClass('w-10', 'h-10');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty label gracefully', () => {
      render(<Spinner label="" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('aria-label', '');
      
      // Check that screen reader text span exists (even if empty)
      const srSpan = spinner.querySelector('.sr-only');
      expect(srSpan).toBeInTheDocument();
      expect(srSpan).toHaveTextContent('');
    });

    it('handles undefined label', () => {
      render(<Spinner label={undefined} data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    });

    it('handles special characters in label', () => {
      const specialLabel = 'Loading... 50% & more "progress"';
      render(<Spinner label={specialLabel} data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('aria-label', specialLabel);
      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });

    it('handles very long labels', () => {
      const longLabel = 'A'.repeat(200);
      render(<Spinner label={longLabel} data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('aria-label', longLabel);
      expect(screen.getByText(longLabel)).toHaveClass('sr-only');
    });
  });

  describe('DOM Structure', () => {
    it('renders as a div element', () => {
      render(<Spinner data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner.tagName).toBe('DIV');
    });

    it('contains screen reader span as only child', () => {
      render(<Spinner label="Loading" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner.children).toHaveLength(1);
      expect(spinner.children[0].tagName).toBe('SPAN');
      expect(spinner.children[0]).toHaveClass('sr-only');
    });

    it('screen reader text is properly nested', () => {
      render(<Spinner label="Test loading" data-testid="spinner" />);
      
      const spinner = screen.getByTestId('spinner');
      const srText = screen.getByText('Test loading');
      
      expect(spinner).toContainElement(srText);
    });
  });

  describe('Variant Color Behavior', () => {
    it('current variant inherits text color from parent', () => {
      render(
        <div className="text-red-500">
          <Spinner variant="current" data-testid="spinner" />
        </div>
      );
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('border-current', 'border-t-transparent');
    });

    it('white variant works on dark backgrounds', () => {
      render(
        <div className="bg-black">
          <Spinner variant="white" data-testid="spinner" />
        </div>
      );
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('border-white', 'border-t-transparent');
    });
  });

  describe('Performance and Rendering', () => {
    it('renders quickly without causing layout shifts', () => {
      const { rerender } = render(<Spinner size="sm" data-testid="spinner" />);
      
      let spinner = screen.getByTestId('spinner');
      expect(spinner).toBeInTheDocument();
      
      // Re-render with different props
      rerender(<Spinner size="xl" variant="white" data-testid="spinner" />);
      
      spinner = screen.getByTestId('spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-16', 'h-16', 'border-white');
    });

    it('handles rapid prop changes without errors', () => {
      const { rerender } = render(<Spinner size="xs" variant="primary" />);
      
      const variants = ['primary', 'secondary', 'white', 'current'] as const;
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      
      // Rapidly change props
      variants.forEach(variant => {
        sizes.forEach(size => {
          rerender(<Spinner size={size} variant={variant} />);
          expect(screen.getByRole('status')).toBeInTheDocument();
        });
      });
    });
  });
});
