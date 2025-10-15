/**
 * @fileoverview Tests for VehicleReqHero Component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { VehicleReqHero } from '@/components/features/vehicle-requirements/VehicleReqHero';

expect.extend(toHaveNoViolations);

describe('VehicleReqHero', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<VehicleReqHero />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('displays the correct heading text', () => {
      render(<VehicleReqHero />);
      const heading = screen.getByRole('heading', {
        name: /vehicle requirements/i,
        level: 1,
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Vehicle Requirements');
    });

    it('uses semantic header element', () => {
      const { container } = render(<VehicleReqHero />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('w-full', 'my-10', 'sm:my-20');
    });
  });

  describe('Styling', () => {
    it('applies correct spacing classes', () => {
      const { container } = render(<VehicleReqHero />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies responsive margin classes', () => {
      const { container } = render(<VehicleReqHero />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('my-10', 'sm:my-20');
    });

    it('has proper heading bottom margin', () => {
      render(<VehicleReqHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-4');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<VehicleReqHero />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses proper heading hierarchy', () => {
      render(<VehicleReqHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('has semantic HTML structure', () => {
      const { container } = render(<VehicleReqHero />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('heading is properly nested in header', () => {
      const { container } = render(<VehicleReqHero />);
      const header = container.querySelector('header');
      const heading = header?.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has correct component hierarchy', () => {
      const { container } = render(<VehicleReqHero />);
      const header = container.querySelector('header');
      const div = header?.querySelector('div');
      const heading = div?.querySelector('h1');

      expect(header).toBeInTheDocument();
      expect(div).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
    });

    it('heading is the only visible content', () => {
      render(<VehicleReqHero />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeVisible();
      expect(screen.getAllByRole('heading')).toHaveLength(1);
    });
  });

  describe('Responsive Design', () => {
    it('has mobile-first padding classes', () => {
      const { container } = render(<VehicleReqHero />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('px-6'); // Mobile default
      expect(header).toHaveClass('lg:px-16'); // Desktop
    });

    it('has responsive vertical spacing', () => {
      const { container } = render(<VehicleReqHero />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('my-10'); // Mobile
      expect(header).toHaveClass('sm:my-20'); // Tablet/Desktop
    });
  });
});

