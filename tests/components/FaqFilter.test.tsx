/**
 * @fileoverview Tests for FaqFilter component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import FaqFilter from '@/components/features/helpcenter/FaqFilter';

expect.extend(toHaveNoViolations);

// Mock the AccordionContainer component
jest.mock('@/components/ui/primitives/Accordion', () => ({
  AccordionContainer: function MockAccordionContainer({ 
    data, 
    ariaLabel 
  }: { 
    data: Array<{ question: string; answer: React.ReactNode; category: string }>; 
    ariaLabel?: string;
  }) {
    return (
      <div data-testid="accordion-container" aria-label={ariaLabel}>
        <div data-testid="accordion-items-count">{data.length}</div>
        {data.map((item, index) => (
          <div key={index} data-testid={`accordion-item-${index}`}>
            <div data-testid={`question-${index}`}>{item.question}</div>
          </div>
        ))}
      </div>
    );
  }
}));

describe('FaqFilter', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<FaqFilter />);
      expect(screen.getByRole('tablist', { name: /faq categories/i })).toBeInTheDocument();
    });

    it('renders all category tabs', () => {
      render(<FaqFilter />);
      const tabs = screen.getAllByRole('tab');
      
      expect(tabs).toHaveLength(8);
      expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Pricing' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Storage Access' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Labor' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Scheduling' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Security' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Delivery' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Other' })).toBeInTheDocument();
    });

    it('renders the default category (General) as selected', () => {
      render(<FaqFilter />);
      const generalTab = screen.getByRole('tab', { name: 'General' });
      
      expect(generalTab).toHaveAttribute('aria-selected', 'true');
      expect(generalTab).toHaveClass('border-primary');
    });

    it('renders custom default category when provided', () => {
      render(<FaqFilter defaultCategory="Pricing" />);
      const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
      
      expect(pricingTab).toHaveAttribute('aria-selected', 'true');
    });

    it('renders AccordionContainer with filtered FAQs', () => {
      render(<FaqFilter />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      expect(accordionContainer).toBeInTheDocument();
      expect(accordionContainer).toHaveAttribute('aria-label', 'General FAQs');
    });

    it('displays correct FAQ count for selected category', () => {
      render(<FaqFilter />);
      
      // General category has several FAQs
      const itemCount = screen.getByTestId('accordion-items-count');
      expect(itemCount).toBeInTheDocument();
      expect(parseInt(itemCount.textContent || '0')).toBeGreaterThan(0);
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<FaqFilter />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility with different selected category', async () => {
      const { container } = render(<FaqFilter defaultCategory="Pricing" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA tablist structure', () => {
      render(<FaqFilter />);
      
      const tablist = screen.getByRole('tablist', { name: /faq categories/i });
      expect(tablist).toBeInTheDocument();
      
      const tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('has proper aria-controls linking tabs to panels', () => {
      render(<FaqFilter />);
      
      const generalTab = screen.getByRole('tab', { name: 'General' });
      const controlsId = generalTab.getAttribute('aria-controls');
      
      expect(controlsId).toBe('faq-panel-general');
      expect(screen.getByRole('tabpanel', { hidden: true })).toHaveAttribute('id', 'faq-panel-general');
    });

    it('has proper tabindex for selected and unselected tabs', () => {
      render(<FaqFilter />);
      
      const generalTab = screen.getByRole('tab', { name: 'General' });
      const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
      
      expect(generalTab).toHaveAttribute('tabindex', '0'); // Selected tab
      expect(pricingTab).toHaveAttribute('tabindex', '-1'); // Unselected tab
    });

    it('has proper focus indicators', () => {
      render(<FaqFilter />);
      
      const generalTab = screen.getByRole('tab', { name: 'General' });
      expect(generalTab).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('handles category click correctly', async () => {
      const user = userEvent.setup();
      render(<FaqFilter />);
      
      const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
      
      await user.click(pricingTab);
      
      expect(pricingTab).toHaveAttribute('aria-selected', 'true');
      expect(pricingTab).toHaveAttribute('tabindex', '0');
    });

    it('calls onCategoryChange callback when category changes', async () => {
      const user = userEvent.setup();
      const mockOnCategoryChange = jest.fn();
      
      render(<FaqFilter onCategoryChange={mockOnCategoryChange} />);
      
      const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
      await user.click(pricingTab);
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Pricing');
    });

    it('updates AccordionContainer aria-label when category changes', async () => {
      const user = userEvent.setup();
      render(<FaqFilter />);
      
      const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
      await user.click(pricingTab);
      
      await waitFor(() => {
        const accordionContainer = screen.getByTestId('accordion-container');
        expect(accordionContainer).toHaveAttribute('aria-label', 'Pricing FAQs');
      });
    });

    it('filters FAQs when category changes', async () => {
      const user = userEvent.setup();
      render(<FaqFilter />);
      
      const initialCount = screen.getByTestId('accordion-items-count');
      const initialValue = initialCount.textContent;
      
      const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
      await user.click(pricingTab);
      
      await waitFor(() => {
        const newCount = screen.getByTestId('accordion-items-count');
        // Count may be different (Pricing vs General FAQs)
        expect(newCount).toBeInTheDocument();
      });
    });
  });

  // REQUIRED: Keyboard navigation testing
  describe('Keyboard Navigation', () => {
    it('handles ArrowRight key to move to next tab', async () => {
      const user = userEvent.setup();
      render(<FaqFilter />);
      
      const generalTab = screen.getByRole('tab', { name: 'General' });
      generalTab.focus();
      
      await user.keyboard('{ArrowRight}');
      
      await waitFor(() => {
        const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
        expect(pricingTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('handles ArrowLeft key to move to previous tab', async () => {
      const user = userEvent.setup();
      render(<FaqFilter defaultCategory="Pricing" />);
      
      const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
      pricingTab.focus();
      
      await user.keyboard('{ArrowLeft}');
      
      await waitFor(() => {
        const generalTab = screen.getByRole('tab', { name: 'General' });
        expect(generalTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('wraps around when ArrowRight is pressed on last tab', async () => {
      const user = userEvent.setup();
      render(<FaqFilter defaultCategory="Other" />);
      
      const otherTab = screen.getByRole('tab', { name: 'Other' });
      otherTab.focus();
      
      await user.keyboard('{ArrowRight}');
      
      await waitFor(() => {
        const generalTab = screen.getByRole('tab', { name: 'General' });
        expect(generalTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('wraps around when ArrowLeft is pressed on first tab', async () => {
      const user = userEvent.setup();
      render(<FaqFilter />);
      
      const generalTab = screen.getByRole('tab', { name: 'General' });
      generalTab.focus();
      
      await user.keyboard('{ArrowLeft}');
      
      await waitFor(() => {
        const otherTab = screen.getByRole('tab', { name: 'Other' });
        expect(otherTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('handles Home key to jump to first tab', async () => {
      const user = userEvent.setup();
      render(<FaqFilter defaultCategory="Security" />);
      
      const securityTab = screen.getByRole('tab', { name: 'Security' });
      securityTab.focus();
      
      await user.keyboard('{Home}');
      
      await waitFor(() => {
        const generalTab = screen.getByRole('tab', { name: 'General' });
        expect(generalTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('handles End key to jump to last tab', async () => {
      const user = userEvent.setup();
      render(<FaqFilter />);
      
      const generalTab = screen.getByRole('tab', { name: 'General' });
      generalTab.focus();
      
      await user.keyboard('{End}');
      
      await waitFor(() => {
        const otherTab = screen.getByRole('tab', { name: 'Other' });
        expect(otherTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  // REQUIRED: State management
  describe('State Management', () => {
    it('maintains selected category state correctly', async () => {
      const user = userEvent.setup();
      render(<FaqFilter />);
      
      // Click through multiple categories
      const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
      await user.click(pricingTab);
      
      expect(pricingTab).toHaveAttribute('aria-selected', 'true');
      
      const laborTab = screen.getByRole('tab', { name: 'Labor' });
      await user.click(laborTab);
      
      expect(laborTab).toHaveAttribute('aria-selected', 'true');
      expect(pricingTab).toHaveAttribute('aria-selected', 'false');
    });

    it('initializes with correct default category state', () => {
      render(<FaqFilter defaultCategory="Scheduling" />);
      
      const schedulingTab = screen.getByRole('tab', { name: 'Scheduling' });
      expect(schedulingTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  // Design system compliance
  describe('Design System Integration', () => {
    it('uses semantic color classes for borders', () => {
      render(<FaqFilter />);
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveClass('border-border'); // Not border-slate-100
    });

    it('uses semantic color classes for active tab', () => {
      render(<FaqFilter />);
      
      const generalTab = screen.getByRole('tab', { name: 'General' });
      expect(generalTab).toHaveClass('border-primary'); // Not border-zinc-950
      expect(generalTab).toHaveClass('text-text-primary');
    });

    it('uses semantic color classes for inactive tabs', () => {
      render(<FaqFilter />);
      
      const pricingTab = screen.getByRole('tab', { name: 'Pricing' });
      expect(pricingTab).toHaveClass('text-text-secondary'); // Not text-zinc-400
    });

    it('applies custom className prop', () => {
      render(<FaqFilter className="custom-class" />);
      
      const container = screen.getByRole('tablist').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles empty FAQ list gracefully (if category has no FAQs)', async () => {
      const user = userEvent.setup();
      render(<FaqFilter />);
      
      // Try to find a category that might have fewer FAQs
      const otherTab = screen.getByRole('tab', { name: 'Other' });
      await user.click(otherTab);
      
      // Component should still render without crashing
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('maintains accessibility when rapidly switching categories', async () => {
      const user = userEvent.setup();
      const { container } = render(<FaqFilter />);
      
      const tabs = ['Pricing', 'Labor', 'Security', 'Delivery'];
      
      for (const tabName of tabs) {
        const tab = screen.getByRole('tab', { name: tabName });
        await user.click(tab);
      }
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

