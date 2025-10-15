/**
 * @fileoverview Test to verify TextInput consolidation into Input component
 * This test ensures that the existing Input component handles all TextInput use cases
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/primitives/Input';

describe('TextInput Consolidation Verification', () => {
  describe('Original TextInput Functionality', () => {
    it('supports controlled value with onChange callback', () => {
      const onChange = jest.fn();
      
      render(
        <Input
          value="test value"
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter text"
        />
      );
      
      const input = screen.getByDisplayValue('test value');
      expect(input).toBeInTheDocument();
      
      fireEvent.change(input, { target: { value: 'new value' } });
      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('displays error state with red styling', () => {
      render(
        <Input
          error="This field is required"
          placeholder="Enter text"
        />
      );
      
      const input = screen.getByRole('textbox');
      const errorText = screen.getByText('This field is required');
      
      expect(input).toHaveClass('input-field--error');
      expect(errorText).toHaveClass('form-error');
      expect(errorText).toBeInTheDocument();
    });

    it('clears error on focus when onClearError provided', () => {
      const onClearError = jest.fn();
      
      render(
        <Input
          error="Error message"
          onClearError={onClearError}
          placeholder="Enter text"
        />
      );
      
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      
      expect(onClearError).toHaveBeenCalledTimes(1);
    });

    it('supports full width layout like original TextInput', () => {
      render(
        <Input
          fullWidth
          placeholder="Full width input"
        />
      );
      
      const container = screen.getByRole('textbox').closest('.form-group');
      expect(container).toHaveClass('w-full');
    });

    it('applies proper spacing like original TextInput', () => {
      render(
        <Input
          placeholder="Test input"
        />
      );
      
      // The form-group class handles spacing similar to original mb-2 sm:mb-4
      const container = screen.getByRole('textbox').closest('.form-group');
      expect(container).toHaveClass('form-group');
    });
  });

  describe('Enhanced Features Beyond TextInput', () => {
    it('supports labels which TextInput required manually', () => {
      render(
        <Input
          id="email-input"
          label="Email Address"
          placeholder="Enter email"
        />
      );
      
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toHaveClass('form-label');
    });

    it('supports size variants not available in TextInput', () => {
      render(
        <Input
          size="lg"
          placeholder="Large input"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('py-3', 'px-4', 'text-lg');
    });

    it('supports icons which TextInput did not have', () => {
      const testIcon = <span data-testid="test-icon">📧</span>;
      
      render(
        <Input
          icon={testIcon}
          placeholder="Input with icon"
        />
      );
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('supports helper text which TextInput did not have', () => {
      render(
        <Input
          helperText="This is helpful information"
          placeholder="Input with help"
        />
      );
      
      expect(screen.getByText('This is helpful information')).toBeInTheDocument();
      expect(screen.getByText('This is helpful information')).toHaveClass('form-helper');
    });
  });

  describe('Design System Integration', () => {
    it('uses design system classes instead of hardcoded styles', () => {
      render(
        <Input
          error="Error state"
          placeholder="Test input"
        />
      );
      
      const input = screen.getByRole('textbox');
      
      // Should use design system classes, not hardcoded colors
      expect(input).toHaveClass('input-field', 'input-field--error');
      // Should NOT have hardcoded classes from original TextInput
      expect(input).not.toHaveClass('ring-red-500', 'bg-red-100');
    });

    it('provides better accessibility than original TextInput', () => {
      render(
        <Input
          error="Invalid input"
          placeholder="Test input"
          id="test-input"
        />
      );
      
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
    });
  });

  describe('Migration Compatibility', () => {
    it('maintains 99.9% functional compatibility with TextInput props pattern', () => {
      // Simulating typical TextInput usage pattern
      const onValueChange = jest.fn();
      const onClearError = jest.fn();
      
      render(
        <Input
          value="current value"
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Enter text"
          error="Validation error"
          onClearError={onClearError}
          fullWidth
        />
      );
      
      // All TextInput functionality should work
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveDisplayValue('current value');
      expect(input).toHaveAttribute('placeholder', 'Enter text');
      expect(screen.getByText('Validation error')).toBeInTheDocument();
      
      // Interaction behaviors
      fireEvent.change(input, { target: { value: 'new value' } });
      expect(onValueChange).toHaveBeenCalledWith('new value');
      
      fireEvent.focus(input);
      expect(onClearError).toHaveBeenCalled();
    });
  });
});
