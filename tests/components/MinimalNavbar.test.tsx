/**
 * @fileoverview MinimalNavbar component tests
 * Tests theme variants, button visibility props, accessibility, and navigation functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MinimalNavbar } from '@/components/ui/navigation/MinimalNavbar';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null })),
}));

// Mock child components
jest.mock('@/components/icons/BoomboxLogo', () => ({
  BoomboxLogo: ({ className }: { className?: string }) => (
    <div data-testid="boombox-logo" className={className}>
      Boombox Logo
    </div>
  ),
}));

jest.mock('@/components/ui/navigation/MenuPopover', () => ({
  MenuPopover: ({ className, theme }: { className?: string; theme?: string }) => (
    <div data-testid="menu-popover" className={className} data-theme={theme}>
      Menu Popover
    </div>
  ),
}));

jest.mock('@/components/ui/navigation/MobileMenu', () => ({
  MobileMenu: ({ className, theme }: { className?: string; theme?: string }) => (
    <div data-testid="mobile-menu" className={className} data-theme={theme}>
      Mobile Menu
    </div>
  ),
}));

describe('MinimalNavbar', () => {
  describe('Rendering', () => {
    it('renders the navigation with default props', () => {
      render(<MinimalNavbar />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('boombox-logo')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get a storage quote/i })).toBeInTheDocument();
    });

    it('renders with minimal props when buttons are hidden', () => {
      render(
        <MinimalNavbar 
          showGetQuoteButton={false} 
          showLoginButton={false} 
        />
      );
      
      expect(screen.getByTestId('boombox-logo')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /get a storage quote/i })).not.toBeInTheDocument();
    });
  });

  describe('Theme Variants', () => {
    it('applies dark theme styling by default', () => {
      render(<MinimalNavbar />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-primary');
      
      const logo = screen.getByTestId('boombox-logo');
      expect(logo).toHaveClass('text-text-inverse');
    });

    it('applies light theme styling when specified', () => {
      render(<MinimalNavbar theme="light" />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-surface-primary', 'border-b', 'border-border');
      
      const logo = screen.getByTestId('boombox-logo');
      expect(logo).toHaveClass('text-primary');
    });

    it('passes theme to child components', () => {
      render(<MinimalNavbar theme="light" />);
      
      expect(screen.getByTestId('menu-popover')).toHaveAttribute('data-theme', 'light');
      expect(screen.getByTestId('mobile-menu')).toHaveAttribute('data-theme', 'light');
    });
  });

  describe('Button Styling', () => {
    it('applies correct dark theme button styles', () => {
      render(<MinimalNavbar theme="dark" />);
      
      const loginButton = screen.getByRole('button', { name: /log in/i });
      expect(loginButton).toHaveClass('text-text-inverse');
      
      const quoteButton = screen.getByRole('button', { name: /get a storage quote/i });
      expect(quoteButton).toHaveClass('text-primary', 'bg-surface-primary');
    });

    it('applies correct light theme button styles', () => {
      render(<MinimalNavbar theme="light" />);
      
      const loginButton = screen.getByRole('button', { name: /log in/i });
      expect(loginButton).toHaveClass('text-text-primary');
      
      const quoteButton = screen.getByRole('button', { name: /get a storage quote/i });
      expect(quoteButton).toHaveClass('text-text-inverse', 'bg-primary');
    });
  });

  describe('Navigation Links', () => {
    it('renders correct navigation links', () => {
      render(<MinimalNavbar />);
      
      const homeLink = screen.getByRole('link', { name: /boombox home page/i });
      expect(homeLink).toHaveAttribute('href', '/');
      
      const loginLink = screen.getByRole('button', { name: /log in/i }).closest('a');
      expect(loginLink).toHaveAttribute('href', '/login');
      
      const quoteLink = screen.getByRole('button', { name: /get a storage quote/i }).closest('a');
      expect(quoteLink).toHaveAttribute('href', '/getquote');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA landmarks and labels', () => {
      render(<MinimalNavbar />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('has descriptive ARIA labels for interactive elements', () => {
      render(<MinimalNavbar />);
      
      expect(screen.getByRole('link', { name: /boombox home page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in to your account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get a storage quote/i })).toBeInTheDocument();
    });

    it('has proper focus styles', () => {
      render(<MinimalNavbar />);
      
      const homeLink = screen.getByRole('link', { name: /boombox home page/i });
      expect(homeLink).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
      
      const loginButton = screen.getByRole('button', { name: /log in/i });
      expect(loginButton).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('Responsive Design', () => {
    it('hides buttons on small screens', () => {
      render(<MinimalNavbar />);
      
      const loginButton = screen.getByRole('button', { name: /log in/i });
      expect(loginButton).toHaveClass('hidden', 'sm:block');
      
      const quoteButton = screen.getByRole('button', { name: /get a storage quote/i });
      expect(quoteButton).toHaveClass('hidden', 'sm:block');
    });

    it('shows appropriate menu components for different screen sizes', () => {
      render(<MinimalNavbar />);
      
      const menuPopover = screen.getByTestId('menu-popover');
      expect(menuPopover).toHaveClass('hidden', 'sm:block');
      
      const mobileMenu = screen.getByTestId('mobile-menu');
      expect(mobileMenu).toHaveClass('sm:hidden');
    });
  });

  describe('Conditional Button Rendering', () => {
    it('respects showLoginButton prop', () => {
      const { rerender } = render(<MinimalNavbar showLoginButton={true} />);
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
      
      rerender(<MinimalNavbar showLoginButton={false} />);
      expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument();
    });

    it('respects showGetQuoteButton prop', () => {
      const { rerender } = render(<MinimalNavbar showGetQuoteButton={true} />);
      expect(screen.getByRole('button', { name: /get a storage quote/i })).toBeInTheDocument();
      
      rerender(<MinimalNavbar showGetQuoteButton={false} />);
      expect(screen.queryByRole('button', { name: /get a storage quote/i })).not.toBeInTheDocument();
    });

    it('can hide both buttons simultaneously', () => {
      render(
        <MinimalNavbar 
          showLoginButton={false} 
          showGetQuoteButton={false} 
        />
      );
      
      expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /get a storage quote/i })).not.toBeInTheDocument();
    });
  });
});
