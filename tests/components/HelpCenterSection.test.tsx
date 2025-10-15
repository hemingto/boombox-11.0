/**
 * @fileoverview Tests for HelpCenterSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { HelpCenterSection } from '@/components/features/landing/HelpCenterSection';

expect.extend(toHaveNoViolations);

// Mock HelpIcon component
jest.mock('@/components/icons', () => ({
  HelpIcon: function MockHelpIcon({ className, ...props }: any) {
    return (
      <svg 
        data-testid="mock-help-icon" 
        className={className}
        {...props}
      >
        <title>Help Icon</title>
      </svg>
    );
  }
}));

describe('HelpCenterSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HelpCenterSection />);
      expect(screen.getByRole('region', { name: /help center call to action/i })).toBeInTheDocument();
    });

    it('renders the help icon', () => {
      render(<HelpCenterSection />);
      expect(screen.getByTestId('mock-help-icon')).toBeInTheDocument();
    });

    it('renders the default heading', () => {
      render(<HelpCenterSection />);
      expect(screen.getByRole('heading', { name: /still have questions\?/i })).toBeInTheDocument();
    });

    it('renders the default description', () => {
      render(<HelpCenterSection />);
      expect(screen.getByText(/no problem! find more answers at our help center page/i)).toBeInTheDocument();
    });

    it('renders the link button with default text', () => {
      render(<HelpCenterSection />);
      expect(screen.getByRole('link', { name: /go to help center/i })).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<HelpCenterSection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<HelpCenterSection />);
      await testAccessibility(renderResult);
    });

    it('uses semantic HTML with proper section element', () => {
      render(<HelpCenterSection />);
      const section = screen.getByRole('region', { name: /help center call to action/i });
      expect(section.tagName).toBe('SECTION');
    });

    it('has proper heading hierarchy with h1', () => {
      render(<HelpCenterSection />);
      const heading = screen.getByRole('heading', { level: 1, name: /still have questions\?/i });
      expect(heading).toBeInTheDocument();
    });

    it('has proper ARIA label on section', () => {
      render(<HelpCenterSection />);
      const section = screen.getByRole('region', { name: /help center call to action/i });
      expect(section).toHaveAttribute('aria-label', 'Help center call to action');
    });

    it('marks icon as decorative with aria-hidden', () => {
      render(<HelpCenterSection />);
      const icon = screen.getByTestId('mock-help-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('has descriptive aria-label on link', () => {
      render(<HelpCenterSection />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label');
      expect(link.getAttribute('aria-label')).toContain('Visit our help center');
    });
  });

  // REQUIRED: Props customization
  describe('Props Customization', () => {
    it('renders custom title', () => {
      render(<HelpCenterSection title="Need more help?" />);
      expect(screen.getByRole('heading', { name: /need more help\?/i })).toBeInTheDocument();
    });

    it('renders custom description', () => {
      render(<HelpCenterSection description="Check out our detailed guides." />);
      expect(screen.getByText(/check out our detailed guides/i)).toBeInTheDocument();
    });

    it('renders custom button text', () => {
      render(<HelpCenterSection buttonText="View Help Center" />);
      expect(screen.getByRole('link', { name: /view help center/i })).toBeInTheDocument();
    });

    it('uses custom help center URL', () => {
      render(<HelpCenterSection helpCenterUrl="/support" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/support');
    });

    it('applies multiple custom props simultaneously', () => {
      render(
        <HelpCenterSection 
          title="Custom Title"
          description="Custom Description"
          buttonText="Custom Button"
          helpCenterUrl="/custom-help"
        />
      );
      
      expect(screen.getByRole('heading', { name: /custom title/i })).toBeInTheDocument();
      expect(screen.getByText(/custom description/i)).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /custom button/i });
      expect(link).toHaveAttribute('href', '/custom-help');
    });
  });

  // REQUIRED: Design system integration
  describe('Design System Integration', () => {
    it('uses semantic surface color tokens', () => {
      const { container } = render(<HelpCenterSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-surface-tertiary');
      
      const card = container.querySelector('.bg-surface-primary');
      expect(card).toBeInTheDocument();
    });

    it('does not use hardcoded slate colors', () => {
      const { container } = render(<HelpCenterSection />);
      const section = container.querySelector('section');
      expect(section).not.toHaveClass('bg-slate-100');
      
      const card = section?.querySelector('div');
      expect(card).not.toHaveClass('bg-white');
    });

    it('uses btn-primary utility class for button', () => {
      render(<HelpCenterSection />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('btn-primary');
    });

    it('does not use inline hardcoded button styles', () => {
      render(<HelpCenterSection />);
      const link = screen.getByRole('link');
      expect(link).not.toHaveClass('bg-zinc-950');
      expect(link).not.toHaveClass('hover:bg-zinc-800');
      expect(link).not.toHaveClass('active:bg-zinc-700');
    });

    it('uses consistent container padding patterns', () => {
      const { container } = render(<HelpCenterSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16');
      expect(section).toHaveClass('px-6');
      expect(section).toHaveClass('pt-14');
      expect(section).toHaveClass('pb-24');
    });

    it('uses responsive layout classes', () => {
      const { container } = render(<HelpCenterSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex');
    });
  });

  // REQUIRED: Link structure and behavior
  describe('Link Structure', () => {
    it('Link wraps button content (correct pattern)', () => {
      render(<HelpCenterSection />);
      const link = screen.getByRole('link');
      expect(link.textContent).toBe('Go to Help Center');
      expect(link.tagName).toBe('A');
    });

    it('has proper href attribute', () => {
      render(<HelpCenterSection />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/help-center');
    });

    it('Link has btn-primary styling', () => {
      render(<HelpCenterSection />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('btn-primary');
    });

    it('does not render button element wrapping Link', () => {
      const { container } = render(<HelpCenterSection />);
      const button = container.querySelector('button');
      expect(button).not.toBeInTheDocument();
    });
  });

  // REQUIRED: Layout structure
  describe('Layout Structure', () => {
    it('renders centered card layout', () => {
      const { container } = render(<HelpCenterSection />);
      const card = container.querySelector('.flex.flex-col.items-center.text-center');
      expect(card).toBeInTheDocument();
    });

    it('card has proper padding', () => {
      const { container } = render(<HelpCenterSection />);
      const card = container.querySelector('.p-24');
      expect(card).toBeInTheDocument();
    });

    it('card has rounded corners', () => {
      const { container } = render(<HelpCenterSection />);
      const card = container.querySelector('.rounded-md');
      expect(card).toBeInTheDocument();
    });

    it('card spans full width', () => {
      const { container } = render(<HelpCenterSection />);
      const card = container.querySelector('.w-full');
      expect(card).toBeInTheDocument();
    });
  });

  // REQUIRED: Icon rendering
  describe('Icon Rendering', () => {
    it('renders help icon with correct size', () => {
      render(<HelpCenterSection />);
      const icon = screen.getByTestId('mock-help-icon');
      expect(icon).toHaveClass('w-16');
    });

    it('icon has bottom margin', () => {
      render(<HelpCenterSection />);
      const icon = screen.getByTestId('mock-help-icon');
      expect(icon).toHaveClass('mb-4');
    });

    it('icon is marked as decorative', () => {
      render(<HelpCenterSection />);
      const icon = screen.getByTestId('mock-help-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // REQUIRED: Content spacing
  describe('Content Spacing', () => {
    it('heading has bottom margin', () => {
      const { container } = render(<HelpCenterSection />);
      const heading = container.querySelector('h1');
      expect(heading).toHaveClass('mb-8');
    });

    it('description has bottom margin', () => {
      const { container } = render(<HelpCenterSection />);
      const description = container.querySelector('p');
      expect(description).toHaveClass('mb-10');
    });

    it('maintains consistent spacing hierarchy', () => {
      const { container } = render(<HelpCenterSection />);
      
      // Icon → mb-4 (smallest)
      const icon = screen.getByTestId('mock-help-icon');
      expect(icon).toHaveClass('mb-4');
      
      // Heading → mb-8 (medium)
      const heading = container.querySelector('h1');
      expect(heading).toHaveClass('mb-8');
      
      // Description → mb-10 (largest before CTA)
      const description = container.querySelector('p');
      expect(description).toHaveClass('mb-10');
    });
  });

  // REQUIRED: Edge cases
  describe('Edge Cases', () => {
    it('handles empty className prop gracefully', () => {
      const { container } = render(<HelpCenterSection className="" />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('renders correctly when className is undefined', () => {
      const { container } = render(<HelpCenterSection />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('maintains proper structure with additional classes', () => {
      const { container } = render(<HelpCenterSection className="extra-class another-class" />);
      const section = container.querySelector('section');
      
      // Should have both design system classes and custom classes
      expect(section).toHaveClass('bg-surface-tertiary');
      expect(section).toHaveClass('extra-class');
      expect(section).toHaveClass('another-class');
    });

    it('handles very long custom text without breaking layout', () => {
      const longTitle = 'A'.repeat(100);
      const longDescription = 'B'.repeat(200);
      const longButtonText = 'C'.repeat(50);
      
      render(
        <HelpCenterSection 
          title={longTitle}
          description={longDescription}
          buttonText={longButtonText}
        />
      );
      
      expect(screen.getByRole('heading')).toHaveTextContent(longTitle);
      expect(screen.getByText(longDescription)).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveTextContent(longButtonText);
    });

    it('handles special characters in props', () => {
      render(
        <HelpCenterSection 
          title="Questions? Contact us!"
          description="We're here 24/7 & ready to help."
          buttonText="Let's Go →"
        />
      );
      
      expect(screen.getByRole('heading', { name: /questions\? contact us!/i })).toBeInTheDocument();
      expect(screen.getByText(/we're here 24\/7 & ready to help/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /let's go/i })).toBeInTheDocument();
    });
  });
});

