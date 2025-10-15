/**
 * @fileoverview Tests for TermsContactInfo component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TermsContactInfo } from '@/components/features/terms/TermsContactInfo';

expect.extend(toHaveNoViolations);

describe('TermsContactInfo', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<TermsContactInfo />);
      expect(screen.getByText('Need to get in touch?')).toBeInTheDocument();
    });

    it('renders the support team message', () => {
      render(<TermsContactInfo />);
      expect(
        screen.getByText('No problem! Contact our support team')
      ).toBeInTheDocument();
    });

    it('displays the phone number', () => {
      render(<TermsContactInfo />);
      expect(screen.getByText('415-322-3135')).toBeInTheDocument();
    });

    it('displays the email address', () => {
      render(<TermsContactInfo />);
      expect(
        screen.getByText('help@boomboxstorage.com')
      ).toBeInTheDocument();
    });

    it('renders with proper card structure', () => {
      const { container } = render(<TermsContactInfo />);
      const card = container.querySelector('.border.border-border.rounded-md');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('p-6');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TermsContactInfo />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses semantic heading structure', () => {
      render(<TermsContactInfo />);
      const heading = screen.getByRole('heading', {
        name: /need to get in touch/i,
      });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('has accessible icon presentation', () => {
      const { container } = render(<TermsContactInfo />);
      // Icons should be decorative (aria-hidden by heroicons)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(2); // Phone and envelope icons
    });
  });

  // REQUIRED: Design System Integration
  describe('Design System', () => {
    it('uses semantic border color', () => {
      const { container } = render(<TermsContactInfo />);
      const card = container.querySelector('.border');
      expect(card).toHaveClass('border-border');
    });

    it('uses semantic text color for icons', () => {
      const { container } = render(<TermsContactInfo />);
      const phoneIcon = container.querySelector('.text-text-primary');
      expect(phoneIcon).toBeInTheDocument();
    });

    it('applies correct spacing classes', () => {
      const { container } = render(<TermsContactInfo />);
      const headerDiv = container.querySelector('.mb-8');
      expect(headerDiv).toBeInTheDocument();
    });
  });

  // REQUIRED: Layout and Structure
  describe('Layout', () => {
    it('has proper flex layout for contact items', () => {
      const { container } = render(<TermsContactInfo />);
      const flexContainers = container.querySelectorAll('.flex');
      expect(flexContainers.length).toBeGreaterThanOrEqual(2);
    });

    it('applies correct icon sizing', () => {
      const { container } = render(<TermsContactInfo />);
      const icons = container.querySelectorAll('.h-6.w-6');
      expect(icons.length).toBe(2); // Phone and envelope icons
    });

    it('has shrink-0 on icons to prevent collapse', () => {
      const { container } = render(<TermsContactInfo />);
      const icons = container.querySelectorAll('.shrink-0');
      expect(icons.length).toBe(2);
    });

    it('applies correct margin to icons', () => {
      const { container } = render(<TermsContactInfo />);
      const icons = container.querySelectorAll('.mr-2');
      expect(icons.length).toBe(2);
    });
  });

  // REQUIRED: Component Behavior
  describe('Content Display', () => {
    it('displays all required text content', () => {
      render(<TermsContactInfo />);

      expect(screen.getByText('Need to get in touch?')).toBeInTheDocument();
      expect(
        screen.getByText('No problem! Contact our support team')
      ).toBeInTheDocument();
      expect(screen.getByText('415-322-3135')).toBeInTheDocument();
      expect(
        screen.getByText('help@boomboxstorage.com')
      ).toBeInTheDocument();
    });

    it('maintains proper content hierarchy', () => {
      const { container } = render(<TermsContactInfo />);
      const heading = container.querySelector('h2');
      const paragraphs = container.querySelectorAll('p');

      expect(heading).toBeInTheDocument();
      expect(paragraphs.length).toBe(3); // Support message, phone, email
    });
  });

  // REQUIRED: Responsive Design
  describe('Responsive Behavior', () => {
    it('has full width container', () => {
      const { container } = render(<TermsContactInfo />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('w-full');
    });

    it('maintains card padding on all screen sizes', () => {
      const { container } = render(<TermsContactInfo />);
      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
    });
  });
});

