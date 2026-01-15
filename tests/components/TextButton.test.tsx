/**
 * @fileoverview Jest tests for TextButton component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { TextButton } from '@/components/ui/primitives/TextButton';

describe('TextButton Component', () => {
 describe('Basic Rendering', () => {
  it('renders with children content', () => {
   render(<TextButton>Cancel</TextButton>);
   
   expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
   expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('applies default props correctly', () => {
   render(<TextButton>Default</TextButton>);
   
   const button = screen.getByRole('button');
   // Default variant is 'primary', size is 'md', underline is true
   expect(button).toHaveClass('text-text-primary');
   expect(button).toHaveClass('text-sm'); // medium size
   expect(button).toHaveClass('underline');
   expect(button).toHaveAttribute('type', 'button');
  });

  it('renders with custom className', () => {
   render(<TextButton className="custom-class">Custom</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass('custom-class');
  });

  it('forwards HTML button attributes', () => {
   render(
    <TextButton 
     data-testid="text-button-test" 
     id="text-button-1"
     title="Test button"
    >
     Test
    </TextButton>
   );
   
   const button = screen.getByRole('button');
   expect(button).toHaveAttribute('data-testid', 'text-button-test');
   expect(button).toHaveAttribute('id', 'text-button-1');
   expect(button).toHaveAttribute('title', 'Test button');
  });
 });

 describe('Variants', () => {
  it.each([
   ['primary', 'text-text-primary'],
   ['secondary', 'text-text-secondary'],
   ['destructive', 'text-status-error'],
  ])('applies correct class for %s variant', (variant, expectedClass) => {
   render(<TextButton variant={variant as any}>Test</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass(expectedClass);
  });

  it('applies hover and active states for primary variant', () => {
   render(<TextButton variant="primary">Primary</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass('hover:text-text-tertiary');
   expect(button).toHaveClass('active:text-text-tertiary');
  });

  it('applies hover and active states for secondary variant', () => {
   render(<TextButton variant="secondary">Secondary</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass('hover:text-text-primary');
   expect(button).toHaveClass('active:text-text-primary');
  });

  it('applies hover and active states for destructive variant', () => {
   render(<TextButton variant="destructive">Delete</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass('hover:text-red-600');
   expect(button).toHaveClass('active:text-red-700');
  });
 });

 describe('Sizes', () => {
  it.each([
   ['sm', 'text-xs'],
   ['md', 'text-sm'],
   ['lg', 'text-base'],
  ])('applies correct text size for %s size', (size, expectedClass) => {
   render(<TextButton size={size as any}>Test</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass(expectedClass);
  });
 });

 describe('Underline Prop', () => {
  it('shows underline by default', () => {
   render(<TextButton>Default</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass('underline');
  });

  it('shows underline when explicitly set to true', () => {
   render(<TextButton underline={true}>With Underline</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass('underline');
  });

  it('hides underline when set to false', () => {
   render(<TextButton underline={false}>No Underline</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).not.toHaveClass('underline');
  });
 });

 describe('Disabled State', () => {
  it('applies disabled attribute when disabled prop is true', () => {
   render(<TextButton disabled>Disabled</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toBeDisabled();
   expect(button).toHaveClass('disabled:cursor-not-allowed');
   expect(button).toHaveClass('disabled:text-text-secondary');
  });

  it('does not apply disabled styles when not disabled', () => {
   render(<TextButton>Enabled</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).not.toBeDisabled();
  });
 });

 describe('Loading State', () => {
  it('applies disabled state when loading is true', () => {
   render(<TextButton loading>Loading</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toBeDisabled();
   expect(button).toHaveClass('disabled:cursor-not-allowed');
  });

  it('loading state overrides disabled prop', () => {
   render(<TextButton loading disabled={false}>Loading</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toBeDisabled();
  });

  it('combines loading and disabled states', () => {
   render(<TextButton loading disabled>Loading and Disabled</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toBeDisabled();
  });
 });

 describe('Event Handling', () => {
  it('calls onClick handler when clicked', () => {
   const onClick = jest.fn();
   render(<TextButton onClick={onClick}>Clickable</TextButton>);
   
   const button = screen.getByRole('button');
   fireEvent.click(button);
   
   expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
   const onClick = jest.fn();
   render(<TextButton onClick={onClick} disabled>Disabled</TextButton>);
   
   const button = screen.getByRole('button');
   fireEvent.click(button);
   
   expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
   const onClick = jest.fn();
   render(<TextButton onClick={onClick} loading>Loading</TextButton>);
   
   const button = screen.getByRole('button');
   fireEvent.click(button);
   
   expect(onClick).not.toHaveBeenCalled();
  });

  it('handles other mouse events', () => {
   const onMouseEnter = jest.fn();
   const onMouseLeave = jest.fn();
   
   render(
    <TextButton onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
     Hover me
    </TextButton>
   );
   
   const button = screen.getByRole('button');
   fireEvent.mouseEnter(button);
   fireEvent.mouseLeave(button);
   
   expect(onMouseEnter).toHaveBeenCalledTimes(1);
   expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });
 });

 describe('Accessibility', () => {
  it('has button role by default', () => {
   render(<TextButton>Button</TextButton>);
   
   expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has proper type attribute', () => {
   render(<TextButton>Button</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveAttribute('type', 'button');
  });

  it('supports custom type attribute', () => {
   render(<TextButton type="submit">Submit</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveAttribute('type', 'submit');
  });

  it('supports aria-label', () => {
   render(<TextButton aria-label="Close dialog">×</TextButton>);
   
   const button = screen.getByRole('button', { name: 'Close dialog' });
   expect(button).toHaveAttribute('aria-label', 'Close dialog');
  });

  it('applies focus-visible styles for keyboard navigation', () => {
   render(<TextButton>Focusable</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass('focus:outline-none');
   expect(button).toHaveClass('focus-visible:ring-2');
   expect(button).toHaveClass('focus-visible:ring-primary');
   expect(button).toHaveClass('focus-visible:ring-offset-2');
  });
 });

 describe('Forwarded Ref', () => {
  it('forwards ref to button element', () => {
   const ref = { current: null };
   
   render(<TextButton ref={ref}>Ref Test</TextButton>);
   
   expect(ref.current).toBeInstanceOf(HTMLButtonElement);
   expect(ref.current).toHaveTextContent('Ref Test');
  });
 });

 describe('Edge Cases', () => {
  it('renders without children', () => {
   render(<TextButton />);
   
   const button = screen.getByRole('button');
   expect(button).toBeInTheDocument();
   expect(button).toHaveTextContent('');
  });

  it('renders with empty string children', () => {
   render(<TextButton>{''}</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toBeInTheDocument();
   expect(button).toHaveTextContent('');
  });

  it('renders with complex children', () => {
   render(
    <TextButton>
     <span>Complex</span> <strong>Children</strong>
    </TextButton>
   );
   
   const button = screen.getByRole('button');
   expect(button).toHaveTextContent('Complex Children');
   expect(button.querySelector('span')).toHaveTextContent('Complex');
   expect(button.querySelector('strong')).toHaveTextContent('Children');
  });

  it('handles long text content', () => {
   const longText = 'This is a very long text that should be handled gracefully by the TextButton component';
   render(<TextButton>{longText}</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveTextContent(longText);
  });
 });

 describe('CSS Classes', () => {
  it('applies base CSS classes', () => {
   render(<TextButton>Base</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass('inline-flex');
   expect(button).toHaveClass('items-center');
   expect(button).toHaveClass('justify-center');
   expect(button).toHaveClass('font-medium');
   expect(button).toHaveClass('duration-200');
  });

  it('merges custom classes with default classes', () => {
   render(<TextButton className="custom-padding">Custom</TextButton>);
   
   const button = screen.getByRole('button');
   expect(button).toHaveClass('inline-flex'); // base class
   expect(button).toHaveClass('custom-padding'); // custom class
  });
 });
});
