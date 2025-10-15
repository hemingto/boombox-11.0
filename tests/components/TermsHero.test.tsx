/**
 * @fileoverview Tests for TermsHero component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TermsHero } from '@/components/features/terms/TermsHero';

expect.extend(toHaveNoViolations);

describe('TermsHero', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<TermsHero />);
      expect(
        screen.getByRole('heading', { name: /terms of service/i })
      ).toBeInTheDocument();
    });

    it('displays the page title', () => {
      render(<TermsHero />);
      expect(screen.getByText('Terms of service')).toBeInTheDocument();
    });

    it('uses h1 heading for the title', () => {
      render(<TermsHero />);
      const heading = screen.getByRole('heading', {
        name: /terms of service/i,
      });
      expect(heading.tagName).toBe('H1');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TermsHero />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses semantic heading hierarchy', () => {
      render(<TermsHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Terms of service');
    });

    it('provides meaningful heading text for screen readers', () => {
      render(<TermsHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      // Heading should not be empty
      expect(heading.textContent).toBeTruthy();
      expect(heading.textContent?.trim()).toBe('Terms of service');
    });
  });

  // REQUIRED: Design System Integration
  describe('Design System', () => {
    it('applies responsive padding classes', () => {
      const { container } = render(<TermsHero />);
      const wrapper = container.querySelector('.lg\\:px-16.px-6');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies responsive margin classes', () => {
      const { container } = render(<TermsHero />);
      const wrapper = container.querySelector('.my-10.sm\\:my-20');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies bottom margin to heading', () => {
      const { container } = render(<TermsHero />);
      const heading = container.querySelector('h1');
      expect(heading).toHaveClass('mb-4');
    });
  });

  // REQUIRED: Layout and Structure
  describe('Layout', () => {
    it('has full width container', () => {
      const { container } = render(<TermsHero />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('maintains proper DOM structure', () => {
      const { container } = render(<TermsHero />);
      const outerDiv = container.firstChild;
      expect(outerDiv).toHaveClass('w-full');

      const innerDiv = container.querySelector('.w-full > div');
      expect(innerDiv).toBeInTheDocument();

      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });
  });

  // REQUIRED: Responsive Behavior
  describe('Responsive Behavior', () => {
    it('applies mobile padding (px-6)', () => {
      const { container } = render(<TermsHero />);
      const wrapper = container.querySelector('.px-6');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies desktop padding (lg:px-16)', () => {
      const { container } = render(<TermsHero />);
      const wrapper = container.querySelector('.lg\\:px-16');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies mobile margin (my-10)', () => {
      const { container } = render(<TermsHero />);
      const wrapper = container.querySelector('.my-10');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies tablet/desktop margin (sm:my-20)', () => {
      const { container } = render(<TermsHero />);
      const wrapper = container.querySelector('.sm\\:my-20');
      expect(wrapper).toBeInTheDocument();
    });
  });

  // REQUIRED: Content Display
  describe('Content Display', () => {
    it('displays the correct heading text', () => {
      render(<TermsHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Terms of service');
    });

    it('heading text is visible and not hidden', () => {
      render(<TermsHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeVisible();
    });
  });

  // REQUIRED: Component Props (none for this component, but including for completeness)
  describe('Component Interface', () => {
    it('renders correctly without any props', () => {
      const { container } = render(<TermsHero />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

