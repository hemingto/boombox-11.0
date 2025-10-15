/**
 * @fileoverview Tests for SiteMapLinks component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { SiteMapLinks } from '@/components/features/sitemap/SiteMapLinks';
import { sitemapData } from '@/data/sitemapLinks';

expect.extend(toHaveNoViolations);

describe('SiteMapLinks', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SiteMapLinks />);
      expect(screen.getByRole('heading', { level: 2, name: /general/i })).toBeInTheDocument();
    });

    it('renders all sitemap sections', () => {
      render(<SiteMapLinks />);
      
      // Should have 3 sections: General, Blog Posts, Locations
      const sections = screen.getAllByRole('region');
      expect(sections).toHaveLength(sitemapData.length);
    });

    it('renders section headings correctly', () => {
      render(<SiteMapLinks />);
      
      sitemapData.forEach((section) => {
        const heading = screen.getByRole('heading', { level: 2, name: section.category });
        expect(heading).toBeInTheDocument();
      });
    });

    it('renders all navigation links', () => {
      render(<SiteMapLinks />);
      
      // Count total links across all sections
      const totalLinks = sitemapData.reduce((sum, section) => sum + section.links.length, 0);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(totalLinks);
    });

    it('renders links with correct hrefs', () => {
      render(<SiteMapLinks />);
      
      // Check a few specific links
      expect(screen.getByRole('link', { name: /Navigate to Homepage/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /Navigate to Get Quote/i })).toHaveAttribute('href', '/get-quote');
      expect(screen.getByRole('link', { name: /Navigate to Locations$/i })).toHaveAttribute('href', '/locations');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<SiteMapLinks />);
      await testAccessibility(renderResult);
    });

    it('uses semantic HTML with proper section structure', () => {
      render(<SiteMapLinks />);
      
      // Each category should be a section
      const sections = screen.getAllByRole('region');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('has proper heading hierarchy', () => {
      const { container } = render(<SiteMapLinks />);
      
      // All category headings should be h2
      const h2Headings = container.querySelectorAll('h2');
      expect(h2Headings.length).toBe(sitemapData.length);
    });

    it('links have descriptive aria-labels', () => {
      render(<SiteMapLinks />);
      
      const firstLink = screen.getByRole('link', { name: /Navigate to Homepage/i });
      expect(firstLink).toHaveAttribute('aria-label', 'Navigate to Homepage');
    });

    it('each section has proper aria-labelledby', () => {
      const { container } = render(<SiteMapLinks />);
      
      const sections = container.querySelectorAll('section');
      sections.forEach((section, index) => {
        expect(section).toHaveAttribute('aria-labelledby', `sitemap-category-${index}`);
      });
    });

    it('navigation elements have proper aria-labels', () => {
      render(<SiteMapLinks />);
      
      // Check for navigation landmarks
      const navElements = screen.getAllByRole('navigation');
      expect(navElements.length).toBeGreaterThan(0);
      
      // First nav should be for General
      expect(navElements[0]).toHaveAttribute('aria-label', 'General navigation');
    });
  });

  // Design System Integration
  describe('Design System Compliance', () => {
    it('applies responsive padding classes to container', () => {
      const { container } = render(<SiteMapLinks />);
      const outerDiv = container.firstChild as HTMLElement;
      
      expect(outerDiv).toHaveClass('lg:px-16');
      expect(outerDiv).toHaveClass('px-6');
    });

    it('applies responsive vertical spacing', () => {
      const { container } = render(<SiteMapLinks />);
      const outerDiv = container.firstChild as HTMLElement;
      
      expect(outerDiv).toHaveClass('sm:mb-48');
      expect(outerDiv).toHaveClass('mb-24');
    });

    it('uses semantic surface colors for link badges', () => {
      render(<SiteMapLinks />);
      
      const firstLink = screen.getByRole('link', { name: /Navigate to Homepage/i });
      expect(firstLink).toHaveClass('bg-surface-tertiary');
      expect(firstLink).toHaveClass('hover:bg-surface-secondary');
    });

    it('applies consistent spacing between sections', () => {
      const { container } = render(<SiteMapLinks />);
      const outerDiv = container.firstChild as HTMLElement;
      
      expect(outerDiv).toHaveClass('space-y-10');
    });

    it('maintains max-width constraint', () => {
      const { container } = render(<SiteMapLinks />);
      const outerDiv = container.firstChild as HTMLElement;
      
      expect(outerDiv).toHaveClass('max-w-7xl');
    });
  });

  // Link Styling & Behavior
  describe('Link Styling', () => {
    it('applies correct styling to link badges', () => {
      render(<SiteMapLinks />);
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('text-sm');
        expect(link).toHaveClass('py-2');
        expect(link).toHaveClass('px-4');
        expect(link).toHaveClass('rounded-full');
        expect(link).toHaveClass('cursor-pointer');
      });
    });

    it('includes transition for smooth hover effects', () => {
      render(<SiteMapLinks />);
      
      const firstLink = screen.getByRole('link', { name: /Navigate to Homepage/i });
      expect(firstLink).toHaveClass('transition-colors');
      expect(firstLink).toHaveClass('duration-150');
    });

    it('has active state styling', () => {
      render(<SiteMapLinks />);
      
      const firstLink = screen.getByRole('link', { name: /Navigate to Homepage/i });
      expect(firstLink).toHaveClass('active:bg-surface-primary');
    });
  });

  // Data Integration
  describe('Data Integration', () => {
    it('renders data from imported sitemapData', () => {
      render(<SiteMapLinks />);
      
      // Verify first category from data
      expect(screen.getByRole('heading', { level: 2, name: sitemapData[0].category })).toBeInTheDocument();
    });

    it('renders all links from each category', () => {
      render(<SiteMapLinks />);
      
      // Check that all links from first category are present
      const firstCategory = sitemapData[0];
      const allLinks = screen.getAllByRole('link');
      
      // Verify each link from first category exists
      firstCategory.links.forEach((link) => {
        const matchingLink = allLinks.find((el) => 
          el.getAttribute('href') === link.href
        );
        expect(matchingLink).toBeDefined();
        expect(matchingLink).toHaveTextContent(link.name);
      });
    });

    it('uses flexbox layout for link badges', () => {
      const { container } = render(<SiteMapLinks />);
      
      const linkContainers = container.querySelectorAll('.flex.flex-wrap');
      expect(linkContainers.length).toBe(sitemapData.length);
      
      linkContainers.forEach((container) => {
        expect(container).toHaveClass('gap-4');
      });
    });
  });

  // Component Structure
  describe('Component Structure', () => {
    it('wraps each category in a section element', () => {
      const { container } = render(<SiteMapLinks />);
      
      const sections = container.querySelectorAll('section');
      expect(sections).toHaveLength(sitemapData.length);
    });

    it('includes nav elements for each category', () => {
      render(<SiteMapLinks />);
      
      const navElements = screen.getAllByRole('navigation');
      expect(navElements).toHaveLength(sitemapData.length);
    });

    it('applies margin bottom to category headings', () => {
      render(<SiteMapLinks />);
      
      const headings = screen.getAllByRole('heading', { level: 2 });
      headings.forEach((heading) => {
        expect(heading).toHaveClass('mb-4');
      });
    });
  });

  // Snapshot Testing
  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = render(<SiteMapLinks />);
      expect(container).toMatchSnapshot();
    });
  });
});

