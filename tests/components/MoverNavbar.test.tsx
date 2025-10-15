/**
 * @fileoverview MoverNavbar component tests
 * Tests mover/driver navigation functionality, theme variants, user type support, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MoverNavbar } from '@/components/ui/navigation/MoverNavbar';

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

jest.mock('@/components/ui/navigation/MoverMenuPopover', () => ({
  MoverMenuPopover: ({ className, theme, userType, userId }: { className?: string; theme?: string; userType: string; userId: string }) => (
    <div data-testid="mover-menu-popover" className={className} data-theme={theme} data-user-type={userType} data-user-id={userId}>
      Mover Menu Popover
    </div>
  ),
}));

jest.mock('@/components/ui/navigation/MoverMobileMenu', () => ({
  MoverMobileMenu: ({ className, theme, userType, userId }: { className?: string; theme?: string; userType: string; userId: string }) => (
    <div data-testid="mover-mobile-menu" className={className} data-theme={theme} data-user-type={userType} data-user-id={userId}>
      Mover Mobile Menu
    </div>
  ),
}));

const mockUserId = '456';

describe('MoverNavbar', () => {
  describe('Rendering with Driver Type', () => {
    it('renders with required props for driver', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('boombox-logo')).toBeInTheDocument();
    });

    it('has correct navigation aria-label for driver', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Driver account navigation');
    });

    it('links to correct driver dashboard', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      const homeLink = screen.getByRole('link', { name: /go to driver dashboard home/i });
      expect(homeLink).toHaveAttribute('href', `/driver-account-page/${mockUserId}`);
    });
  });

  describe('Rendering with Mover Type', () => {
    it('renders with required props for mover', () => {
      render(<MoverNavbar userType="mover" userId={mockUserId} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('boombox-logo')).toBeInTheDocument();
    });

    it('has correct navigation aria-label for mover', () => {
      render(<MoverNavbar userType="mover" userId={mockUserId} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Mover account navigation');
    });

    it('links to correct mover dashboard', () => {
      render(<MoverNavbar userType="mover" userId={mockUserId} />);
      
      const homeLink = screen.getByRole('link', { name: /go to mover dashboard home/i });
      expect(homeLink).toHaveAttribute('href', `/mover-account-page/${mockUserId}`);
    });
  });

  describe('Theme Variants', () => {
    it('applies dark theme styling by default', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-primary');
      
      const logo = screen.getByTestId('boombox-logo');
      expect(logo).toHaveClass('text-text-inverse');
    });

    it('applies light theme styling when specified', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} theme="light" />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-surface-primary', 'border-b', 'border-border');
      
      const logo = screen.getByTestId('boombox-logo');
      expect(logo).toHaveClass('text-primary');
    });

    it('passes theme to child components', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} theme="light" />);
      
      expect(screen.getByTestId('mover-menu-popover')).toHaveAttribute('data-theme', 'light');
      expect(screen.getByTestId('mover-mobile-menu')).toHaveAttribute('data-theme', 'light');
    });
  });

  describe('Child Component Props', () => {
    it('passes correct props to child components for driver', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} theme="dark" />);
      
      const menuPopover = screen.getByTestId('mover-menu-popover');
      expect(menuPopover).toHaveAttribute('data-user-type', 'driver');
      expect(menuPopover).toHaveAttribute('data-user-id', mockUserId);
      expect(menuPopover).toHaveAttribute('data-theme', 'dark');
      
      const mobileMenu = screen.getByTestId('mover-mobile-menu');
      expect(mobileMenu).toHaveAttribute('data-user-type', 'driver');
      expect(mobileMenu).toHaveAttribute('data-user-id', mockUserId);
      expect(mobileMenu).toHaveAttribute('data-theme', 'dark');
    });

    it('passes correct props to child components for mover', () => {
      render(<MoverNavbar userType="mover" userId={mockUserId} theme="light" />);
      
      const menuPopover = screen.getByTestId('mover-menu-popover');
      expect(menuPopover).toHaveAttribute('data-user-type', 'mover');
      expect(menuPopover).toHaveAttribute('data-user-id', mockUserId);
      expect(menuPopover).toHaveAttribute('data-theme', 'light');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA landmarks and labels', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Driver account navigation');
    });

    it('has descriptive ARIA label for home link', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      expect(screen.getByRole('link', { name: /go to driver dashboard home/i })).toBeInTheDocument();
    });

    it('has proper focus styles', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      const homeLink = screen.getByRole('link', { name: /go to driver dashboard home/i });
      expect(homeLink).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('Responsive Design', () => {
    it('shows appropriate menu components for different screen sizes', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      const menuPopover = screen.getByTestId('mover-menu-popover');
      expect(menuPopover).toHaveClass('hidden', 'sm:block');
      
      const mobileMenu = screen.getByTestId('mover-mobile-menu');
      expect(mobileMenu).toHaveClass('sm:hidden');
    });
  });

  describe('Layout Structure', () => {
    it('has correct layout classes', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('h-16', 'w-full', 'flex', 'items-center');
    });

    it('uses proper basis classes for layout sections', () => {
      render(<MoverNavbar userType="driver" userId={mockUserId} />);
      
      const logoSection = screen.getByTestId('boombox-logo').closest('ul');
      expect(logoSection).toHaveClass('md:basis-1/2');
    });
  });
});
