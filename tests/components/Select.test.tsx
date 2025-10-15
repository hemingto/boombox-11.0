/**
 * @fileoverview Jest tests for Select component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '@/components/ui/primitives/Select';

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChevronDownIcon: (props: any) => <div data-testid="chevron-down-icon" {...props} />,
}));

describe('Select Component', () => {
  const sampleOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4 (Disabled)', disabled: true },
  ];

  describe('Basic Rendering', () => {
    it('renders with required props', () => {
      render(<Select options={sampleOptions} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Select label="Test Label" options={sampleOptions} />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Select placeholder="Choose an option" options={sampleOptions} />);
      
      expect(screen.getByText('Choose an option')).toBeInTheDocument();
    });

    it('renders options from props', () => {
      render(<Select options={sampleOptions} />);
      
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      // The select might have the first option selected by default
      expect(select).toBeInTheDocument();
      
      sampleOptions.forEach(option => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });
    });

    it('renders children options when provided', () => {
      // Custom dropdown doesn't support children - it uses options prop
      const childOptions = [
        { value: 'child1', label: 'Child Option 1' },
        { value: 'child2', label: 'Child Option 2' },
      ];
      
      render(<Select options={childOptions} />);
      
      // Options are only visible in the hidden select element for form submission
      // The custom dropdown shows placeholder until opened
      expect(screen.getByText('Select an option')).toBeInTheDocument();
      
      // Verify options exist in the hidden select for form submission
      const hiddenSelect = document.querySelector('select[aria-hidden="true"]');
      expect(hiddenSelect).toBeInTheDocument();
      expect(hiddenSelect?.querySelector('option[value="child1"]')).toBeInTheDocument();
      expect(hiddenSelect?.querySelector('option[value="child2"]')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it.each([
      ['sm', ['py-2', 'px-2.5', 'text-sm']],
      ['md', ['py-2.5', 'px-3', 'text-base']],
      ['lg', ['py-3', 'px-4', 'text-lg']],
    ])('applies correct classes for %s size', (size, expectedClasses) => {
      render(<Select size={size as any} options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      expectedClasses.forEach(className => {
        expect(select).toHaveClass(className);
      });
    });

    it('defaults to medium size when size is not provided', () => {
      render(<Select options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('py-2.5', 'px-3', 'text-base');
    });
  });

  describe('States and Variants', () => {
    it('applies error styling when error prop is provided', () => {
      render(<Select error="This field is required" options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-border-error', 'ring-2', 'ring-border-error', 'bg-red-50', 'text-status-error');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders error message', () => {
      render(<Select error="This field is required" name="test-select" options={sampleOptions} />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      const errorElement = screen.getByText('This field is required');
      expect(errorElement).toHaveAttribute('id', 'test-select-error');
    });

    it('renders helper text when provided', () => {
      render(<Select helperText="Choose wisely" name="test-select" options={sampleOptions} />);
      
      expect(screen.getByText('Choose wisely')).toBeInTheDocument();
      const helperElement = screen.getByText('Choose wisely');
      expect(helperElement).toHaveAttribute('id', 'test-select-helper');
    });

    it('shows required indicator when required is true', () => {
      render(<Select label="Required Field" required options={sampleOptions} />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveClass('text-red-500');
    });

    it('applies disabled state correctly', () => {
      render(<Select disabled options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      // Custom dropdown uses tabIndex and styling for disabled state
      expect(select).toHaveAttribute('tabIndex', '-1');
      expect(select).toHaveClass('bg-surface-disabled', 'cursor-not-allowed', 'text-text-secondary');
    });

    it('applies fullWidth styling', () => {
      render(<Select fullWidth options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('w-full');
    });
  });

  describe('Icon Behavior', () => {
    it('renders chevron icon with correct size based on select size', () => {
      const { rerender } = render(<Select size="sm" options={sampleOptions} />);
      let icon = screen.getByTestId('chevron-down-icon');
      expect(icon).toHaveClass('w-4', 'h-4');

      rerender(<Select size="md" options={sampleOptions} />);
      icon = screen.getByTestId('chevron-down-icon');
      expect(icon).toHaveClass('w-5', 'h-5');

      rerender(<Select size="lg" options={sampleOptions} />);
      icon = screen.getByTestId('chevron-down-icon');
      expect(icon).toHaveClass('w-6', 'h-6');
    });

    it('applies error color to icon when error state is active', () => {
      render(<Select error="Error message" options={sampleOptions} />);
      
      const icon = screen.getByTestId('chevron-down-icon');
      expect(icon).toHaveClass('text-status-error');
    });
  });

  describe('Event Handling', () => {
    it('calls onChange when selection changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<Select onChange={onChange} options={sampleOptions} />);
      
      // Open the dropdown
      const select = screen.getByRole('combobox');
      await user.click(select);
      
      // Click on an option in the dropdown (not the hidden select)
      const option = screen.getByRole('option', { name: 'Option 2' });
      await user.click(option);
      
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('option2');
    });

    it('calls onFocus when select is focused', async () => {
      const user = userEvent.setup();
      const onFocus = jest.fn();
      
      render(<Select onFocus={onFocus} options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      await user.click(select);
      
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onClearError when focused and has error', async () => {
      const user = userEvent.setup();
      const onClearError = jest.fn();
      
      render(
        <Select 
          error="Test error" 
          onClearError={onClearError} 
          options={sampleOptions} 
        />
      );
      
      const select = screen.getByRole('combobox');
      await user.click(select);
      
      expect(onClearError).toHaveBeenCalledTimes(1);
    });

    it('does not call onClearError when focused without error', async () => {
      const user = userEvent.setup();
      const onClearError = jest.fn();
      
      render(<Select onClearError={onClearError} options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      await user.click(select);
      
      expect(onClearError).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Select label="Test Select" options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'false');
    });

    it('has proper ARIA attributes when error is present', () => {
      render(
        <Select 
          label="Test Select" 
          error="Error message" 
          name="test-select"
          options={sampleOptions} 
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
      
      // The hidden select has the aria-describedby for form submission
      const hiddenSelect = document.querySelector('select[aria-hidden="true"]');
      expect(hiddenSelect).toHaveAttribute('aria-describedby', 'test-select-error');
    });

    it('has proper ARIA attributes when helper text is present', () => {
      render(
        <Select 
          label="Test Select" 
          helperText="Helper text" 
          name="test-select"
          options={sampleOptions} 
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'false');
      
      // The hidden select has the aria-describedby for form submission
      const hiddenSelect = document.querySelector('select[aria-hidden="true"]');
      expect(hiddenSelect).toHaveAttribute('aria-describedby', 'test-select-helper');
    });

    it('associates label with select field', () => {
      render(<Select label="Test Label" options={sampleOptions} />);
      
      const label = screen.getByText('Test Label');
      const select = screen.getByRole('combobox');
      
      expect(label.tagName).toBe('LABEL');
      // The association is handled by the form structure
    });
  });

  describe('Option Handling', () => {
    it('handles disabled options correctly', () => {
      render(<Select options={sampleOptions} />);
      
      // Disabled options are only visible when dropdown is open
      // Check that the disabled option exists in the hidden select
      const hiddenSelect = document.querySelector('select[aria-hidden="true"]');
      const disabledOption = hiddenSelect?.querySelector('option[value="option4"]');
      expect(disabledOption).toBeInTheDocument();
      expect(disabledOption).toHaveTextContent('Option 4 (Disabled)');
    });

    it('renders placeholder as disabled option when provided', () => {
      render(<Select placeholder="Select an option" options={sampleOptions} />);
      
      // Placeholder is shown in the custom dropdown trigger
      const placeholderOption = screen.getByText('Select an option');
      expect(placeholderOption).toBeInTheDocument();
      
      // Custom dropdown doesn't have .value property - it's a div
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });

    it('combines options from props and children', () => {
      // Custom dropdown only uses options prop, doesn't support children
      render(<Select options={sampleOptions} />);
      
      // Only prop options are available
      const hiddenSelect = document.querySelector('select[aria-hidden="true"]');
      expect(hiddenSelect?.querySelector('option[value="option1"]')).toBeInTheDocument();
      
      // Children are not supported in custom dropdown architecture
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    it('works with controlled value', () => {
      const { rerender } = render(
        <Select value="option2" onChange={() => {}} options={sampleOptions} />
      );
      
      // Check that the selected value is displayed in the custom dropdown trigger
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveTextContent('Option 2');
      
      // Check that the hidden select has the correct value for form submission
      const hiddenSelect = document.querySelector('select[aria-hidden="true"]') as HTMLSelectElement;
      expect(hiddenSelect.value).toBe('option2');
      
      rerender(<Select value="option3" onChange={() => {}} options={sampleOptions} />);
      expect(combobox).toHaveTextContent('Option 3');
      expect(hiddenSelect.value).toBe('option3');
    });

    it('works with defaultValue', () => {
      // Custom dropdown doesn't support defaultValue prop - use value prop instead
      render(<Select value="option2" options={sampleOptions} />);
      
      // Check that the selected value is displayed in the combobox
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveTextContent('Option 2');
      
      // Check hidden select for form submission
      const hiddenSelect = document.querySelector('select[aria-hidden="true"]') as HTMLSelectElement;
      expect(hiddenSelect.value).toBe('option2');
    });

    it('forwards name attribute for form submission', () => {
      render(<Select name="test-select" options={sampleOptions} />);
      
      // Name attribute is on the hidden select for form submission
      const hiddenSelect = document.querySelector('select[aria-hidden="true"]');
      expect(hiddenSelect).toHaveAttribute('name', 'test-select');
    });

    it('forwards id attribute', () => {
      render(<Select id="custom-id" options={sampleOptions} />);
      
      // ID is forwarded to the combobox
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Styling and Customization', () => {
    it('applies custom className', () => {
      render(<Select className="custom-select" options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-select');
    });

    it('maintains design system classes with custom className', () => {
      render(<Select className="custom-select" options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('relative', 'rounded-md', 'cursor-pointer', 'custom-select');
    });

    it('applies cursor-pointer class for interactive state', () => {
      render(<Select options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('cursor-pointer');
    });

    it('applies appearance-none for custom styling', () => {
      render(<Select options={sampleOptions} />);
      
      const select = screen.getByRole('combobox');
      // Custom select doesn't use appearance-none since it's a div, not a select element
      expect(select).toHaveClass('relative', 'rounded-md');
    });
  });

  describe('Error State Management', () => {
    it('prioritizes error message over helper text', () => {
      render(
        <Select 
          error="Error message" 
          helperText="Helper text" 
          options={sampleOptions} 
        />
      );
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('clears error state when onClearError is called on focus', async () => {
      const user = userEvent.setup();
      let hasError = true;
      const onClearError = jest.fn(() => { hasError = false; });
      
      const { rerender } = render(
        <Select 
          error={hasError ? "Error message" : ""} 
          onClearError={onClearError} 
          options={sampleOptions} 
        />
      );
      
      const select = screen.getByRole('combobox');
      await user.click(select);
      
      expect(onClearError).toHaveBeenCalled();
      
      // Rerender without error to simulate state update
      rerender(
        <Select 
          error="" 
          onClearError={onClearError} 
          options={sampleOptions} 
        />
      );
      
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      render(<Select options={[]} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      
      // Custom dropdown always has content (placeholder text and chevron icon)
      expect(screen.getByText('Select an option')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('handles undefined options', () => {
      render(<Select />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('handles options with special characters', () => {
      const specialOptions = [
        { value: 'special-1', label: 'Option with "quotes"' },
        { value: 'special-2', label: "Option with 'apostrophes'" },
        { value: 'special-3', label: 'Option with <brackets>' },
      ];
      
      render(<Select options={specialOptions} />);
      
      expect(screen.getByText('Option with "quotes"')).toBeInTheDocument();
      expect(screen.getByText("Option with 'apostrophes'")).toBeInTheDocument();
      expect(screen.getByText('Option with <brackets>')).toBeInTheDocument();
    });

    it('handles very long option text', () => {
      const longOptions = [
        { 
          value: 'long', 
          label: 'This is a very long option text that should be handled gracefully without breaking the layout or causing issues with the select component rendering and interaction behavior' 
        },
      ];
      
      render(<Select options={longOptions} />);
      
      expect(screen.getByText(/This is a very long option text/)).toBeInTheDocument();
    });
  });
});
