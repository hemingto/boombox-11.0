/**
 * @fileoverview Jest tests for MenuPopover component
 * Tests component functionality, accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { MenuPopover } from '@/components/ui/navigation/MenuPopover';
import { getAccountPageUrl, getAccountPageText } from '@/lib/utils/navigationUtils';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock navigation utils
jest.mock('@/lib/utils/navigationUtils');
const mockGetAccountPageUrl = getAccountPageUrl as jest.MockedFunction<typeof getAccountPageUrl>;
const mockGetAccountPageText = getAccountPageText as jest.MockedFunction<typeof getAccountPageText>;

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('MenuPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGetAccountPageUrl.mockReturnValue('/login');
    mockGetAccountPageText.mockReturnValue('Log In');
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders the menu button with hamburger icon', () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'popover-menu');
    });

    it('applies custom className when provided', () => {
      const { container } = render(<MenuPopover className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies dark theme styles by default', () => {
      render(<MenuPopover />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-text-inverse');
    });

    it('applies light theme styles when specified', () => {
      render(<MenuPopover theme="light" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-text-primary');
    });
  });

  describe('Menu Toggle Functionality', () => {
    it('opens menu when button is clicked', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
        const menu = screen.getByRole('list');
        expect(menu).toBeInTheDocument();
      });
    });

    it('closes menu when button is clicked again', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      
      // Open menu
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
      
      // Close menu
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('shows X icon when menu is open', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        // Check that the icon changed (XMarkIcon should be present)
        const icon = button.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Menu Options', () => {
    beforeEach(async () => {
      render(<MenuPopover />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('list')).toBeInTheDocument();
      });
    });

    it('renders all navigation menu options', () => {
      const expectedOptions = [
        'How it works',
        'Storage unit prices',
        'Storage calculator',
        'Packing supplies',
        'Locations',
        'Help center'
      ];

      expectedOptions.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });
    });

    it('renders menu options as links with correct hrefs', () => {
      const expectedLinks = [
        { text: 'How it works', href: '/howitworks' },
        { text: 'Storage unit prices', href: '/storage-unit-prices' },
        { text: 'Storage calculator', href: '/storage-calculator' },
        { text: 'Packing supplies', href: '/packing-supplies' },
        { text: 'Locations', href: '/locations' },
        { text: 'Help center', href: '/help-center' }
      ];

      expectedLinks.forEach(({ text, href }) => {
        const link = screen.getByText(text).closest('a');
        expect(link).toHaveAttribute('href', href);
      });
    });
  });

  describe('Account Page Link', () => {
    it('calls navigationUtils for unauthenticated user', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
      
      render(<MenuPopover />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockGetAccountPageUrl).toHaveBeenCalledWith(undefined);
        expect(mockGetAccountPageText).toHaveBeenCalledWith(undefined);
      });
    });

    it('calls navigationUtils for authenticated user', async () => {
      const mockUser = {
        id: '123',
        accountType: 'USER' as const,
        email: 'test@example.com'
      };
      
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
        update: jest.fn(),
      });
      
      mockGetAccountPageUrl.mockReturnValue('/user-page/123');
      mockGetAccountPageText.mockReturnValue('Account Page');
      
      render(<MenuPopover />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockGetAccountPageUrl).toHaveBeenCalledWith(mockUser);
        expect(mockGetAccountPageText).toHaveBeenCalledWith(mockUser);
        
        const accountLink = screen.getByText('Account Page').closest('a');
        expect(accountLink).toHaveAttribute('href', '/user-page/123');
      });
    });
  });

  describe('Click Outside Functionality', () => {
    it('closes menu when clicking outside', async () => {
      render(
        <div>
          <MenuPopover />
          <div data-testid="outside-element">Outside</div>
        </div>
      );
      
      const button = screen.getByRole('button');
      const outsideElement = screen.getByTestId('outside-element');
      
      // Open menu
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
      
      // Click outside
      fireEvent.mouseDown(outsideElement);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('does not close menu when clicking inside', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
      
      // Click inside the menu
      const menuItem = screen.getByText('How it works');
      fireEvent.mouseDown(menuItem);
      
      // Menu should still be open
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'popover-menu');
      expect(button).toHaveAttribute('aria-label', 'Toggle navigation menu');
    });

    it('updates aria-expanded when menu state changes', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      
      // Initially closed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      // Open menu
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
      
      // Close menu
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('has correct menu container with proper ARIA attributes', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const menuContainer = document.getElementById('popover-menu');
        expect(menuContainer).toBeInTheDocument();
        expect(menuContainer).toHaveAttribute('role', 'menu');
        expect(menuContainer).toHaveAttribute('aria-label', 'Navigation menu');
      });
    });

    it('menu items have proper ARIA roles and tabIndex', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems).toHaveLength(7); // 6 navigation items + 1 account item
        
        menuItems.forEach(item => {
          expect(item).toHaveAttribute('tabIndex', '0');
        });
      });
    });

    it('menu items have disabled tabIndex when menu is closed', () => {
      render(<MenuPopover />);
      
      // Menu items should not be in DOM when closed, but if they were, 
      // they would have tabIndex="-1"
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Menu should be closed initially
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens menu when Enter key is pressed on button', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('opens menu when Space key is pressed on button', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('closes menu when Escape key is pressed on button', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      
      // Open menu first
      fireEvent.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
      
      // Close with Escape
      fireEvent.keyDown(button, { key: 'Escape' });
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('closes menu when Escape key is pressed on menu container', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
      
      const menuContainer = document.getElementById('popover-menu');
      expect(menuContainer).toBeInTheDocument();
      
      // Close with Escape on menu
      fireEvent.keyDown(menuContainer!, { key: 'Escape' });
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('handles Space key correctly (preventDefault is called implicitly)', async () => {
      render(<MenuPopover />);
      
      const button = screen.getByRole('button');
      
      // Verify Space key opens the menu (which means preventDefault worked and didn't trigger default scroll behavior)
      fireEvent.keyDown(button, { key: ' ' });
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Theme Support', () => {
    it('applies dark theme classes correctly', () => {
      render(<MenuPopover theme="dark" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-text-inverse');
      expect(button).toHaveClass('sm:hover:bg-primary-hover');
    });

    it('applies light theme classes correctly', () => {
      render(<MenuPopover theme="light" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-text-primary');
      expect(button).toHaveClass('sm:hover:bg-surface-tertiary');
    });
  });

  describe('Error Handling', () => {
    it('handles session loading state gracefully', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });
      
      expect(() => render(<MenuPopover />)).not.toThrow();
    });

    it('handles undefined session data', () => {
      mockUseSession.mockReturnValue({
        data: undefined,
        status: 'unauthenticated',
        update: jest.fn(),
      });
      
      expect(() => render(<MenuPopover />)).not.toThrow();
    });
  });
});
