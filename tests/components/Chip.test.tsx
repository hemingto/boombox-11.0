/**
 * @fileoverview Jest tests for Chip component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from '@/components/ui/primitives/Chip';

describe('Chip Component', () => {
  describe('Basic Rendering', () => {
    it('renders with required label prop', () => {
      render(<Chip label="Test Chip" />);
      
      expect(screen.getByText('Test Chip')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies default variant and size classes', () => {
      render(<Chip label="Default" />);
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('bg-surface-tertiary', 'text-text-primary');
      expect(chip).toHaveClass('px-4', 'py-2', 'text-sm'); // medium size
    });

    it('renders with custom className', () => {
      render(<Chip label="Custom" className="custom-class" />);
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('custom-class');
    });

    it('has proper display name', () => {
      expect(Chip.displayName).toBe('Chip');
    });
  });

  describe('Variants', () => {
    it.each([
      ['default', 'bg-surface-tertiary'],
      ['primary', 'bg-primary'],
      ['secondary', 'bg-surface-secondary'],
      ['outline', 'bg-transparent'],
    ])('applies correct class for %s variant', (variant, expectedClass) => {
      render(<Chip label="Test" variant={variant as any} />);
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass(expectedClass);
    });

    it('applies text colors correctly for variants', () => {
      render(<Chip label="Primary" variant="primary" />);
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('text-text-inverse');
    });
  });

  describe('Sizes', () => {
    it.each([
      ['sm', ['px-2', 'py-1', 'text-xs']],
      ['md', ['px-4', 'py-2', 'text-sm']],
      ['lg', ['px-6', 'py-3', 'text-base']],
    ])('applies correct classes for %s size', (size, expectedClasses) => {
      render(<Chip label="Test" size={size as any} />);
      
      const chip = screen.getByRole('button');
      expectedClasses.forEach(className => {
        expect(chip).toHaveClass(className);
      });
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles when disabled prop is true', () => {
      render(<Chip label="Disabled" disabled />);
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('cursor-not-allowed', 'opacity-50');
      expect(chip).toHaveClass('bg-surface-disabled', 'text-text-secondary');
      expect(chip).toHaveAttribute('aria-disabled', 'true');
      expect(chip).toHaveAttribute('tabIndex', '-1');
    });

    it('does not respond to clicks when disabled', () => {
      const onClick = jest.fn();
      render(<Chip label="Disabled" disabled onClick={onClick} />);
      
      const chip = screen.getByRole('button');
      fireEvent.click(chip);
      
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not respond to keyboard events when disabled', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<Chip label="Disabled" disabled onClick={onClick} />);
      
      const chip = screen.getByRole('button');
      await user.type(chip, '{enter}');
      await user.type(chip, ' ');
      
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Click Interactions', () => {
    it('responds to click events when not disabled', () => {
      const onClick = jest.fn();
      render(<Chip label="Clickable" onClick={onClick} />);
      
      const chip = screen.getByRole('button');
      fireEvent.click(chip);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('applies cursor-pointer when clickable', () => {
      render(<Chip label="Clickable" onClick={jest.fn()} />);
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('cursor-pointer');
    });

    it('applies cursor-default when not interactive', () => {
      render(<Chip label="Static" />);
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('cursor-default');
    });
  });

  describe('Keyboard Navigation', () => {
    it('responds to Enter key press', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<Chip label="Keyboard" onClick={onClick} />);
      
      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard('{Enter}');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('responds to Space key press', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<Chip label="Keyboard" onClick={onClick} />);
      
      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard(' ');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('has proper tabIndex when not disabled', () => {
      render(<Chip label="Focusable" />);
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Removable Functionality', () => {
    it('shows remove button when removable prop is true', () => {
      render(<Chip label="Removable" removable />);
      
      const removeButton = screen.getByRole('button', { name: /remove removable/i });
      expect(removeButton).toBeInTheDocument();
    });

    it('does not show remove button by default', () => {
      render(<Chip label="Not Removable" />);
      
      const removeButton = screen.queryByRole('button', { name: /remove/i });
      expect(removeButton).not.toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', () => {
      const onRemove = jest.fn();
      render(<Chip label="Removable" removable onRemove={onRemove} />);
      
      const removeButton = screen.getByRole('button', { name: /remove removable/i });
      fireEvent.click(removeButton);
      
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('stops event propagation when remove button is clicked', () => {
      const onClick = jest.fn();
      const onRemove = jest.fn();
      render(<Chip label="Removable" removable onClick={onClick} onRemove={onRemove} />);
      
      const removeButton = screen.getByRole('button', { name: /remove removable/i });
      fireEvent.click(removeButton);
      
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('responds to Delete key for removal', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      render(<Chip label="Removable" removable onRemove={onRemove} />);
      
      const chip = screen.getByRole('button', { name: /removable, removable/i });
      chip.focus();
      await user.keyboard('{Delete}');
      
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('responds to Backspace key for removal', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      render(<Chip label="Removable" removable onRemove={onRemove} />);
      
      const chip = screen.getByRole('button', { name: /removable, removable/i });
      chip.focus();
      await user.keyboard('{Backspace}');
      
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('applies cursor-pointer when removable', () => {
      render(<Chip label="Removable" removable />);
      
      const chip = screen.getByRole('button', { name: /removable, removable/i });
      expect(chip).toHaveClass('cursor-pointer');
    });

    it('does not call onRemove when disabled', () => {
      const onRemove = jest.fn();
      render(<Chip label="Disabled Removable" removable disabled onRemove={onRemove} />);
      
      const removeButton = screen.getByRole('button', { name: /remove disabled removable/i });
      fireEvent.click(removeButton);
      
      expect(onRemove).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for basic chip', () => {
      render(<Chip label="Test Label" />);
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveAttribute('aria-label', 'Test Label');
    });

    it('has proper aria-label for removable chip', () => {
      render(<Chip label="Removable Label" removable />);
      
      const chip = screen.getByRole('button', { name: /removable label, removable/i });
      expect(chip).toHaveAttribute('aria-label', 'Removable Label, removable');
    });

    it('applies role="button" for interaction', () => {
      render(<Chip label="Button" />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has proper aria-label for remove button', () => {
      render(<Chip label="Test" removable />);
      
      const removeButton = screen.getByRole('button', { name: /remove test/i });
      expect(removeButton).toHaveAttribute('aria-label', 'Remove Test');
    });

    it('hides SVG icon from screen readers', () => {
      render(<Chip label="Test" removable />);
      
      const svg = screen.getByRole('button', { name: /remove test/i }).querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('sets tabIndex to -1 for remove button', () => {
      render(<Chip label="Test" removable />);
      
      const removeButton = screen.getByRole('button', { name: /remove test/i });
      expect(removeButton).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Text Truncation', () => {
    it('applies truncation classes to label span', () => {
      render(<Chip label="Very long text that should be truncated" />);
      
      const textSpan = screen.getByText('Very long text that should be truncated');
      expect(textSpan).toHaveClass('truncate', 'whitespace-nowrap', 'text-ellipsis');
    });
  });

  describe('Remove Button Styling', () => {
    it('applies correct size classes for remove button icon', () => {
      const { rerender } = render(<Chip label="Test" removable size="sm" />);
      
      let svg = screen.getByRole('button', { name: /remove test/i }).querySelector('svg');
      expect(svg).toHaveClass('w-3', 'h-3');

      rerender(<Chip label="Test" removable size="md" />);
      svg = screen.getByRole('button', { name: /remove test/i }).querySelector('svg');
      expect(svg).toHaveClass('w-4', 'h-4');

      rerender(<Chip label="Test" removable size="lg" />);
      svg = screen.getByRole('button', { name: /remove test/i }).querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5');
    });

    it('applies different hover styles for primary variant', () => {
      render(<Chip label="Primary" variant="primary" removable />);
      
      const removeButton = screen.getByRole('button', { name: /remove primary/i });
      expect(removeButton).toHaveClass('text-text-inverse', 'hover:bg-white/20');
    });

    it('applies different hover styles for non-primary variants', () => {
      render(<Chip label="Default" variant="default" removable />);
      
      const removeButton = screen.getByRole('button', { name: /remove default/i });
      expect(removeButton).toHaveClass('text-text-secondary', 'hover:bg-black/5');
    });
  });

  describe('Event Handling', () => {
    it('forwards other HTML attributes', () => {
      render(<Chip label="Test" data-testid="chip-test" id="chip-1" />);
      
      const chip = screen.getByRole('button');
      expect(chip).toHaveAttribute('data-testid', 'chip-test');
      expect(chip).toHaveAttribute('id', 'chip-1');
    });

    it('preserves onClick behavior alongside removable functionality', () => {
      const onClick = jest.fn();
      const onRemove = jest.fn();
      render(<Chip label="Both" onClick={onClick} removable onRemove={onRemove} />);
      
      const chip = screen.getByRole('button', { name: /both, removable/i });
      fireEvent.click(chip);
      
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onRemove).not.toHaveBeenCalled();
    });
  });
});
