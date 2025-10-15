/**
 * @fileoverview Tests for VehicleReqPictures Component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { VehicleReqPictures } from '@/components/features/vehicle-requirements/VehicleReqPictures';

expect.extend(toHaveNoViolations);

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    className?: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe('VehicleReqPictures', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<VehicleReqPictures />);
      expect(
        screen.getByRole('heading', { name: /example photos of approved vehicles/i })
      ).toBeInTheDocument();
    });

    it('displays both approved and not-approved sections', () => {
      render(<VehicleReqPictures />);
      expect(
        screen.getByRole('heading', { name: /example photos of approved vehicles/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /example photos of not approved vehicles/i,
        })
      ).toBeInTheDocument();
    });

    it('renders as semantic sections', () => {
      const { container } = render(<VehicleReqPictures />);
      const sections = container.querySelectorAll('section');
      expect(sections).toHaveLength(2);
    });
  });

  describe('Approved Vehicles Section', () => {
    it('displays approved vehicles section heading', () => {
      render(<VehicleReqPictures />);
      const heading = screen.getByRole('heading', {
        name: /example photos of approved vehicles/i,
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute('id', 'approved-vehicles-heading');
    });

    it('renders three approved vehicle images', () => {
      render(<VehicleReqPictures />);
      const approvedImages = screen.getAllByAltText(
        /example of an approved vehicle/i
      );
      expect(approvedImages).toHaveLength(3);
    });

    it('displays check icons for approved vehicles', () => {
      const { container } = render(<VehicleReqPictures />);
      const approvedSection = screen.getByRole('region', {
        name: /example photos of approved vehicles/i,
      });
      const checkIcons = approvedSection.querySelectorAll('svg[aria-hidden="true"]');
      expect(checkIcons.length).toBeGreaterThanOrEqual(3);
    });

    it('check icons use success color from design system', () => {
      const { container } = render(<VehicleReqPictures />);
      const approvedSection = screen.getByRole('region', {
        name: /example photos of approved vehicles/i,
      });
      const checkIcons = approvedSection.querySelectorAll('.text-status-success');
      expect(checkIcons).toHaveLength(3);
    });

    it('section has proper ARIA labeling', () => {
      render(<VehicleReqPictures />);
      const section = screen.getByRole('region', {
        name: /example photos of approved vehicles/i,
      });
      expect(section).toBeInTheDocument();
      expect(section.getAttribute('aria-labelledby')).toBe(
        'approved-vehicles-heading'
      );
    });
  });

  describe('Not Approved Vehicles Section', () => {
    it('displays not-approved vehicles section heading', () => {
      render(<VehicleReqPictures />);
      const heading = screen.getByRole('heading', {
        name: /example photos of not approved vehicles/i,
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute('id', 'not-approved-vehicles-heading');
    });

    it('renders three not-approved vehicle images', () => {
      render(<VehicleReqPictures />);
      const notApprovedImages = screen.getAllByAltText(
        /example of a not-approved vehicle/i
      );
      expect(notApprovedImages).toHaveLength(3);
    });

    it('displays X icons for not-approved vehicles', () => {
      const { container } = render(<VehicleReqPictures />);
      const notApprovedSection = screen.getByRole('region', {
        name: /example photos of not approved vehicles/i,
      });
      const xIcons = notApprovedSection.querySelectorAll('svg[aria-hidden="true"]');
      expect(xIcons.length).toBeGreaterThanOrEqual(3);
    });

    it('X icons use error color from design system', () => {
      const { container } = render(<VehicleReqPictures />);
      const notApprovedSection = screen.getByRole('region', {
        name: /example photos of not approved vehicles/i,
      });
      const xIcons = notApprovedSection.querySelectorAll('.text-status-error');
      expect(xIcons).toHaveLength(3);
    });

    it('section has proper ARIA labeling', () => {
      render(<VehicleReqPictures />);
      const section = screen.getByRole('region', {
        name: /example photos of not approved vehicles/i,
      });
      expect(section).toBeInTheDocument();
      expect(section.getAttribute('aria-labelledby')).toBe(
        'not-approved-vehicles-heading'
      );
    });
  });

  describe('Image Rendering', () => {
    it('all images have descriptive alt text', () => {
      render(<VehicleReqPictures />);
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(6);

      images.forEach((img) => {
        const altText = img.getAttribute('alt');
        expect(altText).toBeTruthy();
        expect(altText?.length).toBeGreaterThan(20);
      });
    });

    it('approved vehicle images have descriptive alt text', () => {
      render(<VehicleReqPictures />);
      const approvedImages = screen.getAllByAltText(
        /example of an approved vehicle showing proper angle and condition/i
      );
      expect(approvedImages).toHaveLength(3);
    });

    it('not-approved vehicle images have descriptive alt text', () => {
      render(<VehicleReqPictures />);
      const notApprovedImages = screen.getAllByAltText(
        /example of a not-approved vehicle showing issues/i
      );
      expect(notApprovedImages).toHaveLength(3);
    });

    it('images use correct source paths', () => {
      render(<VehicleReqPictures />);
      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('src', '/placeholder.jpg');
      });
    });
  });

  describe('Styling and Design System', () => {
    it('uses semantic border colors', () => {
      const { container } = render(<VehicleReqPictures />);
      const sections = container.querySelectorAll('section');
      sections.forEach((section) => {
        expect(section).toHaveClass('border-border');
      });
    });

    it('uses OptimizedImage with square aspect ratio', () => {
      const { container } = render(<VehicleReqPictures />);
      const imageContainers = container.querySelectorAll('.aspect-square');
      // OptimizedImage creates containers with aspect-square class
      expect(imageContainers.length).toBeGreaterThanOrEqual(6);
    });

    it('applies consistent padding to sections', () => {
      const { container } = render(<VehicleReqPictures />);
      const sections = container.querySelectorAll('section');
      sections.forEach((section) => {
        expect(section).toHaveClass('p-6', 'border', 'rounded-md');
      });
    });

    it('has proper spacing between sections', () => {
      const { container } = render(<VehicleReqPictures />);
      const wrapper = container.querySelector('.space-y-8');
      expect(wrapper).toBeInTheDocument();
    });

    it('has responsive container padding', () => {
      const { container } = render(<VehicleReqPictures />);
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('lg:px-16', 'px-6');
    });

    it('has responsive bottom margin', () => {
      const { container } = render(<VehicleReqPictures />);
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('sm:mb-48', 'mb-24');
    });
  });

  describe('Status Icons', () => {
    it('check icons are positioned correctly', () => {
      const { container } = render(<VehicleReqPictures />);
      const approvedSection = screen.getByRole('region', {
        name: /example photos of approved vehicles/i,
      });
      const checkIcons = approvedSection.querySelectorAll('svg.absolute');
      checkIcons.forEach((icon) => {
        expect(icon).toHaveClass('top-2', 'right-2', 'rounded-full', 'bg-white');
      });
    });

    it('X icons are positioned correctly', () => {
      const { container } = render(<VehicleReqPictures />);
      const notApprovedSection = screen.getByRole('region', {
        name: /example photos of not approved vehicles/i,
      });
      const xIcons = notApprovedSection.querySelectorAll('svg.absolute');
      xIcons.forEach((icon) => {
        expect(icon).toHaveClass('top-2', 'right-2', 'rounded-full', 'bg-white');
      });
    });

    it('icons have responsive sizing', () => {
      const { container } = render(<VehicleReqPictures />);
      const icons = container.querySelectorAll('svg.absolute');
      icons.forEach((icon) => {
        expect(icon).toHaveClass('w-6', 'h-6', 'sm:w-10', 'sm:h-10');
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<VehicleReqPictures />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses semantic section elements with ARIA labels', () => {
      render(<VehicleReqPictures />);
      const sections = screen.getAllByRole('region');
      expect(sections).toHaveLength(2);
    });

    it('headings are associated with sections via aria-labelledby', () => {
      const { container } = render(<VehicleReqPictures />);
      const sections = container.querySelectorAll('section');

      const firstSection = sections[0];
      expect(firstSection.getAttribute('aria-labelledby')).toBe(
        'approved-vehicles-heading'
      );

      const secondSection = sections[1];
      expect(secondSection.getAttribute('aria-labelledby')).toBe(
        'not-approved-vehicles-heading'
      );
    });

    it('all headings have proper level', () => {
      render(<VehicleReqPictures />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings).toHaveLength(2);
    });

    it('status icons are properly hidden from screen readers', () => {
      const { container } = render(<VehicleReqPictures />);
      const allIcons = container.querySelectorAll('svg[aria-hidden="true"]');
      
      // Should have 6 icons total (3 approved + 3 not approved)
      expect(allIcons.length).toBeGreaterThanOrEqual(6);
      
      // All icons should be hidden from screen readers
      allIcons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Responsive Layout', () => {
    it('image grids have responsive flex direction', () => {
      const { container } = render(<VehicleReqPictures />);
      // Select the grid containers that hold the images
      const sections = container.querySelectorAll('section');
      
      sections.forEach((section) => {
        const grid = section.querySelector('div.flex.flex-col.sm\\:flex-row');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('flex-col', 'sm:flex-row');
      });
    });

    it('images have square aspect ratio', () => {
      const { container } = render(<VehicleReqPictures />);
      const imageContainers = container.querySelectorAll('.aspect-square');
      expect(imageContainers.length).toBeGreaterThanOrEqual(6);
    });

    it('has proper gap spacing between images', () => {
      const { container } = render(<VehicleReqPictures />);
      const grids = container.querySelectorAll('.gap-4');
      expect(grids.length).toBeGreaterThanOrEqual(2);
    });

    it('image containers have full width on mobile', () => {
      const { container } = render(<VehicleReqPictures />);
      const imageContainers = container.querySelectorAll('.aspect-square');
      imageContainers.forEach((container) => {
        expect(container).toHaveClass('w-full');
      });
    });
  });

  describe('Component Structure', () => {
    it('maintains correct section order', () => {
      render(<VehicleReqPictures />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings[0]).toHaveTextContent(/approved vehicles/i);
      expect(headings[1]).toHaveTextContent(/not approved vehicles/i);
    });

    it('each section contains heading and image grid', () => {
      const { container } = render(<VehicleReqPictures />);
      const sections = container.querySelectorAll('section');

      sections.forEach((section) => {
        const heading = section.querySelector('h2');
        const grid = section.querySelector('.flex');
        expect(heading).toBeInTheDocument();
        expect(grid).toBeInTheDocument();
      });
    });

    it('each image has status icon overlay', () => {
      const { container } = render(<VehicleReqPictures />);
      // Check for all absolute positioned SVG icons
      const icons = container.querySelectorAll('svg.absolute');
      
      // Should have 6 icons total (3 approved + 3 not approved)
      expect(icons.length).toBeGreaterThanOrEqual(6);
      
      // Verify they're positioned as overlays
      icons.forEach((icon) => {
        expect(icon).toHaveClass('absolute');
        expect(icon).toHaveClass('top-2');
        expect(icon).toHaveClass('right-2');
      });
    });
  });
});

