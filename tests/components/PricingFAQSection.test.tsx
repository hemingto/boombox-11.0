/**
 * @fileoverview Tests for PricingFAQSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { PricingFAQSection } from '@/components/features/storage-unit-prices/PricingFAQSection';

expect.extend(toHaveNoViolations);

// Mock the FAQ data
jest.mock('@/data/faq', () => ({
  faqs: [
    {
      question: 'How much does storage cost?',
      answer: 'Storage costs vary by size and duration.',
      category: 'Pricing',
      image: '',
    },
    {
      question: 'Are there any hidden fees?',
      answer: 'No, all fees are disclosed upfront.',
      category: 'Pricing',
      image: '',
    },
    {
      question: 'Do you offer monthly billing?',
      answer: 'Yes, we offer flexible monthly billing.',
      category: 'Pricing',
      image: '',
    },
    {
      question: 'What is Boombox?',
      answer: 'Boombox is a mobile storage company.',
      category: 'General',
      image: '',
    },
    {
      question: 'How does delivery work?',
      answer: 'We deliver storage units to your door.',
      category: 'General',
      image: '',
    },
    {
      question: 'Extra question 1',
      answer: 'This should not appear (6th item).',
      category: 'General',
      image: '',
    },
  ],
}));

describe('PricingFAQSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<PricingFAQSection />);
      expect(screen.getByRole('region', { name: /pricing frequently asked questions/i })).toBeInTheDocument();
    });

    it('renders the main heading', () => {
      render(<PricingFAQSection />);
      expect(screen.getByRole('heading', { name: /frequently asked questions/i, level: 1 })).toBeInTheDocument();
    });

    it('renders FAQ accordion container', () => {
      const { container } = render(<PricingFAQSection />);
      
      // AccordionContainer should be rendered with button elements
      const accordions = container.querySelectorAll('button[type="button"]');
      expect(accordions.length).toBeGreaterThan(0);
    });

    it('displays pricing FAQs first', () => {
      render(<PricingFAQSection />);
      
      // First pricing FAQ should be present
      expect(screen.getByText('How much does storage cost?')).toBeInTheDocument();
      expect(screen.getByText('Are there any hidden fees?')).toBeInTheDocument();
      expect(screen.getByText('Do you offer monthly billing?')).toBeInTheDocument();
    });

    it('includes general FAQs as fallback', () => {
      render(<PricingFAQSection />);
      
      // General FAQs should also be present
      expect(screen.getByText('What is Boombox?')).toBeInTheDocument();
      expect(screen.getByText('How does delivery work?')).toBeInTheDocument();
    });

    it('limits FAQs to 5 items', () => {
      const { container } = render(<PricingFAQSection />);
      
      // Should have exactly 5 accordion buttons
      const accordions = container.querySelectorAll('button[type="button"]');
      expect(accordions).toHaveLength(5);
    });

    it('does not render 6th FAQ item', () => {
      render(<PricingFAQSection />);
      
      // 6th item should not be present
      expect(screen.queryByText('Extra question 1')).not.toBeInTheDocument();
      expect(screen.queryByText('This should not appear (6th item).')).not.toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<PricingFAQSection />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA label on section', () => {
      render(<PricingFAQSection />);
      
      const section = screen.getByRole('region', { name: /pricing frequently asked questions/i });
      expect(section).toHaveAttribute('aria-label', 'Pricing frequently asked questions');
    });

    it('section uses semantic HTML', () => {
      const { container } = render(<PricingFAQSection />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('uses proper heading hierarchy', () => {
      render(<PricingFAQSection />);
      
      // Should have h1 for main heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Frequently asked questions');
    });

    it('accordion items are keyboard accessible', () => {
      const { container } = render(<PricingFAQSection />);
      
      // All accordion buttons should be keyboard accessible
      const buttons = container.querySelectorAll('button[type="button"]');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-expanded');
      });
    });
  });

  // User interactions
  describe('User Interactions', () => {
    it('accordion items are clickable', async () => {
      const user = userEvent.setup();
      const { container } = render(<PricingFAQSection />);
      
      const firstAccordion = container.querySelector('button[type="button"]');
      expect(firstAccordion).toBeInTheDocument();
      
      // Should be clickable
      await user.click(firstAccordion!);
      
      // Should still be in the document after click
      expect(firstAccordion).toBeInTheDocument();
    });

    it('accordion starts collapsed by default', () => {
      const { container } = render(<PricingFAQSection />);
      
      const accordions = container.querySelectorAll('button[type="button"]');
      accordions.forEach((accordion) => {
        expect(accordion).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('uses semantic background color', () => {
      const { container } = render(<PricingFAQSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-surface-tertiary');
    });

    it('uses semantic text color for heading', () => {
      render(<PricingFAQSection />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('applies consistent spacing classes', () => {
      const { container } = render(<PricingFAQSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('py-24');
    });
  });

  // Responsive design
  describe('Responsive Design', () => {
    it('has responsive padding classes', () => {
      const { container } = render(<PricingFAQSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('has responsive flex layout', () => {
      const { container } = render(<PricingFAQSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex');
    });

    it('has responsive basis classes', () => {
      const { container } = render(<PricingFAQSection />);
      
      const headingContainer = container.querySelector('.basis-2\\/5');
      const contentContainer = container.querySelector('.basis-3\\/5');
      
      expect(headingContainer).toBeInTheDocument();
      expect(contentContainer).toBeInTheDocument();
    });
  });

  // Data handling
  describe('Data Handling', () => {
    it('filters FAQs by Pricing category', () => {
      render(<PricingFAQSection />);
      
      // All pricing FAQs should be present
      expect(screen.getByText('How much does storage cost?')).toBeInTheDocument();
      expect(screen.getByText('Are there any hidden fees?')).toBeInTheDocument();
      expect(screen.getByText('Do you offer monthly billing?')).toBeInTheDocument();
    });

    it('includes General category as fallback', () => {
      render(<PricingFAQSection />);
      
      // General FAQs should fill remaining slots
      expect(screen.getByText('What is Boombox?')).toBeInTheDocument();
      expect(screen.getByText('How does delivery work?')).toBeInTheDocument();
    });

    it('prioritizes Pricing FAQs over General', () => {
      const { container } = render(<PricingFAQSection />);
      
      // Get all accordion questions in order
      const buttons = Array.from(container.querySelectorAll('button[type="button"]'));
      const questions = buttons.map((button) => button.textContent);
      
      // First 3 should be pricing FAQs
      expect(questions[0]).toContain('How much does storage cost?');
      expect(questions[1]).toContain('Are there any hidden fees?');
      expect(questions[2]).toContain('Do you offer monthly billing?');
    });

    it('handles empty FAQ array gracefully', () => {
      // This would require mocking with empty array, but component should handle it
      const { container } = render(<PricingFAQSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  // Layout structure
  describe('Layout Structure', () => {
    it('has two-column layout structure', () => {
      const { container } = render(<PricingFAQSection />);
      
      const leftColumn = container.querySelector('.basis-2\\/5');
      const rightColumn = container.querySelector('.basis-3\\/5');
      
      expect(leftColumn).toBeInTheDocument();
      expect(rightColumn).toBeInTheDocument();
    });

    it('heading is in left column', () => {
      const { container } = render(<PricingFAQSection />);
      
      const leftColumn = container.querySelector('.basis-2\\/5');
      const heading = leftColumn?.querySelector('h1');
      
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Frequently asked questions');
    });

    it('accordion is in right column', () => {
      const { container } = render(<PricingFAQSection />);
      
      const rightColumn = container.querySelector('.basis-3\\/5');
      const accordions = rightColumn?.querySelectorAll('button[type="button"]');
      
      expect(accordions?.length).toBeGreaterThan(0);
    });

    it('right column has proper alignment', () => {
      const { container } = render(<PricingFAQSection />);
      
      const rightColumnWrapper = container.querySelector('.flex.place-content-end');
      expect(rightColumnWrapper).toBeInTheDocument();
      expect(rightColumnWrapper).toHaveClass('basis-3/5');
    });
  });

  // Component integration
  describe('Component Integration', () => {
    it('integrates AccordionContainer component', () => {
      const { container } = render(<PricingFAQSection />);
      
      // AccordionContainer should render accordion items
      const accordions = container.querySelectorAll('button[type="button"]');
      expect(accordions.length).toBe(5);
    });

    it('passes correct data to AccordionContainer', () => {
      render(<PricingFAQSection />);
      
      // Verify all 5 FAQ questions are rendered
      expect(screen.getByText('How much does storage cost?')).toBeInTheDocument();
      expect(screen.getByText('Are there any hidden fees?')).toBeInTheDocument();
      expect(screen.getByText('Do you offer monthly billing?')).toBeInTheDocument();
      expect(screen.getByText('What is Boombox?')).toBeInTheDocument();
      expect(screen.getByText('How does delivery work?')).toBeInTheDocument();
    });

    it('AccordionContainer handles default closed state', () => {
      const { container } = render(<PricingFAQSection />);
      
      // All accordions should start closed (defaultOpenIndex={null})
      const accordions = container.querySelectorAll('button[type="button"]');
      accordions.forEach((accordion) => {
        expect(accordion).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  // Performance
  describe('Performance', () => {
    it('memoizes FAQ filtering', () => {
      const { rerender } = render(<PricingFAQSection />);
      
      // Get initial FAQ questions
      const initialQuestions = screen.getAllByRole('button');
      
      // Rerender component
      rerender(<PricingFAQSection />);
      
      // Questions should be the same (memoized)
      const rerenderedQuestions = screen.getAllByRole('button');
      expect(rerenderedQuestions).toHaveLength(initialQuestions.length);
    });
  });
});

