/**
 * @fileoverview Jest tests for AccordionContainer component
 * Tests container functionality, state management, and accordion interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccordionContainer } from '@/components/ui/primitives/Accordion/AccordionContainer';
import type { AccordionData } from '@/components/ui/primitives/Accordion/AccordionContainer';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('AccordionContainer', () => {
  const mockOnAccordionChange = jest.fn();

  const sampleData: AccordionData[] = [
    {
      question: 'What is your return policy?',
      answer: 'You can return items within 30 days.',
      category: 'policy',
      image: '/return-policy.jpg',
    },
    {
      question: 'How do I track my order?',
      answer: 'You can track your order using the tracking number provided.',
      category: 'shipping',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept credit cards, PayPal, and bank transfers.',
      category: 'payment',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all accordion items', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
        />
      );

      expect(screen.getByText('What is your return policy?')).toBeInTheDocument();
      expect(screen.getByText('How do I track my order?')).toBeInTheDocument();
      expect(screen.getByText('What payment methods do you accept?')).toBeInTheDocument();
    });

    it('renders with proper ARIA region role', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
        />
      );

      const region = screen.getByLabelText('Accordion group with 3 items');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-label', 'Accordion group with 3 items');
    });

    it('uses custom ARIA label when provided', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          ariaLabel="FAQ Section"
        />
      );

      const region = screen.getByLabelText('FAQ Section');
      expect(region).toHaveAttribute('aria-label', 'FAQ Section');
    });

    it('applies custom className to container', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          className="custom-container-class"
        />
      );

      const container = screen.getByLabelText('Accordion group with 3 items');
      expect(container).toHaveClass('custom-container-class');
    });
  });

  describe('Default State Management', () => {
    it('opens first accordion by default (defaultOpenIndex=0)', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          defaultOpenIndex={0}
        />
      );

      const firstButton = screen.getByText('What is your return policy?').closest('button');
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
      
      const secondButton = screen.getByText('How do I track my order?').closest('button');
      expect(secondButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens specified accordion by default', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          defaultOpenIndex={1}
        />
      );

      const firstButton = screen.getByText('What is your return policy?').closest('button');
      expect(firstButton).toHaveAttribute('aria-expanded', 'false');
      
      const secondButton = screen.getByText('How do I track my order?').closest('button');
      expect(secondButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has no accordions open when defaultOpenIndex is null', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          defaultOpenIndex={null}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Single Accordion Mode (default)', () => {
    it('closes other accordions when opening a new one', async () => {
      const user = userEvent.setup();
      
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          defaultOpenIndex={0}
        />
      );

      // First accordion should be open initially
      const firstButton = screen.getByText('What is your return policy?').closest('button');
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Click second accordion
      const secondButton = screen.getByText('How do I track my order?').closest('button');
      await user.click(secondButton!);

      // First should be closed, second should be open
      expect(firstButton).toHaveAttribute('aria-expanded', 'false');
      expect(secondButton).toHaveAttribute('aria-expanded', 'true');
      expect(mockOnAccordionChange).toHaveBeenCalledWith(1);
    });

    it('closes accordion when clicking it again (without alwaysOpen)', async () => {
      const user = userEvent.setup();
      
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          defaultOpenIndex={0}
          alwaysOpen={false}
        />
      );

      const firstButton = screen.getByText('What is your return policy?').closest('button');
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Click the same accordion
      await user.click(firstButton!);

      expect(firstButton).toHaveAttribute('aria-expanded', 'false');
      expect(mockOnAccordionChange).toHaveBeenCalledWith(0);
    });

    it('keeps accordion open when clicking it with alwaysOpen=true', async () => {
      const user = userEvent.setup();
      
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          defaultOpenIndex={0}
          alwaysOpen={true}
        />
      );

      const firstButton = screen.getByText('What is your return policy?').closest('button');
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Click the same accordion
      await user.click(firstButton!);

      // Should remain open
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
      expect(mockOnAccordionChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Multiple Accordion Mode', () => {
    it('allows multiple accordions to be open simultaneously', async () => {
      const user = userEvent.setup();
      
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          allowMultiple={true}
          defaultOpenIndex={0}
        />
      );

      const firstButton = screen.getByText('What is your return policy?').closest('button');
      const secondButton = screen.getByText('How do I track my order?').closest('button');

      // First accordion should be open initially
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Click second accordion
      await user.click(secondButton!);

      // Both should be open
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
      expect(secondButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('allows closing individual accordions in multiple mode', async () => {
      const user = userEvent.setup();
      
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          allowMultiple={true}
          defaultOpenIndex={0}
        />
      );

      const firstButton = screen.getByText('What is your return policy?').closest('button');
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Click to close
      await user.click(firstButton!);

      expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('respects alwaysOpen in multiple mode when only one accordion is open', async () => {
      const user = userEvent.setup();
      
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          allowMultiple={true}
          alwaysOpen={true}
          defaultOpenIndex={0}
        />
      );

      const firstButton = screen.getByText('What is your return policy?').closest('button');
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Try to close the only open accordion
      await user.click(firstButton!);

      // Should remain open due to alwaysOpen
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Event Handling', () => {
    it('calls onAccordionChange with correct index', async () => {
      const user = userEvent.setup();
      
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
        />
      );

      const secondButton = screen.getByText('How do I track my order?').closest('button');
      await user.click(secondButton!);

      expect(mockOnAccordionChange).toHaveBeenCalledTimes(1);
      expect(mockOnAccordionChange).toHaveBeenCalledWith(1);
    });

    it('calls onAccordionChange for each interaction', async () => {
      const user = userEvent.setup();
      
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          allowMultiple={true}
        />
      );

      const firstButton = screen.getByText('What is your return policy?').closest('button');
      const secondButton = screen.getByText('How do I track my order?').closest('button');

      await user.click(firstButton!);
      await user.click(secondButton!);

      expect(mockOnAccordionChange).toHaveBeenCalledTimes(2);
      expect(mockOnAccordionChange).toHaveBeenNthCalledWith(1, 0);
      expect(mockOnAccordionChange).toHaveBeenNthCalledWith(2, 1);
    });
  });

  describe('Custom Props Propagation', () => {
    it('passes accordionClassName to individual accordions', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          accordionClassName="custom-accordion-class"
        />
      );

      const firstAccordionContainer = screen.getByText('What is your return policy?').closest('div');
      expect(firstAccordionContainer).toHaveClass('custom-accordion-class');
    });

    it('passes contentClassName to accordion content', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
          contentClassName="custom-content-class"
          defaultOpenIndex={0}
        />
      );

      // Find the specific accordion content region by its ID and check for the custom class
      const contentRegion = document.getElementById('accordion-policy-0-content');
      expect(contentRegion).toBeInTheDocument();
      const contentDiv = contentRegion?.querySelector('div');
      expect(contentDiv).toHaveClass('custom-content-class');
    });
  });

  describe('Accordion Data with IDs', () => {
    it('uses custom IDs from accordion data', () => {
      const dataWithIds: AccordionData[] = [
        {
          id: 'custom-return-policy',
          question: 'What is your return policy?',
          answer: 'You can return items within 30 days.',
          category: 'policy',
        },
      ];

      render(
        <AccordionContainer
          data={dataWithIds}
          onAccordionChange={mockOnAccordionChange}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'custom-return-policy-header');
      expect(button).toHaveAttribute('aria-controls', 'custom-return-policy-content');
    });

    it('generates fallback IDs when not provided', () => {
      render(
        <AccordionContainer
          data={sampleData}
          onAccordionChange={mockOnAccordionChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      
      // Check that IDs are generated
      buttons.forEach((button, index) => {
        const id = button.getAttribute('id');
        expect(id).toMatch(/accordion-.*-\d+-header/);
      });
    });
  });
});
