/**
 * @fileoverview Tests for LocationsFaqSection component
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { LocationsFaqSection } from '@/components/features/locations/LocationsFaqSection';
import { faqs } from '@/data/faq';

// Mock the AccordionContainer to simplify testing
jest.mock('@/components/ui/primitives/Accordion/AccordionContainer', () => ({
  AccordionContainer: ({ data, ariaLabel }: any) => (
    <div data-testid="accordion-container" aria-label={ariaLabel}>
      {data.map((item: any, index: number) => (
        <div key={index} data-testid={`faq-item-${index}`}>
          <div data-testid="question">{item.question}</div>
          <div data-testid="answer">{item.answer}</div>
        </div>
      ))}
    </div>
  ),
}));

describe('LocationsFaqSection', () => {
  describe('Rendering', () => {
    it('should render with default heading', () => {
      render(<LocationsFaqSection />);
      
      expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
    });
    
    it('should render with custom heading', () => {
      render(<LocationsFaqSection heading="Custom FAQ Heading" />);
      
      expect(screen.getByText('Custom FAQ Heading')).toBeInTheDocument();
      expect(screen.queryByText('Frequently asked questions')).not.toBeInTheDocument();
    });
    
    it('should render AccordionContainer', () => {
      render(<LocationsFaqSection />);
      
      expect(screen.getByTestId('accordion-container')).toBeInTheDocument();
    });
    
    it('should apply custom className', () => {
      const { container } = render(<LocationsFaqSection className="custom-class" />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });
  
  describe('FAQ Filtering', () => {
    it('should filter and display FAQs from Locations and General categories', () => {
      render(<LocationsFaqSection />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      const faqItems = within(accordionContainer).getAllByTestId(/faq-item/);
      
      // Should have 5 FAQs by default
      expect(faqItems).toHaveLength(5);
    });
    
    it('should prioritize Locations FAQs over General FAQs', () => {
      render(<LocationsFaqSection />);
      
      const locationsFaqs = faqs.filter(faq => faq.category === 'Locations');
      const generalFaqs = faqs.filter(faq => faq.category === 'General');
      const expectedFaqs = [...locationsFaqs, ...generalFaqs].slice(0, 5);
      
      const questions = screen.getAllByTestId('question');
      
      // Verify the order matches our expectation (Locations first, then General)
      questions.forEach((question, index) => {
        expect(question).toHaveTextContent(expectedFaqs[index].question);
      });
    });
    
    it('should display correct number of FAQs with custom faqCount', () => {
      render(<LocationsFaqSection faqCount={3} />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      const faqItems = within(accordionContainer).getAllByTestId(/faq-item/);
      
      expect(faqItems).toHaveLength(3);
    });
    
    it('should handle faqCount larger than available FAQs', () => {
      const totalAvailable = faqs.filter(
        faq => faq.category === 'Locations' || faq.category === 'General'
      ).length;
      
      render(<LocationsFaqSection faqCount={1000} />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      const faqItems = within(accordionContainer).getAllByTestId(/faq-item/);
      
      // Should only show what's available
      expect(faqItems.length).toBeLessThanOrEqual(totalAvailable);
    });
    
    it('should handle faqCount of 0', () => {
      render(<LocationsFaqSection faqCount={0} />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      const faqItems = within(accordionContainer).queryAllByTestId(/faq-item/);
      
      expect(faqItems).toHaveLength(0);
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<LocationsFaqSection />);
      
      const section = screen.getByRole('region', { name: /frequently asked questions/i });
      expect(section).toBeInTheDocument();
    });
    
    it('should have proper heading with id', () => {
      render(<LocationsFaqSection />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAttribute('id', 'locations-faq-section-title');
      expect(heading).toHaveTextContent('Frequently asked questions');
    });
    
    it('should have aria-labelledby linking heading to section', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-labelledby', 'locations-faq-section-title');
    });
    
    it('should pass descriptive aria-label to AccordionContainer', () => {
      render(<LocationsFaqSection />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      expect(accordionContainer).toHaveAttribute(
        'aria-label',
        'Frequently asked questions about storage locations and services in your area'
      );
    });
    
    it('should use custom heading in aria-labelledby relationship', () => {
      render(<LocationsFaqSection heading="Custom Heading" />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Custom Heading');
      expect(heading).toHaveAttribute('id', 'locations-faq-section-title');
    });
  });
  
  describe('Layout and Spacing', () => {
    it('should have proper section container classes', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass(
        'md:flex',
        'bg-surface-tertiary',
        'mt-14',
        'lg:px-16',
        'px-6',
        'py-24'
      );
    });
    
    it('should have proper left column layout', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const leftColumn = container.querySelector('.basis-2\\/5');
      expect(leftColumn).toBeInTheDocument();
      expect(leftColumn).toHaveClass('pt-6');
    });
    
    it('should have proper right column layout', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const rightColumn = container.querySelector('.basis-3\\/5');
      expect(rightColumn).toBeInTheDocument();
      expect(rightColumn).toHaveClass('flex', 'place-content-end');
    });
    
    it('should have proper heading spacing', () => {
      render(<LocationsFaqSection />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-10', 'py-4', 'mr-4');
    });
  });
  
  describe('Design System Integration', () => {
    it('should use design system surface color', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-surface-tertiary');
    });
    
    it('should use consistent container padding patterns', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6', 'py-24');
    });
    
    it('should maintain responsive breakpoints', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex');
    });
  });
  
  describe('AccordionContainer Integration', () => {
    it('should pass correct data to AccordionContainer', () => {
      render(<LocationsFaqSection />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      expect(accordionContainer).toBeInTheDocument();
      
      // Should have 5 FAQ items by default
      const faqItems = within(accordionContainer).getAllByTestId(/faq-item/);
      expect(faqItems).toHaveLength(5);
    });
    
    it('should pass empty data for faqCount of 0', () => {
      render(<LocationsFaqSection faqCount={0} />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      const faqItems = within(accordionContainer).queryAllByTestId(/faq-item/);
      
      expect(faqItems).toHaveLength(0);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty heading', () => {
      render(<LocationsFaqSection heading="" />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });
    
    it('should handle very long heading text', () => {
      const longHeading = 'This is a very long FAQ section heading that should still render properly without breaking the layout or causing any accessibility issues';
      render(<LocationsFaqSection heading={longHeading} />);
      
      expect(screen.getByText(longHeading)).toBeInTheDocument();
    });
    
    it('should handle special characters in heading', () => {
      render(<LocationsFaqSection heading="FAQ's & Questions?" />);
      
      expect(screen.getByText("FAQ's & Questions?")).toBeInTheDocument();
    });
    
    it('should handle negative faqCount gracefully', () => {
      render(<LocationsFaqSection faqCount={-1} />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      const faqItems = within(accordionContainer).queryAllByTestId(/faq-item/);
      
      // Negative slice in JavaScript slices from the end, which still returns items
      // Just verify it doesn't crash and returns some FAQs
      expect(faqItems.length).toBeGreaterThan(0);
    });
    
    it('should handle decimal faqCount', () => {
      render(<LocationsFaqSection faqCount={3.7} />);
      
      const accordionContainer = screen.getByTestId('accordion-container');
      const faqItems = within(accordionContainer).getAllByTestId(/faq-item/);
      
      // JavaScript slice with decimal will truncate to 3
      expect(faqItems).toHaveLength(3);
    });
  });
  
  describe('Content Variations', () => {
    it('should render all props together', () => {
      render(
        <LocationsFaqSection
          heading="Custom Heading"
          faqCount={3}
          className="custom-class"
        />
      );
      
      expect(screen.getByText('Custom Heading')).toBeInTheDocument();
      
      const accordionContainer = screen.getByTestId('accordion-container');
      const faqItems = within(accordionContainer).getAllByTestId(/faq-item/);
      expect(faqItems).toHaveLength(3);
      
      const section = screen.getByRole('region');
      expect(section).toHaveClass('custom-class');
    });
  });
  
  describe('Responsive Behavior', () => {
    it('should have mobile-first responsive classes', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex'); // Flex on medium and above
    });
    
    it('should have responsive padding', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6'); // Larger padding on large screens
    });
    
    it('should maintain two-column layout on desktop', () => {
      const { container } = render(<LocationsFaqSection />);
      
      const leftColumn = container.querySelector('.basis-2\\/5');
      const rightColumn = container.querySelector('.basis-3\\/5');
      
      expect(leftColumn).toBeInTheDocument();
      expect(rightColumn).toBeInTheDocument();
    });
  });
  
  describe('FAQ Data Integrity', () => {
    it('should only include Locations and General category FAQs', () => {
      render(<LocationsFaqSection />);
      
      const locationsFaqs = faqs.filter(faq => faq.category === 'Locations');
      const generalFaqs = faqs.filter(faq => faq.category === 'General');
      const expectedCategories = [...locationsFaqs, ...generalFaqs];
      
      const questions = screen.getAllByTestId('question');
      
      questions.forEach(question => {
        const questionText = question.textContent;
        const matchingFaq = expectedCategories.find(faq => faq.question === questionText);
        expect(matchingFaq).toBeDefined();
        expect(['Locations', 'General']).toContain(matchingFaq?.category);
      });
    });
  });
});

