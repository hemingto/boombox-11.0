/**
 * @fileoverview Tests for SubPageHero component
 * Following boombox-11.0 testing standards
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { SubPageHero } from '@/components/features/service-providers/account/SubPageHero';

expect.extend(toHaveNoViolations);

describe('SubPageHero', () => {
  const defaultProps = {
    title: 'Payment Settings',
    userType: 'driver' as const,
    userId: 'driver-123',
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SubPageHero {...defaultProps} />);
      expect(screen.getByRole('heading', { name: 'Payment Settings' })).toBeInTheDocument();
    });

    it('displays the title correctly', () => {
      render(<SubPageHero {...defaultProps} title="Account Settings" />);
      expect(screen.getByRole('heading', { name: 'Account Settings' })).toBeInTheDocument();
    });

    it('displays the description when provided', () => {
      const description = 'Manage your payment methods and payout preferences';
      render(<SubPageHero {...defaultProps} description={description} />);
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('does not display description when not provided', () => {
      render(<SubPageHero {...defaultProps} />);
      const paragraphs = screen.queryAllByRole('paragraph');
      expect(paragraphs).toHaveLength(0);
    });

    it('renders the ChevronLeftIcon', () => {
      const { container } = render(<SubPageHero {...defaultProps} />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<SubPageHero {...defaultProps} />);
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations with description', async () => {
      const renderResult = render(
        <SubPageHero {...defaultProps} description="Test description" />
      );
      await testAccessibility(renderResult);
    });

    it('has proper navigation role', () => {
      render(<SubPageHero {...defaultProps} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<SubPageHero {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Payment Settings');
    });

    it('has aria-label on navigation section', () => {
      render(<SubPageHero {...defaultProps} />);
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Sub-page navigation');
    });

    it('has screen reader text for back button', () => {
      render(<SubPageHero {...defaultProps} userType="driver" />);
      expect(screen.getByText('Back to Driver Account')).toHaveClass('sr-only');
    });

    it('has correct screen reader text for mover type', () => {
      render(<SubPageHero {...defaultProps} userType="mover" />);
      expect(screen.getByText('Back to Mover Account')).toHaveClass('sr-only');
    });
  });

  describe('Navigation Links', () => {
    it('renders correct back link for driver with userId', () => {
      render(<SubPageHero {...defaultProps} userType="driver" userId="driver-456" />);
      const link = screen.getByRole('link', { name: /Back to Driver Account/i });
      expect(link).toHaveAttribute('href', '/driver-account-page/driver-456');
    });

    it('renders correct back link for mover with userId', () => {
      render(<SubPageHero {...defaultProps} userType="mover" userId="mover-789" />);
      const link = screen.getByRole('link', { name: /Back to Mover Account/i });
      expect(link).toHaveAttribute('href', '/mover-account-page/mover-789');
    });

    it('has proper aria-label for driver back button', () => {
      render(<SubPageHero {...defaultProps} userType="driver" />);
      const link = screen.getByRole('link', { name: 'Back to Driver Account' });
      expect(link).toHaveAttribute('aria-label', 'Back to Driver Account');
    });

    it('has proper aria-label for mover back button', () => {
      render(<SubPageHero {...defaultProps} userType="mover" />);
      const link = screen.getByRole('link', { name: 'Back to Mover Account' });
      expect(link).toHaveAttribute('aria-label', 'Back to Mover Account');
    });
  });

  describe('Design System Integration', () => {
    it('uses semantic text colors for title', () => {
      render(<SubPageHero {...defaultProps} />);
      const heading = screen.getByRole('heading', { name: 'Payment Settings' });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('uses semantic text colors for description', () => {
      render(<SubPageHero {...defaultProps} description="Test description" />);
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('text-text-primary');
    });

    it('applies responsive spacing classes', () => {
      const { container } = render(<SubPageHero {...defaultProps} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('mt-12', 'sm:mt-24', 'mb-12');
    });

    it('applies responsive padding classes', () => {
      const { container } = render(<SubPageHero {...defaultProps} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies max-width container pattern', () => {
      const { container } = render(<SubPageHero {...defaultProps} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('max-w-5xl', 'w-full', 'mx-auto');
    });
  });

  describe('User Type Variants', () => {
    it('handles driver user type correctly', () => {
      render(<SubPageHero {...defaultProps} userType="driver" userId="driver-123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/driver-account-page/driver-123');
    });

    it('handles mover user type correctly', () => {
      render(<SubPageHero {...defaultProps} userType="mover" userId="mover-456" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/mover-account-page/mover-456');
    });
  });

  describe('Focus Management', () => {
    it('back link has focus styles', () => {
      render(<SubPageHero {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });

    it('back link has hover styles', () => {
      render(<SubPageHero {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:opacity-70', 'transition-opacity');
    });
  });

  describe('Props Validation', () => {
    it('handles empty userId gracefully', () => {
      render(<SubPageHero {...defaultProps} userId="" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/driver-account-page');
    });

    it('renders with minimal required props', () => {
      render(
        <SubPageHero 
          title="Test Title" 
          userType="driver" 
          userId="test-123" 
        />
      );
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('handles long titles correctly', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      render(<SubPageHero {...defaultProps} title={longTitle} />);
      expect(screen.getByRole('heading', { name: longTitle })).toBeInTheDocument();
    });

    it('handles long descriptions correctly', () => {
      const longDescription = 'This is a very long description that provides extensive information about the page and its purpose, potentially spanning multiple lines.';
      render(<SubPageHero {...defaultProps} description={longDescription} />);
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in title', () => {
      const specialTitle = "Driver's Payment & Settings";
      render(<SubPageHero {...defaultProps} title={specialTitle} />);
      expect(screen.getByRole('heading', { name: specialTitle })).toBeInTheDocument();
    });

    it('handles special characters in description', () => {
      const specialDescription = "Manage your payment methods & payout preferences (driver's account)";
      render(<SubPageHero {...defaultProps} description={specialDescription} />);
      expect(screen.getByText(specialDescription)).toBeInTheDocument();
    });

    it('handles special characters in userId', () => {
      render(<SubPageHero {...defaultProps} userId="driver-123-abc" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/driver-account-page/driver-123-abc');
    });
  });
});

