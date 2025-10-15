/**
 * @fileoverview Tests for HowItWorksHeroSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { HowItWorksHeroSection } from '@/components/features/howitworks/HowItWorksHeroSection';

expect.extend(toHaveNoViolations);

// Mock the ClipboardIcon component
jest.mock('@/components/icons/ClipboardIcon', () => ({
  ClipboardIcon: function MockClipboardIcon(props: any) {
    return (
      <svg 
        data-testid="clipboard-icon"
        className={props.className}
        aria-hidden={props['aria-hidden']}
      >
        <title>Clipboard Icon</title>
      </svg>
    );
  },
}));

describe('HowItWorksHeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HowItWorksHeroSection />);
      expect(screen.getByRole('region', { name: /how it works/i })).toBeInTheDocument();
    });

    it('renders the heading', () => {
      render(<HowItWorksHeroSection />);
      expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
    });

    it('renders the tagline', () => {
      render(<HowItWorksHeroSection />);
      expect(screen.getByText(/start storing in 4 easy steps/i)).toBeInTheDocument();
    });

    it('renders the clipboard icon', () => {
      render(<HowItWorksHeroSection />);
      expect(screen.getByTestId('clipboard-icon')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<HowItWorksHeroSection className="custom-hero" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-hero');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<HowItWorksHeroSection />);
      await testAccessibility(renderResult);
    });

    it('has proper heading hierarchy', () => {
      render(<HowItWorksHeroSection />);
      const heading = screen.getByRole('heading', { name: /how it works/i });
      expect(heading.tagName).toBe('H1');
    });

    it('has proper ARIA labelledby relationship', () => {
      const { container } = render(<HowItWorksHeroSection />);
      const section = container.querySelector('section');
      const heading = screen.getByRole('heading', { name: /how it works/i });
      
      expect(section).toHaveAttribute('aria-labelledby', 'hero-heading');
      expect(heading).toHaveAttribute('id', 'hero-heading');
    });

    it('uses semantic HTML structure', () => {
      const { container } = render(<HowItWorksHeroSection />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('marks icon as decorative with aria-hidden', () => {
      render(<HowItWorksHeroSection />);
      const icon = screen.getByTestId('clipboard-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Design System Compliance', () => {
    it('uses semantic color tokens for heading', () => {
      render(<HowItWorksHeroSection />);
      const heading = screen.getByRole('heading', { name: /how it works/i });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('uses semantic color tokens for tagline', () => {
      render(<HowItWorksHeroSection />);
      const tagline = screen.getByText(/start storing in 4 easy steps/i);
      expect(tagline).toHaveClass('text-text-secondary');
    });

    it('applies correct icon styling', () => {
      render(<HowItWorksHeroSection />);
      const icon = screen.getByTestId('clipboard-icon');
      expect(icon).toHaveClass('mb-4', 'w-12', 'h-12', 'text-text-primary');
    });

    it('applies consistent spacing patterns', () => {
      const { container } = render(<HowItWorksHeroSection />);
      const section = container.querySelector('section');
      
      expect(section).toHaveClass('mt-12', 'sm:mt-24');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });
  });

  describe('Layout & Responsive Design', () => {
    it('applies responsive layout classes', () => {
      const { container } = render(<HowItWorksHeroSection />);
      const section = container.querySelector('section');
      
      expect(section).toHaveClass('md:flex');
      expect(section).toHaveClass('lg:px-16');
      expect(section).toHaveClass('px-6');
    });

    it('has proper content structure', () => {
      const { container } = render(<HowItWorksHeroSection />);
      const contentDiv = container.querySelector('.place-content-center');
      
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv).toHaveClass('mb-8');
    });
  });

  describe('Content', () => {
    it('displays correct heading text', () => {
      render(<HowItWorksHeroSection />);
      expect(screen.getByText('How it works')).toBeInTheDocument();
    });

    it('displays correct tagline text', () => {
      render(<HowItWorksHeroSection />);
      expect(screen.getByText('start storing in 4 easy steps')).toBeInTheDocument();
    });

    it('uses paragraph element for tagline', () => {
      render(<HowItWorksHeroSection />);
      const tagline = screen.getByText(/start storing in 4 easy steps/i);
      expect(tagline.tagName).toBe('P');
    });
  });
});

