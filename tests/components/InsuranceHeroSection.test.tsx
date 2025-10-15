/**
 * @fileoverview Tests for InsuranceHeroSection component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { InsuranceHeroSection } from '@/components/features/insurance/InsuranceHeroSection';

expect.extend(toHaveNoViolations);

describe('InsuranceHeroSection', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<InsuranceHeroSection />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('displays the correct heading text', () => {
      render(<InsuranceHeroSection />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Insurance Coverage');
    });

    it('displays the descriptive text', () => {
      render(<InsuranceHeroSection />);
      expect(screen.getByText('Make sure your items are protected')).toBeInTheDocument();
    });

    it('renders as a section element', () => {
      const { container } = render(<InsuranceHeroSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<InsuranceHeroSection />);
      await testAccessibility(renderResult);
    });

    it('uses proper heading hierarchy', () => {
      render(<InsuranceHeroSection />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies semantic text color to description', () => {
      render(<InsuranceHeroSection />);
      const description = screen.getByText('Make sure your items are protected');
      expect(description).toHaveClass('text-text-secondary');
    });
  });
});

