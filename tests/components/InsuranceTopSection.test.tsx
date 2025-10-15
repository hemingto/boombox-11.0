/**
 * @fileoverview Tests for InsuranceTopSection component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { InsuranceTopSection } from '@/components/features/insurance/InsuranceTopSection';

expect.extend(toHaveNoViolations);

describe('InsuranceTopSection', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<InsuranceTopSection />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays the correct heading text', () => {
      render(<InsuranceTopSection />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Protect your belongings');
    });

    it('displays the full introductory text', () => {
      render(<InsuranceTopSection />);
      expect(screen.getByText(/If your belongings are worth storing/i)).toBeInTheDocument();
      expect(screen.getByText(/we are not responsible for damage or loss/i)).toBeInTheDocument();
    });

    it('renders as a section element', () => {
      const { container } = render(<InsuranceTopSection />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('uses card component styling', () => {
      const { container } = render(<InsuranceTopSection />);
      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<InsuranceTopSection />);
      await testAccessibility(renderResult);
    });

    it('uses proper heading hierarchy', () => {
      render(<InsuranceTopSection />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('mentions Boombox storage facility', () => {
      render(<InsuranceTopSection />);
      expect(screen.getByText(/Boombox Self-Storage facility/i)).toBeInTheDocument();
    });

    it('explains responsibility disclaimer', () => {
      render(<InsuranceTopSection />);
      expect(screen.getByText(/we are not responsible for damage or loss/i)).toBeInTheDocument();
    });
  });
});

