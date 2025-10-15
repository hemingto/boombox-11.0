/**
 * @fileoverview Tests for DriverSignupHero component
 * @source Migrated from boombox-10.0/src/app/components/driver-signup/driversignuphero.tsx
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DriverSignupHero } from '@/components/features/drivers/DriverSignupHero';

// Mock the TruckIcon component
jest.mock('@/components/icons', () => ({
  TruckIcon: ({ className, 'aria-hidden': ariaHidden }: { className?: string; 'aria-hidden'?: boolean }) => (
    <svg 
      className={className} 
      aria-hidden={ariaHidden}
      data-testid="truck-icon"
      role="img"
    >
      <path d="mock-truck-path" />
    </svg>
  ),
}));

describe('DriverSignupHero', () => {
  const defaultProps = {
    title: 'Become a Driver',
    description: 'Join our team and start earning money by delivering storage containers and packing supplies.',
  };

  describe('Component Structure', () => {
    it('renders as a semantic section with proper ARIA labeling', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'driver-signup-hero-title');
    });

    it('renders the main heading with proper ID', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute('id', 'driver-signup-hero-title');
      expect(heading).toHaveTextContent(defaultProps.title);
    });

    it('renders the description text', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const description = screen.getByText(defaultProps.description);
      expect(description).toBeInTheDocument();
      expect(description.tagName.toLowerCase()).toBe('p');
    });

    it('renders the TruckIcon with proper attributes', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const icon = screen.getByTestId('truck-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Props Handling', () => {
    it('displays the provided title', () => {
      const customTitle = 'Custom Driver Title';
      render(<DriverSignupHero title={customTitle} description={defaultProps.description} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(customTitle);
    });

    it('displays the provided description', () => {
      const customDescription = 'Custom description for driver signup.';
      render(<DriverSignupHero title={defaultProps.title} description={customDescription} />);
      
      expect(screen.getByText(customDescription)).toBeInTheDocument();
    });

    it('handles empty title gracefully', () => {
      render(<DriverSignupHero title="" description={defaultProps.description} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('');
    });

    it('handles empty description gracefully', () => {
      render(<DriverSignupHero title={defaultProps.title} description="" />);
      
      const section = screen.getByRole('region');
      const description = section.querySelector('p');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('');
    });

    it('handles long title text', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines and should still be handled properly by the component';
      render(<DriverSignupHero title={longTitle} description={defaultProps.description} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(longTitle);
    });

    it('handles long description text', () => {
      const longDescription = 'This is a very long description that contains multiple sentences and should wrap properly. It includes information about becoming a driver, earning money, and delivering various items to customers across different locations.';
      render(<DriverSignupHero title={defaultProps.title} description={longDescription} />);
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('Design System Compliance', () => {
    it('applies design system classes correctly', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const section = screen.getByRole('region');
      expect(section).toHaveClass(
        'flex-col',
        'mt-12',
        'sm:mt-24',
        'lg:px-16',
        'px-6',
        'sm:mb-12',
        'mb-6',
        'text-center'
      );
    });

    it('uses semantic color tokens for text elements', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1 });
      const description = screen.getByText(defaultProps.description);
      
      expect(heading).toHaveClass('text-text-primary');
      expect(description).toHaveClass('text-text-primary');
    });

    it('applies proper icon styling with design system colors', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const icon = screen.getByTestId('truck-icon');
      expect(icon).toHaveClass('w-20', 'mb-4', 'mx-auto', 'text-text-primary');
    });

    it('applies proper spacing classes', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const section = screen.getByRole('region');
      const contentDiv = section.querySelector('div');
      
      expect(contentDiv).toHaveClass('mb-8');
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-4');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<DriverSignupHero {...defaultProps} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('provides proper ARIA labeling', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const section = screen.getByRole('region');
      const heading = screen.getByRole('heading', { level: 1 });
      
      expect(section).toHaveAttribute('aria-labelledby', 'driver-signup-hero-title');
      expect(heading).toHaveAttribute('id', 'driver-signup-hero-title');
    });

    it('hides decorative icon from screen readers', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const icon = screen.getByTestId('truck-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('maintains proper heading hierarchy', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveProperty('tagName', 'H1');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for layout', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const section = screen.getByRole('region');
      expect(section).toHaveClass('mt-12', 'sm:mt-24');
      expect(section).toHaveClass('px-6', 'lg:px-16');
      expect(section).toHaveClass('mb-6', 'sm:mb-12');
    });

    it('maintains center alignment across breakpoints', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const section = screen.getByRole('region');
      expect(section).toHaveClass('text-center');
    });
  });

  describe('Component Integration', () => {
    it('integrates TruckIcon properly', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const icon = screen.getByTestId('truck-icon');
      expect(icon).toBeInTheDocument();
      
      // Verify icon is positioned correctly within the layout
      const contentDiv = screen.getByRole('region').querySelector('div');
      expect(contentDiv).toContainElement(icon);
    });

    it('maintains proper visual hierarchy', () => {
      render(<DriverSignupHero {...defaultProps} />);
      const section = screen.getByRole('region');
      const icon = screen.getByTestId('truck-icon');
      const heading = screen.getByRole('heading', { level: 1 });
      const description = screen.getByText(defaultProps.description);
      
      // Verify all elements are within the same container
      expect(section).toContainElement(icon);
      expect(section).toContainElement(heading);
      expect(section).toContainElement(description);
    });
  });

  describe('TypeScript Interface', () => {
    it('accepts required props without TypeScript errors', () => {
      // This test ensures the component compiles with TypeScript
      expect(() => {
        render(<DriverSignupHero title="Test" description="Test description" />);
      }).not.toThrow();
    });

    it('renders with minimal props', () => {
      render(<DriverSignupHero title="Minimal" description="Minimal desc" />);
      
      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('Minimal desc')).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    it('preserves HTML entities in title', () => {
      const titleWithEntities = 'Driver &amp; Partner Program';
      render(<DriverSignupHero title={titleWithEntities} description={defaultProps.description} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(titleWithEntities);
    });

    it('preserves HTML entities in description', () => {
      const descriptionWithEntities = 'Join us &amp; start earning today!';
      render(<DriverSignupHero title={defaultProps.title} description={descriptionWithEntities} />);
      
      expect(screen.getByText(descriptionWithEntities)).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      const specialTitle = 'Driver Signup - 100% Commission!';
      const specialDescription = 'Earn $20-50/hour delivering items.';
      
      render(<DriverSignupHero title={specialTitle} description={specialDescription} />);
      
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
      expect(screen.getByText(specialDescription)).toBeInTheDocument();
    });
  });
});
