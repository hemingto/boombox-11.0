/**
 * @fileoverview Payment method dropdown with card brand icons
 * @source boombox-10.0/src/app/components/reusablecomponents/paymentmethoddropdown.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Custom dropdown for selecting payment methods (saved cards or add new card).
 * Displays card brand icons (Visa, Mastercard, Amex, Discover, JCB, Apple Pay, Amazon Pay)
 * and formatted card details. Supports click-outside-to-close behavior.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced slate-100 with surface-tertiary for background
 * - Replaced slate-200 with surface-secondary for selected state
 * - Replaced slate-400 with text-tertiary for default icons
 * - Replaced zinc-950 with text-primary for text
 * - Replaced zinc-400 with text-secondary for placeholder
 * - Replaced red-500/red-100 with status-error/status-bg-error for errors
 * - Applied proper focus states with primary color
 * 
 * @refactor Migrated with design system compliance, enhanced accessibility,
 * preserved all card brand icon functionality
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import { useClickOutside } from '@/hooks';
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
  label = 'Select payment method',
  value = null,
  onOptionChange,
  hasError = false,
  onClearError,
  options,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(value);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected option when value prop changes
  useEffect(() => {
    setSelectedOption(value);
  }, [value]);

  // Handle click outside to close dropdown
  useClickOutside(dropdownRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const handleOptionClick = (option: PaymentMethodOption) => {
    setSelectedOption(option.value);
    setIsOpen(false);
    onOptionChange(option.value);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (onClearError) {
      onClearError();
    }
  };

  const getSelectedOptionDisplay = (): string => {
    const selectedOpt = options.find(opt => opt.value === selectedOption);
    return selectedOpt ? selectedOpt.display : label;
  };

  const getSelectedOptionIcon = (): React.JSX.Element | null => {
    const selectedOpt = options.find(opt => opt.value === selectedOption);
    if (!selectedOpt) return null;

    if (selectedOpt.brand) {
      return getCardBrandIcon(selectedOpt.brand);
    }

    return null;
  };

  return (
    <div className="w-full relative mb-2 sm:mb-4" ref={dropdownRef}>
      <div
        className={`relative rounded-md py-2.5 px-3 cursor-pointer ${
          hasError
            ? 'text-status-error bg-status-bg-error ring-2 ring-status-error'
            : isOpen
            ? 'ring-2 ring-primary bg-surface-primary'
            : 'ring-0 bg-surface-tertiary'
        }`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {getSelectedOptionIcon()}
            <span
              className={`${
                hasError
                  ? 'text-sm text-status-error'
                  : selectedOption
                  ? 'text-base text-text-primary'
                  : 'text-sm leading-6 text-text-secondary'
              }`}
            >
              {getSelectedOptionDisplay()}
            </span>
          </div>
          <svg
            className={`w-5 h-5 ${hasError ? 'text-status-error' : 'text-text-secondary'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 rounded-md bg-surface-primary shadow-custom-shadow max-h-60 overflow-auto"
          role="listbox"
        >
          {options.map((option, idx) => (
            <div
              key={idx}
              className={`px-4 py-2 cursor-pointer hover:bg-surface-tertiary flex items-center gap-3 ${
                selectedOption === option.value ? 'bg-surface-secondary' : 'bg-surface-primary'
              }`}
              onClick={() => handleOptionClick(option)}
              role="option"
              aria-selected={selectedOption === option.value}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionClick(option);
                }
              }}
            >
              {option.brand ? getCardBrandIcon(option.brand) : null}
              <span>{option.display}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodDropdown;
