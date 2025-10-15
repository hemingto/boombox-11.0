/**
 * @fileoverview Jest tests for Tooltip component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from '@/components/ui/primitives/Tooltip';

describe('Tooltip Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default question mark icon', () => {
      render(<Tooltip text="Test tooltip" />);
      
      expect(screen.getByLabelText('More information')).toBeInTheDocument();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('renders with custom trigger element', () => {
      render(
        <Tooltip text="Custom tooltip">
          <button>Custom trigger</button>
        </Tooltip>
      );
      
      // Should find only the inner button, not a wrapper
      expect(screen.getByText('Custom trigger')).toBeInTheDocument();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('displays tooltip text content', () => {
      render(<Tooltip text="This is the tooltip content" />);
      
      expect(screen.getByText('This is the tooltip content')).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it.each([
      ['top', 'bottom-full mb-2 left-1/2 -translate-x-1/2'],
      ['bottom', 'top-full mt-2 left-1/2 -translate-x-1/2'],
      ['left', 'right-full mr-2 top-1/2 -translate-y-1/2'],
      ['right', 'left-full ml-2 top-1/2 -translate-y-1/2'],
    ])('applies correct positioning classes for %s position', (position, expectedClasses) => {
      render(<Tooltip text="Test" position={position as any} />);
      
      const tooltip = screen.getByRole('tooltip');
      expectedClasses.split(' ').forEach(className => {
        expect(tooltip).toHaveClass(className);
      });
    });
  });

  describe('Icon Sizes', () => {
    it.each([
      ['sm', 'w-3 h-3'],
      ['md', 'w-4 h-4'],
      ['lg', 'w-5 h-5'],
    ])('applies correct size classes for %s icon', (size, expectedClass) => {
      render(<Tooltip text="Test" iconSize={size as any} />);
      
      // Find the trigger wrapper first, then the icon inside it
      const trigger = screen.getByLabelText('More information');
      const icon = trigger.querySelector('svg');
      expect(icon).toHaveClass(expectedClass);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Tooltip text="Accessible tooltip" />);
      
      const trigger = screen.getByRole('button');
      const tooltip = screen.getByRole('tooltip');
      
      expect(trigger).toHaveAttribute('aria-describedby', 'tooltip-content');
      expect(trigger).toHaveAttribute('tabIndex', '0');
      expect(tooltip).toHaveAttribute('id', 'tooltip-content');
      expect(tooltip).toHaveAttribute('role', 'tooltip');
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Tooltip text="Keyboard accessible" />);
      
      const trigger = screen.getByRole('button');
      
      // Tab to focus the trigger
      await user.tab();
      expect(trigger).toHaveFocus();
      
      // Tooltip wrapper should have group class for CSS behavior
      const groupWrapper = trigger.closest('.group');
      expect(groupWrapper).toBeInTheDocument();
    });

    it('has proper screen reader content', () => {
      render(<Tooltip text="Screen reader content" />);
      
      const description = screen.getByText('Screen reader content');
      expect(description).toBeInTheDocument();
    });
  });

  describe('Hover Behavior', () => {
    it('shows tooltip on hover by default', async () => {
      render(<Tooltip text="Hover tooltip" />);
      
      const trigger = screen.getByLabelText('More information');
      const tooltip = screen.getByRole('tooltip');
      
      // Initially hidden
      expect(tooltip).toHaveClass('opacity-0');
      
      // Should show on hover via CSS classes
      expect(tooltip).toHaveClass('group-hover:opacity-100');
    });

    it('applies custom delay timing', () => {
      render(<Tooltip text="Delayed tooltip" delay={500} />);
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle('transition-delay: 500ms');
    });

    it('applies zero delay when specified', () => {
      render(<Tooltip text="No delay tooltip" delay={0} />);
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle('transition-delay: 0ms');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to trigger', () => {
      render(<Tooltip text="Custom" className="custom-trigger" />);
      
      // Find the trigger wrapper first, then the icon inside it
      const trigger = screen.getByLabelText('More information');
      const icon = trigger.querySelector('svg');
      expect(icon).toHaveClass('custom-trigger');
    });

    it('applies custom tooltipClassName to tooltip content', () => {
      render(<Tooltip text="Custom" tooltipClassName="custom-tooltip" />);
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('custom-tooltip');
    });

    it('applies className to custom trigger wrapper', () => {
      render(
        <Tooltip text="Custom" className="wrapper-class">
          <span>Custom trigger</span>
        </Tooltip>
      );
      
      // With custom trigger, className is applied to the wrapper div
      const wrapper = screen.getByText('Custom trigger').closest('.wrapper-class');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('inline-flex', 'items-center', 'wrapper-class');
    });
  });

  describe('Arrow Positioning', () => {
    it('positions arrow correctly for top tooltip', () => {
      render(<Tooltip text="Top tooltip" position="top" />);
      
      // Arrow should be at bottom of tooltip pointing down
      const tooltip = screen.getByRole('tooltip');
      const arrow = tooltip.querySelector('.absolute.w-2.h-2');
      
      expect(arrow).toHaveClass(
        'top-full',
        'left-1/2',
        '-translate-x-1/2',
        '-translate-y-1/2',
        'border-t-0',
        'border-l-0'
      );
    });

    it('positions arrow correctly for bottom tooltip', () => {
      render(<Tooltip text="Bottom tooltip" position="bottom" />);
      
      const tooltip = screen.getByRole('tooltip');
      const arrow = tooltip.querySelector('.absolute.w-2.h-2');
      
      expect(arrow).toHaveClass(
        'bottom-full',
        'left-1/2',
        '-translate-x-1/2',
        'translate-y-1/2',
        'border-b-0',
        'border-r-0'
      );
    });
  });

  describe('Content Wrapping', () => {
    it('applies max-width class for long content', () => {
      const longText = 'This is a very long tooltip text that should wrap to multiple lines when it exceeds the maximum width';
      render(<Tooltip text={longText} />);
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('max-w-xs');
    });

    it('renders long text content correctly', () => {
      const longText = 'This is a very long tooltip text content';
      render(<Tooltip text={longText} />);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe('Custom Trigger Elements', () => {
    it('works with button triggers', () => {
      render(
        <Tooltip text="Button tooltip">
          <button>Click me</button>
        </Tooltip>
      );
      
      expect(screen.getByText('Click me')).toBeInTheDocument();
      expect(screen.getByText('Button tooltip')).toBeInTheDocument();
    });

    it('works with text triggers', () => {
      render(
        <Tooltip text="Text tooltip">
          <span>Hover text</span>
        </Tooltip>
      );
      
      expect(screen.getByText('Hover text')).toBeInTheDocument();
      expect(screen.getByText('Text tooltip')).toBeInTheDocument();
    });

    it('works with icon triggers', () => {
      const TestIcon = () => <svg data-testid="custom-icon" />;
      
      render(
        <Tooltip text="Icon tooltip">
          <TestIcon />
        </Tooltip>
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByText('Icon tooltip')).toBeInTheDocument();
    });
  });
});
