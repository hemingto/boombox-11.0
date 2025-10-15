/**
 * @fileoverview Jest tests for BlogHeroSection component
 * @source Created for boombox-11.0 component testing
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BlogHeroSection } from '@/components/features/content/BlogHeroSection';

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  NewspaperIcon: ({ className, ...props }: any) => (
    <svg className={className} {...props} data-testid="newspaper-icon">
      <title>Newspaper Icon</title>
    </svg>
  ),
}));

describe('BlogHeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the blog hero section with title and icon', () => {
      render(<BlogHeroSection />);
      
      // Check for the main heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Blog');
      
      // Check for the newspaper icon
      const icon = screen.getByTestId('newspaper-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies correct CSS classes for styling', () => {
      const { container } = render(<BlogHeroSection />);
      
      // Check container classes
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-full', 'mt-4', 'py-2', 'mb-14', 'lg:px-16', 'px-6');
      
      // Check inner container classes
      const innerContainer = wrapper.firstChild as HTMLElement;
      expect(innerContainer).toHaveClass('flex', 'items-center');
    });

    it('has proper semantic HTML structure', () => {
      render(<BlogHeroSection />);
      
      // Should have a main heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      
      // Icon should be decorative (aria-hidden)
      const icon = screen.getByTestId('newspaper-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<BlogHeroSection />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Blog');
    });

    it('marks decorative icon as aria-hidden', () => {
      render(<BlogHeroSection />);
      
      const icon = screen.getByTestId('newspaper-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('has no accessibility violations', () => {
      const { container } = render(<BlogHeroSection />);
      
      // Check that all images have alt text or are marked as decorative
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        expect(
          img.hasAttribute('alt') || img.hasAttribute('aria-hidden')
        ).toBe(true);
      });
    });
  });

  describe('Design System Integration', () => {
    it('uses consistent spacing patterns', () => {
      const { container } = render(<BlogHeroSection />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('lg:px-16', 'px-6'); // Consistent horizontal padding
      expect(wrapper).toHaveClass('mt-4', 'py-2', 'mb-14'); // Consistent vertical spacing
    });

    it('uses proper icon sizing', () => {
      render(<BlogHeroSection />);
      
      const icon = screen.getByTestId('newspaper-icon');
      expect(icon).toHaveClass('w-6', 'h-6'); // Standard icon size
      expect(icon).toHaveClass('mr-1'); // Consistent margin
    });
  });

  describe('Component Behavior', () => {
    it('renders consistently across multiple renders', () => {
      const { rerender } = render(<BlogHeroSection />);
      
      let heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Blog');
      
      rerender(<BlogHeroSection />);
      
      heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Blog');
    });

    it('is a pure component with no side effects', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<BlogHeroSection />);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive padding classes', () => {
      const { container } = render(<BlogHeroSection />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('lg:px-16'); // Large screen padding
      expect(wrapper).toHaveClass('px-6'); // Default padding
    });

    it('maintains consistent layout structure', () => {
      const { container } = render(<BlogHeroSection />);
      
      const wrapper = container.firstChild as HTMLElement;
      const innerContainer = wrapper.firstChild as HTMLElement;
      
      expect(innerContainer).toHaveClass('flex', 'items-center');
    });
  });
});
