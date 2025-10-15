/**
 * @fileoverview Tests for InsuranceProtections component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { InsuranceProtections } from '@/components/features/insurance/InsuranceProtections';

expect.extend(toHaveNoViolations);

describe('InsuranceProtections', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<InsuranceProtections />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays the correct heading text', () => {
      render(<InsuranceProtections />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What we protect against');
    });

    it('displays introductory text', () => {
      render(<InsuranceProtections />);
      expect(screen.getByText('We protect against the following list of damaging events')).toBeInTheDocument();
    });

    it('renders as a section element', () => {
      const { container } = render(<InsuranceProtections />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Protection List', () => {
    const protectionTypes = [
      'Fire',
      'Hurricane',
      'Tornado',
      'Wind',
      'Smoke',
      'Earthquake',
      'Hail',
      'Vandalism',
      'Burglary',
      'Vermin',
      'Flood',
      'Water Leak',
      'Lightning',
    ];

    it('displays all 13 protection types', () => {
      render(<InsuranceProtections />);
      protectionTypes.forEach(protection => {
        expect(screen.getByText(protection)).toBeInTheDocument();
      });
    });

    it('renders protections as a list', () => {
      render(<InsuranceProtections />);
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('has correct number of list items', () => {
      render(<InsuranceProtections />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(13);
    });

    it('displays chevron icons for each protection', () => {
      const { container } = render(<InsuranceProtections />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(13);
    });

    it('renders each protection as a list item', () => {
      render(<InsuranceProtections />);
      protectionTypes.forEach(protection => {
        const item = screen.getByText(protection).closest('li');
        expect(item).toBeInTheDocument();
      });
    });
  });

  describe('Coverage Information', () => {
    it('displays base coverage amount', () => {
      render(<InsuranceProtections />);
      expect(screen.getByText('Our base coverage covers up to $1000 worth of damages')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<InsuranceProtections />);
      await testAccessibility(renderResult);
    });

    it('uses proper heading hierarchy', () => {
      render(<InsuranceProtections />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('marks decorative icons with aria-hidden', () => {
      const { container } = render(<InsuranceProtections />);
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBe(13);
    });

    it('uses semantic list structure', () => {
      render(<InsuranceProtections />);
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });
  });

  describe('Design System Integration', () => {
    it('uses card component styling', () => {
      const { container } = render(<InsuranceProtections />);
      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
    });

    it('uses semantic text colors', () => {
      const { container } = render(<InsuranceProtections />);
      const secondaryText = container.querySelector('.text-text-secondary');
      expect(secondaryText).toBeInTheDocument();
    });

    it('uses primary color for icons', () => {
      const { container } = render(<InsuranceProtections />);
      const icon = container.querySelector('.text-primary');
      expect(icon).toBeInTheDocument();
    });
  });
});

