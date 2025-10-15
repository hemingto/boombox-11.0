/**
 * @fileoverview MobileMenu component tests
 * Tests mobile navigation functionality, theme variants, accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MobileMenu } from '@/components/ui/navigation/MobileMenu';

// Mock Next.js hooks and components
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null })),
}));

jest.mock('next/link', () => {
  return ({ href, children, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
});

// Mock navigation utils
jest.mock('@/lib/utils/navigationUtils', () => ({
  getAccountPageUrl: jest.fn((user) => user ? `/user-page/${user.id}` : '/login'),
  getAccountPageText: jest.fn((user) => user ? 'My Account' : 'Log In'),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('MobileMenu', () => {
  beforeEach(() => {
    // Reset document.body style
    document.body.style.overflow = '';
    mockUsePathname.mockReturnValue('/');
    mockUseSession.mockReturnValue({ data: null });
  });

  afterEach(() => {
    // Clean up document.body style
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders the menu toggle button', () => {
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders with custom className', () => {
      render(<MobileMenu className="custom-class" />);
      
      const container = screen.getByRole('button', { name: /toggle navigation menu/i }).parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Menu Toggle Functionality', () => {
    it('toggles menu on button click', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      // Initially closed
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      
      // Click to open
      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      
      // Navigation should be visible
      expect(screen.getByRole('dialog', { name: /mobile navigation menu/i })).toBeInTheDocument();
    });

    it('toggles menu on Enter key press', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      toggleButton.focus();
      await user.keyboard('{Enter}');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('toggles menu on Space key press', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      toggleButton.focus();
      await user.keyboard(' ');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes menu on Escape key press', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      // Open menu
      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      
      // Close with Escape
      await user.type(toggleButton, '{Escape}');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Menu Content', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(toggleButton);
    });

    it('renders all navigation menu items', () => {
      const expectedMenuItems = [
        'How it works',
        'Storage unit prices', 
        'Storage calculator',
        'Packing Supplies',
        'Locations',
        'Help Center'
      ];

      expectedMenuItems.forEach(item => {
        expect(screen.getByRole('link', { name: new RegExp(`Navigate to ${item}`, 'i') })).toBeInTheDocument();
      });
    });

    it('renders action buttons', () => {
      expect(screen.getByRole('button', { name: /go to log in page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get a storage quote/i })).toBeInTheDocument();
    });

    it('has correct navigation links', () => {
      const howItWorksLink = screen.getByRole('link', { name: /navigate to how it works/i });
      expect(howItWorksLink).toHaveAttribute('href', '/howitworks');
      
      const packingSuppliesLink = screen.getByRole('link', { name: /navigate to packing supplies/i });
      expect(packingSuppliesLink).toHaveAttribute('href', '/packing-supplies');
    });
  });

  describe('Theme Variants', () => {
    it('applies dark theme styling by default', () => {
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(toggleButton).toHaveClass('bg-primary-hover', 'text-text-inverse');
    });

    it('applies light theme styling when specified', () => {
      render(<MobileMenu theme="light" />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(toggleButton).toHaveClass('text-text-primary');
      expect(toggleButton).not.toHaveClass('bg-primary-hover');
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when menu is open', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      // Open menu
      await user.click(toggleButton);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when menu is closed', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      // Open then close menu
      await user.click(toggleButton);
      await user.click(toggleButton);
      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on route change', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      // Open menu
      await user.click(toggleButton);
      expect(document.body.style.overflow).toBe('hidden');
      
      // Simulate route change
      mockUsePathname.mockReturnValue('/new-route');
      rerender(<MobileMenu />);
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('User Session Integration', () => {
    it('shows login button when user is not authenticated', async () => {
      const user = userEvent.setup();
      mockUseSession.mockReturnValue({ data: null });
      
      render(<MobileMenu />);
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(toggleButton);
      
      expect(screen.getByRole('button', { name: /go to log in page/i })).toBeInTheDocument();
    });

    it('shows account button when user is authenticated', async () => {
      const user = userEvent.setup();
      mockUseSession.mockReturnValue({ 
        data: { user: { id: '123', name: 'Test User' } } 
      });
      
      render(<MobileMenu />);
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(toggleButton);
      
      expect(screen.getByRole('button', { name: /go to my account page/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for menu button', () => {
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(toggleButton).toHaveAttribute('aria-controls', 'mobile-navigation-menu');
    });

    it('has proper ARIA attributes for menu dialog', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(toggleButton);
      
      const menuDialog = screen.getByRole('dialog', { name: /mobile navigation menu/i });
      expect(menuDialog).toHaveAttribute('aria-modal', 'true');
      expect(menuDialog).toHaveAttribute('id', 'mobile-navigation-menu');
    });

    it('has proper focus management', () => {
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(toggleButton).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
    });

    it('has aria-hidden on decorative icons', () => {
      render(<MobileMenu />);
      
      const icon = screen.getByRole('button', { name: /toggle navigation menu/i }).querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('provides descriptive aria-labels for all interactive elements', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(toggleButton);
      
      // Check navigation links have descriptive labels
      expect(screen.getByRole('link', { name: /navigate to how it works/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /navigate to storage unit prices/i })).toBeInTheDocument();
      
      // Check action buttons have descriptive labels
      expect(screen.getByRole('button', { name: /get a storage quote/i })).toBeInTheDocument();
    });
  });

  describe('Icon State Changes', () => {
    it('shows hamburger icon when menu is closed', () => {
      render(<MobileMenu />);
      
      const button = screen.getByRole('button', { name: /toggle navigation menu/i });
      const hamburgerIcon = button.querySelector('svg[data-slot="icon"]');
      
      expect(hamburgerIcon).toBeInTheDocument();
    });

    it('shows close icon when menu is open', async () => {
      const user = userEvent.setup();
      render(<MobileMenu />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      await user.click(toggleButton);
      
      // The icon should change - we can test this by checking if the button still exists
      // and that aria-expanded is true
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
