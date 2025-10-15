/**
 * @fileoverview UserMenuPopover component tests
 * Tests user menu dropdown functionality, logout behavior, accessibility, and navigation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { UserMenuPopover } from '@/components/ui/navigation/UserMenuPopover';

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

describe('UserMenuPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockSignOut.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders with required userId prop', () => {
      render(<UserMenuPopover userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user account menu/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders menu items when opened', async () => {
      const user = userEvent.setup();
      render(<UserMenuPopover userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user account menu/i });
      await user.click(button);
      
      const expectedMenuItems = [
        'Home',
        'Add storage unit',
        'Access storage',
        'Packing supplies', 
        'Payments',
        'Account info'
      ];
      
      expectedMenuItems.forEach(item => {
        expect(screen.getByRole('menuitem', { name: new RegExp(`Navigate to ${item}`, 'i') })).toBeInTheDocument();
      });
      
      expect(screen.getByRole('menuitem', { name: /log out of your account/i })).toBeInTheDocument();
    });
  });

  describe('Theme Variants', () => {
    it('applies dark theme styling by default', () => {
      render(<UserMenuPopover userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user account menu/i });
      expect(button).toHaveClass('text-text-inverse', 'hover:bg-primary-hover');
    });

    it('applies light theme styling when specified', () => {
      render(<UserMenuPopover userId="123" theme="light" />);
      
      const button = screen.getByRole('button', { name: /toggle user account menu/i });
      expect(button).toHaveClass('text-text-primary', 'hover:bg-surface-tertiary');
    });
  });

  describe('Logout Functionality', () => {
    it('handles logout successfully', async () => {
      const user = userEvent.setup();
      render(<UserMenuPopover userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user account menu/i });
      await user.click(button);
      
      const logoutButton = screen.getByRole('menuitem', { name: /log out of your account/i });
      await user.click(logoutButton);
      
      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('shows loading state during logout', async () => {
      const user = userEvent.setup();
      
      // Mock signOut to return a promise we can control
      let resolveSignOut: () => void;
      const signOutPromise = new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      });
      mockSignOut.mockReturnValue(signOutPromise);
      
      render(<UserMenuPopover userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user account menu/i });
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
    it('has proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<UserMenuPopover userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user account menu/i });
      expect(button).toHaveAttribute('aria-controls', 'user-popover-menu');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
      
      await user.click(button);
      
      const menu = screen.getByRole('menu', { name: /user account menu/i });
      expect(menu).toHaveAttribute('id', 'user-popover-menu');
    });

    it('manages focus properly', () => {
      render(<UserMenuPopover userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user account menu/i });
      expect(button).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
    });
  });
});
