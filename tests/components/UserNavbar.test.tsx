/**
 * @fileoverview UserNavbar component tests
 * Tests user-specific navigation functionality, theme variants, conditional buttons, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserNavbar } from '@/components/ui/navigation/UserNavbar';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ href, children, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
});

// Mock child components
jest.mock('@/components/icons/BoomboxLogo', () => ({
  BoomboxLogo: ({ className }: { className?: string }) => (
    <div data-testid="boombox-logo" className={className}>
      Boombox Logo
    </div>
  ),
}));

jest.mock('@/components/ui/navigation/UserMenuPopover', () => ({
  UserMenuPopover: ({ className, userId, theme }: { className?: string; userId: string; theme?: string }) => (
    <div data-testid="user-menu-popover" className={className} data-user-id={userId} data-theme={theme}>
      User Menu Popover
    </div>
  ),
}));

jest.mock('@/components/ui/navigation/UserMobileMenu', () => ({
  UserMobileMenu: ({ className, userId, theme }: { className?: string; userId: string; theme?: string }) => (
    <div data-testid="user-mobile-menu" className={className} data-user-id={userId} data-theme={theme}>
      User Mobile Menu
    </div>
  ),
}));

const mockUserId = '123';

describe('UserNavbar', () => {
  describe('Rendering', () => {
    it('renders with required userId prop', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('boombox-logo')).toBeInTheDocument();
    });

    it('renders with default button visibility', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      expect(screen.getByRole('button', { name: /access your existing storage units/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add a new storage unit/i })).toBeInTheDocument();
    });

    it('passes userId to child components', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const menuPopover = screen.getByTestId('user-menu-popover');
      expect(menuPopover).toHaveAttribute('data-user-id', mockUserId);
      
      const mobileMenu = screen.getByTestId('user-mobile-menu');
      expect(mobileMenu).toHaveAttribute('data-user-id', mockUserId);
    });
  });

  describe('Theme Variants', () => {
    it('applies dark theme styling by default', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-primary');
      
      const logo = screen.getByTestId('boombox-logo');
      expect(logo).toHaveClass('text-text-inverse');
    });

    it('applies light theme styling when specified', () => {
      render(<UserNavbar userId={mockUserId} theme="light" />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-surface-primary', 'border-b', 'border-border');
      
      const logo = screen.getByTestId('boombox-logo');
      expect(logo).toHaveClass('text-primary');
    });

    it('passes theme to child components', () => {
      render(<UserNavbar userId={mockUserId} theme="light" />);
      
      expect(screen.getByTestId('user-menu-popover')).toHaveAttribute('data-theme', 'light');
      expect(screen.getByTestId('user-mobile-menu')).toHaveAttribute('data-theme', 'light');
    });
  });

  describe('Button Styling', () => {
    it('applies correct dark theme button styles', () => {
      render(<UserNavbar userId={mockUserId} theme="dark" />);
      
      const accessButton = screen.getByRole('button', { name: /access your existing storage units/i });
      expect(accessButton).toHaveClass('text-text-inverse');
      
      const addButton = screen.getByRole('button', { name: /add a new storage unit/i });
      expect(addButton).toHaveClass('text-primary', 'bg-surface-primary');
    });

    it('applies correct light theme button styles', () => {
      render(<UserNavbar userId={mockUserId} theme="light" />);
      
      const accessButton = screen.getByRole('button', { name: /access your existing storage units/i });
      expect(accessButton).toHaveClass('text-text-primary');
      
      const addButton = screen.getByRole('button', { name: /add a new storage unit/i });
      expect(addButton).toHaveClass('text-text-inverse', 'bg-primary');
    });
  });

  describe('Navigation Links', () => {
    it('renders correct navigation links with userId', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const homeLink = screen.getByRole('link', { name: /go to user dashboard home/i });
      expect(homeLink).toHaveAttribute('href', `/user-page/${mockUserId}`);
      
      const accessLink = screen.getByRole('button', { name: /access your existing storage units/i }).closest('a');
      expect(accessLink).toHaveAttribute('href', `/user-page/${mockUserId}/access-storage`);
      
      const addLink = screen.getByRole('button', { name: /add a new storage unit/i }).closest('a');
      expect(addLink).toHaveAttribute('href', `/user-page/${mockUserId}/add-storage`);
    });
  });

  describe('Conditional Button Rendering', () => {
    it('respects showAccessStorageButton prop', () => {
      const { rerender } = render(<UserNavbar userId={mockUserId} showAccessStorageButton={true} />);
      expect(screen.getByRole('button', { name: /access your existing storage units/i })).toBeInTheDocument();
      
      rerender(<UserNavbar userId={mockUserId} showAccessStorageButton={false} />);
      expect(screen.queryByRole('button', { name: /access your existing storage units/i })).not.toBeInTheDocument();
    });

    it('respects showAddStorageButton prop', () => {
      const { rerender } = render(<UserNavbar userId={mockUserId} showAddStorageButton={true} />);
      expect(screen.getByRole('button', { name: /add a new storage unit/i })).toBeInTheDocument();
      
      rerender(<UserNavbar userId={mockUserId} showAddStorageButton={false} />);
      expect(screen.queryByRole('button', { name: /add a new storage unit/i })).not.toBeInTheDocument();
    });

    it('can hide both buttons simultaneously', () => {
      render(
        <UserNavbar 
          userId={mockUserId} 
          showAccessStorageButton={false} 
          showAddStorageButton={false} 
        />
      );
      
      expect(screen.queryByRole('button', { name: /access your existing storage units/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add a new storage unit/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA landmarks and labels', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'User account navigation');
    });

    it('has descriptive ARIA labels for interactive elements', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      expect(screen.getByRole('link', { name: /go to user dashboard home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /access your existing storage units/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add a new storage unit/i })).toBeInTheDocument();
    });

    it('has proper focus styles', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const homeLink = screen.getByRole('link', { name: /go to user dashboard home/i });
      expect(homeLink).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
      
      const accessButton = screen.getByRole('button', { name: /access your existing storage units/i });
      expect(accessButton).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('Responsive Design', () => {
    it('hides buttons on small screens', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const accessButton = screen.getByRole('button', { name: /access your existing storage units/i });
      expect(accessButton).toHaveClass('hidden', 'sm:block');
      
      const addButton = screen.getByRole('button', { name: /add a new storage unit/i });
      expect(addButton).toHaveClass('hidden', 'sm:block');
    });

    it('shows appropriate menu components for different screen sizes', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const menuPopover = screen.getByTestId('user-menu-popover');
      expect(menuPopover).toHaveClass('hidden', 'sm:block');
      
      const mobileMenu = screen.getByTestId('user-mobile-menu');
      expect(mobileMenu).toHaveClass('sm:hidden');
    });
  });

  describe('Layout Structure', () => {
    it('has correct layout classes', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('h-16', 'w-full', 'flex', 'items-center');
    });

    it('uses proper basis classes for layout sections', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const logoSection = screen.getByTestId('boombox-logo').closest('ul');
      expect(logoSection).toHaveClass('md:basis-1/2');
      
      const actionSection = screen.getByRole('button', { name: /access your existing storage units/i }).closest('ul');
      expect(actionSection).toHaveClass('md:basis-1/2');
    });
  });

  describe('Typography', () => {
    it('applies Inter font to buttons', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const accessButton = screen.getByRole('button', { name: /access your existing storage units/i });
      expect(accessButton.className).toMatch(/font-inter/);
      
      const addButton = screen.getByRole('button', { name: /add a new storage unit/i });
      expect(addButton.className).toMatch(/font-inter/);
    });

    it('applies proper text sizing and weights', () => {
      render(<UserNavbar userId={mockUserId} />);
      
      const accessButton = screen.getByRole('button', { name: /access your existing storage units/i });
      expect(accessButton).toHaveClass('font-semibold', 'text-sm');
      
      const addButton = screen.getByRole('button', { name: /add a new storage unit/i });
      expect(addButton).toHaveClass('font-semibold', 'text-sm');
    });
  });
});
