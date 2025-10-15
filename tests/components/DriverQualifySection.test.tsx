/**
 * @fileoverview Tests for DriverQualifySection component
 * @source Migrated from boombox-10.0/src/app/components/driver-signup/driverqualifysection.tsx
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DriverQualifySection } from '@/components/features/drivers/DriverQualifySection';

describe('DriverQualifySection', () => {
  beforeEach(() => {
    render(<DriverQualifySection />);
  });

  describe('Component Structure', () => {
    it('renders the main heading', () => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Make sure you qualify');
    });

    it('renders as a semantic section with proper ARIA labeling', () => {
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'qualification-heading');
    });

    it('renders requirements as a list with proper ARIA labeling', () => {
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute('aria-label', 'Driver qualification requirements');

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);
    });
  });

  describe('Requirements Content', () => {
    it('renders all five qualification requirements', () => {
      // Test specific text content that should be present
      expect(screen.getByText('At least 18 years of age')).toBeInTheDocument();
      expect(screen.getByText('Valid U.S. driver\'s license and auto insurance')).toBeInTheDocument();
      expect(screen.getByText('Own an iPhone or Android phone with GPS')).toBeInTheDocument();
      expect(screen.getByText('Able to pass a background check')).toBeInTheDocument();
      
      // For the qualifying vehicle requirement, check for the separate parts
      expect(screen.getByText('Own a')).toBeInTheDocument();
      expect(screen.getByText('qualifying vehicle')).toBeInTheDocument();
    });

    it('renders check circle icons for each requirement', () => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);

      // Check that each list item contains a check icon (hidden from screen readers)
      listItems.forEach(item => {
        const icon = item.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('renders qualifying vehicle link with proper attributes', () => {
      const link = screen.getByRole('link', { name: /qualifying vehicle/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/vehicle-requirements');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('aria-label', 'View qualifying vehicle requirements (opens in new tab)');
    });

    it('has proper heading hierarchy', () => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      
      expect(mainHeading).toBeInTheDocument();
      expect(subHeadings).toHaveLength(5); // One h2 for each requirement
    });
  });

  describe('Design System Compliance', () => {
    it('applies design system classes correctly', () => {
      const section = screen.getByRole('region');
      expect(section).toHaveClass('mt-14', 'lg:px-16', 'px-6', 'sm:mb-48', 'mb-24');

      const list = screen.getByRole('list');
      expect(list).toHaveClass('border', 'border-border', 'rounded-md', 'p-6', 'bg-surface-primary');
    });

    it('uses semantic color tokens for text', () => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-text-primary');

      const requirementTexts = screen.getAllByText(/years of age|license|vehicle|phone|background/i);
      requirementTexts.forEach(text => {
        expect(text).toHaveClass('text-text-primary');
      });
    });

    it('uses design system status colors for check icons', () => {
      const listItems = screen.getAllByRole('listitem');
      listItems.forEach(item => {
        const icon = item.querySelector('svg');
        expect(icon).toHaveClass('text-status-success');
      });
    });

    it('applies proper focus styles to the qualifying vehicle link', () => {
      const link = screen.getByRole('link', { name: /qualifying vehicle/i });
      expect(link).toHaveClass(
        'focus:text-primary',
        'focus:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-primary',
        'focus-visible:ring-offset-2'
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(5);
    });

    it('provides descriptive aria-labels', () => {
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'qualification-heading');

      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Driver qualification requirements');

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'View qualifying vehicle requirements (opens in new tab)');
    });

    it('hides decorative icons from screen readers', () => {
      const listItems = screen.getAllByRole('listitem');
      listItems.forEach(item => {
        const icon = item.querySelector('svg');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('has proper link attributes for security', () => {
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for layout', () => {
      const section = screen.getByRole('region');
      expect(section).toHaveClass('lg:px-16', 'px-6', 'sm:mb-48', 'mb-24');
    });

    it('applies responsive spacing classes', () => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-10');
    });
  });

  describe('Component Props and State', () => {
    it('renders without requiring any props', () => {
      expect(() => render(<DriverQualifySection />)).not.toThrow();
    });

    it('maintains consistent requirement data structure', () => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);

      // Verify each requirement has the expected structure
      listItems.forEach(item => {
        expect(item.querySelector('svg')).toBeInTheDocument(); // Check icon
        expect(item.querySelector('h2')).toBeInTheDocument(); // Requirement text
      });
    });
  });

  describe('Link Functionality', () => {
    it('renders external link with correct styling', () => {
      const link = screen.getByRole('link', { name: /qualifying vehicle/i });
      expect(link).toHaveClass(
        'underline',
        'decoration-dotted',
        'underline-offset-4',
        'text-text-primary',
        'hover:text-primary'
      );
    });

    it('integrates properly within requirement text', () => {
      const link = screen.getByRole('link', { name: /qualifying vehicle/i });
      expect(link).toBeInTheDocument();
      
      // Verify the link text content
      expect(link).toHaveTextContent('qualifying vehicle');
      
      // Verify the link is properly integrated within the requirement structure
      const listItems = screen.getAllByRole('listitem');
      const vehicleRequirementItem = listItems[2]; // Third requirement is about qualifying vehicle
      expect(vehicleRequirementItem).toContainElement(link);
    });
  });
});
