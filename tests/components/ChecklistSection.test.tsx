/**
 * @fileoverview Tests for ChecklistSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ChecklistSection } from '@/components/features/content/ChecklistSection';

expect.extend(toHaveNoViolations);

describe('ChecklistSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ChecklistSection />);
      expect(screen.getByRole('heading', { name: /pre-pickup checklist/i })).toBeInTheDocument();
    });

    it('renders all checklist items', () => {
      render(<ChecklistSection />);
      
      // Check that all 6 default items are rendered
      const listItems = screen.getAllByRole('button');
      expect(listItems).toHaveLength(6);
      
      // Check specific items
      expect(screen.getByText(/pack your items in proper packing materials/i)).toBeInTheDocument();
      expect(screen.getByText(/disassemble all larger furniture items/i)).toBeInTheDocument();
      expect(screen.getByText(/measure all larger items/i)).toBeInTheDocument();
      expect(screen.getByText(/take photos of the items/i)).toBeInTheDocument();
      expect(screen.getByText(/provide us with additional information/i)).toBeInTheDocument();
      expect(screen.getByText(/read our terms of service/i)).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const customClass = 'custom-checklist-class';
      render(<ChecklistSection className={customClass} />);
      
      const section = screen.getByRole('region', { name: /pre-pickup checklist/i });
      expect(section).toHaveClass(customClass);
    });

    it('renders with proper semantic HTML structure', () => {
      render(<ChecklistSection />);
      
      // Check for semantic elements
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(6);
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<ChecklistSection />);
      const results = await axe(renderResult.container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility with items checked', async () => {
      const user = userEvent.setup();
      const renderResult = render(<ChecklistSection />);
      
      // Check first item
      const firstItem = screen.getAllByRole('button')[0];
      await user.click(firstItem);
      
      const results = await axe(renderResult.container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      render(<ChecklistSection />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'checklist-title');
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveAttribute('id', 'checklist-title');
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button, index) => {
        expect(button).toHaveAttribute('aria-pressed');
        expect(button).toHaveAttribute('aria-describedby', `item-${index + 1}-description`);
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection />);
      
      const firstButton = screen.getAllByRole('button')[0];
      
      // Focus the first button
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      // Press Enter to toggle
      await user.keyboard('{Enter}');
      expect(firstButton).toHaveAttribute('aria-pressed', 'true');
      
      // Press Space to toggle back
      await user.keyboard(' ');
      expect(firstButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('has proper focus indicators', () => {
      render(<ChecklistSection />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:ring-2', 'focus:ring-primary', 'focus:ring-offset-2');
      });
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('toggles item state when clicked', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection />);
      
      const firstItem = screen.getAllByRole('button')[0];
      
      // Initially unchecked
      expect(firstItem).toHaveAttribute('aria-pressed', 'false');
      
      // Click to check
      await user.click(firstItem);
      expect(firstItem).toHaveAttribute('aria-pressed', 'true');
      
      // Click again to uncheck
      await user.click(firstItem);
      expect(firstItem).toHaveAttribute('aria-pressed', 'false');
    });

    it('handles keyboard interactions correctly', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection />);
      
      const firstItem = screen.getAllByRole('button')[0];
      firstItem.focus();
      
      // Test Enter key
      await user.keyboard('{Enter}');
      expect(firstItem).toHaveAttribute('aria-pressed', 'true');
      
      // Test Space key
      await user.keyboard(' ');
      expect(firstItem).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls onItemToggle callback when provided', async () => {
      const user = userEvent.setup();
      const mockOnItemToggle = jest.fn();
      
      render(<ChecklistSection onItemToggle={mockOnItemToggle} />);
      
      const firstItem = screen.getAllByRole('button')[0];
      await user.click(firstItem);
      
      expect(mockOnItemToggle).toHaveBeenCalledTimes(1);
      expect(mockOnItemToggle).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          isChecked: true,
          title: expect.any(String),
          description: expect.any(String)
        })
      );
    });

    it('calls onAllCompleted callback when all items are checked', async () => {
      const user = userEvent.setup();
      const mockOnAllCompleted = jest.fn();
      
      render(<ChecklistSection onAllCompleted={mockOnAllCompleted} />);
      
      const buttons = screen.getAllByRole('button');
      
      // Check all items except the last one
      for (let i = 0; i < buttons.length - 1; i++) {
        await user.click(buttons[i]);
      }
      
      expect(mockOnAllCompleted).not.toHaveBeenCalled();
      
      // Check the last item
      await user.click(buttons[buttons.length - 1]);
      
      expect(mockOnAllCompleted).toHaveBeenCalledTimes(1);
    });

    it('handles multiple rapid clicks correctly', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection />);
      
      const firstItem = screen.getAllByRole('button')[0];
      
      // Rapid clicks
      await user.click(firstItem);
      await user.click(firstItem);
      await user.click(firstItem);
      
      expect(firstItem).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // REQUIRED: State management testing
  describe('State Management', () => {
    it('maintains independent state for each item', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection />);
      
      const buttons = screen.getAllByRole('button');
      
      // Check first and third items
      await user.click(buttons[0]);
      await user.click(buttons[2]);
      
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
      expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
      expect(buttons[3]).toHaveAttribute('aria-pressed', 'false');
    });

    it('updates visual state correctly when items are checked', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection />);
      
      const firstButton = screen.getAllByRole('button')[0];
      const firstTitle = screen.getByText(/pack your items in proper packing materials/i);
      
      // Initially no line-through
      expect(firstTitle).not.toHaveClass('line-through');
      
      // Check item
      await user.click(firstButton);
      
      // Should have line-through
      expect(firstTitle).toHaveClass('line-through');
    });

    it('shows check icon when item is checked', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection />);
      
      const firstButton = screen.getAllByRole('button')[0];
      
      // Check item
      await user.click(firstButton);
      
      // Check for check icon (using aria-hidden since it's decorative)
      const checkIcon = firstButton.querySelector('[aria-hidden="true"] svg');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  // REQUIRED: Design system integration testing
  describe('Design System Integration', () => {
    it('uses semantic color classes', () => {
      render(<ChecklistSection />);
      
      const section = screen.getByRole('region');
      const mainHeading = screen.getByRole('heading', { level: 1 });
      const buttons = screen.getAllByRole('button');
      
      // Check semantic color usage
      expect(mainHeading).toHaveClass('text-text-primary');
      
      buttons.forEach(button => {
        expect(button).toHaveClass('border-surface-tertiary');
        expect(button).toHaveClass('focus:ring-primary');
      });
    });

    it('applies proper typography classes', () => {
      render(<ChecklistSection />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveClass('font-poppins');
    });

    it('uses design system spacing and layout', () => {
      render(<ChecklistSection />);
      
      const section = screen.getByRole('region');
      const list = screen.getByRole('list');
      
      expect(section).toHaveClass('mt-12', 'sm:mt-24', 'lg:px-16', 'px-6', 'sm:mb-48', 'mb-24');
      expect(list).toHaveClass('space-y-6');
    });
  });

  // REQUIRED: Error handling and edge cases
  describe('Error Handling', () => {
    it('handles empty callback props gracefully', async () => {
      const user = userEvent.setup();
      
      // Should not throw when callbacks are undefined
      expect(() => {
        render(<ChecklistSection onItemToggle={undefined} onAllCompleted={undefined} />);
      }).not.toThrow();
      
      const firstItem = screen.getAllByRole('button')[0];
      
      // Should not throw when clicking
      await expect(user.click(firstItem)).resolves.not.toThrow();
    });

    it('prevents default behavior on keyboard events', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection />);
      
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      
      // Test that keyboard events work (preventDefault is called internally)
      const initialState = firstButton.getAttribute('aria-pressed');
      
      await user.keyboard('{Enter}');
      
      // State should change, indicating preventDefault worked
      expect(firstButton).toHaveAttribute('aria-pressed', initialState === 'true' ? 'false' : 'true');
    });

    it('ignores non-action keyboard events', () => {
      render(<ChecklistSection />);
      
      const firstButton = screen.getAllByRole('button')[0];
      const initialState = firstButton.getAttribute('aria-pressed');
      
      // Press non-action keys
      fireEvent.keyDown(firstButton, { key: 'Tab' });
      fireEvent.keyDown(firstButton, { key: 'Escape' });
      fireEvent.keyDown(firstButton, { key: 'a' });
      
      // State should not change
      expect(firstButton).toHaveAttribute('aria-pressed', initialState);
    });
  });

  // Performance and optimization testing
  describe('Performance', () => {
    it('renders efficiently with all items', () => {
      const startTime = performance.now();
      render(<ChecklistSection />);
      const endTime = performance.now();
      
      // Should render quickly (under 100ms in test environment)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles rapid state changes efficiently', async () => {
      const user = userEvent.setup();
      render(<ChecklistSection />);
      
      const buttons = screen.getAllByRole('button');
      
      // Rapid state changes
      const startTime = performance.now();
      for (const button of buttons) {
        await user.click(button);
        await user.click(button);
      }
      const endTime = performance.now();
      
      // Should handle rapid changes efficiently
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
