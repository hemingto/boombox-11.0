/**
 * @fileoverview Tests for ItemSelector component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemSelector } from '@/components/features/storage-calculator/ItemSelector';
import { useStorageStore } from '@/hooks/useStorageStore';

// Reset store before each test
beforeEach(() => {
  useStorageStore.getState().clearAll();
});

describe('ItemSelector', () => {
  describe('rendering', () => {
    it('should render the component with header', () => {
      render(<ItemSelector />);

      expect(screen.getByText('Add Items')).toBeInTheDocument();
    });

    it('should render category tabs', () => {
      render(<ItemSelector />);

      expect(screen.getByRole('tab', { name: /bedroom/i })).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /living room/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /kitchen/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /office/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /boxes/i })).toBeInTheDocument();
    });

    it('should default to bedroom category', () => {
      render(<ItemSelector />);

      // Should show bedroom items
      expect(screen.getByText('King Bed Frame')).toBeInTheDocument();
      expect(screen.getByText('Queen Bed Frame')).toBeInTheDocument();
    });

    it('should not show clear button when no items selected', () => {
      render(<ItemSelector />);

      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });
  });

  describe('category switching', () => {
    it('should switch categories when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);

      // Click on Kitchen tab
      await user.click(screen.getByRole('tab', { name: /kitchen/i }));

      // Should show kitchen items
      expect(screen.getByText('Refrigerator')).toBeInTheDocument();

      // Should not show bedroom items
      expect(screen.queryByText('King Bed Frame')).not.toBeInTheDocument();
    });

    it('should show boxes category items', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);

      await user.click(screen.getByRole('tab', { name: /boxes/i }));

      expect(screen.getByText('Small Box')).toBeInTheDocument();
      expect(screen.getByText('Medium Box')).toBeInTheDocument();
      expect(screen.getByText('Large Box')).toBeInTheDocument();
    });
  });

  describe('item selection', () => {
    it('should add item when plus button is clicked', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);

      // Find and click the add button for King Bed Frame
      const addButtons = screen.getAllByRole('button', { name: /add/i });
      await user.click(addButtons[0]);

      // Should show quantity
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show minus button after item is added', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);

      // Add an item
      const addButtons = screen.getAllByRole('button', { name: /add/i });
      await user.click(addButtons[0]);

      // Should have remove button
      expect(
        screen.getByRole('button', { name: /remove/i })
      ).toBeInTheDocument();
    });

    it('should increment quantity when plus is clicked again', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);

      // Add item first time
      const addButton = screen.getByRole('button', {
        name: /add king bed frame/i,
      });
      await user.click(addButton);

      // Now there's a quantity shown, find the add button again (now labeled "Add one")
      const addOneButton = screen.getByRole('button', {
        name: /add one king bed frame/i,
      });
      await user.click(addOneButton);

      // Should show quantity of 2
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should decrement quantity when minus is clicked', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);

      // Add item first
      const addButton = screen.getByRole('button', {
        name: /add king bed frame/i,
      });
      await user.click(addButton);

      // Add again
      const addOneButton = screen.getByRole('button', {
        name: /add one king bed frame/i,
      });
      await user.click(addOneButton);

      // Should have quantity 2
      expect(screen.getByText('2')).toBeInTheDocument();

      // Remove one
      const removeButton = screen.getByRole('button', {
        name: /remove one king bed frame/i,
      });
      await user.click(removeButton);

      // Should show quantity of 1
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should remove item completely when quantity reaches 0', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);

      // Add item
      const addButton = screen.getByRole('button', {
        name: /add king bed frame/i,
      });
      await user.click(addButton);

      // Remove it
      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      // Quantity display should be gone
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });

  describe('clear all', () => {
    it('should show clear button when items are selected', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);

      // Add an item
      const addButton = screen.getByRole('button', {
        name: /add king bed frame/i,
      });
      await user.click(addButton);

      // Clear button should appear
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('should clear all items when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);

      // Add items
      const addButtons = screen.getAllByRole('button', { name: /add/i });
      await user.click(addButtons[0]);
      await user.click(addButtons[1]);

      // Click clear all
      await user.click(screen.getByText('Clear all'));

      // All quantities should be gone
      const store = useStorageStore.getState();
      expect(store.getTotalItemCount()).toBe(0);
    });
  });

  describe('item card display', () => {
    it('should show item dimensions', () => {
      render(<ItemSelector />);

      // King bed dimensions: 80" × 10" × 76"
      expect(screen.getByText(/80" × 10" × 76"/)).toBeInTheDocument();
    });

    it('should show cubic feet', () => {
      render(<ItemSelector />);

      // Should show cu ft for items
      expect(screen.getAllByText(/cu ft/)[0]).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible tab roles', () => {
      render(<ItemSelector />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should have aria-selected on active tab', () => {
      render(<ItemSelector />);

      const bedroomTab = screen.getByRole('tab', { name: /bedroom/i });
      expect(bedroomTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have proper button labels', () => {
      render(<ItemSelector />);

      const addButton = screen.getByRole('button', {
        name: /add king bed frame/i,
      });
      expect(addButton).toBeInTheDocument();
    });
  });
});
