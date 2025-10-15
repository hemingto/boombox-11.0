/**
 * @fileoverview Tests for LocationsPopover component
 * Tests dropdown functionality, keyboard navigation, accessibility, and city data integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationsPopover } from '@/components/ui/navigation/LocationsPopover';
import { SERVED_CITIES } from '@/data/locations';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock LocationZipInput component
jest.mock('@/components/ui/navigation/LocationZipInput', () => ({
  LocationZipInput: () => <div data-testid="location-zip-input">Zip Input Component</div>
}));

// Mock MapIcon
jest.mock('@/components/icons/MapIcon', () => ({
  MapIcon: ({ className, ...props }: any) => (
    <div data-testid="map-icon" className={className} {...props}>
      Map Icon
    </div>
  )
}));

describe('LocationsPopover', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders the locations button', () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Locations');
    });

    it('toggles dropdown menu on button click', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      
      // Menu should be closed initially (has opacity-0 and pointer-events-none)
      const menu = screen.queryByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('opacity-0', 'pointer-events-none');
      
      // Open menu
      await user.click(button);
      expect(screen.getByRole('menu')).toBeVisible();
      
      // Close menu
      await user.click(button);
      await waitFor(() => {
        const menu = screen.queryByRole('menu');
        expect(menu).toHaveClass('opacity-0', 'pointer-events-none');
      });
    });

    it('displays all served cities in the dropdown', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      // Check that all cities from data are rendered
      SERVED_CITIES.forEach(city => {
        expect(screen.getByText(city.name)).toBeInTheDocument();
      });
    });

    it('includes the zip input component', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      expect(screen.getByTestId('location-zip-input')).toBeInTheDocument();
    });

    it('includes the full locations list link', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      const fullListLink = screen.getByRole('menuitem', { name: /view complete list/i });
      expect(fullListLink).toBeInTheDocument();
      expect(fullListLink).toHaveAttribute('href', '/locations');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on button', () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'locations-menu');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('updates aria-expanded when menu opens/closes', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      
      // Initially closed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      // Open menu
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Close menu
      await user.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('has proper menu role and aria-label', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-label', 'Storage locations menu');
      expect(menu).toHaveAttribute('id', 'locations-menu');
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes menu on Escape key', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      expect(screen.getByRole('menu')).toBeVisible();
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        const menu = screen.queryByRole('menu');
        expect(menu).toHaveClass('opacity-0', 'pointer-events-none');
      });
      
      // Focus should return to button
      expect(button).toHaveFocus();
    });

    it('navigates through menu items with arrow keys', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      // Arrow down should focus first city
      await user.keyboard('{ArrowDown}');
      
      const firstCityLink = screen.getByRole('menuitem', { name: new RegExp(`Storage in ${SERVED_CITIES[0].city}`, 'i') });
      expect(firstCityLink).toHaveFocus();
      
      // Arrow down again should focus second city
      await user.keyboard('{ArrowDown}');
      
      const secondCityLink = screen.getByRole('menuitem', { name: new RegExp(SERVED_CITIES[1].city, 'i') });
      expect(secondCityLink).toHaveFocus();
    });
  });

  describe('Mouse Interactions', () => {
    it('closes menu when clicking outside', async () => {
      render(
        <div>
          <LocationsPopover />
          <div data-testid="outside-element">Outside</div>
        </div>
      );
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      expect(screen.getByRole('menu')).toBeVisible();
      
      // Click outside
      const outsideElement = screen.getByTestId('outside-element');
      await user.click(outsideElement);
      
      await waitFor(() => {
        const menu = screen.queryByRole('menu');
        expect(menu).toHaveClass('opacity-0', 'pointer-events-none');
      });
    });

    it('closes menu when clicking a city link', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      const firstCityLink = screen.getByRole('menuitem', { name: new RegExp(`Storage in ${SERVED_CITIES[0].city}`, 'i') });
      await user.click(firstCityLink);
      
      await waitFor(() => {
        const menu = screen.queryByRole('menu');
        expect(menu).toHaveClass('opacity-0', 'pointer-events-none');
      });
    });
  });

  describe('Data Integration', () => {
    it('renders correct href for each city', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      SERVED_CITIES.forEach(city => {
        const cityLink = screen.getByRole('menuitem', { name: new RegExp(`Storage in ${city.city}`, 'i') });
        expect(cityLink).toHaveAttribute('href', city.href);
      });
    });

    it('uses memoized cities data for performance', () => {
      const { rerender } = render(<LocationsPopover />);
      
      // Rerender shouldn't cause issues with memoized data
      rerender(<LocationsPopover />);
      
      expect(screen.getByRole('button', { name: /select storage location/i })).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('applies correct opacity classes based on open state', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      
      // Initially closed
      const menu = screen.getByRole('menu', { hidden: true });
      expect(menu).toHaveClass('opacity-0', 'pointer-events-none');
      
      // Open menu
      await user.click(button);
      expect(menu).toHaveClass('opacity-100');
      expect(menu).not.toHaveClass('pointer-events-none');
    });

    it('applies responsive grid classes', async () => {
      render(<LocationsPopover />);
      
      const button = screen.getByRole('button', { name: /select storage location/i });
      await user.click(button);
      
      const cityGrid = screen.getByRole('menu').querySelector('.grid');
      expect(cityGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });
});
