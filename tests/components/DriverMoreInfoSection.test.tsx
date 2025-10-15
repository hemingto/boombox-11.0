/**
 * @fileoverview Tests for DriverMoreInfoSection component
 * @source Migrated from boombox-10.0/src/app/components/driver-signup/drivermoreinfosection.tsx
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DriverMoreInfoSection } from '@/components/features/drivers/DriverMoreInfoSection';

describe('DriverMoreInfoSection', () => {
  beforeEach(() => {
    render(<DriverMoreInfoSection />);
  });

  describe('Component Structure', () => {
    it('renders the main heading', () => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("What you'll be delivering");
    });

    it('renders as a semantic section with proper ARIA labeling', () => {
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'delivery-info-heading');
    });

    it('has proper heading hierarchy', () => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      
      expect(mainHeading).toBeInTheDocument();
      expect(subHeadings).toHaveLength(2);
      expect(subHeadings[0]).toHaveTextContent('Boombox Storage Containers');
      expect(subHeadings[1]).toHaveTextContent('Packing Supplies');
    });
  });

  describe('Storage Containers Section', () => {
    it('renders storage containers heading and description', () => {
      const heading = screen.getByRole('heading', { name: /boombox storage containers/i });
      expect(heading).toBeInTheDocument();

      const description = screen.getByText(/as a container delivery driver/i);
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('towing capacity of 4000lbs and trailer hitch');
    });

    it('renders storage containers placeholder image with proper accessibility', () => {
      const images = screen.getAllByRole('img');
      const storageImage = images[0];
      
      expect(storageImage).toBeInTheDocument();
      expect(storageImage).toHaveAttribute('aria-label', 'Placeholder image for Boombox storage containers');
    });

    it('renders qualifying vehicles link for storage containers', () => {
      const links = screen.getAllByRole('link', { name: /check qualifying vehicles/i });
      const storageLink = links[0];
      
      expect(storageLink).toBeInTheDocument();
      expect(storageLink).toHaveAttribute('href', '/vehicle-requirements');
      expect(storageLink).toHaveAttribute('target', '_blank');
      expect(storageLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(storageLink).toHaveAttribute('aria-label', 'Check qualifying vehicles for container delivery (opens in new tab)');
    });
  });

  describe('Packing Supplies Section', () => {
    it('renders packing supplies heading and description', () => {
      const heading = screen.getByRole('heading', { name: /packing supplies/i });
      expect(heading).toBeInTheDocument();

      const description = screen.getByText(/as a packing supply delivery driver/i);
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('cardboard boxes, moving blankets, tape');
      expect(description).toHaveTextContent('does not need towing capabilities');
    });

    it('renders packing supplies placeholder image with proper accessibility', () => {
      const images = screen.getAllByRole('img');
      const packingImage = images[1];
      
      expect(packingImage).toBeInTheDocument();
      expect(packingImage).toHaveAttribute('aria-label', 'Placeholder image for packing supplies');
    });

    it('renders qualifying vehicles link for packing supplies', () => {
      const links = screen.getAllByRole('link', { name: /check qualifying vehicles/i });
      const packingLink = links[1];
      
      expect(packingLink).toBeInTheDocument();
      expect(packingLink).toHaveAttribute('href', '/vehicle-requirements');
      expect(packingLink).toHaveAttribute('target', '_blank');
      expect(packingLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(packingLink).toHaveAttribute('aria-label', 'Check qualifying vehicles for packing supply delivery (opens in new tab)');
    });
  });

  describe('Design System Compliance', () => {
    it('applies design system classes correctly', () => {
      const section = screen.getByRole('region');
      expect(section).toHaveClass('mt-14', 'lg:px-16', 'px-6', 'sm:mb-48', 'mb-24');

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('btn-primary');
      });
    });

    it('uses semantic color tokens for text', () => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-text-primary');

      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      subHeadings.forEach(subHeading => {
        expect(subHeading).toHaveClass('text-text-primary');
      });
    });

    it('uses design system surface colors for placeholder images', () => {
      const images = screen.getAllByRole('img');
      images.forEach(image => {
        expect(image).toHaveClass('bg-surface-tertiary');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
    });

    it('provides descriptive aria-labels for images', () => {
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('aria-label', 'Placeholder image for Boombox storage containers');
      expect(images[1]).toHaveAttribute('aria-label', 'Placeholder image for packing supplies');
    });

    it('provides descriptive aria-labels for external links', () => {
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('aria-label', 'Check qualifying vehicles for container delivery (opens in new tab)');
      expect(links[1]).toHaveAttribute('aria-label', 'Check qualifying vehicles for packing supply delivery (opens in new tab)');
    });

    it('has proper link attributes for security', () => {
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for layout', () => {
      const section = screen.getByRole('region');
      expect(section).toHaveClass('lg:px-16', 'px-6', 'sm:mb-48', 'mb-24');
    });

    it('applies responsive classes for content layout', () => {
      const section = screen.getByRole('region');
      const flexContainers = section.querySelectorAll('.flex.flex-col.lg\\:flex-row');
      
      // Check for responsive flex direction classes - should have 2 main content containers
      expect(flexContainers).toHaveLength(2);
      flexContainers.forEach(container => {
        expect(container).toHaveClass('flex-col', 'lg:flex-row');
      });
    });
  });
});
