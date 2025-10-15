/**
 * @fileoverview Tests for MoverSignUpHero component
 * Following boombox-11.0 testing standards
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { MoverSignUpHero } from '@/components/features/moving-partners/MoverSignUpHero';

expect.extend(toHaveNoViolations);

describe('MoverSignUpHero', () => {
  const defaultProps = {
    title: 'Join Our Moving Partner Network',
    description: 'Connect with customers and grow your business',
  };

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<MoverSignUpHero {...defaultProps} />);
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    });

    it('renders title correctly', () => {
      render(<MoverSignUpHero {...defaultProps} />);
      const title = screen.getByText(defaultProps.title);
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');
    });

    it('renders description correctly', () => {
      render(<MoverSignUpHero {...defaultProps} />);
      expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
    });

    it('renders with custom title and description', () => {
      const customProps = {
        title: 'Custom Title',
        description: 'Custom Description',
      };
      render(<MoverSignUpHero {...customProps} />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<MoverSignUpHero {...defaultProps} />);
      await testAccessibility(renderResult);
    });

    it('uses proper heading hierarchy', () => {
      render(<MoverSignUpHero {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(defaultProps.title);
    });

    it('has proper semantic structure', () => {
      const { container } = render(<MoverSignUpHero {...defaultProps} />);
      
      // Should have proper text hierarchy
      const heading = container.querySelector('h1');
      const paragraph = container.querySelector('p');
      
      expect(heading).toBeInTheDocument();
      expect(paragraph).toBeInTheDocument();
    });
  });

  // Component structure testing
  describe('Component Structure', () => {
    it('applies correct CSS classes for layout', () => {
      const { container } = render(<MoverSignUpHero {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      
      expect(wrapper).toHaveClass('flex-col');
      expect(wrapper).toHaveClass('text-center');
    });

    it('applies responsive spacing classes', () => {
      const { container } = render(<MoverSignUpHero {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      
      // Check for responsive margin classes
      expect(wrapper.className).toMatch(/mt-12/);
      expect(wrapper.className).toMatch(/sm:mt-24/);
      expect(wrapper.className).toMatch(/lg:px-16/);
    });
  });
});

