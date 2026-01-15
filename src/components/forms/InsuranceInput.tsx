/**
 * @fileoverview Insurance coverage selection component with design system integration
 * @source boombox-10.0/src/app/components/reusablecomponents/insuranceinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a dropdown selection for insurance coverage options with rich display
 * including icons, descriptions, and pricing. Handles validation states and supports
 * controlled component patterns for form integration.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses design system Select primitive with rich display mode
 * - Applied semantic color tokens (primary, status-error, text-primary, etc.)
 * - Integrated with design system utility classes (.form-group, .form-label)
 * - Consistent focus states and accessibility patterns
 * 
 * @refactor Refactored to use Select primitive instead of custom dropdown implementation
 * Business logic extracted to data layer, maintained component interface compatibility
 */

import { forwardRef } from 'react';
import { Select, type SelectOption } from '@/components/ui/primitives/Select';
import { insuranceOptions, type InsuranceOption } from '@/data/insuranceOptions';

export interface InsuranceInputProps {
  /**
   * Currently selected insurance option value
   */
  value?: string | null;
  
  /**
   * Callback when insurance selection changes
   */
  onInsuranceChange: (option: InsuranceOption | null) => void;
  
  /**
   * Whether the input has an error state
   */
  hasError?: boolean;
  
  /**
   * Callback to clear the error state
   */
  onClearError?: () => void;
  
  /**
   * Custom label for the input (optional)
   */
  label?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  
  /**
   * Name attribute for form submission
   */
  name?: string;
}

const InsuranceInput = forwardRef<HTMLDivElement, InsuranceInputProps>(
  (
    {
      value = null,
      onInsuranceChange,
      hasError = false,
      onClearError,
      label = 'Do you need additional insurance coverage?',
      required = false,
      className,
      disabled = false,
      name = 'insurance-coverage',
      ...props
    },
    ref
  ) => {
    // Convert insurance options to Select-compatible format
    const selectOptions: SelectOption[] = insuranceOptions.map((option) => ({
      value: option.value,
      label: option.label,
      description: option.description,
      price: option.price,
      icon: option.icon,
      metadata: {
        monthlyRate: option.monthlyRate,
      },
    }));

    // Handle selection change - convert back to InsuranceOption format
    const handleSelectionChange = (selectedValue: string) => {
      if (!selectedValue) {
        onInsuranceChange(null);
        return;
      }

      const selectedOption = insuranceOptions.find(
        (option) => option.value === selectedValue
      );
      
      if (selectedOption) {
        onInsuranceChange(selectedOption);
      }
    };

    return (
      <div ref={ref} className={className} {...props}>
        <Select
          name={name}
          label={label}
          required={required}
          value={value || ''}
          onChange={handleSelectionChange}
          options={selectOptions}
          displayMode="rich"
          placeholder="Select your insurance coverage"
          fullWidth
          disabled={disabled}
          variant={hasError ? 'error' : 'default'}
          error={hasError ? 'Please select an insurance option' : undefined}
          onClearError={onClearError}
          size="sm"
        />
      </div>
    );
  }
);

InsuranceInput.displayName = 'InsuranceInput';

export default InsuranceInput;
export type { InsuranceOption };
