/**
 * @fileoverview Tests for StorageCalculatorHero component
 * Following boombox-11.0 testing standards
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StorageCalculatorHero } from '@/components/features/storage-calculator/StorageCalculatorHero';
import { testAccessibility } from '../utils/accessibility';

expect.extend(toHaveNoViolations);

// Mock RulerIcon component
jest.mock('@/components/icons/RulerIcon', () => ({
  RulerIcon: function MockRulerIcon({ className, ...props }: any) {
    return (
      <svg 
        data-testid="ruler-icon" 
        className={className}
        {...props}
      >
        <title>Ruler Icon</title>
      </svg>
    );
  }
}));

describe('StorageCalculatorHero', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================
  // Rendering Tests
  // ===========================
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<StorageCalculatorHero />);
      expect(screen.getByRole('region', { name: /storage calculator/i })).toBeInTheDocument();
    });

    it('renders the main heading', () => {
      render(<StorageCalculatorHero />);
      const heading = screen.getByRole('heading', { name: /storage calculator/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('renders the description text', () => {
      render(<StorageCalculatorHero />);
      expect(screen.getByText(/know exactly how much storage space you'll need/i)).toBeInTheDocument();
    });

    it('renders the ruler icon', () => {
      render(<StorageCalculatorHero />);
      expect(screen.getByTestId('ruler-icon')).toBeInTheDocument();
    });
  });

  // ===========================
  // Accessibility Tests (MANDATORY)
  // ===========================
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<StorageCalculatorHero />);
      await testAccessibility(renderResult);
    });

    it('uses semantic HTML with proper heading hierarchy', () => {
      render(<StorageCalculatorHero />);
      const heading = screen.getByRole('heading', { name: /storage calculator/i });
      expect(heading.tagName).toBe('H1');
    });

    it('has proper ARIA landmark with labelledby', () => {
      render(<StorageCalculatorHero />);
      const section = screen.getByRole('region', { name: /storage calculator/i });
      expect(section).toHaveAttribute('aria-labelledby', 'storage-calculator-heading');
    });

    it('marks icon as decorative with aria-hidden', () => {
      render(<StorageCalculatorHero />);
      const icon = screen.getByTestId('ruler-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('has accessible text content with no empty elements', () => {
      const { container } = render(<StorageCalculatorHero />);
      
      // Verify heading has content
      const heading = screen.getByRole('heading', { name: /storage calculator/i });
      expect(heading.textContent).toBeTruthy();
      
      // Verify description has content
      const description = screen.getByText(/know exactly how much storage space you'll need/i);
      expect(description.textContent).toBeTruthy();
    });
  });

  // ===========================
  // Design System Integration Tests
  // ===========================
  describe('Design System Integration', () => {
    it('uses semantic color tokens for heading', () => {
      render(<StorageCalculatorHero />);
      const heading = screen.getByRole('heading', { name: /storage calculator/i });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('uses semantic color tokens for description', () => {
      render(<StorageCalculatorHero />);
      const description = screen.getByText(/know exactly how much storage space you'll need/i);
      expect(description).toHaveClass('text-text-secondary');
    });

    it('uses semantic color tokens for icon', () => {
      render(<StorageCalculatorHero />);
      const icon = screen.getByTestId('ruler-icon');
      expect(icon).toHaveClass('text-text-primary');
    });

    it('does not use hardcoded color values', () => {
      const { container } = render(<StorageCalculatorHero />);
      const html = container.innerHTML;
      
      // Check for common hardcoded color patterns
      expect(html).not.toMatch(/text-zinc-\d+/);
      expect(html).not.toMatch(/text-gray-\d+/);
      expect(html).not.toMatch(/text-slate-\d+/);
      expect(html).not.toMatch(/bg-zinc-\d+/);
    });
  });

  // ===========================
  // Layout Structure Tests
  // ===========================
  describe('Layout Structure', () => {
    it('applies correct container spacing', () => {
      render(<StorageCalculatorHero />);
      const section = screen.getByRole('region', { name: /storage calculator/i });
      
      // Check responsive spacing classes
      expect(section).toHaveClass('mt-12');
      expect(section).toHaveClass('sm:mt-24');
      expect(section).toHaveClass('lg:px-16');
      expect(section).toHaveClass('px-6');
    });

    it('applies correct icon spacing', () => {
      render(<StorageCalculatorHero />);
      const icon = screen.getByTestId('ruler-icon');
      expect(icon).toHaveClass('mb-4');
      expect(icon).toHaveClass('w-12');
      expect(icon).toHaveClass('h-12');
    });

    it('applies correct heading spacing', () => {
      render(<StorageCalculatorHero />);
      const heading = screen.getByRole('heading', { name: /storage calculator/i });
      expect(heading).toHaveClass('mb-4');
    });

    it('uses proper flex layout', () => {
      render(<StorageCalculatorHero />);
      const section = screen.getByRole('region', { name: /storage calculator/i });
      expect(section).toHaveClass('flex');
    });
  });

  // ===========================
  // Content Tests
  // ===========================
  describe('Content', () => {
    it('displays correct heading text', () => {
      render(<StorageCalculatorHero />);
      expect(screen.getByRole('heading', { name: /storage calculator/i })).toHaveTextContent('Storage Calculator');
    });

    it('displays correct description with proper apostrophe', () => {
      render(<StorageCalculatorHero />);
      const description = screen.getByText(/know exactly how much storage space you'll need/i);
      expect(description).toBeInTheDocument();
      
      // Verify the apostrophe is properly escaped in the source
      expect(description.textContent).toContain("you'll");
    });

    it('has proper heading ID for ARIA relationship', () => {
      render(<StorageCalculatorHero />);
      const heading = screen.getByRole('heading', { name: /storage calculator/i });
      expect(heading).toHaveAttribute('id', 'storage-calculator-heading');
    });
  });

  // ===========================
  // Snapshot Test
  // ===========================
  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = render(<StorageCalculatorHero />);
      expect(container).toMatchSnapshot();
    });
  });
});

