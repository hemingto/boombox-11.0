/**
 * @fileoverview Tests for InsuranceRates component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { InsuranceRates } from '@/components/features/insurance/InsuranceRates';

expect.extend(toHaveNoViolations);

describe('InsuranceRates', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<InsuranceRates />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays the correct heading text', () => {
      render(<InsuranceRates />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Rates for insurance coverage');
    });

    it('displays introductory text', () => {
      render(<InsuranceRates />);
      expect(screen.getByText('We offer insurance coverage at the following rates.')).toBeInTheDocument();
    });

    it('renders as a section element', () => {
      const { container } = render(<InsuranceRates />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Insurance Plans', () => {
    it('displays Standard Insurance Coverage plan', () => {
      render(<InsuranceRates />);
      expect(screen.getByText('Standard Insurance Coverage')).toBeInTheDocument();
      expect(screen.getByText('covers up to $1000 per unit')).toBeInTheDocument();
      expect(screen.getByText('$15/mo')).toBeInTheDocument();
    });

    it('displays Premium Insurance Coverage plan', () => {
      render(<InsuranceRates />);
      expect(screen.getByText('Premium Insurance Coverage')).toBeInTheDocument();
      expect(screen.getByText('covers up to $2500 per unit')).toBeInTheDocument();
      expect(screen.getByText('$25/mo')).toBeInTheDocument();
    });

    it('renders shield icons for each plan', () => {
      const { container } = render(<InsuranceRates />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });

    it('displays plan names with proper styling', () => {
      render(<InsuranceRates />);
      const standardPlan = screen.getByText('Standard Insurance Coverage');
      expect(standardPlan).toHaveClass('text-lg', 'font-medium', 'text-text-primary');
    });

    it('displays coverage details with secondary text styling', () => {
      render(<InsuranceRates />);
      const coverage = screen.getByText('covers up to $1000 per unit');
      expect(coverage).toHaveClass('text-sm', 'text-text-secondary');
    });
  });

  describe('Disclaimers', () => {
    it('displays purchase timing disclaimer', () => {
      render(<InsuranceRates />);
      expect(screen.getByText(/All insurance plans must be purchased at the time of your original sign up/i)).toBeInTheDocument();
    });

    it('mentions alternative renter\'s insurance option', () => {
      render(<InsuranceRates />);
      expect(screen.getByText(/You can also opt out of insurance and use your own renter's insurance/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<InsuranceRates />);
      await testAccessibility(renderResult);
    });

    it('uses proper heading hierarchy', () => {
      render(<InsuranceRates />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('marks decorative icons with aria-hidden', () => {
      const { container } = render(<InsuranceRates />);
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Design System Integration', () => {
    it('uses semantic border colors', () => {
      const { container } = render(<InsuranceRates />);
      const borders = container.querySelectorAll('.border-border');
      expect(borders.length).toBeGreaterThan(0);
    });

    it('uses card component styling', () => {
      const { container } = render(<InsuranceRates />);
      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
    });

    it('uses primary color for icons', () => {
      const { container } = render(<InsuranceRates />);
      const icon = container.querySelector('.text-primary');
      expect(icon).toBeInTheDocument();
    });
  });
});

