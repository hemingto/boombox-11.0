/**
 * @fileoverview Insurance-related type definitions
 * @source boombox-10.0/src/app/components/reusablecomponents/insuranceinput.tsx
 * @refactor Extracted insurance types to centralized type definitions
 */

export interface InsuranceOption {
  label: string;
  price?: string;
  value?: string;
  description?: string;
}

export interface InsuranceInputProps {
  selectedInsurance?: InsuranceOption | null;
  onInsuranceChange: (insurance: InsuranceOption | null) => void;
  hasError?: boolean;
  errorMessage?: string;
  onClearError?: () => void;
}
