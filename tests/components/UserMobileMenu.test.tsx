/**
 * @fileoverview UserMobileMenu component tests
 * Tests user mobile navigation functionality, logout behavior, accessibility, and responsive design
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { UserMobileMenu } from '@/components/ui/navigation/UserMobileMenu';

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

describe('UserMobileMenu', () => {
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

  describe('Rendering', () => {
    it('renders with required userId prop', () => {
      render(<UserMobileMenu userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user navigation menu/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders menu items when opened', async () => {
      const user = userEvent.setup();
      render(<UserMobileMenu userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user navigation menu/i });
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
        expect(screen.getByRole('link', { name: new RegExp(`Navigate to ${item}`, 'i') })).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /log out of your account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add a new storage unit/i })).toBeInTheDocument();
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when menu is open', async () => {
      const user = userEvent.setup();
      render(<UserMobileMenu userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user navigation menu/i });
      await user.click(button);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', async () => {
      const user = userEvent.setup();
      render(<UserMobileMenu userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user navigation menu/i });
      await user.click(button);
      await user.click(button);
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Logout Functionality', () => {
    it('handles logout successfully', async () => {
      const user = userEvent.setup();
      render(<UserMobileMenu userId="123" />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle user navigation menu/i });
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
      
      render(<UserMobileMenu userId="123" />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle user navigation menu/i });
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
    it('has proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<UserMobileMenu userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user navigation menu/i });
      expect(button).toHaveAttribute('aria-controls', 'user-mobile-navigation-menu');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(button);
      
      const menu = screen.getByRole('dialog', { name: /user mobile navigation menu/i });
      expect(menu).toHaveAttribute('aria-modal', 'true');
      expect(menu).toHaveAttribute('id', 'user-mobile-navigation-menu');
    });

    it('has proper focus management', () => {
      render(<UserMobileMenu userId="123" />);
      
      const button = screen.getByRole('button', { name: /toggle user navigation menu/i });
      expect(button).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
    });
  });
});
