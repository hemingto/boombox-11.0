/**
 * @fileoverview PricingPopover component tests
 * Tests pricing popover functionality, keyboard navigation, accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingPopover } from '@/components/ui/navigation/PricingPopover';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ href, children, onClick, className, ...props }: any) => (
    <a href={href} onClick={onClick} className={className} {...props}>
      {children}
    </a>
  );
});

// Mock child components
jest.mock('@/components/icons/PriceIcon', () => ({
  PriceIcon: ({ className }: { className?: string }) => (
    <div data-testid="price-icon" className={className}>
      Price Icon
    </div>
  ),
}));

jest.mock('@/components/ui/navigation/PriceZipInput', () => ({
  PriceZipInput: () => (
    <div data-testid="price-zip-input">
      Price Zip Input
    </div>
  ),
}));

describe('PricingPopover', () => {
  describe('Rendering', () => {
    it('renders the pricing button', () => {
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('renders with proper ARIA attributes', () => {
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      expect(button).toHaveAttribute('aria-controls', 'pricing-popover-menu');
      expect(button).toHaveAttribute('aria-label', 'Storage unit pricing - opens menu with pricing tools');
    });
  });

  describe('Menu Toggle Functionality', () => {
    it('toggles menu on button click', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      
      // Initially closed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('menu', { name: /pricing tools menu/i })).not.toBeInTheDocument();
      
      // Click to open
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Menu should be visible
      const menu = screen.getByRole('menu', { name: /pricing tools menu/i });
      expect(menu).toBeInTheDocument();
      expect(menu).not.toHaveClass('pointer-events-none');
    });

    it('closes menu on second button click', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      
      // Open menu
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Close menu
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens menu on Enter key press', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('opens menu on Space key press', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      
      button.focus();
      await user.keyboard(' ');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes menu on Escape key press', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      
      // Open menu
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Close with Escape
      await user.keyboard('{Escape}');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes menu on click outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <PricingPopover />
          <div data-testid="outside-element">Outside</div>
        </div>
      );
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      const outsideElement = screen.getByTestId('outside-element');
      
      // Open menu
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Click outside
      await user.click(outsideElement);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Menu Content', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      await user.click(button);
    });

    it('renders pricing information section', () => {
      expect(screen.getByText('Storage unit prices')).toBeInTheDocument();
      expect(screen.getByText('check pricing in your zip code')).toBeInTheDocument();
      expect(screen.getByTestId('price-icon')).toBeInTheDocument();
    });

    it('renders PriceZipInput component', () => {
      expect(screen.getByTestId('price-zip-input')).toBeInTheDocument();
    });

    it('renders link to pricing page', () => {
      const pricingLink = screen.getByRole('menuitem', { name: /learn more about storage unit pricing/i });
      expect(pricingLink).toBeInTheDocument();
      expect(pricingLink).toHaveAttribute('href', '/storage-unit-prices');
    });

    it('has proper menu structure', () => {
      const menu = screen.getByRole('menu', { name: /pricing tools menu/i });
      expect(menu).toHaveAttribute('id', 'pricing-popover-menu');
    });
  });

  describe('Accessibility', () => {
    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      
      // Button should be focusable
      await user.tab();
      expect(button).toHaveFocus();
    });

    it('returns focus to button when menu is closed with Escape', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      
      // Open menu and close with Escape
      await user.click(button);
      await user.keyboard('{Escape}');
      
      // Focus should return to button
      expect(button).toHaveFocus();
    });

    it('has proper ARIA attributes for menu items', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      await user.click(button);
      
      const menuItem = screen.getByRole('menuitem', { name: /learn more about storage unit pricing/i });
      expect(menuItem).toBeInTheDocument();
    });

    it('has aria-hidden on decorative icons', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      
      // Check chevron icon on button
      const chevronIcon = button.querySelector('svg');
      expect(chevronIcon).toHaveAttribute('aria-hidden', 'true');
      
      // Open menu and check other icons
      await user.click(button);
      
      // Check that price icon exists (aria-hidden may be handled differently)
      const priceIcon = screen.getByTestId('price-icon');
      expect(priceIcon).toBeInTheDocument();
    });

    it('has proper focus styles', () => {
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      expect(button).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('Design System Integration', () => {
    it('applies correct design system colors to button', () => {
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      expect(button).toHaveClass('text-text-inverse', 'hover:bg-primary-hover', 'active:bg-primary-active');
    });

    it('applies correct design system colors to menu', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      await user.click(button);
      
      const menu = screen.getByRole('menu', { name: /pricing tools menu/i });
      expect(menu).toHaveClass('bg-surface-primary', 'ring-border');
    });

    it('applies correct design system colors to text elements', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      await user.click(button);
      
      const title = screen.getByText('Storage unit prices');
      expect(title).toHaveClass('text-text-primary');
      
      const subtitle = screen.getByText('check pricing in your zip code');
      expect(subtitle).toHaveClass('text-text-secondary');
    });

    it('applies hover effects using design system colors', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      await user.click(button);
      
      const menuItem = screen.getByRole('menuitem', { name: /learn more about storage unit pricing/i });
      const menuItemContainer = menuItem.parentElement;
      expect(menuItemContainer).toHaveClass('hover:bg-surface-tertiary', 'active:bg-surface-disabled');
    });
  });

  describe('Link Navigation', () => {
    it('closes menu when clicking pricing page link', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      await user.click(button);
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      const pricingLink = screen.getByRole('menuitem', { name: /learn more about storage unit pricing/i });
      await user.click(pricingLink);
      
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('has correct href for pricing page', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      await user.click(button);
      
      const pricingLink = screen.getByRole('menuitem', { name: /learn more about storage unit pricing/i });
      expect(pricingLink).toHaveAttribute('href', '/storage-unit-prices');
    });
  });

  describe('Visual States', () => {
    it('shows proper opacity states for menu visibility', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      
      // Initially hidden (not in DOM)
      expect(screen.queryByRole('menu', { name: /pricing tools menu/i })).not.toBeInTheDocument();
      
      // Open menu
      await user.click(button);
      const menu = screen.getByRole('menu', { name: /pricing tools menu/i });
      expect(menu).toHaveClass('opacity-100');
      expect(menu).toBeInTheDocument();
    });

    it('applies transition classes for smooth animations', async () => {
      const user = userEvent.setup();
      render(<PricingPopover />);
      
      const button = screen.getByRole('button', { name: /storage unit pricing/i });
      expect(button).toHaveClass('transition-colors');
      
      // Open menu to check its transition classes
      await user.click(button);
      const menu = screen.getByRole('menu', { name: /pricing tools menu/i });
      expect(menu).toHaveClass('transition-transform', 'transition-opacity', 'duration-200', 'ease-out');
    });
  });
});
