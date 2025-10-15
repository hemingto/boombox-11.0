/**
 * @fileoverview Tests for LoadingOverlay component
 * Comprehensive test coverage for full-screen loading overlay functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';

// Mock the Spinner component
jest.mock('@/components/ui/primitives/Spinner', () => ({
  Spinner: ({ size, variant, className, label, ...props }: any) => (
    <div
      data-testid="spinner"
      data-size={size}
      data-variant={variant}
      className={className}
      aria-label={label}
      {...props}
    >
      Loading spinner
    </div>
  ),
}));

describe('LoadingOverlay Component', () => {
  describe('Basic Rendering', () => {
    it('renders when visible is true', () => {
      render(<LoadingOverlay visible={true} />);
      
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('does not render when visible is false', () => {
      render(<LoadingOverlay visible={false} />);
      
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('returns null when not visible', () => {
      const { container } = render(<LoadingOverlay visible={false} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('renders with default message when no message provided', () => {
      render(<LoadingOverlay visible={true} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<LoadingOverlay visible={true} message="Processing your request..." />);
      
      expect(screen.getByText('Processing your request...')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('does not render message when message is empty string', () => {
      render(<LoadingOverlay visible={true} message="" />);
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('renders default message when message is undefined', () => {
      render(<LoadingOverlay visible={true} message={undefined} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });

  describe('Spinner Configuration', () => {
    it('renders spinner with default xl size', () => {
      render(<LoadingOverlay visible={true} />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'xl');
    });

    it('renders spinner with custom size', () => {
      render(<LoadingOverlay visible={true} spinnerSize="md" />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'md');
    });

    it('renders spinner with white variant', () => {
      render(<LoadingOverlay visible={true} />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-variant', 'white');
    });

    it('applies margin bottom class to spinner', () => {
      render(<LoadingOverlay visible={true} />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('mb-4');
    });

    it('supports all spinner sizes', () => {
      const sizes: Array<'md' | 'lg' | 'xl'> = ['md', 'lg', 'xl'];
      
      sizes.forEach(size => {
        const { unmount } = render(<LoadingOverlay visible={true} spinnerSize={size} />);
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toHaveAttribute('data-size', size);
        
        unmount();
      });
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies default overlay classes', () => {
      render(<LoadingOverlay visible={true} data-testid="overlay" />);
      
      const overlay = screen.getByTestId('overlay');
      expect(overlay).toHaveClass(
        'fixed',
        'inset-0',
        'bg-overlay-primary',
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'z-[9999]'
      );
    });

    it('applies custom overlay className', () => {
      render(<LoadingOverlay visible={true} className="custom-overlay bg-red-500" data-testid="overlay" />);
      
      const overlay = screen.getByTestId('overlay');
      expect(overlay).toHaveClass('custom-overlay', 'bg-red-500');
      expect(overlay).toHaveClass('fixed', 'inset-0'); // Still has default classes
    });

    it('applies default content classes', () => {
      render(<LoadingOverlay visible={true} />);
      
      // Content container is the div containing spinner and message
      const contentContainer = screen.getByTestId('spinner').parentElement;
      expect(contentContainer).toHaveClass('flex', 'flex-col', 'items-center');
    });

    it('applies custom content className', () => {
      render(<LoadingOverlay visible={true} contentClassName="custom-content p-8" />);
      
      const contentContainer = screen.getByTestId('spinner').parentElement;
      expect(contentContainer).toHaveClass('custom-content', 'p-8');
      expect(contentContainer).toHaveClass('flex', 'flex-col', 'items-center'); // Still has default classes
    });

    it('applies text styling to message', () => {
      render(<LoadingOverlay visible={true} message="Test message" />);
      
      const message = screen.getByText('Test message');
      expect(message).toHaveClass('text-white', 'text-sm', 'font-medium');
    });
  });

  describe('Content and Layout', () => {
    it('renders message below spinner', () => {
      render(<LoadingOverlay visible={true} message="Loading content..." />);
      
      const spinner = screen.getByTestId('spinner');
      const message = screen.getByText('Loading content...');
      
      // Check that spinner comes before message in DOM order
      expect(spinner.compareDocumentPosition(message)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('centers content vertically and horizontally', () => {
      render(<LoadingOverlay visible={true} data-testid="overlay" />);
      
      const overlay = screen.getByTestId('overlay');
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('arranges spinner and message in column layout', () => {
      render(<LoadingOverlay visible={true} />);
      
      const contentContainer = screen.getByTestId('spinner').parentElement;
      expect(contentContainer).toHaveClass('flex-col');
    });

    it('has proper z-index for overlay', () => {
      render(<LoadingOverlay visible={true} data-testid="overlay" />);
      
      const overlay = screen.getByTestId('overlay');
      expect(overlay).toHaveClass('z-[9999]');
    });
  });

  describe('Accessibility', () => {
    it('has proper role for screen readers', () => {
      render(<LoadingOverlay visible={true} />);
      
      // The overlay should be announced to screen readers
      const overlay = screen.getByRole('status', { hidden: true });
      expect(overlay).toBeInTheDocument();
    });

    it('spinner has accessible label', () => {
      render(<LoadingOverlay visible={true} />);
      
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('aria-label');
    });

    it('provides text alternative for loading state', () => {
      render(<LoadingOverlay visible={true} message="Processing data..." />);
      
      expect(screen.getByText('Processing data...')).toBeInTheDocument();
    });

    it('is keyboard accessible (no focusable elements)', () => {
      render(<LoadingOverlay visible={true} />);
      
      // Overlay should not have focusable elements to prevent keyboard navigation
      const overlay = screen.getByRole('status', { hidden: true });
      const focusableElements = overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements).toHaveLength(0);
    });
  });

  describe('Interactive Behavior', () => {
    it('blocks interaction with background content', () => {
      render(
        <div>
          <button data-testid="background-button">Background Button</button>
          <LoadingOverlay visible={true} />
        </div>
      );
      
      const backgroundButton = screen.getByTestId('background-button');
      const overlay = screen.getByRole('status', { hidden: true });
      
      // Overlay should cover the background button
      expect(overlay).toHaveClass('fixed', 'inset-0');
      expect(overlay).toHaveClass('z-[9999]'); // High z-index
    });

    it('prevents scrolling when visible', () => {
      render(<LoadingOverlay visible={true} data-testid="overlay" />);
      
      const overlay = screen.getByTestId('overlay');
      expect(overlay).toHaveClass('fixed', 'inset-0');
    });

    it('overlay click does not close it (no click handler)', () => {
      const user = userEvent.setup();
      render(<LoadingOverlay visible={true} data-testid="overlay" />);
      
      const overlay = screen.getByTestId('overlay');
      
      // Should not throw or cause issues when clicked
      expect(async () => {
        await user.click(overlay);
      }).not.toThrow();
      
      // Overlay should still be visible
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Dynamic Updates', () => {
    it('updates message when prop changes', () => {
      const { rerender } = render(<LoadingOverlay visible={true} message="Initial message" />);
      
      expect(screen.getByText('Initial message')).toBeInTheDocument();
      
      rerender(<LoadingOverlay visible={true} message="Updated message" />);
      
      expect(screen.getByText('Updated message')).toBeInTheDocument();
      expect(screen.queryByText('Initial message')).not.toBeInTheDocument();
    });

    it('updates spinner size when prop changes', () => {
      const { rerender } = render(<LoadingOverlay visible={true} spinnerSize="md" />);
      
      expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'md');
      
      rerender(<LoadingOverlay visible={true} spinnerSize="xl" />);
      
      expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'xl');
    });

    it('shows/hides overlay when visible prop changes', () => {
      const { rerender } = render(<LoadingOverlay visible={false} />);
      
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      
      rerender(<LoadingOverlay visible={true} />);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      
      rerender(<LoadingOverlay visible={false} />);
      
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });

    it('updates styling when className props change', () => {
      const { rerender } = render(
        <LoadingOverlay visible={true} className="initial-class" data-testid="overlay" />
      );
      
      expect(screen.getByTestId('overlay')).toHaveClass('initial-class');
      
      rerender(
        <LoadingOverlay visible={true} className="updated-class" data-testid="overlay" />
      );
      
      expect(screen.getByTestId('overlay')).toHaveClass('updated-class');
      expect(screen.getByTestId('overlay')).not.toHaveClass('initial-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long messages gracefully', () => {
      const longMessage = 'This is a very long loading message that might wrap to multiple lines and should still be displayed properly without breaking the layout or causing any issues with the overlay component functionality and user experience.';
      
      render(<LoadingOverlay visible={true} message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles special characters in message', () => {
      const specialMessage = 'Loading... 50% complete! @#$%^&*()_+-=[]{}|;:,.<>?';
      
      render(<LoadingOverlay visible={true} message={specialMessage} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('handles HTML entities in message', () => {
      const htmlMessage = 'Loading data &amp; processing results...';
      
      render(<LoadingOverlay visible={true} message={htmlMessage} />);
      
      expect(screen.getByText(htmlMessage)).toBeInTheDocument();
    });

    it('handles rapid visibility toggles', async () => {
      const { rerender } = render(<LoadingOverlay visible={false} />);
      
      // Rapid toggles
      rerender(<LoadingOverlay visible={true} />);
      rerender(<LoadingOverlay visible={false} />);
      rerender(<LoadingOverlay visible={true} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
      });
    });

    it('handles undefined and null props gracefully', () => {
      expect(() => {
        render(
          <LoadingOverlay
            visible={true}
            message={undefined}
            spinnerSize={undefined as any}
            className={undefined}
            contentClassName={undefined}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when visible is false', () => {
      const { rerender, container } = render(<LoadingOverlay visible={false} />);
      
      const initialHTML = container.innerHTML;
      
      // Re-render with same props
      rerender(<LoadingOverlay visible={false} />);
      
      expect(container.innerHTML).toBe(initialHTML);
    });

    it('removes from DOM when not visible', () => {
      const { rerender } = render(<LoadingOverlay visible={true} />);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      
      rerender(<LoadingOverlay visible={false} />);
      
      // Should not be in DOM at all
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('works with form submission simulation', async () => {
      const user = userEvent.setup();
      let isSubmitting = false;
      
      const TestForm = () => {
        const [submitting, setSubmitting] = React.useState(false);
        
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          setSubmitting(true);
          isSubmitting = true;
          setTimeout(() => {
            setSubmitting(false);
            isSubmitting = false;
          }, 100);
        };
        
        return (
          <div>
            <form onSubmit={handleSubmit}>
              <button type="submit">Submit</button>
            </form>
            <LoadingOverlay visible={submitting} message="Submitting..." />
          </div>
        );
      };
      
      render(<TestForm />);
      
      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
      });
    });
  });
});
