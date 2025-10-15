/**
 * @fileoverview Jest tests for Accordion component
 * Tests component functionality, accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from '@/components/ui/primitives/Accordion/Accordion';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('Accordion', () => {
  const mockToggleAccordion = jest.fn();
  
  const defaultProps = {
    question: 'What is your return policy?',
    answer: 'You can return items within 30 days of purchase.',
    category: 'policy',
    isOpen: false,
    toggleAccordion: mockToggleAccordion,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the accordion with question text', () => {
      render(<Accordion {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('What is your return policy?')).toBeInTheDocument();
    });

    it('renders the answer content when open', () => {
      render(<Accordion {...defaultProps} isOpen={true} />);
      
      expect(screen.getByText('You can return items within 30 days of purchase.')).toBeInTheDocument();
    });

    it('does not render answer content when closed', () => {
      render(<Accordion {...defaultProps} isOpen={false} />);
      
      // Content is rendered but hidden with maxHeight 0
      const content = screen.queryByText('You can return items within 30 days of purchase.');
      expect(content).toBeInTheDocument();
      
      // Check that the container has maxHeight of 0
      const contentContainer = screen.getByRole('region');
      expect(contentContainer).toHaveStyle('max-height: 0px');
    });

    it('renders JSX content in answer', () => {
      const jsxAnswer = (
        <div>
          <p>Complex answer</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      );

      render(<Accordion {...defaultProps} answer={jsxAnswer} isOpen={true} />);
      
      expect(screen.getByText('Complex answer')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('renders image when provided and accordion is open', () => {
      render(
        <Accordion 
          {...defaultProps} 
          image="/test-image.jpg" 
          isOpen={true} 
        />
      );
      
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
      expect(image).toHaveAttribute('alt', 'Illustration for: What is your return policy?');
    });

    it('does not render image when accordion is closed', () => {
      render(
        <Accordion 
          {...defaultProps} 
          image="/test-image.jpg" 
          isOpen={false} 
        />
      );
      
      // Image is rendered but hidden in collapsed accordion
      const image = screen.queryByRole('img');
      expect(image).toBeInTheDocument();
      
      // Check that the container has maxHeight of 0 (effectively hiding the image)
      const contentContainer = screen.getByRole('region');
      expect(contentContainer).toHaveStyle('max-height: 0px');
    });
  });

  describe('User Interactions', () => {
    it('calls toggleAccordion when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Accordion {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockToggleAccordion).toHaveBeenCalledTimes(1);
    });

    it('calls toggleAccordion when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<Accordion {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(mockToggleAccordion).toHaveBeenCalledTimes(1);
    });

    it('calls toggleAccordion when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(<Accordion {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(mockToggleAccordion).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes when closed', () => {
      render(<Accordion {...defaultProps} isOpen={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls');
      expect(button).toHaveAttribute('aria-labelledby');
    });

    it('has proper ARIA attributes when open', () => {
      render(<Accordion {...defaultProps} isOpen={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper role and ARIA attributes on content region', () => {
      render(<Accordion {...defaultProps} isOpen={true} />);
      
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-labelledby');
    });

    it('generates unique IDs for accessibility', () => {
      render(<Accordion {...defaultProps} />);
      
      const button = screen.getByRole('button');
      const buttonId = button.getAttribute('id');
      const ariaControls = button.getAttribute('aria-controls');
      const ariaLabelledBy = button.getAttribute('aria-labelledby');
      
      expect(buttonId).toBeTruthy();
      expect(ariaControls).toBeTruthy();
      expect(ariaLabelledBy).toBe(buttonId);
    });

    it('uses custom ID when provided', () => {
      render(<Accordion {...defaultProps} id="custom-accordion" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'custom-accordion-header');
      expect(button).toHaveAttribute('aria-controls', 'custom-accordion-content');
    });

    it('has proper button type attribute', () => {
      render(<Accordion {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Icons and Visual States', () => {
    it('shows ChevronDownIcon when closed', () => {
      render(<Accordion {...defaultProps} isOpen={false} />);
      
      // Check for the presence of the chevron down icon
      const chevronDown = document.querySelector('[data-testid="chevron-down"]') || 
                         document.querySelector('svg[aria-hidden="true"]');
      expect(chevronDown).toBeInTheDocument();
    });

    it('shows ChevronUpIcon when open', () => {
      render(<Accordion {...defaultProps} isOpen={true} />);
      
      // Check for the presence of the chevron up icon
      const chevronUp = document.querySelector('[data-testid="chevron-up"]') || 
                       document.querySelector('svg[aria-hidden="true"]');
      expect(chevronUp).toBeInTheDocument();
    });
  });

  describe('Custom Classes', () => {
    it('applies custom className to container', () => {
      render(<Accordion {...defaultProps} className="custom-class" />);
      
      const container = screen.getByRole('button').closest('div');
      expect(container).toHaveClass('custom-class');
    });

    it('applies custom contentClassName to content', () => {
      render(
        <Accordion 
          {...defaultProps} 
          contentClassName="custom-content-class" 
          isOpen={true} 
        />
      );
      
      const content = screen.getByRole('region').querySelector('div');
      expect(content).toHaveClass('custom-content-class');
    });
  });

  describe('Animation and Transitions', () => {
    it('applies animation class when open', () => {
      render(<Accordion {...defaultProps} isOpen={true} />);
      
      const contentContainer = screen.getByRole('region');
      expect(contentContainer).toHaveClass('animate-fadeIn');
    });

    it('does not apply animation class when closed', () => {
      render(<Accordion {...defaultProps} isOpen={false} />);
      
      const contentContainer = screen.getByRole('region');
      expect(contentContainer).not.toHaveClass('animate-fadeIn');
    });
  });
});
