/**
 * @fileoverview MoverMobileMenu component tests
 * Tests mover/driver mobile navigation functionality, logout behavior, accessibility, and responsive design
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { MoverMobileMenu } from '@/components/ui/navigation/MoverMobileMenu';

// Mock Next.js and auth
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ href, children, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
});

const mockPush = jest.fn();
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('MoverMobileMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockSignOut.mockResolvedValue(undefined);
    mockUsePathname.mockReturnValue('/');
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Rendering with Driver Type', () => {
    it('renders with required props for driver', () => {
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders driver menu items when opened', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      await user.click(button);
      
      const expectedMenuItems = [
        'Home',
        'Calendar',
        'Coverage area',
        'Account information',
        'Payment',
        'Best practices'
      ];
      
      expectedMenuItems.forEach(item => {
        expect(screen.getByRole('link', { name: new RegExp(`Navigate to ${item}`, 'i') })).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /log out of your account/i })).toBeInTheDocument();
    });

    it('has correct driver menu links', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      await user.click(button);
      
      const homeLink = screen.getByRole('link', { name: /navigate to home/i });
      expect(homeLink).toHaveAttribute('href', '/driver-account-page/123');
      
      const calendarLink = screen.getByRole('link', { name: /navigate to calendar/i });
      expect(calendarLink).toHaveAttribute('href', '/driver-account-page/123/calendar');
    });
  });

  describe('Rendering with Mover Type', () => {
    it('renders with required props for mover', () => {
      render(<MoverMobileMenu userType="mover" userId="456" />);
      
      const button = screen.getByRole('button', { name: /toggle mover navigation menu/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('has correct mover menu links', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="mover" userId="456" />);
      
      const button = screen.getByRole('button', { name: /toggle mover navigation menu/i });
      await user.click(button);
      
      const homeLink = screen.getByRole('link', { name: /navigate to home/i });
      expect(homeLink).toHaveAttribute('href', '/mover-account-page/456');
      
      const paymentLink = screen.getByRole('link', { name: /navigate to payment/i });
      expect(paymentLink).toHaveAttribute('href', '/mover-account-page/456/payment');
    });

    it('has correct aria-label for mover', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="mover" userId="456" />);
      
      const button = screen.getByRole('button', { name: /toggle mover navigation menu/i });
      await user.click(button);
      
      const menu = screen.getByRole('dialog', { name: /mover mobile navigation menu/i });
      expect(menu).toBeInTheDocument();
      
      const nav = screen.getByRole('navigation', { name: /mover mobile navigation/i });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when menu is open', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      await user.click(button);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      await user.click(button);
      await user.click(button);
      
      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on route change', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      
      // Open menu
      await user.click(button);
      expect(document.body.style.overflow).toBe('hidden');
      
      // Simulate route change
      mockUsePathname.mockReturnValue('/new-route');
      rerender(<MoverMobileMenu userType="driver" userId="123" />);
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Theme Variants', () => {
    it('applies dark theme styling by default', () => {
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      expect(button).toHaveClass('bg-primary-hover', 'text-text-inverse');
    });

    it('applies light theme styling when specified', () => {
      render(<MoverMobileMenu userType="driver" userId="123" theme="light" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      expect(button).toHaveClass('text-text-primary');
      expect(button).not.toHaveClass('bg-primary-hover');
    });
  });

  describe('Logout Functionality', () => {
    it('handles logout successfully', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      await user.click(toggleButton);
      
      const logoutButton = screen.getByRole('button', { name: /log out of your account/i });
      await user.click(logoutButton);
      
      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('shows loading state during logout', async () => {
      const user = userEvent.setup();
      
      let resolveSignOut: () => void;
      const signOutPromise = new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      });
      mockSignOut.mockReturnValue(signOutPromise);
      
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      await user.click(toggleButton);
      
      const logoutButton = screen.getByRole('button', { name: /log out of your account/i });
      await user.click(logoutButton);
      
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
      expect(logoutButton).toBeDisabled();
      
      resolveSignOut!();
      await waitFor(() => {
        expect(screen.queryByText('Logging out...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for driver', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      expect(button).toHaveAttribute('aria-controls', 'mover-mobile-navigation-menu');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(button);
      
      const menu = screen.getByRole('dialog', { name: /driver mobile navigation menu/i });
      expect(menu).toHaveAttribute('aria-modal', 'true');
      expect(menu).toHaveAttribute('id', 'mover-mobile-navigation-menu');
    });

    it('has proper ARIA attributes for mover', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="mover" userId="456" />);
      
      const button = screen.getByRole('button', { name: /toggle mover navigation menu/i });
      await user.click(button);
      
      const menu = screen.getByRole('dialog', { name: /mover mobile navigation menu/i });
      expect(menu).toBeInTheDocument();
    });

    it('has proper focus management', () => {
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      expect(button).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
    });

    it('has aria-hidden on decorative icons', () => {
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const icon = screen.getByRole('button', { name: /toggle driver navigation menu/i }).querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Design System Integration', () => {
    it('applies correct design system colors', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      await user.click(button);
      
      const menu = screen.getByRole('dialog', { name: /driver mobile navigation menu/i });
      expect(menu).toHaveClass('bg-surface-primary');
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('text-text-primary');
    });

    it('applies hover effects using design system colors', async () => {
      const user = userEvent.setup();
      render(<MoverMobileMenu userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver navigation menu/i });
      await user.click(button);
      
      const homeLink = screen.getByRole('link', { name: /navigate to home/i });
      expect(homeLink).toHaveClass('hover:bg-surface-tertiary');
      
      const logoutButton = screen.getByRole('button', { name: /log out of your account/i });
      expect(logoutButton).toHaveClass('border-primary', 'bg-surface-primary', 'text-text-primary');
    });
  });
});
