/**
 * @fileoverview Tests for PackingSuppliesHero component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PackingSuppliesHero } from '@/components/features/packing-supplies/PackingSuppliesHero';

expect.extend(toHaveNoViolations);

// Mock PackingSuppliesIcon
jest.mock('@/components/icons/PackingSuppliesIcon', () => ({
  PackingSuppliesIcon: function MockPackingSuppliesIcon(props: any) {
    return <svg data-testid="packing-supplies-icon" {...props} />;
  },
}));

describe('PackingSuppliesHero', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<PackingSuppliesHero />);
      expect(screen.getByText('Packing supplies')).toBeInTheDocument();
    });

    it('should render the heading', () => {
      render(<PackingSuppliesHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Packing supplies');
    });

    it('should render the description text', () => {
      render(<PackingSuppliesHero />);
      expect(screen.getByText('get packing supplies delivered to your door')).toBeInTheDocument();
    });

    it('should render the packing supplies icon', () => {
      render(<PackingSuppliesHero />);
      const icon = screen.getByTestId('packing-supplies-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('mt-1', 'w-12', 'h-12');
    });
  });

  describe('Layout', () => {
    it('should have correct spacing classes', () => {
      const { container } = render(<PackingSuppliesHero />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex-col', 'mt-12', 'sm:mt-24', 'lg:px-16', 'px-6', 'sm:mb-24', 'mb-12');
    });

    it('should have correct flex layout for content', () => {
      const { container } = render(<PackingSuppliesHero />);
      const contentDiv = container.querySelector('.flex.flex-col.items-start') as HTMLElement;
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv).toHaveClass('gap-4', 'mb-4');
    });

    it('should align text to the left', () => {
      render(<PackingSuppliesHero />);
      const heading = screen.getByRole('heading');
      const description = screen.getByText('get packing supplies delivered to your door');
      
      expect(heading).toHaveClass('text-left');
      expect(description).toHaveClass('text-left');
    });
  });

  describe('Typography', () => {
    it('should use h1 element for main heading', () => {
      render(<PackingSuppliesHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.tagName).toBe('H1');
    });

    it('should have proper spacing for description', () => {
      render(<PackingSuppliesHero />);
      const description = screen.getByText('get packing supplies delivered to your door');
      expect(description).toHaveClass('mt-4');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<PackingSuppliesHero />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(<PackingSuppliesHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have meaningful heading text', () => {
      render(<PackingSuppliesHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Packing supplies');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive margin classes', () => {
      const { container } = render(<PackingSuppliesHero />);
      const mainDiv = container.firstChild as HTMLElement;
      
      // Mobile margins
      expect(mainDiv).toHaveClass('mt-12', 'mb-12');
      
      // Desktop margins
      expect(mainDiv).toHaveClass('sm:mt-24', 'sm:mb-24');
    });

    it('should have responsive padding classes', () => {
      const { container } = render(<PackingSuppliesHero />);
      const mainDiv = container.firstChild as HTMLElement;
      
      // Mobile padding
      expect(mainDiv).toHaveClass('px-6');
      
      // Desktop padding
      expect(mainDiv).toHaveClass('lg:px-16');
    });
  });

  describe('Component Structure', () => {
    it('should render icon before text content', () => {
      const { container } = render(<PackingSuppliesHero />);
      const contentDiv = container.querySelector('.flex.flex-col.items-start');
      const children = contentDiv?.children;
      
      expect(children?.[0]).toHaveAttribute('data-testid', 'packing-supplies-icon');
    });

    it('should group heading and description together', () => {
      const { container } = render(<PackingSuppliesHero />);
      const textWrapper = container.querySelector('.flex.flex-col.items-start > div');
      
      expect(textWrapper).toContainElement(screen.getByRole('heading'));
      expect(textWrapper).toContainElement(screen.getByText('get packing supplies delivered to your door'));
    });
  });
});

