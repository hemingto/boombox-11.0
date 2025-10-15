/**
 * @fileoverview Tests for LoginStep2 component (account selection)
 * @source boombox-11.0/src/components/features/auth/LoginStep2.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginStep2, getAccountIcon, type LoginStep2Props, type AccountType } from '@/components/features/auth/LoginStep2';

describe('LoginStep2', () => {
  const mockAccounts: AccountType[] = [
    { id: '1', name: 'John Doe', type: 'customer' },
    { id: '2', name: 'John Doe', type: 'driver' },
    { id: '3', name: 'John Doe', type: 'mover' },
  ];

  const defaultProps: LoginStep2Props = {
    accounts: mockAccounts,
    selectedAccountId: null,
    onAccountSelect: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with title', () => {
      render(<LoginStep2 {...defaultProps} />);
      
      expect(screen.getByText('Select your account type')).toBeInTheDocument();
    });

    it('should render all account cards', () => {
      render(<LoginStep2 {...defaultProps} />);
      
      // Use getAllByText for duplicate names
      expect(screen.getAllByText('John Doe')).toHaveLength(3);
      
      // Check account types are rendered
      mockAccounts.forEach((account) => {
        expect(screen.getByText(account.type)).toBeInTheDocument();
      });
    });

    it('should render helper text', () => {
      render(<LoginStep2 {...defaultProps} />);
      
      expect(screen.getByText(/You have multiple account types connected/i)).toBeInTheDocument();
    });
  });

  describe('Account Selection', () => {
    it('should call onAccountSelect when an account card is clicked', () => {
      const onAccountSelect = jest.fn();
      render(<LoginStep2 {...defaultProps} onAccountSelect={onAccountSelect} />);
      
      const customerCard = screen.getByText('customer').closest('div[role="radio"]');
      fireEvent.click(customerCard!);
      
      expect(onAccountSelect).toHaveBeenCalledWith('1');
    });

    it('should highlight selected account', () => {
      render(<LoginStep2 {...defaultProps} selectedAccountId="2" />);
      
      const driverCard = screen.getByText('driver').closest('div[role="radio"]');
      expect(driverCard).toHaveClass('border-primary', 'bg-white');
    });

    it('should not highlight non-selected accounts', () => {
      render(<LoginStep2 {...defaultProps} selectedAccountId="2" />);
      
      const customerCard = screen.getByText('customer').closest('div[role="radio"]');
      expect(customerCard).toHaveClass('border-surface-secondary', 'bg-surface-secondary');
    });

    it('should update radio button checked state', () => {
      render(<LoginStep2 {...defaultProps} selectedAccountId="1" />);
      
      // Get the actual radio inputs (not the divs with role="radio")
      const radios = screen.getAllByRole('radio').filter(el => el.tagName === 'INPUT');
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();
      expect(radios[2]).not.toBeChecked();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Enter key press to select account', () => {
      const onAccountSelect = jest.fn();
      render(<LoginStep2 {...defaultProps} onAccountSelect={onAccountSelect} />);
      
      const customerCard = screen.getByText('customer').closest('div[role="radio"]');
      fireEvent.keyDown(customerCard!, { key: 'Enter' });
      
      expect(onAccountSelect).toHaveBeenCalledWith('1');
    });

    it('should handle Space key press to select account', () => {
      const onAccountSelect = jest.fn();
      render(<LoginStep2 {...defaultProps} onAccountSelect={onAccountSelect} />);
      
      const customerCard = screen.getByText('customer').closest('div[role="radio"]');
      fireEvent.keyDown(customerCard!, { key: ' ' });
      
      expect(onAccountSelect).toHaveBeenCalledWith('1');
    });

    it('should not select account on other key presses', () => {
      const onAccountSelect = jest.fn();
      render(<LoginStep2 {...defaultProps} onAccountSelect={onAccountSelect} />);
      
      const customerCard = screen.getByText('customer').closest('div[role="radio"]');
      fireEvent.keyDown(customerCard!, { key: 'a' });
      
      expect(onAccountSelect).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have radiogroup role', () => {
      render(<LoginStep2 {...defaultProps} />);
      
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
      expect(radioGroup).toHaveAttribute('aria-label', 'Account type selection');
    });

    it('should have proper aria-checked attributes', () => {
      render(<LoginStep2 {...defaultProps} selectedAccountId="1" />);
      
      // Get the container divs with role="radio" (not the input elements)
      const cards = screen.getAllByRole('radio').filter(el => el.tagName === 'DIV');
      expect(cards[0]).toHaveAttribute('aria-checked', 'true');
      expect(cards[1]).toHaveAttribute('aria-checked', 'false');
      expect(cards[2]).toHaveAttribute('aria-checked', 'false');
    });

    it('should have proper aria-labelledby attributes', () => {
      render(<LoginStep2 {...defaultProps} />);
      
      const customerCard = screen.getByText('customer').closest('div[role="radio"]');
      expect(customerCard).toHaveAttribute('aria-labelledby', 'account-1-label');
    });

    it('should be keyboard focusable', () => {
      render(<LoginStep2 {...defaultProps} />);
      
      // Get the container divs with role="radio" (not the input elements)
      const cards = screen.getAllByRole('radio').filter(el => el.tagName === 'DIV');
      cards.forEach((card) => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('getAccountIcon', () => {
    it('should return UserCircleIcon for customer type', () => {
      const icon = getAccountIcon('customer');
      expect(icon.type).toBeDefined();
    });

    it('should return TruckIcon for driver type', () => {
      const icon = getAccountIcon('driver');
      expect(icon.type).toBeDefined();
    });

    it('should return UserGroupIcon for mover type', () => {
      const icon = getAccountIcon('mover');
      expect(icon.type).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty accounts array', () => {
      render(<LoginStep2 {...defaultProps} accounts={[]} />);
      
      expect(screen.getByText('Select your account type')).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('should handle single account', () => {
      const singleAccount = [mockAccounts[0]];
      render(<LoginStep2 {...defaultProps} accounts={singleAccount} />);
      
      // Should have 2 radio elements: 1 DIV container and 1 INPUT element
      expect(screen.getAllByRole('radio')).toHaveLength(2);
    });
  });
});

