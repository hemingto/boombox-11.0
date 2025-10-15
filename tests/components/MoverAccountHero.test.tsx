/**
 * @fileoverview Tests for MoverAccountHero component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MoverAccountHero } from '@/components/features/service-providers/account/MoverAccountHero';

expect.extend(toHaveNoViolations);

describe('MoverAccountHero', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<MoverAccountHero displayName="John Smith" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays the correct greeting with display name', () => {
      render(<MoverAccountHero displayName="John Smith" />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Hi John Smith,');
    });

    it('displays the default message when no custom message provided', () => {
      render(<MoverAccountHero displayName="John Smith" />);
      expect(screen.getByText('You can manage your account settings from this page')).toBeInTheDocument();
    });

    it('displays custom message when provided', () => {
      const customMessage = 'Welcome back! Ready to manage your schedule?';
      render(<MoverAccountHero displayName="John Smith" message={customMessage} />);
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('handles display names with special characters', () => {
      render(<MoverAccountHero displayName="O'Brien-Smith" />);
      expect(screen.getByRole('heading')).toHaveTextContent("Hi O'Brien-Smith,");
    });

    it('handles long display names', () => {
      const longName = 'Alexander Christopher Montgomery III';
      render(<MoverAccountHero displayName={longName} />);
      expect(screen.getByRole('heading')).toHaveTextContent(`Hi ${longName},`);
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<MoverAccountHero displayName="John Smith" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labeling', () => {
      render(<MoverAccountHero displayName="John Smith" />);
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'account-hero-heading');
    });

    it('heading has proper ID for ARIA reference', () => {
      render(<MoverAccountHero displayName="John Smith" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('id', 'account-hero-heading');
    });

    it('uses semantic HTML structure', () => {
      const { container } = render(<MoverAccountHero displayName="John Smith" />);
      expect(container.querySelector('section')).toBeInTheDocument();
      expect(container.querySelector('h2')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('applies semantic text color to heading', () => {
      render(<MoverAccountHero displayName="John Smith" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('applies semantic text color to message', () => {
      render(<MoverAccountHero displayName="John Smith" />);
      const message = screen.getByText(/You can manage your account settings/);
      expect(message).toHaveClass('text-text-secondary');
    });

    it('applies standardized spacing patterns', () => {
      const { container } = render(<MoverAccountHero displayName="John Smith" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('mt-12', 'sm:mt-24', 'mb-8', 'sm:mb-10');
    });

    it('applies responsive padding', () => {
      const { container } = render(<MoverAccountHero displayName="John Smith" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies max-width constraint', () => {
      const { container } = render(<MoverAccountHero displayName="John Smith" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('max-w-5xl', 'w-full', 'mx-auto');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles empty display name', () => {
      render(<MoverAccountHero displayName="" />);
      expect(screen.getByRole('heading')).toHaveTextContent('Hi ,');
    });

    it('handles whitespace-only display name', () => {
      render(<MoverAccountHero displayName="   " />);
      // React/JSX collapses whitespace, so this is expected behavior
      expect(screen.getByRole('heading')).toHaveTextContent('Hi ,');
    });

    it('handles empty custom message', () => {
      render(<MoverAccountHero displayName="John Smith" message="" />);
      const message = screen.getByText('', { selector: 'p' });
      expect(message).toBeInTheDocument();
      expect(message).toBeEmptyDOMElement();
    });

    it('handles very long custom messages', () => {
      const longMessage = 'A'.repeat(500);
      render(<MoverAccountHero displayName="John" message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  // Component structure
  describe('Component Structure', () => {
    it('renders as a client component', () => {
      // The 'use client' directive makes this a client component
      // Testing that it renders successfully validates client-side compatibility
      const { container } = render(<MoverAccountHero displayName="John" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('maintains proper heading hierarchy', () => {
      render(<MoverAccountHero displayName="John Smith" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('renders message in paragraph element', () => {
      render(<MoverAccountHero displayName="John Smith" />);
      const message = screen.getByText(/You can manage your account settings/);
      expect(message.tagName).toBe('P');
    });
  });
});

