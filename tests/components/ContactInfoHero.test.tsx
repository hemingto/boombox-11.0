/**
 * @fileoverview Tests for ContactInfoHero component
 * @source boombox-10.0/src/app/components/user-page/contactinfohero.tsx
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContactInfoHero } from '@/components/features/customers/ContactInfoHero';
import { testAccessibility } from '../utils/accessibility';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('ContactInfoHero', () => {
  const mockUserId = '123';

  describe('Rendering', () => {
    it('renders the page title', () => {
      render(<ContactInfoHero userId={mockUserId} />);
      
      expect(screen.getByRole('heading', { name: /account info/i })).toBeInTheDocument();
    });

    it('renders the back button with correct link and aria-label', () => {
      render(<ContactInfoHero userId={mockUserId} />);
      
      const link = screen.getByRole('link', { name: /back to dashboard/i });
      expect(link).toHaveAttribute('href', `/user-page/${mockUserId}`);
      expect(link).toHaveAttribute('aria-label', 'Back to dashboard');
    });
  });

  describe('Styling', () => {
    it('applies correct responsive classes', () => {
      const { container } = render(<ContactInfoHero userId={mockUserId} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('mt-12', 'sm:mt-24', 'mb-12', 'lg:px-16', 'px-6');
    });

    it('applies design system text colors', () => {
      render(<ContactInfoHero userId={mockUserId} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-text-primary');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<ContactInfoHero userId={mockUserId} />);
      
      await testAccessibility(renderResult);
    });

    it('uses semantic heading hierarchy', () => {
      render(<ContactInfoHero userId={mockUserId} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('provides accessible navigation', () => {
      render(<ContactInfoHero userId={mockUserId} />);
      
      const link = screen.getByRole('link', { name: /back to dashboard/i });
      expect(link).toHaveAttribute('href', `/user-page/${mockUserId}`);
      expect(link).toHaveAttribute('aria-label');
    });
  });

  describe('Props', () => {
    it('uses userId prop correctly in link', () => {
      const testUserId = '456';
      render(<ContactInfoHero userId={testUserId} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', `/user-page/${testUserId}`);
    });
  });
});

