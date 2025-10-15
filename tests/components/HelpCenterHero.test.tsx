/**
 * @fileoverview Tests for HelpCenterHero component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import HelpCenterHero from '@/components/features/helpcenter/HelpCenterHero';

expect.extend(toHaveNoViolations);

// Mock the HelpIcon component
jest.mock('@/components/icons', () => ({
  HelpIcon: function MockHelpIcon({ className, 'aria-hidden': ariaHidden }: { className?: string; 'aria-hidden'?: boolean }) {
    return (
      <svg 
        data-testid="help-icon" 
        className={className}
        aria-hidden={ariaHidden}
      >
        <title>Help Icon</title>
      </svg>
    );
  }
}));

describe('HelpCenterHero', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HelpCenterHero />);
      expect(screen.getByRole('region', { name: /help center introduction/i })).toBeInTheDocument();
    });

    it('renders with default title', () => {
      render(<HelpCenterHero />);
      expect(screen.getByRole('heading', { level: 1, name: 'Help Center' })).toBeInTheDocument();
    });

    it('renders with default subtitle', () => {
      render(<HelpCenterHero />);
      expect(screen.getByText('let us know how we can help')).toBeInTheDocument();
    });

    it('renders HelpIcon', () => {
      render(<HelpCenterHero />);
      expect(screen.getByTestId('help-icon')).toBeInTheDocument();
    });

    it('renders placeholder by default', () => {
      const { container } = render(<HelpCenterHero />);
      const placeholder = container.querySelector('[role="presentation"]');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass('bg-surface-tertiary');
    });

    it('renders custom title when provided', () => {
      render(<HelpCenterHero title="Custom Help Center" />);
      expect(screen.getByRole('heading', { level: 1, name: 'Custom Help Center' })).toBeInTheDocument();
      expect(screen.queryByText('Help Center')).not.toBeInTheDocument();
    });

    it('renders custom subtitle when provided', () => {
      render(<HelpCenterHero subtitle="We're here to assist you" />);
      expect(screen.getByText("We're here to assist you")).toBeInTheDocument();
      expect(screen.queryByText('let us know how we can help')).not.toBeInTheDocument();
    });

    it('hides placeholder when showPlaceholder is false', () => {
      const { container } = render(<HelpCenterHero showPlaceholder={false} />);
      const placeholder = container.querySelector('[role="presentation"]');
      expect(placeholder).not.toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<HelpCenterHero />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility with custom props', async () => {
      const { container } = render(
        <HelpCenterHero 
          title="Custom Title"
          subtitle="Custom Subtitle"
          showPlaceholder={false}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper semantic HTML structure', () => {
      render(<HelpCenterHero />);
      
      // Section landmark
      expect(screen.getByRole('region', { name: /help center introduction/i })).toBeInTheDocument();
      
      // Heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('has proper ARIA attributes on icon', () => {
      render(<HelpCenterHero />);
      const icon = screen.getByTestId('help-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('has proper ARIA attributes on placeholder', () => {
      const { container } = render(<HelpCenterHero />);
      const placeholder = container.querySelector('[role="presentation"]');
      expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    });

    it('uses proper heading hierarchy', () => {
      render(<HelpCenterHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('has descriptive landmark label', () => {
      render(<HelpCenterHero />);
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-label', 'Help center introduction');
    });
  });

  // REQUIRED: Props testing
  describe('Props Handling', () => {
    it('applies custom className to container', () => {
      render(<HelpCenterHero className="custom-class" />);
      const section = screen.getByRole('region');
      expect(section).toHaveClass('custom-class');
    });

    it('applies custom iconClassName to icon', () => {
      render(<HelpCenterHero iconClassName="custom-icon-class" />);
      const icon = screen.getByTestId('help-icon');
      expect(icon).toHaveClass('custom-icon-class');
    });

    it('preserves default classes when custom className added', () => {
      render(<HelpCenterHero className="custom-class" />);
      const section = screen.getByRole('region');
      expect(section).toHaveClass('custom-class');
      expect(section).toHaveClass('flex-col');
      expect(section).toHaveClass('mt-12');
    });

    it('handles all props together', () => {
      render(
        <HelpCenterHero 
          title="Custom Title"
          subtitle="Custom Subtitle"
          className="custom-class"
          iconClassName="custom-icon"
          showPlaceholder={false}
        />
      );

      expect(screen.getByRole('heading', { name: 'Custom Title' })).toBeInTheDocument();
      expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
      expect(screen.getByRole('region')).toHaveClass('custom-class');
      expect(screen.getByTestId('help-icon')).toHaveClass('custom-icon');
      
      const { container } = render(<HelpCenterHero showPlaceholder={false} />);
      expect(container.querySelector('[role="presentation"]')).not.toBeInTheDocument();
    });
  });

  // Design system compliance
  describe('Design System Integration', () => {
    it('uses semantic color classes for placeholder', () => {
      const { container } = render(<HelpCenterHero />);
      const placeholder = container.querySelector('[role="presentation"]');
      expect(placeholder).toHaveClass('bg-surface-tertiary'); // Not bg-slate-100
    });

    it('uses semantic color classes for subtitle', () => {
      render(<HelpCenterHero />);
      const subtitle = screen.getByText('let us know how we can help');
      expect(subtitle).toHaveClass('text-text-secondary');
    });

    it('uses consistent spacing tokens', () => {
      render(<HelpCenterHero />);
      const section = screen.getByRole('region');
      
      // Check for design system spacing classes
      expect(section).toHaveClass('mt-12', 'sm:mt-24');
      expect(section).toHaveClass('lg:px-16', 'px-6');
      expect(section).toHaveClass('sm:mb-12', 'mb-6');
    });

    it('uses design system icon sizing', () => {
      render(<HelpCenterHero />);
      const icon = screen.getByTestId('help-icon');
      expect(icon).toHaveClass('w-12', 'h-12');
    });
  });

  // Component structure
  describe('Component Structure', () => {
    it('renders semantic section element', () => {
      render(<HelpCenterHero />);
      const section = screen.getByRole('region');
      expect(section.tagName).toBe('SECTION');
    });

    it('renders semantic header element', () => {
      const { container } = render(<HelpCenterHero />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('has proper content hierarchy', () => {
      const { container } = render(<HelpCenterHero />);
      
      const section = screen.getByRole('region');
      const header = container.querySelector('header');
      const heading = screen.getByRole('heading', { level: 1 });
      
      // Header should be inside section
      expect(section.contains(header)).toBe(true);
      
      // Heading should be inside header
      expect(header?.contains(heading)).toBe(true);
    });

    it('renders placeholder with correct dimensions', () => {
      const { container } = render(<HelpCenterHero />);
      const placeholder = container.querySelector('[role="presentation"]');
      
      expect(placeholder).toHaveClass('h-[300px]');
      expect(placeholder).toHaveClass('rounded-md');
      expect(placeholder).toHaveClass('w-full');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles empty string title', () => {
      render(<HelpCenterHero title="" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });

    it('handles empty string subtitle', () => {
      render(<HelpCenterHero subtitle="" />);
      // Should not crash, subtitle exists but is empty
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('handles very long title text', () => {
      const longTitle = 'This is a very long title that might wrap across multiple lines in the interface';
      render(<HelpCenterHero title={longTitle} />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(longTitle);
    });

    it('handles very long subtitle text', () => {
      const longSubtitle = 'This is a very long subtitle that provides extensive information about the help center and what users can expect to find here';
      render(<HelpCenterHero subtitle={longSubtitle} />);
      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });

    it('handles multiple custom classes', () => {
      render(<HelpCenterHero className="class1 class2 class3" />);
      const section = screen.getByRole('region');
      expect(section).toHaveClass('class1', 'class2', 'class3');
    });
  });

  // Responsive behavior
  describe('Responsive Behavior', () => {
    it('has responsive spacing classes', () => {
      render(<HelpCenterHero />);
      const section = screen.getByRole('region');
      
      // Mobile and desktop spacing
      expect(section).toHaveClass('mt-12', 'sm:mt-24');
      expect(section).toHaveClass('mb-6', 'sm:mb-12');
      expect(section).toHaveClass('px-6', 'lg:px-16');
    });

    it('placeholder has responsive padding', () => {
      const { container } = render(<HelpCenterHero />);
      const placeholder = container.querySelector('[role="presentation"]');
      expect(placeholder).toHaveClass('p-24');
    });
  });
});

