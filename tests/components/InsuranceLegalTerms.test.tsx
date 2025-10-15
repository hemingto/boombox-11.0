/**
 * @fileoverview Tests for InsuranceLegalTerms component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { InsuranceLegalTerms } from '@/components/features/insurance/InsuranceLegalTerms';

expect.extend(toHaveNoViolations);

describe('InsuranceLegalTerms', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays the correct heading text', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Legal terms');
    });

    it('renders as a section element', () => {
      const { container } = render(<InsuranceLegalTerms />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Legal Content', () => {
    it('references Terms of Use agreement', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByText(/Capitalized terms not defined in this Limited Security Warranty Policy/i)).toBeInTheDocument();
    });

    it('describes Limited Security Warranty coverage', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByText(/US \$0.60 per pound in aggregate per User/i)).toBeInTheDocument();
    });

    it('mentions additional protection options', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByText(/You may purchase additional protection of either \$1,000 or \$2,500/i)).toBeInTheDocument();
    });

    it('includes contact phone number', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByText(/\(415\) 322-3135/i)).toBeInTheDocument();
    });

    it('describes prior warranty for legacy accounts', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByText(/if you created a Boombox account prior to January 10, 2017/i)).toBeInTheDocument();
    });

    it('lists warranty requirements', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByText(/have photographs of your Stored Items/i)).toBeInTheDocument();
    });

    it('describes claim investigation process', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByText(/Upon receiving notice of lost or damaged Stored Items/i)).toBeInTheDocument();
    });

    it('lists exclusions and limitations', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByText(/The Limited Security Warranty does not apply to/i)).toBeInTheDocument();
    });

    it('includes sole remedy acknowledgment', () => {
      render(<InsuranceLegalTerms />);
      expect(screen.getByText(/shall be your sole and exclusive remedy/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<InsuranceLegalTerms />);
      await testAccessibility(renderResult);
    });

    it('uses proper heading hierarchy', () => {
      render(<InsuranceLegalTerms />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('uses proper paragraph structure', () => {
      const { container } = render(<InsuranceLegalTerms />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(5);
    });
  });

  describe('Design System Integration', () => {
    it('uses card component styling', () => {
      const { container } = render(<InsuranceLegalTerms />);
      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
    });

    it('uses semantic text colors', () => {
      const { container } = render(<InsuranceLegalTerms />);
      const secondaryText = container.querySelector('.text-text-secondary');
      expect(secondaryText).toBeInTheDocument();
    });

    it('applies proper spacing to content', () => {
      const { container } = render(<InsuranceLegalTerms />);
      const spacedContent = container.querySelector('.space-y-4');
      expect(spacedContent).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('properly escapes special characters', () => {
      render(<InsuranceLegalTerms />);
      // Test for proper HTML entity escaping
      expect(screen.getByText(/Boombox's Terms of Use/i)).toBeInTheDocument();
    });

    it('maintains readability with long paragraphs', () => {
      const { container } = render(<InsuranceLegalTerms />);
      const paragraphs = container.querySelectorAll('p');
      paragraphs.forEach(p => {
        expect(p.textContent?.length).toBeGreaterThan(0);
      });
    });
  });
});

