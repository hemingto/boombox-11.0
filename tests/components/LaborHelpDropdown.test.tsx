/**
 * @fileoverview Jest tests for LaborHelpDropdown component
 * @source boombox-10.0/src/app/components/reusablecomponents/laborhelpdropdown.tsx
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LaborHelpDropdown from '@/components/forms/LaborHelpDropdown';

// Mock the heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  CheckCircleIcon: ({ className }: { className?: string }) => (
    <div data-testid="check-circle-icon" className={className}>✓</div>
  ),
  NoSymbolIcon: ({ className }: { className?: string }) => (
    <div data-testid="no-symbol-icon" className={className}>✗</div>
  ),
  ChevronDownIcon: ({ className }: { className?: string }) => (
    <div data-testid="chevron-down-icon" className={className}>⌄</div>
  ),
}));

describe('LaborHelpDropdown', () => {
  const mockOnLaborChange = jest.fn();
  const mockOnClearError = jest.fn();

  const defaultProps = {
    value: '',
    onLaborChange: mockOnLaborChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default placeholder when no value is selected', () => {
      render(<LaborHelpDropdown {...defaultProps} />);
      
      expect(screen.getAllByText('Select if you need unloading help')).toHaveLength(2); // visible + hidden
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('renders with selected option when value is provided', () => {
      render(<LaborHelpDropdown {...defaultProps} value="option2" />);
      
      expect(screen.getAllByText('Yes, I would love some help unloading')).toHaveLength(2); // visible + hidden
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('renders with Do It Yourself option when option1 is selected', () => {
      render(<LaborHelpDropdown {...defaultProps} value="option1" />);
      
      expect(screen.getAllByText("No, I'll unload my storage unit myself")).toHaveLength(2); // visible + hidden
      expect(screen.getByTestId('no-symbol-icon')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <LaborHelpDropdown {...defaultProps} className="custom-class" />
      );
      
      // Check that the custom class is applied to the dropdown trigger
      const trigger = container.querySelector('[role="combobox"]');
      expect(trigger).toHaveClass('custom-class');
    });
  });

  describe('Dropdown Interactions', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getAllByText('Yes, I would love some help unloading')).toHaveLength(2);
      expect(screen.getAllByText("No, I'll unload my storage unit myself")).toHaveLength(2);
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <LaborHelpDropdown {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );
      
      // Open dropdown
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'));
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('calls onLaborChange when option is selected', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      // Open dropdown
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      
      // Select Full Service option using testid to avoid text conflicts
      const fullServiceIcon = screen.getByTestId('check-circle-icon');
      const fullServiceOption = fullServiceIcon.closest('[role="option"]');
      await user.click(fullServiceOption!);
      
      expect(mockOnLaborChange).toHaveBeenCalledWith(
        'option2',
        'Full Service Plan',
        '$189/hr estimate'
      );
    });

    it('calls onLaborChange with correct data for DIY option', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      // Open dropdown
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      
      // Select DIY option using testid to avoid text conflicts
      const diyIcon = screen.getByTestId('no-symbol-icon');
      const diyOption = diyIcon.closest('[role="option"]');
      await user.click(diyOption!);
      
      expect(mockOnLaborChange).toHaveBeenCalledWith(
        'option1',
        'Do It Yourself Plan',
        'Free!'
      );
    });

    it('closes dropdown after selecting an option', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      // Open dropdown
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      // Select option
      const icon = screen.getByTestId('check-circle-icon');
      const option = icon.closest('[role="option"]');
      await user.click(option!);
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      trigger.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens dropdown with Space key', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      trigger.focus();
      await user.keyboard('{ }');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      // Open dropdown
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      // Close with Escape
      await user.keyboard('{Escape}');
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error styling when hasError is true', () => {
      render(<LaborHelpDropdown {...defaultProps} hasError />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      expect(trigger).toHaveClass('text-status-error');
      expect(trigger).toHaveClass('bg-red-50');
      expect(trigger).toHaveClass('ring-border-error');
    });

    it('calls onClearError when dropdown is opened and has error', async () => {
      const user = userEvent.setup();
      render(
        <LaborHelpDropdown 
          {...defaultProps} 
          hasError 
          onClearError={mockOnClearError} 
        />
      );
      
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      
      expect(mockOnClearError).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} disabled />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('applies disabled styling when disabled', () => {
      render(<LaborHelpDropdown {...defaultProps} disabled />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      expect(trigger).toHaveClass('bg-surface-disabled');
      expect(trigger).toHaveClass('cursor-not-allowed');
      expect(trigger).toHaveClass('text-text-secondary');
    });

    it('does not respond to keyboard events when disabled', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} disabled />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      trigger.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<LaborHelpDropdown {...defaultProps} />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-invalid', 'false');
      expect(trigger).toHaveAttribute('aria-label', 'Select labor help option');
    });

    it('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('sets aria-invalid to true when hasError is true', () => {
      render(<LaborHelpDropdown {...defaultProps} hasError />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });

    it('includes hidden select for form submission', () => {
      render(<LaborHelpDropdown {...defaultProps} name="labor-help" />);
      
      const hiddenSelect = document.querySelector('select[name="labor-help"]') as HTMLSelectElement;
      expect(hiddenSelect).toBeInTheDocument();
      expect(hiddenSelect.tagName).toBe('SELECT');
      expect(hiddenSelect).toHaveAttribute('name', 'labor-help');
      expect(hiddenSelect).toHaveClass('sr-only');
    });
  });

  describe('Form Integration', () => {
    it('sets correct name attribute on hidden select', () => {
      render(<LaborHelpDropdown {...defaultProps} name="labor-help" />);
      
      const hiddenSelect = document.querySelector('select[name="labor-help"]') as HTMLSelectElement;
      expect(hiddenSelect).toHaveAttribute('name', 'labor-help');
    });

    it('hidden select reflects the current value', () => {
      render(<LaborHelpDropdown {...defaultProps} value="option2" name="labor-help" />);
      
      const hiddenSelect = document.querySelector('select[name="labor-help"]') as HTMLSelectElement;
      expect(hiddenSelect.value).toBe('option2');
    });
  });

  describe('Data Integration', () => {
    it('displays correct icons for each option', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      
      // Check that both icons are present
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('no-symbol-icon')).toBeInTheDocument();
    });

    it('renders all expected options with correct structure', async () => {
      const user = userEvent.setup();
      render(<LaborHelpDropdown {...defaultProps} />);
      
      const trigger = screen.getByLabelText('Select labor help option');
      await user.click(trigger);
      
      // Check for specific text that appears in the dropdown
      expect(screen.getByText('Full Service Plan')).toBeInTheDocument();
      expect(screen.getByText('Do It Yourself Plan')).toBeInTheDocument();
      expect(screen.getByText('$189/hr estimate')).toBeInTheDocument();
      expect(screen.getByText('Free!')).toBeInTheDocument();
    });
  });
});