/**
 * @fileoverview Routing Number Input Component using unified Input component with custom hook
 * @source boombox-10.0/src/app/components/reusablecomponents/routingnumberinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a specialized routing number input field with numeric-only validation,
 * 9-digit format validation, and comprehensive error handling. Uses the unified
 * Input component with the useRoutingNumberInput custom hook for business logic.
 * 
 * API ROUTES UPDATED:
 * - No API routes used in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses design system Input component with proper error states
 * - Follows design system color tokens and utility classes
 * 
 * @refactor Migrated to use unified Input component with custom hook pattern
 * instead of standalone component, following boombox-11.0 architecture
 */

import React from 'react';
import { Input } from '@/components/ui/primitives/Input';
import { useRoutingNumberInput } from '@/hooks/useRoutingNumberInput';
import type { UseRoutingNumberInputOptions } from '@/hooks/useRoutingNumberInput';

/**
 * Props for RoutingNumberInput component
 */
export interface RoutingNumberInputProps extends UseRoutingNumberInputOptions {
  /** Current routing number value */
  value: string;
  /** Callback when routing number changes */
  onRoutingNumberChange: (routingNumber: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Whether the input should take full width */
  fullWidth?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Input ID for accessibility */
  id?: string;
  /** Input name attribute */
  name?: string;
}

/**
 * Routing Number Input Component
 * 
 * A specialized input component for bank routing number entry with built-in
 * numeric validation, format checking, and accessibility features.
 * 
 * @example
 * ```tsx
 * <RoutingNumberInput
 *   value={routingNumber}
 *   onRoutingNumberChange={setRoutingNumber}
 *   required
 *   showLabel
 *   fullWidth
 * />
 * ```
 */
export const RoutingNumberInput: React.FC<RoutingNumberInputProps> = ({
  value,
  onRoutingNumberChange,
  className,
  showLabel = false,
  label = 'Routing Number',
  fullWidth = true,
  disabled = false,
  id = 'routing-number',
  name = 'routingNumber',
  ...hookOptions
}) => {
  const routingInput = useRoutingNumberInput(value, {
    ...hookOptions,
    onRoutingNumberChange,
  });

  return (
    <Input
      {...routingInput.inputProps}
      id={id}
      name={name}
      label={showLabel ? label : undefined}
      error={routingInput.hasError ? routingInput.errorMessage : undefined}
      onClearError={routingInput.clearError}
      fullWidth={fullWidth}
      disabled={disabled}
      className={className}
      required={hookOptions.required}
      helperText="Enter your bank's 9-digit routing number"
    />
  );
};

export default RoutingNumberInput;
