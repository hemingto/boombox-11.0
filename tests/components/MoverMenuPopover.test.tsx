/**
 * @fileoverview MoverMenuPopover component tests
 * Tests mover/driver menu dropdown functionality, logout behavior, accessibility, and user type support
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { MoverMenuPopover } from '@/components/ui/navigation/MoverMenuPopover';

// Mock Next.js and auth
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ href, children, className, onClick, ...props }: any) => (
    <a href={href} className={className} onClick={onClick} {...props}>
      {children}
    </a>
  );
});

const mockPush = jest.fn();
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('MoverMenuPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockSignOut.mockResolvedValue(undefined);
  });

  describe('Rendering with Driver Type', () => {
    it('renders with required props for driver', () => {
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders driver menu items when opened', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
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
        expect(screen.getByRole('menuitem', { name: new RegExp(`Navigate to ${item}`, 'i') })).toBeInTheDocument();
      });
      
      expect(screen.getByRole('menuitem', { name: /log out of your account/i })).toBeInTheDocument();
    });

    it('has correct driver menu links', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      await user.click(button);
      
      const homeLink = screen.getByRole('menuitem', { name: /navigate to home/i });
      expect(homeLink).toHaveAttribute('href', '/driver-account-page/123');
      
      const calendarLink = screen.getByRole('menuitem', { name: /navigate to calendar/i });
      expect(calendarLink).toHaveAttribute('href', '/driver-account-page/123/calendar');
    });
  });

  describe('Rendering with Mover Type', () => {
    it('renders with required props for mover', () => {
      render(<MoverMenuPopover userType="mover" userId="456" />);
      
      const button = screen.getByRole('button', { name: /toggle mover account menu/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('has correct mover menu links', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="mover" userId="456" />);
      
      const button = screen.getByRole('button', { name: /toggle mover account menu/i });
      await user.click(button);
      
      const homeLink = screen.getByRole('menuitem', { name: /navigate to home/i });
      expect(homeLink).toHaveAttribute('href', '/mover-account-page/456');
      
      const paymentLink = screen.getByRole('menuitem', { name: /navigate to payment/i });
      expect(paymentLink).toHaveAttribute('href', '/mover-account-page/456/payment');
    });
  });

  describe('Menu Toggle Functionality', () => {
    it('toggles menu on button click', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      
      // Initially closed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      // Click to open
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      const menu = screen.getByRole('menu', { name: /driver account menu/i });
      expect(menu).toBeInTheDocument();
    });

    it('opens menu on Enter key press', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes menu on Escape key press', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      
      // Open menu
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Close with Escape
      await user.type(button, '{Escape}');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Theme Variants', () => {
    it('applies dark theme styling by default', () => {
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      expect(button).toHaveClass('text-text-inverse', 'hover:bg-primary-hover');
    });

    it('applies light theme styling when specified', () => {
      render(<MoverMenuPopover userType="driver" userId="123" theme="light" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      expect(button).toHaveClass('text-text-primary', 'hover:bg-surface-tertiary');
    });
  });

  describe('Logout Functionality', () => {
    it('handles logout successfully', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      await user.click(button);
      
      const logoutButton = screen.getByRole('menuitem', { name: /log out of your account/i });
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
      
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      await user.click(button);
      
      const logoutButton = screen.getByRole('menuitem', { name: /log out of your account/i });
      await user.click(logoutButton);
      
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
      expect(logoutButton).toBeDisabled();
      
      resolveSignOut!();
      await waitFor(() => {
        expect(screen.queryByText('Logging out...')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for driver', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      expect(button).toHaveAttribute('aria-controls', 'mover-popover-menu');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
      
      await user.click(button);
      
      const menu = screen.getByRole('menu', { name: /driver account menu/i });
      expect(menu).toHaveAttribute('id', 'mover-popover-menu');
    });

    it('has proper ARIA attributes for mover', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="mover" userId="456" />);
      
      const button = screen.getByRole('button', { name: /toggle mover account menu/i });
      await user.click(button);
      
      const menu = screen.getByRole('menu', { name: /mover account menu/i });
      expect(menu).toBeInTheDocument();
    });

    it('manages focus properly', () => {
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      expect(button).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
    });

    it('closes menu when menu item is clicked', async () => {
      const user = userEvent.setup();
      render(<MoverMenuPopover userType="driver" userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle driver account menu/i });
      await user.click(button);
      
      const homeLink = screen.getByRole('menuitem', { name: /navigate to home/i });
      await user.click(homeLink);
      
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
