/**
 * @fileoverview Login step 2 - Account type selection for users with multiple accounts
 * @source boombox-10.0/src/app/components/login/loginstep2.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Second step of login flow for users who have multiple account types (customer, driver, mover).
 * Displays a list of account options with radio button selection.
 * Shows appropriate icon for each account type (customer, driver, mover).
 * Allows user to select which account they want to log into.
 * 
 * API ROUTES UPDATED:
 * - N/A (Pure UI component, API calls handled by parent LoginForm)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens (primary, surface-secondary, text colors)
 * - Applied consistent border and background states using design system
 * - Updated hover states to use design system patterns
 * - Improved accessibility with proper ARIA labels and keyboard navigation
 * 
 * @refactor Maintained original radio card selection pattern, enhanced with design system
 * compliance and improved accessibility standards
 */

'use client';

import React from 'react';
import { UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { TruckIcon } from '@/components/icons/TruckIcon';

/**
 * Account type interface
 */
export interface AccountType {
  id: string;
  name: string;
  type: 'customer' | 'driver' | 'mover';
}

/**
 * LoginStep2 props interface
 */
export interface LoginStep2Props {
  /**
   * List of accounts associated with the contact method
   */
  accounts: AccountType[];
  
  /**
   * Currently selected account ID
   */
  selectedAccountId: string | null;
  
  /**
   * Callback when an account is selected
   */
  onAccountSelect: (accountId: string) => void;
  
  /**
   * Callback when back button is clicked
   */
  onBack: () => void;
}

/**
 * Helper function to get the appropriate icon based on account type
 * 
 * @param type - Account type (customer, driver, mover)
 * @returns JSX element for the icon
 */
export function getAccountIcon(type: 'customer' | 'driver' | 'mover') {
  switch (type) {
    case 'customer':
      return <UserCircleIcon className="h-10 w-10 text-primary" />;
    case 'driver':
      return <TruckIcon className="h-10 w-10 text-primary" />;
    case 'mover':
      return <UserGroupIcon className="h-10 w-10 text-primary" />;
    default:
      return <UserCircleIcon className="h-10 w-10 text-primary" />;
  }
}

/**
 * LoginStep2 - Account selection step for multiple account types
 * 
 * @example
 * ```tsx
 * <LoginStep2
 *   accounts={[
 *     { id: '1', name: 'John Doe', type: 'customer' },
 *     { id: '2', name: 'John Doe', type: 'driver' }
 *   ]}
 *   selectedAccountId={selectedId}
 *   onAccountSelect={setSelectedId}
 *   onBack={handleBack}
 * />
 * ```
 */
export function LoginStep2({
  accounts,
  selectedAccountId,
  onAccountSelect,
}: LoginStep2Props) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center">
        <h2 className="mb-8 text-text-primary">Select your account type</h2>
      </div>
      
      {/* Account Selection Cards */}
      <div className="space-y-2" role="radiogroup" aria-label="Account type selection">
        {accounts.map((account) => {
          const isSelected = selectedAccountId === account.id;
          
          return (
            <div
              key={account.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-6 transition-colors ${
                isSelected
                  ? 'border-primary bg-white'
                  : 'border-surface-secondary bg-surface-secondary hover:bg-surface-tertiary'
              }`}
              onClick={() => onAccountSelect(account.id)}
              role="radio"
              aria-checked={isSelected}
              aria-labelledby={`account-${account.id}-label`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAccountSelect(account.id);
                }
              }}
            >
              {/* Account Info */}
              <div className="flex items-center">
                {/* Icon */}
                <div className="mr-4 flex h-10 w-10 items-center justify-center">
                  {getAccountIcon(account.type)}
                </div>
                
                {/* Name and Type */}
                <div>
                  <p id={`account-${account.id}-label`} className="text-text-primary font-medium">
                    {account.name}
                  </p>
                  <p className="text-sm text-text-secondary capitalize">
                    {account.type}
                  </p>
                </div>
              </div>
              
              {/* Radio Button */}
              <div className="flex items-center justify-center">
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => onAccountSelect(account.id)}
                  className={`h-5 w-5 ${
                    isSelected 
                      ? 'accent-primary' 
                      : 'accent-text-disabled'
                  }`}
                  aria-label={`Select ${account.type} account for ${account.name}`}
                  tabIndex={-1}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Helper Text */}
      <p className="mb-8 mt-4 text-sm text-text-primary">
        You have multiple account types connected to your phone number or email. 
        Please select your preferred account.
      </p>
    </div>
  );
}

export default LoginStep2;

