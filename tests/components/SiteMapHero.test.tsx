/**
 * @fileoverview Tests for SiteMapHero component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { SiteMapHero } from '@/components/features/sitemap/SiteMapHero';

expect.extend(toHaveNoViolations);

describe('SiteMapHero', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SiteMapHero />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('displays the correct heading text', () => {
      render(<SiteMapHero />);
      const heading = screen.getByRole('heading', { level: 1, name: /site map/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Site map');
    });

    it('renders with correct container structure', () => {
      const { container } = render(<SiteMapHero />);
      const outerDiv = container.firstChild;
      expect(outerDiv).toHaveClass('w-full', 'my-10', 'sm:my-20', 'lg:px-16', 'px-6');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<SiteMapHero />);
      await testAccessibility(renderResult);
    });

    it('uses semantic HTML with proper heading hierarchy', () => {
      render(<SiteMapHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.tagName).toBe('H1');
    });

    it('has accessible heading structure', () => {
      const { container } = render(<SiteMapHero />);
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      // Should have exactly one h1
      expect(headings).toHaveLength(1);
      expect(headings[0].tagName).toBe('H1');
    });
  });

  // Design System Integration
  describe('Design System Compliance', () => {
    it('applies responsive padding classes', () => {
      const { container } = render(<SiteMapHero />);
      const outerDiv = container.firstChild as HTMLElement;
      
      // Test responsive padding
      expect(outerDiv).toHaveClass('lg:px-16');
      expect(outerDiv).toHaveClass('px-6');
    });

    it('applies responsive vertical spacing', () => {
      const { container } = render(<SiteMapHero />);
      const outerDiv = container.firstChild as HTMLElement;
      
      // Test responsive margin
      expect(outerDiv).toHaveClass('my-10');
      expect(outerDiv).toHaveClass('sm:my-20');
    });

    it('maintains full width layout', () => {
      const { container } = render(<SiteMapHero />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('w-full');
    });
  });

  // Component Structure
  describe('Component Structure', () => {
    it('renders nested div structure correctly', () => {
      const { container } = render(<SiteMapHero />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      
      expect(outerDiv.tagName).toBe('DIV');
      expect(innerDiv.tagName).toBe('DIV');
    });

    it('applies bottom margin to heading', () => {
      render(<SiteMapHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-4');
    });
  });

  // Snapshot Testing
  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = render(<SiteMapHero />);
      expect(container).toMatchSnapshot();
    });
  });
});

