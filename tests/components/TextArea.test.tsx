/**
 * @fileoverview Jest tests for TextArea component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextArea } from '@/components/ui/primitives/TextArea';
import { testAccessibility, accessibilityTestPatterns } from '../utils/accessibility';

describe('TextArea Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders with label', () => {
      render(<TextArea label="Test Label" data-testid="textarea" />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<TextArea placeholder="Enter text here..." data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Enter text here...');
    });

    it('renders with default rows', () => {
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('renders with custom rows', () => {
      render(<TextArea rows={6} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('rows', '6');
    });
  });

  describe('Size Variants', () => {
    it.each([
      ['sm', ['py-2', 'px-2.5', 'text-sm']],
      ['md', ['py-2.5', 'px-3', 'text-md']],
      ['lg', ['py-3', 'px-4', 'text-lg']],
    ])('applies correct classes for %s size', (size, expectedClasses) => {
      render(<TextArea size={size as any} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expectedClasses.forEach(className => {
        expect(textarea).toHaveClass(className);
      });
    });

    it('defaults to medium size when size is not provided', () => {
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('py-2.5', 'px-3', 'text-md');
    });
  });

  describe('States and Variants', () => {
    it('applies error styling when error prop is provided', () => {
      render(<TextArea error="This field is required" data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('input-field--error');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders error message', () => {
      render(<TextArea error="This field is required" id="test-textarea" data-testid="textarea" />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      const errorElement = screen.getByText('This field is required');
      expect(errorElement).toHaveAttribute('id', 'test-textarea-error');
    });

    it('renders helper text when provided', () => {
      render(<TextArea helperText="Please be detailed" id="test-textarea" data-testid="textarea" />);
      
      expect(screen.getByText('Please be detailed')).toBeInTheDocument();
      const helperElement = screen.getByText('Please be detailed');
      expect(helperElement).toHaveAttribute('id', 'test-textarea-helper');
    });

    it('shows required indicator when required is true', () => {
      render(<TextArea label="Required Field" required data-testid="textarea" />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveClass('text-red-500');
    });

    it('applies disabled state correctly', () => {
      render(<TextArea disabled data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeDisabled();
    });

    it('applies fullWidth styling', () => {
      render(<TextArea fullWidth data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('w-full');
    });
  });

  describe('Resize Behavior', () => {
    it.each([
      ['none', 'resize-none'],
      ['vertical', 'resize-y'],
      ['horizontal', 'resize-x'],
      ['both', 'resize'],
    ])('applies correct resize class for %s resize', (resize, expectedClass) => {
      render(<TextArea resize={resize as any} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass(expectedClass);
    });

    it('defaults to vertical resize when resize is not provided', () => {
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('resize-y');
    });
  });

  describe('Event Handling', () => {
    it('calls onChange when content changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      
      render(<TextArea onChange={onChange} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      await user.type(textarea, 'Hello world');
      
      expect(onChange).toHaveBeenCalled();
      expect(textarea).toHaveValue('Hello world');
    });

    it('calls onFocus when textarea is focused', async () => {
      const user = userEvent.setup();
      const onFocus = jest.fn();
      
      render(<TextArea onFocus={onFocus} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      await user.click(textarea);
      
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when textarea loses focus', async () => {
      const user = userEvent.setup();
      const onBlur = jest.fn();
      
      render(<TextArea onBlur={onBlur} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      await user.click(textarea);
      await user.tab(); // Move focus away
      
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('calls onClearError when focused and has error', async () => {
      const user = userEvent.setup();
      const onClearError = jest.fn();
      
      render(
        <TextArea 
          error="Test error" 
          onClearError={onClearError} 
          data-testid="textarea" 
        />
      );
      
      const textarea = screen.getByTestId('textarea');
      await user.click(textarea);
      
      expect(onClearError).toHaveBeenCalledTimes(1);
    });

    it('does not call onClearError when focused without error', async () => {
      const user = userEvent.setup();
      const onClearError = jest.fn();
      
      render(<TextArea onClearError={onClearError} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      await user.click(textarea);
      
      expect(onClearError).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(
        <TextArea 
          label="Test TextArea" 
          id="test-textarea"
          data-testid="textarea" 
        />
      );
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations with error', async () => {
      const renderResult = render(
        <TextArea 
          label="Test TextArea" 
          error="Error message" 
          id="test-textarea"
          data-testid="textarea" 
        />
      );
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations with helper text', async () => {
      const renderResult = render(
        <TextArea 
          label="Test TextArea" 
          helperText="Helper text" 
          id="test-textarea"
          data-testid="textarea" 
        />
      );
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations when disabled', async () => {
      const renderResult = render(
        <TextArea 
          label="Test TextArea" 
          id="test-textarea-disabled"
          disabled 
          data-testid="textarea" 
        />
      );
      await testAccessibility(renderResult);
    });

    it('has proper form field accessibility', async () => {
      const renderResult = render(
        <TextArea 
          label="Test TextArea" 
          id="test-textarea-form"
          data-testid="textarea" 
        />
      );
      await accessibilityTestPatterns.formField(renderResult, 'textbox');
    });

    it('has proper ARIA attributes', () => {
      render(<TextArea label="Test TextArea" data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });

    it('has proper ARIA attributes when error is present', () => {
      render(
        <TextArea 
          label="Test TextArea" 
          error="Error message" 
          id="test-textarea"
          data-testid="textarea" 
        />
      );
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
      expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-error');
    });

    it('has proper ARIA attributes when helper text is present', () => {
      render(
        <TextArea 
          label="Test TextArea" 
          helperText="Helper text" 
          id="test-textarea"
          data-testid="textarea" 
        />
      );
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-helper');
    });

    it('associates label with textarea field', () => {
      render(<TextArea label="Test Label" data-testid="textarea" />);
      
      const label = screen.getByText('Test Label');
      const textarea = screen.getByTestId('textarea');
      
      expect(label.tagName).toBe('LABEL');
      // The association is handled by the form structure
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      
      // Tab to focus
      await user.tab();
      expect(textarea).toHaveFocus();
      
      // Tab away
      await user.tab();
      expect(textarea).not.toHaveFocus();
    });
  });

  describe('Form Integration', () => {
    it('works with controlled value', () => {
      const { rerender } = render(
        <TextArea value="Initial value" onChange={() => {}} data-testid="textarea" />
      );
      
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial value');
      
      rerender(<TextArea value="Updated value" onChange={() => {}} data-testid="textarea" />);
      expect(textarea.value).toBe('Updated value');
    });

    it('works with defaultValue', () => {
      render(<TextArea defaultValue="Default content" data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Default content');
    });

    it('forwards name attribute for form submission', () => {
      render(<TextArea name="test-textarea" data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('name', 'test-textarea');
    });

    it('forwards id attribute', () => {
      render(<TextArea id="custom-id" data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('id', 'custom-id');
    });

    it('works in form submission', () => {
      const onSubmit = jest.fn();
      
      render(
        <form onSubmit={onSubmit}>
          <TextArea name="description" defaultValue="Test content" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('Styling and Customization', () => {
    it('applies custom className', () => {
      render(<TextArea className="custom-textarea" data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('custom-textarea');
    });

    it('maintains design system classes with custom className', () => {
      render(<TextArea className="custom-textarea" data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('input-field', 'custom-textarea');
    });

    it('applies base input-field class', () => {
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('input-field');
    });

    it('combines multiple CSS classes correctly', () => {
      render(
        <TextArea 
          size="lg" 
          fullWidth 
          className="custom-class" 
          data-testid="textarea" 
        />
      );
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass(
        'input-field',
        'py-3',
        'px-4',
        'text-lg',
        'w-full',
        'custom-class'
      );
    });
  });

  describe('Error State Management', () => {
    it('prioritizes error message over helper text', () => {
      render(
        <TextArea 
          error="Error message" 
          helperText="Helper text" 
          data-testid="textarea" 
        />
      );
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('shows helper text when no error is present', () => {
      render(
        <TextArea 
          helperText="Helper text" 
          data-testid="textarea" 
        />
      );
      
      expect(screen.getByText('Helper text')).toBeInTheDocument();
    });

    it('clears error state when onClearError is called on focus', async () => {
      const user = userEvent.setup();
      let hasError = true;
      const onClearError = jest.fn(() => { hasError = false; });
      
      const { rerender } = render(
        <TextArea 
          error={hasError ? "Error message" : ""} 
          onClearError={onClearError} 
          data-testid="textarea" 
        />
      );
      
      const textarea = screen.getByTestId('textarea');
      await user.click(textarea);
      
      expect(onClearError).toHaveBeenCalled();
      
      // Rerender without error to simulate state update
      rerender(
        <TextArea 
          error="" 
          onClearError={onClearError} 
          data-testid="textarea" 
        />
      );
      
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });

  describe('Content Handling', () => {
    it('handles multiline content correctly', async () => {
      const user = userEvent.setup();
      
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      const multilineText = 'Line 1\nLine 2\nLine 3';
      
      await user.type(textarea, multilineText);
      expect(textarea).toHaveValue(multilineText);
    });

    it('preserves line breaks in content', () => {
      const multilineValue = 'Line 1\nLine 2\nLine 3';
      render(
        <TextArea 
          defaultValue={multilineValue} 
          data-testid="textarea" 
        />
      );
      
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe(multilineValue);
      expect(textarea.value).toContain('\n');
    });

    it('handles special characters', () => {
      const specialChars = '@#$%^&*()_+|:<>?[];\',./\"';
      
      render(<TextArea defaultValue={specialChars} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe(specialChars);
    });

    it('handles very long content', async () => {
      const user = userEvent.setup();
      
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      const longText = 'A'.repeat(1000);
      
      // Use paste instead of typing for performance - simulates real user behavior
      // when dealing with large amounts of text
      await user.click(textarea);
      await user.paste(longText);
      
      expect(textarea).toHaveValue(longText);
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      render(<TextArea value={undefined} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('handles zero rows', () => {
      render(<TextArea rows={0} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      // Zero rows is edge case - just verify component renders
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('handles very large row count', () => {
      render(<TextArea rows={100} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('rows', '100');
    });

    it('handles empty string as value', () => {
      render(<TextArea value="" onChange={() => {}} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('handles null as error prop', () => {
      render(<TextArea error={null as any} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).not.toHaveClass('input-field--error');
    });
  });

  describe('Focus Management', () => {
    it('handles focus state changes correctly', async () => {
      const user = userEvent.setup();
      
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      
      // Initial state - not focused
      expect(textarea).not.toHaveFocus();
      
      // Focus
      await user.click(textarea);
      expect(textarea).toHaveFocus();
      
      // Blur
      await user.tab();
      expect(textarea).not.toHaveFocus();
    });

    it('maintains focus during typing', async () => {
      const user = userEvent.setup();
      
      render(<TextArea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      await user.click(textarea);
      
      await user.type(textarea, 'Some text');
      expect(textarea).toHaveFocus();
      expect(textarea).toHaveValue('Some text');
    });
  });

  describe('Performance', () => {
    it('handles rapid value changes without errors', () => {
      const { rerender } = render(<TextArea value="initial" onChange={() => {}} data-testid="textarea" />);
      
      const values = ['first', 'second', 'third', 'fourth', 'fifth'];
      
      values.forEach(value => {
        rerender(<TextArea value={value} onChange={() => {}} data-testid="textarea" />);
        expect(screen.getByTestId('textarea')).toHaveValue(value);
      });
    });

    it('handles rapid prop changes without errors', () => {
      const { rerender } = render(<TextArea size="sm" data-testid="textarea" />);
      
      const sizes = ['sm', 'md', 'lg'] as const;
      const resizeOptions = ['none', 'vertical', 'horizontal', 'both'] as const;
      
      sizes.forEach(size => {
        resizeOptions.forEach(resize => {
          rerender(<TextArea size={size} resize={resize} data-testid="textarea" />);
          expect(screen.getByTestId('textarea')).toBeInTheDocument();
        });
      });
    });
  });
});
