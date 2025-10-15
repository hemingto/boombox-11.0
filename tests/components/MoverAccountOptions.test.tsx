/**
 * @fileoverview Tests for MoverAccountOptions component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MoverAccountOptions } from '@/components/features/service-providers/account/MoverAccountOptions';

expect.extend(toHaveNoViolations);

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return {
    __esModule: true,
    default: MockLink,
  };
});

describe('MoverAccountOptions', () => {
  const defaultProps = {
    icon: <svg data-testid="test-icon" />,
    title: 'Manage Availability',
    description: 'Set your working hours and availability',
    href: '/mover/availability',
  };

  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays the icon', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('displays the title', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Manage Availability');
    });

    it('displays the description', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      expect(screen.getByText('Set your working hours and availability')).toBeInTheDocument();
    });

    it('renders as a link when href is provided and not disabled', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/mover/availability');
    });

    it('does not render as a link when href is not provided', () => {
      const { href, ...propsWithoutHref } = defaultProps;
      render(<MoverAccountOptions {...propsWithoutHref} />);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not render as a link when disabled', () => {
      render(<MoverAccountOptions {...defaultProps} disabled={true} />);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations in enabled state', async () => {
      const { container } = render(<MoverAccountOptions {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in disabled state', async () => {
      const { container } = render(<MoverAccountOptions {...defaultProps} disabled={true} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations without href', async () => {
      const { href, ...propsWithoutHref } = defaultProps;
      const { container } = render(<MoverAccountOptions {...propsWithoutHref} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA label on button', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Manage Availability: Set your working hours and availability');
    });

    it('has proper ARIA label on link', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Navigate to Manage Availability');
    });

    it('has aria-disabled attribute when disabled', () => {
      render(<MoverAccountOptions {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('icon is hidden from screen readers', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const iconContainer = screen.getByTestId('test-icon').parentElement;
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('supports keyboard navigation when enabled', async () => {
      const user = userEvent.setup();
      render(<MoverAccountOptions {...defaultProps} />);
      const link = screen.getByRole('link');
      
      await user.tab();
      expect(link).toHaveFocus();
    });

    it('has visible focus indicator', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary', 'focus:ring-offset-2');
    });
  });

  // User interactions
  describe('User Interactions', () => {
    it('applies hover effect when enabled', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('sm:hover:scale-[102%]');
    });

    it('does not apply hover effect when disabled', () => {
      render(<MoverAccountOptions {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('sm:hover:scale-[102%]');
    });

    it('button is disabled when disabled prop is true', () => {
      render(<MoverAccountOptions {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('button is not disabled when disabled prop is false', () => {
      render(<MoverAccountOptions {...defaultProps} disabled={false} />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('link is clickable when enabled', async () => {
      const user = userEvent.setup();
      render(<MoverAccountOptions {...defaultProps} />);
      const link = screen.getByRole('link');
      
      await user.click(link);
      // Link click behavior is handled by Next.js router
      expect(link).toBeInTheDocument();
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('applies semantic surface color to button', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-surface-primary');
    });

    it('applies semantic text color to title', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('text-text-primary');
    });

    it('applies semantic text color to description', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const description = screen.getByText(defaultProps.description);
      expect(description).toHaveClass('text-text-secondary');
    });

    it('applies custom shadow from design system', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('shadow-custom-shadow');
    });

    it('applies proper disabled styling', () => {
      render(<MoverAccountOptions {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('applies responsive height classes', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-40', 'sm:h-48');
    });

    it('applies transition and transform classes', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transform', 'transition-transform', 'duration-300');
    });
  });

  // Visual states
  describe('Visual States', () => {
    it('shows reduced opacity when disabled', () => {
      render(<MoverAccountOptions {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50');
    });

    it('shows cursor not-allowed when disabled', () => {
      render(<MoverAccountOptions {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('has proper rounded corners', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-2xl');
    });

    it('link wrapper has proper rounded corners', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('rounded-2xl');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles empty title', () => {
      render(<MoverAccountOptions {...defaultProps} title="" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeEmptyDOMElement();
    });

    it('handles empty description', () => {
      render(<MoverAccountOptions {...defaultProps} description="" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles long title text', () => {
      const longTitle = 'A'.repeat(100);
      render(<MoverAccountOptions {...defaultProps} title={longTitle} />);
      expect(screen.getByRole('heading')).toHaveTextContent(longTitle);
    });

    it('handles long description text', () => {
      const longDescription = 'B'.repeat(200);
      render(<MoverAccountOptions {...defaultProps} description={longDescription} />);
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles complex icon components', () => {
      const complexIcon = (
        <div data-testid="complex-icon">
          <span>Icon</span>
          <svg>
            <path d="M10 10" />
          </svg>
        </div>
      );
      render(<MoverAccountOptions {...defaultProps} icon={complexIcon} />);
      expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
    });

    it('handles disabled without href', () => {
      const { href, ...propsWithoutHref } = defaultProps;
      render(<MoverAccountOptions {...propsWithoutHref} disabled={true} />);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('handles undefined disabled prop (defaults to false)', () => {
      const { disabled, ...propsWithoutDisabled } = defaultProps;
      render(<MoverAccountOptions {...propsWithoutDisabled} />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  // Component structure
  describe('Component Structure', () => {
    it('maintains proper heading hierarchy', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it('uses button type attribute', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('uses flexbox layout', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex', 'flex-col');
    });

    it('icon is positioned at start', () => {
      render(<MoverAccountOptions {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('items-start');
    });
  });
});

