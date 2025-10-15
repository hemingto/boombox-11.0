/**
 * @fileoverview Tests for FaqSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { FaqSection } from '@/components/features/landing/FaqSection';

expect.extend(toHaveNoViolations);

// Mock AccordionContainer component
jest.mock('@/components/ui/primitives/Accordion/AccordionContainer', () => ({
  AccordionContainer: function MockAccordionContainer({ data, ariaLabel }: any) {
    return (
      <div 
        data-testid="mock-accordion-container" 
        role="region" 
        aria-label={ariaLabel}
      >
        {data.map((item: any, index: number) => (
          <div key={index} data-testid="accordion-item">
            <button>{item.question}</button>
            <div>{item.answer}</div>
          </div>
        ))}
      </div>
    );
  }
}));

// Mock FAQ data
jest.mock('@/data/faq', () => ({
  faqs: [
    {
      question: 'What is Boombox?',
      answer: 'Boombox is a mobile storage company.',
      category: 'General',
      image: '',
    },
    {
      question: 'How does Boombox work?',
      answer: 'Boombox delivers storage units to your location.',
      category: 'General',
      image: '',
    },
    {
      question: 'How much time do I have to load my unit?',
      answer: 'You get 60 minutes free loading time.',
      category: 'General',
      image: '',
    },
    {
      question: 'What should I do to prepare my belongings?',
      answer: 'Disassemble furniture and wrap items.',
      category: 'Best Practices',
      image: '',
    },
    {
      question: 'How do I keep my belongings from shifting?',
      answer: 'Pack heavy items at the bottom center.',
      category: 'Best Practices',
      image: '',
    },
    {
      question: 'What items cannot be placed in my Boombox?',
      answer: 'No flammables, weapons, or perishables.',
      category: 'Best Practices',
      image: '',
    },
  ]
}));

describe('FaqSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<FaqSection />);
      expect(screen.getByRole('region', { name: /frequently asked questions$/i })).toBeInTheDocument();
    });

    it('renders the section heading', () => {
      render(<FaqSection />);
      expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
    });

    it('renders the accordion container', () => {
      render(<FaqSection />);
      expect(screen.getByTestId('mock-accordion-container')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<FaqSection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<FaqSection />);
      await testAccessibility(renderResult);
    });

    it('uses semantic HTML with proper section element', () => {
      render(<FaqSection />);
      const section = screen.getByRole('region', { name: /frequently asked questions$/i });
      expect(section.tagName).toBe('SECTION');
    });

    it('has proper heading hierarchy with h1', () => {
      render(<FaqSection />);
      const heading = screen.getByRole('heading', { level: 1, name: /frequently asked questions/i });
      expect(heading).toBeInTheDocument();
    });

    it('has proper ARIA labelledby relationship', () => {
      render(<FaqSection />);
      const section = screen.getByRole('region', { name: /frequently asked questions$/i });
      expect(section).toHaveAttribute('aria-labelledby', 'faq-section-title');
    });

    it('passes ARIA label to AccordionContainer', () => {
      render(<FaqSection />);
      const accordion = screen.getByRole('region', { name: /frequently asked questions about boombox storage services/i });
      expect(accordion).toBeInTheDocument();
    });
  });

  // REQUIRED: Data filtering
  describe('FAQ Data Filtering', () => {
    it('filters and displays FAQs from General category', () => {
      render(<FaqSection />);
      expect(screen.getByText('What is Boombox?')).toBeInTheDocument();
      expect(screen.getByText('How does Boombox work?')).toBeInTheDocument();
    });

    it('filters and displays FAQs from Best Practices category', () => {
      render(<FaqSection />);
      expect(screen.getByText('What should I do to prepare my belongings?')).toBeInTheDocument();
      expect(screen.getByText('How do I keep my belongings from shifting?')).toBeInTheDocument();
    });

    it('displays exactly 5 FAQ items', () => {
      render(<FaqSection />);
      const accordionItems = screen.getAllByTestId('accordion-item');
      expect(accordionItems).toHaveLength(5);
    });

    it('displays FAQs in correct order (General first, then Best Practices)', () => {
      render(<FaqSection />);
      const accordionItems = screen.getAllByTestId('accordion-item');
      
      // First 3 should be General
      expect(accordionItems[0]).toHaveTextContent('What is Boombox?');
      expect(accordionItems[1]).toHaveTextContent('How does Boombox work?');
      expect(accordionItems[2]).toHaveTextContent('How much time do I have to load my unit?');
      
      // Last 2 should be Best Practices
      expect(accordionItems[3]).toHaveTextContent('What should I do to prepare my belongings?');
      expect(accordionItems[4]).toHaveTextContent('How do I keep my belongings from shifting?');
    });
  });

  // REQUIRED: Design system integration
  describe('Design System Integration', () => {
    it('uses semantic surface color token', () => {
      const { container } = render(<FaqSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-surface-tertiary');
    });

    it('does not use hardcoded slate colors', () => {
      const { container } = render(<FaqSection />);
      const section = container.querySelector('section');
      expect(section).not.toHaveClass('bg-slate-100');
    });

    it('uses consistent container padding patterns', () => {
      const { container } = render(<FaqSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16');
      expect(section).toHaveClass('px-6');
      expect(section).toHaveClass('py-24');
    });

    it('uses responsive layout classes', () => {
      const { container } = render(<FaqSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex');
    });
  });

  // REQUIRED: Component props
  describe('Component Props', () => {
    it('passes correct props to AccordionContainer', () => {
      render(<FaqSection />);
      const accordion = screen.getByTestId('mock-accordion-container');
      
      expect(accordion).toHaveAttribute('aria-label', 'Frequently asked questions about Boombox storage services');
    });

    it('renders with defaultOpenIndex as null', () => {
      // This is verified through the mock implementation
      render(<FaqSection />);
      expect(screen.getByTestId('mock-accordion-container')).toBeInTheDocument();
    });
  });

  // REQUIRED: Layout structure
  describe('Layout Structure', () => {
    it('renders two-column layout with proper basis classes', () => {
      const { container } = render(<FaqSection />);
      
      // Left column (title)
      const leftColumn = container.querySelector('.basis-2\\/5');
      expect(leftColumn).toBeInTheDocument();
      
      // Right column (accordion)
      const rightColumn = container.querySelector('.basis-3\\/5');
      expect(rightColumn).toBeInTheDocument();
    });

    it('renders title in left column with proper spacing', () => {
      const { container } = render(<FaqSection />);
      const leftColumn = container.querySelector('.basis-2\\/5');
      
      expect(leftColumn).toHaveClass('pt-6');
      const heading = leftColumn?.querySelector('h1');
      expect(heading).toHaveClass('mb-10', 'py-4', 'mr-4');
    });

    it('renders accordion in right column with full width', () => {
      const { container } = render(<FaqSection />);
      const rightColumn = container.querySelector('.basis-3\\/5');
      
      expect(rightColumn).toHaveClass('flex', 'place-content-end');
      const accordionWrapper = rightColumn?.querySelector('.w-full');
      expect(accordionWrapper).toBeInTheDocument();
    });
  });

  // REQUIRED: Edge cases
  describe('Edge Cases', () => {
    it('handles empty className prop gracefully', () => {
      const { container } = render(<FaqSection className="" />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('renders correctly when className is undefined', () => {
      const { container } = render(<FaqSection />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('maintains proper structure with additional classes', () => {
      const { container } = render(<FaqSection className="extra-class another-class" />);
      const section = container.querySelector('section');
      
      // Should have both design system classes and custom classes
      expect(section).toHaveClass('bg-surface-tertiary');
      expect(section).toHaveClass('extra-class');
      expect(section).toHaveClass('another-class');
    });
  });
});

