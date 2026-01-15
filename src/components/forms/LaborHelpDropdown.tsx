"use client";

/**
 * @fileoverview Labor Help Dropdown - Specialized dropdown for selecting unloading assistance
 * @source boombox-10.0/src/app/components/reusablecomponents/laborhelpdropdown.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a specialized dropdown for users to select whether they need help unloading storage units.
 * Features two predefined options: "Full Service Plan" (paid assistance) and "Do It Yourself Plan" (free).
 * Uses the Select primitive component as its base with rich display mode.
 * 
 * API ROUTES UPDATED:
 * None - This is a pure UI component with no API dependencies
 * 
 * DESIGN SYSTEM UPDATES:
 * - Refactored to use Select primitive component for consistent styling
 * - Uses rich display mode with icons, descriptions, and pricing
 * - Applied design system patterns for error states and accessibility
 * - Consistent with other form components (InsuranceInput, etc.)
 * 
 * @refactor Refactored to use Select primitive instead of custom dropdown implementation
 */

import { forwardRef } from 'react';
import { Select, type SelectOption } from '@/components/ui/primitives/Select';
import { LABOR_HELP_OPTIONS, type LaborOption } from '@/data/laborOptions';

interface LaborHelpDropdownProps {
  /**
   * Currently selected labor option value
   */
  value: string;
  
  /**
   * Callback when labor selection changes
   */
  onLaborChange: (id: string, plan: string, description: string) => void;
  
  /**
   * Whether the input has an error state
   */
  hasError?: boolean;
  
  /**
   * Callback to clear the error state
   */
  onClearError?: () => void;
  
  /**
   * Custom label for the input
   */
  label?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Name attribute for form submission
   */
  name?: string;
  
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

const LaborHelpDropdown = forwardRef<HTMLDivElement, LaborHelpDropdownProps>(
  (
    {
      value,
      onLaborChange,
      hasError = false,
      onClearError,
      label = 'Do you need help unloading?',
      required = false,
      name = 'labor-help',
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    // Convert labor options to Select-compatible format
    const selectOptions: SelectOption[] = LABOR_HELP_OPTIONS.map((option) => ({
      value: option.id,
      label: option.title,
      description: option.plan,
      price: option.description,
      icon: option.icon,
      metadata: {
        pricing: option.pricing,
      },
    }));

    // Handle selection change - call the callback with full option details
    const handleSelectionChange = (selectedValue: string) => {
      const selectedOption = LABOR_HELP_OPTIONS.find(
        (option) => option.id === selectedValue
      );
      
      if (selectedOption) {
        onLaborChange(
          selectedOption.id,
          selectedOption.plan,
          selectedOption.description || ''
        );
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
          placeholder="Select if you need unloading help"
          fullWidth
          disabled={disabled}
          variant={hasError ? 'error' : 'default'}
          error={hasError ? 'Please select a labor help option' : undefined}
          onClearError={onClearError}
          size="sm"
        />
      </div>
    );
  }
);

LaborHelpDropdown.displayName = 'LaborHelpDropdown';

export default LaborHelpDropdown;
