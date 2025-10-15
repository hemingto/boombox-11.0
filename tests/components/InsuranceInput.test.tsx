/**
 * @fileoverview Comprehensive Jest tests for InsuranceInput component
 * Tests component rendering, user interactions, accessibility, and integration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InsuranceInput, { type InsuranceInputProps } from '@/components/forms/InsuranceInput';
import { insuranceOptions } from '@/data/insuranceOptions';

// Mock console.warn to avoid noise in test output
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

describe('InsuranceInput', () => {
  const defaultProps: InsuranceInputProps = {
    onInsuranceChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<InsuranceInput {...defaultProps} />);
      
      // Check that visible combobox exists
      const triggers = screen.getAllByRole('combobox');
      const visibleTrigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      expect(visibleTrigger).toBeInTheDocument();
      
      expect(screen.getByText('Do you need additional insurance coverage?')).toBeInTheDocument();
      expect(screen.getByText('Select your insurance coverage')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      const customLabel = 'Choose your insurance plan';
      render(<InsuranceInput {...defaultProps} label={customLabel} />);
      
      expect(screen.getByText(customLabel)).toBeInTheDocument();
    });

    it('renders as required when specified', () => {
      render(<InsuranceInput {...defaultProps} required />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const customClass = 'custom-insurance-input';
      const { container } = render(
        <InsuranceInput {...defaultProps} className={customClass} />
      );
      
      expect(container.firstChild).toHaveClass(customClass);
    });
  });

  describe('State Management', () => {
    it('displays selected option correctly', () => {
      render(<InsuranceInput {...defaultProps} value="standard" />);
      
      // Expect the text to appear at least once (could be in hidden select and visible trigger)
      expect(screen.getAllByText('Standard Insurance Coverage').length).toBeGreaterThan(0);
      expect(screen.getByText('$15/mo')).toBeInTheDocument();
    });

    it('handles null/undefined values gracefully', () => {
      render(<InsuranceInput {...defaultProps} value={null} />);
      
      expect(screen.getByText('Select your insurance coverage')).toBeInTheDocument();
    });

    it('updates when value prop changes', () => {
      const { rerender } = render(<InsuranceInput {...defaultProps} value="standard" />);
      
      expect(screen.getAllByText('Standard Insurance Coverage').length).toBeGreaterThan(0);
      
      rerender(<InsuranceInput {...defaultProps} value="premium" />);
      
      expect(screen.getAllByText('Premium Insurance Coverage').length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<InsuranceInput {...defaultProps} />);
      
      // Get the visible combobox (not the hidden select)
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      expect(trigger).toBeDefined();
      await user.click(trigger!);
      
      // Check if dropdown opened with listbox
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('calls onInsuranceChange when option is selected', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      render(<InsuranceInput {...defaultProps} onInsuranceChange={mockOnChange} />);
      
      // Open dropdown
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      await user.click(trigger!);
      
      // Select standard option (from dropdown, not hidden select)
      const standardOptions = screen.getAllByRole('option', { name: /Standard Insurance Coverage/i });
      const dropdownOption = standardOptions.find(option => 
        option.closest('[role="listbox"]') !== null
      );
      await user.click(dropdownOption!);
      
      // Verify callback was called with correct option
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'standard',
          label: 'Standard Insurance Coverage',
          price: '$15/mo',
          monthlyRate: 15,
        })
      );
    });

    it('handles empty value correctly', () => {
      render(<InsuranceInput {...defaultProps} value="" />);
      
      // The component should handle empty string as null and show placeholder
      expect(screen.getByText('Select your insurance coverage')).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      const { container } = render(<InsuranceInput {...defaultProps} />);
      
      // Open dropdown
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      await user.click(trigger!);
      
      // Verify options are visible (only check dropdown, not hidden select)
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      // Click outside
      await user.click(container);
      
      // Wait for dropdown to close - check that listbox is not visible
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error state correctly', () => {
      render(<InsuranceInput {...defaultProps} hasError />);
      
      expect(screen.getByText('Please select an insurance option')).toBeInTheDocument();
    });

    it('calls onClearError when interacted with while in error state', async () => {
      const user = userEvent.setup();
      const mockClearError = jest.fn();
      render(
        <InsuranceInput 
          {...defaultProps} 
          hasError 
          onClearError={mockClearError} 
        />
      );
      
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      await user.click(trigger!);
      
      expect(mockClearError).toHaveBeenCalled();
    });

    it('does not show error when hasError is false', () => {
      render(<InsuranceInput {...defaultProps} hasError={false} />);
      
      expect(screen.queryByText('Please select an insurance option')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled when specified', () => {
      render(<InsuranceInput {...defaultProps} disabled />);
      
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') === '-1' && !el.classList.contains('sr-only'));
      expect(trigger).toHaveAttribute('tabIndex', '-1');
      
      // Should not be clickable - check that listbox doesn't appear
      fireEvent.click(trigger!);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not call onInsuranceChange when disabled', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      render(<InsuranceInput {...defaultProps} onInsuranceChange={mockOnChange} disabled />);
      
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') === '-1' && !el.classList.contains('sr-only'));
      await user.click(trigger!);
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<InsuranceInput {...defaultProps} name="insurance" />);
      
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-invalid', 'false');
    });

    it('updates ARIA attributes in error state', () => {
      render(<InsuranceInput {...defaultProps} name="insurance" hasError />);
      
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<InsuranceInput {...defaultProps} />);
      
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1')!;
      
      // Focus and open with Enter
      trigger.focus();
      await user.keyboard('[Enter]');
      
      // Should open dropdown
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      // Close with Escape
      await user.keyboard('[Escape]');
      
      // Should close dropdown
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('has proper form association', () => {
      render(<InsuranceInput {...defaultProps} name="insurance-coverage" />);
      
      // Should have hidden select for form submission
      const hiddenSelect = document.querySelector('select[name="insurance-coverage"]');
      expect(hiddenSelect).toBeInTheDocument();
    });
  });

  describe('Rich Display Mode', () => {
    it('displays option icons and descriptions', async () => {
      const user = userEvent.setup();
      render(<InsuranceInput {...defaultProps} />);
      
      // Open dropdown
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      await user.click(trigger!);
      
      // Check for descriptions
      expect(screen.getByText('covers up to $1000 per unit')).toBeInTheDocument();
      expect(screen.getByText('covers up to $2500 per unit')).toBeInTheDocument();
      expect(screen.getByText("Will use own renter's insurance")).toBeInTheDocument();
    });

    it('displays pricing information', async () => {
      const user = userEvent.setup();
      render(<InsuranceInput {...defaultProps} />);
      
      // Open dropdown
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      await user.click(trigger!);
      
      // Check for pricing
      expect(screen.getByText('$15/mo')).toBeInTheDocument();
      expect(screen.getByText('$25/mo')).toBeInTheDocument();
      expect(screen.getByText('$0/mo')).toBeInTheDocument();
    });

    it('shows selected option with icon and price', () => {
      render(<InsuranceInput {...defaultProps} value="premium" />);
      
      // Use getAllByText to handle multiple instances
      expect(screen.getAllByText('Premium Insurance Coverage')[0]).toBeInTheDocument();
      expect(screen.getByText('$25/mo')).toBeInTheDocument();
    });
  });

  describe('Integration with Insurance Options Data', () => {
    it('renders all available insurance options', async () => {
      const user = userEvent.setup();
      render(<InsuranceInput {...defaultProps} />);
      
      // Open dropdown
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      await user.click(trigger!);
      
      // Verify all options from data are present (from visible dropdown)
      insuranceOptions.forEach((option) => {
        // Use getAllByText to handle both hidden select and visible dropdown
        expect(screen.getAllByText(option.label).length).toBeGreaterThan(0);
        expect(screen.getByText(option.description)).toBeInTheDocument();
        expect(screen.getByText(option.price)).toBeInTheDocument();
      });
    });

    it('returns correct InsuranceOption object on selection', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      render(<InsuranceInput {...defaultProps} onInsuranceChange={mockOnChange} />);
      
      // Open dropdown
      const triggers = screen.getAllByRole('combobox');
      const trigger = triggers.find(el => el.getAttribute('tabindex') !== '-1');
      await user.click(trigger!);
      
      // Select premium option (from dropdown, not hidden select)
      const premiumOptions = screen.getAllByRole('option', { name: /Premium Insurance Coverage/i });
      const dropdownOption = premiumOptions.find(option => 
        option.closest('[role="listbox"]') !== null
      );
      await user.click(dropdownOption!);
      
      // Verify the exact structure matches InsuranceOption interface
      const expectedOption = insuranceOptions.find(opt => opt.value === 'premium');
      expect(mockOnChange).toHaveBeenCalledWith(expectedOption);
    });
  });
});
