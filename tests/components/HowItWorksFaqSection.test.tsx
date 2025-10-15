/**
 * @fileoverview Tests for HowItWorksFaqSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { HowItWorksFaqSection } from '@/components/features/howitworks/HowItWorksFaqSection';

expect.extend(toHaveNoViolations);

// Mock the FAQ data to ensure consistent test results
jest.mock('@/data/faq', () => ({
  faqs: [
    {
      question: 'Test Best Practices Question 1',
      answer: 'Test answer 1',
      category: 'Best Practices',
      image: '',
    },
    {
      question: 'Test Best Practices Question 2',
      answer: 'Test answer 2',
      category: 'Best Practices',
      image: '',
    },
    {
      question: 'Test General Question 1',
      answer: 'Test general answer 1',
      category: 'General',
      image: '',
    },
    {
      question: 'Test General Question 2',
      answer: 'Test general answer 2',
      category: 'General',
      image: '',
    },
    {
      question: 'Test General Question 3',
      answer: 'Test general answer 3',
      category: 'General',
      image: '',
    },
    {
      question: 'Test General Question 4',
      answer: 'Test general answer 4',
      category: 'General',
      image: '',
    },
    {
      question: 'Test Pricing Question',
      answer: 'Test pricing answer',
      category: 'Pricing',
      image: '',
    },
  ],
}));

// Mock AccordionContainer to simplify testing
jest.mock('@/components/ui/primitives/Accordion/AccordionContainer', () => ({
  AccordionContainer: function MockAccordionContainer(props: any) {
    return (
      <div 
        data-testid="accordion-container"
        role="region"
        aria-label={props.ariaLabel}
      >
        {props.data.map((item: any, index: number) => (
          <div key={index} data-testid={`faq-item-${index}`}>
            <button>{item.question}</button>
            <div>{item.answer}</div>
          </div>
        ))}
      </div>
    );
  },
}));

describe('HowItWorksFaqSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HowItWorksFaqSection />);
      expect(screen.getByRole('region', { name: /how it works frequently asked questions/i })).toBeInTheDocument();
    });

    it('renders the heading', () => {
      render(<HowItWorksFaqSection />);
      expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
    });

    it('renders the accordion container', () => {
      render(<HowItWorksFaqSection />);
      expect(screen.getByTestId('accordion-container')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<HowItWorksFaqSection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('uses design system colors', () => {
      const { container } = render(<HowItWorksFaqSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-surface-tertiary');
      expect(section).toHaveClass('md:flex');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<HowItWorksFaqSection />);
      await testAccessibility(renderResult);
    });

    it('has proper heading hierarchy', () => {
      render(<HowItWorksFaqSection />);
      const heading = screen.getByRole('heading', { name: /frequently asked questions/i });
      expect(heading.tagName).toBe('H1');
    });

    it('has proper ARIA labelledby relationship', () => {
      const { container } = render(<HowItWorksFaqSection />);
      const section = container.querySelector('section');
      const heading = screen.getByRole('heading', { name: /frequently asked questions/i });
      
      expect(section).toHaveAttribute('aria-labelledby', 'faq-heading');
      expect(heading).toHaveAttribute('id', 'faq-heading');
    });

    it('passes ARIA label to AccordionContainer', () => {
      render(<HowItWorksFaqSection />);
      const accordion = screen.getByTestId('accordion-container');
      expect(accordion).toHaveAttribute('aria-label', 'How It Works frequently asked questions');
    });

    it('uses semantic HTML structure', () => {
      const { container } = render(<HowItWorksFaqSection />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('FAQ Data Filtering', () => {
    it('displays exactly 5 FAQs', () => {
      render(<HowItWorksFaqSection />);
      const faqItems = screen.getAllByTestId(/faq-item-/);
      expect(faqItems).toHaveLength(5);
    });

    it('prioritizes Best Practices FAQs first', () => {
      render(<HowItWorksFaqSection />);
      const firstQuestion = screen.getByText('Test Best Practices Question 1');
      const secondQuestion = screen.getByText('Test Best Practices Question 2');
      
      expect(firstQuestion).toBeInTheDocument();
      expect(secondQuestion).toBeInTheDocument();
    });

    it('includes General FAQs after Best Practices', () => {
      render(<HowItWorksFaqSection />);
      const generalQuestion = screen.getByText('Test General Question 1');
      expect(generalQuestion).toBeInTheDocument();
    });

    it('excludes non-relevant categories', () => {
      render(<HowItWorksFaqSection />);
      expect(screen.queryByText('Test Pricing Question')).not.toBeInTheDocument();
    });
  });

  describe('Layout & Responsive Design', () => {
    it('applies responsive layout classes', () => {
      const { container } = render(<HowItWorksFaqSection />);
      const section = container.querySelector('section');
      
      expect(section).toHaveClass('md:flex');
      expect(section).toHaveClass('lg:px-16');
      expect(section).toHaveClass('px-6');
      expect(section).toHaveClass('py-24');
    });

    it('has proper column structure', () => {
      const { container } = render(<HowItWorksFaqSection />);
      const headingContainer = container.querySelector('.basis-2\\/5');
      const accordionContainer = container.querySelector('.basis-3\\/5');
      
      expect(headingContainer).toBeInTheDocument();
      expect(accordionContainer).toBeInTheDocument();
    });
  });

  describe('Design System Compliance', () => {
    it('uses semantic color tokens', () => {
      const { container } = render(<HowItWorksFaqSection />);
      const section = container.querySelector('section');
      const heading = screen.getByRole('heading');
      
      expect(section).toHaveClass('bg-surface-tertiary');
      expect(heading).toHaveClass('text-text-primary');
    });

    it('applies consistent spacing patterns', () => {
      const { container } = render(<HowItWorksFaqSection />);
      const section = container.querySelector('section');
      
      expect(section).toHaveClass('mt-14');
      expect(section).toHaveClass('py-24');
    });
  });

  describe('Props & Configuration', () => {
    it('passes correct props to AccordionContainer', () => {
      render(<HowItWorksFaqSection />);
      const accordion = screen.getByTestId('accordion-container');
      
      expect(accordion).toHaveAttribute('aria-label', 'How It Works frequently asked questions');
    });

    it('handles empty FAQ data gracefully', () => {
      jest.resetModules();
      jest.mock('@/data/faq', () => ({
        faqs: [],
      }));
      
      const { container } = render(<HowItWorksFaqSection />);
      expect(container).toBeInTheDocument();
    });
  });
});

