/**
 * @fileoverview Payment method dropdown with card brand icons
 * @source boombox-10.0/src/app/components/reusablecomponents/paymentmethoddropdown.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Custom dropdown for selecting payment methods (saved cards or add new card).
 * Displays card brand icons (Visa, Mastercard, Amex, Discover, JCB, Apple Pay, Amazon Pay)
 * and formatted card details. Wraps Select component for consistent design system styling.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Refactored to use Select component for consistent styling
 * - Maintains card brand icon rendering via custom renderOption/renderSelected props
 * - Delegates dropdown behavior to Select (click outside, keyboard handling, focus states)
 * - All design system colors now handled by Select component
 * 
 * @refactor Migrated to use Select component wrapper, preserved all card brand
 * icon functionality while ensuring design system consistency
 */

'use client';

import { CreditCardIcon } from '@heroicons/react/24/outline';
import { Select, SelectOption } from '@/components/ui/primitives/Select';
import { VisaIcon } from '@/components/icons/VisaIcon';
import { MastercardIcon } from '@/components/icons/MastercardIcon';
import { AmexIcon } from '@/components/icons/AmexIcon';
import { DiscoverIcon } from '@/components/icons/DiscoverIcon';
import { JcbIcon } from '@/components/icons/JsbIcon';
import { AppleIcon } from '@/components/icons/AppleIcon';
import { AmazonPayIcon } from '@/components/icons/AmazonPayIcon';

interface PaymentMethodOption {
  value: string;
  display: string;
  brand?: string;
  isAddNew?: boolean;
}

interface PaymentMethodDropdownProps {
  label?: string;
  value?: string | null;
  onOptionChange: (option: string | null) => void;
  hasError?: boolean;
  onClearError?: () => void;
  options: PaymentMethodOption[];
}

/**
 * Get card brand icon component based on brand name
 */
const getCardBrandIcon = (brand: string): React.JSX.Element => {
  const brandLower = brand.toLowerCase();

  switch (brandLower) {
    case 'visa':
      return <VisaIcon className="w-6 h-6 text-visa" />;
    
    case 'mastercard':
      return <MastercardIcon className="w-6 h-6" />;
    
    case 'amex':
    case 'american_express':
      return <AmexIcon className="w-6 h-6 text-amex" />;
    
    case 'discover':
      return <DiscoverIcon className="w-6 h-6 text-stone-800" />;
    
    case 'jcb':
      return <JcbIcon className="w-6 h-6 text-jcb" />;
    
    case 'apple':
    case 'apple_pay':
      return <AppleIcon className="w-6 h-6 text-zinc-applepay" />;
    
    case 'amazon':
    case 'amazon_pay':
      return <AmazonPayIcon className="w-6 h-6 text-amazonpay" />;
    
    case 'diners':
    case 'diners_club':
      return <CreditCardIcon className="w-6 h-6 text-text-tertiary" />;
    
    case 'unionpay':
      return <CreditCardIcon className="w-6 h-6 text-text-tertiary" />;
    
    default:
      return <CreditCardIcon className="w-6 h-6 text-text-tertiary" />;
  }
};

export const PaymentMethodDropdown: React.FC<PaymentMethodDropdownProps> = ({
  label = '',
  value = null,
  onOptionChange,
  hasError = false,
  onClearError,
  options,
}) => {
  // Transform PaymentMethodOption[] to SelectOption[] format
  const selectOptions: SelectOption[] = options.map(opt => ({
    value: opt.value,
    label: opt.display,
    metadata: { brand: opt.brand, isAddNew: opt.isAddNew }
  }));

  // Custom renderOption to show card brand icons
  const renderOption = (option: SelectOption) => {
    const brand = option.metadata?.brand;
    return (
      <div className="flex items-center gap-3">
        {brand && getCardBrandIcon(brand)}
        <span>{option.label}</span>
      </div>
    );
  };

  // Custom renderSelected to show selected card icon
  const renderSelected = (option: SelectOption) => {
    const brand = option.metadata?.brand;
    return (
      <div className="flex items-center gap-3">
        {brand && getCardBrandIcon(brand)}
        <span>{option.label}</span>
      </div>
    );
  };

  return (
    <Select
      label={label}
      value={value || ''}
      onChange={onOptionChange || (() => {})}
      error={hasError ? ' ' : undefined}
      onClearError={onClearError}
      options={selectOptions}
      displayMode="compact"
      placeholder="Select saved payment method"
      renderOption={renderOption}
      renderSelected={renderSelected}
      fullWidth
      id="payment-method-select"
      name="paymentMethod"
      size="sm"
    />
  );
};

export default PaymentMethodDropdown;
