/**
 * @fileoverview Tests for VehicleReqList Component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { VehicleReqList } from '@/components/features/vehicle-requirements/VehicleReqList';

expect.extend(toHaveNoViolations);

describe('VehicleReqList', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<VehicleReqList />);
      expect(
        screen.getByRole('region', { name: /vehicle requirements list/i })
      ).toBeInTheDocument();
    });

    it('displays all three requirement sections', () => {
      render(<VehicleReqList />);
      expect(
        screen.getByRole('heading', { name: /introduction/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /minimum vehicle requirements/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /minimum vehicle photo requirements/i })
      ).toBeInTheDocument();
    });

    it('renders all sections as articles', () => {
      const { container } = render(<VehicleReqList />);
      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(3);
    });
  });

  describe('Content Display', () => {
    it('displays introduction text correctly', () => {
      render(<VehicleReqList />);
      expect(
        screen.getByText(
          /we have certain standards and minimum requirements for vehicles/i
        )
      ).toBeInTheDocument();
    });

    it('displays minimum vehicle requirements', () => {
      render(<VehicleReqList />);
      expect(
        screen.getByText(/vehicles must have a towing capacity of 4,000 lbs/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/vehicles must be manufactured in 1995 or later/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/we do not accept rental vehicles/i)
      ).toBeInTheDocument();
    });

    it('displays photo requirements', () => {
      render(<VehicleReqList />);
      expect(
        screen.getByText(
          /vehicle photos must clearly show the front of the vehicle/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/vehicle photos must show the vehicle in good condition/i)
      ).toBeInTheDocument();
    });

    it('renders all requirement items as list items', () => {
      render(<VehicleReqList />);
      const listItems = screen.getAllByRole('listitem');
      // 1 intro + 4 vehicle reqs + 2 photo reqs = 7 total
      expect(listItems).toHaveLength(7);
    });
  });

  describe('Icons and Visual Elements', () => {
    it('displays chevron icons for all list items', () => {
      const { container } = render(<VehicleReqList />);
      const icons = container.querySelectorAll('svg');
      // 7 chevron icons (one per requirement)
      expect(icons.length).toBeGreaterThanOrEqual(7);
    });

    it('chevron icons have proper ARIA attributes', () => {
      const { container } = render(<VehicleReqList />);
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThanOrEqual(7);
    });

    it('chevron icons use design system colors', () => {
      const { container } = render(<VehicleReqList />);
      const chevrons = container.querySelectorAll('.text-text-primary');
      expect(chevrons.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Styling and Design System', () => {
    it('applies semantic border colors', () => {
      const { container } = render(<VehicleReqList />);
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('border-border');
      });
    });

    it('applies consistent spacing between sections', () => {
      const { container } = render(<VehicleReqList />);
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('mb-8');
      });
    });

    it('applies proper padding to requirement cards', () => {
      const { container } = render(<VehicleReqList />);
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('p-6', 'border', 'rounded-md');
      });
    });

    it('has responsive container padding', () => {
      const { container } = render(<VehicleReqList />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<VehicleReqList />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses semantic section element with ARIA label', () => {
      render(<VehicleReqList />);
      const section = screen.getByRole('region', {
        name: /vehicle requirements list/i,
      });
      expect(section).toBeInTheDocument();
    });

    it('uses semantic article elements for requirement blocks', () => {
      const { container } = render(<VehicleReqList />);
      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(3);
    });

    it('all headings are properly nested', () => {
      render(<VehicleReqList />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings).toHaveLength(3);
    });

    it('list items have proper semantic structure', () => {
      render(<VehicleReqList />);
      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(3);
    });

    it('icons are hidden from screen readers', () => {
      const { container } = render(<VehicleReqList />);
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Component Structure', () => {
    it('renders requirement sections in correct order', () => {
      render(<VehicleReqList />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings[0]).toHaveTextContent('Introduction');
      expect(headings[1]).toHaveTextContent('Minimum Vehicle Requirements');
      expect(headings[2]).toHaveTextContent('Minimum Vehicle Photo Requirements');
    });

    it('each requirement has heading followed by list', () => {
      const { container } = render(<VehicleReqList />);
      const articles = container.querySelectorAll('article');

      articles.forEach((article) => {
        const heading = article.querySelector('h2');
        const list = article.querySelector('ul');
        expect(heading).toBeInTheDocument();
        expect(list).toBeInTheDocument();
      });
    });

    it('list items have icon and text structure', () => {
      const { container } = render(<VehicleReqList />);
      const listItems = container.querySelectorAll('li');

      listItems.forEach((li) => {
        expect(li).toHaveClass('flex', 'items-start', 'space-x-2');
        const icon = li.querySelector('svg');
        const text = li.querySelector('p');
        expect(icon).toBeInTheDocument();
        expect(text).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('has mobile-first padding', () => {
      const { container } = render(<VehicleReqList />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('px-6'); // Mobile
      expect(section).toHaveClass('lg:px-16'); // Desktop
    });

    it('maintains consistent spacing at all breakpoints', () => {
      const { container } = render(<VehicleReqList />);
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('p-6'); // Consistent padding
      });
    });
  });
});

