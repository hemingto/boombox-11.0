/**
 * @fileoverview Tests for CitiesSection component
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CitiesSection } from '@/components/features/locations/CitiesSection';
import { bayAreaCities } from '@/data/bayareacities';

// Mock Next.js Link component
jest.mock('next/link', () => {
 return ({ children, href }: { children: React.ReactNode; href: string }) => {
  return <a href={href}>{children}</a>;
 };
});

// Mock window.innerWidth for responsive behavior
const mockWindowWidth = (width: number) => {
 Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: width,
 });
};

describe('CitiesSection', () => {
 beforeEach(() => {
  mockWindowWidth(1440); // Default to desktop
 });
 
 describe('Rendering', () => {
  it('should render with default title', () => {
   render(<CitiesSection />);
   
   expect(screen.getByText('Cities we serve')).toBeInTheDocument();
  });
  
  it('should render with custom title', () => {
   render(<CitiesSection title="Custom Title" />);
   
   expect(screen.getByText('Custom Title')).toBeInTheDocument();
   expect(screen.queryByText('Cities we serve')).not.toBeInTheDocument();
  });
  
  it('should render navigation arrows', () => {
   render(<CitiesSection />);
   
   expect(screen.getByLabelText('Previous page of cities')).toBeInTheDocument();
   expect(screen.getByLabelText('Next page of cities')).toBeInTheDocument();
  });
  
  it('should render cities grid', () => {
   render(<CitiesSection />);
   
   const grid = screen.getByRole('list', { name: /bay area cities we serve/i });
   expect(grid).toBeInTheDocument();
  });
  
  it('should render first page of cities', () => {
   render(<CitiesSection />);
   
   // Desktop shows 42 items per page (7 cols * 6 rows)
   const listItems = screen.getAllByRole('listitem');
   expect(listItems.length).toBeLessThanOrEqual(42);
   
   // First city should be visible
   expect(screen.getByText('Alameda')).toBeInTheDocument();
  });
  
  it('should apply custom className', () => {
   const { container } = render(<CitiesSection className="custom-class" />);
   
   const section = container.querySelector('section');
   expect(section).toHaveClass('custom-class');
  });
 });
 
 describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
   render(<CitiesSection />);
   
   expect(screen.getByLabelText('Cities pagination')).toBeInTheDocument();
   expect(screen.getByLabelText('Previous page of cities')).toBeInTheDocument();
   expect(screen.getByLabelText('Next page of cities')).toBeInTheDocument();
  });
  
  it('should have section landmark with labelledby', () => {
   render(<CitiesSection />);
   
   const section = screen.getByRole('region', { name: /cities we serve/i });
   expect(section).toBeInTheDocument();
  });
  
  it('should have screen reader announcement for current page', () => {
   render(<CitiesSection />);
   
   const announcement = screen.getByRole('status');
   expect(announcement).toHaveClass('sr-only');
   expect(announcement).toHaveTextContent(/page \d+ of \d+/i);
  });
  
  it('should have proper aria-disabled attributes', () => {
   render(<CitiesSection />);
   
   const prevButton = screen.getByLabelText('Previous page of cities');
   const nextButton = screen.getByLabelText('Next page of cities');
   
   // On first page, previous should be disabled
   expect(prevButton).toHaveAttribute('aria-disabled', 'true');
   expect(nextButton).toHaveAttribute('aria-disabled', 'false');
  });
  
  it('should have descriptive link labels for cities', () => {
   render(<CitiesSection />);
   
   // Check that links are properly structured
   const alamedaLink = screen.getByText('Alameda').closest('a');
   expect(alamedaLink).toBeInTheDocument();
   expect(alamedaLink).toHaveAttribute('href', '/alameda');
   
   // The Chip component provides the aria-label for each city
   const chip = screen.getByText('Alameda').closest('[role="button"]');
   expect(chip).toHaveAttribute('aria-label', 'Alameda');
  });
  
  it('should have aria-hidden on decorative icons', () => {
   const { container } = render(<CitiesSection />);
   
   const icons = container.querySelectorAll('svg');
   icons.forEach(icon => {
    expect(icon).toHaveAttribute('aria-hidden', 'true');
   });
  });
 });
 
 describe('Pagination Navigation', () => {
  it('should navigate to next page', () => {
   render(<CitiesSection />);
   
   const firstPageCity = screen.getByText('Alameda');
   expect(firstPageCity).toBeInTheDocument();
   
   const nextButton = screen.getByLabelText('Next page of cities');
   fireEvent.click(nextButton);
   
   // After clicking next, page should change
   const announcement = screen.getByRole('status');
   expect(announcement).toHaveTextContent(/page 2 of/i);
  });
  
  it('should navigate to previous page', () => {
   render(<CitiesSection />);
   
   const nextButton = screen.getByLabelText('Next page of cities');
   const prevButton = screen.getByLabelText('Previous page of cities');
   
   // Go to page 2
   fireEvent.click(nextButton);
   
   // Come back to page 1
   fireEvent.click(prevButton);
   
   const announcement = screen.getByRole('status');
   expect(announcement).toHaveTextContent(/page 1 of/i);
  });
  
  it('should disable previous button on first page', () => {
   render(<CitiesSection />);
   
   const prevButton = screen.getByLabelText('Previous page of cities') as HTMLButtonElement;
   
   expect(prevButton).toBeDisabled();
   expect(prevButton).toHaveAttribute('aria-disabled', 'true');
   expect(prevButton).toHaveClass('opacity-50', 'cursor-not-allowed');
  });
  
  it('should disable next button on last page', () => {
   render(<CitiesSection />);
   
   const nextButton = screen.getByLabelText('Next page of cities');
   
   // Calculate total pages (50 cities, 42 per page = 2 pages)
   const totalPages = Math.ceil(bayAreaCities.length / 42);
   
   // Navigate to last page
   for (let i = 1; i < totalPages; i++) {
    fireEvent.click(nextButton);
   }
   
   expect(nextButton).toBeDisabled();
   expect(nextButton).toHaveAttribute('aria-disabled', 'true');
  });
  
  it('should not navigate beyond first page', () => {
   render(<CitiesSection />);
   
   const prevButton = screen.getByLabelText('Previous page of cities');
   const announcement = screen.getByRole('status');
   
   // Try to go back from page 1
   fireEvent.click(prevButton);
   
   expect(announcement).toHaveTextContent(/page 1 of/i);
  });
  
  it('should not navigate beyond last page', () => {
   render(<CitiesSection />);
   
   const nextButton = screen.getByLabelText('Next page of cities');
   
   // Calculate total pages
   const totalPages = Math.ceil(bayAreaCities.length / 42);
   
   // Try to navigate beyond last page
   for (let i = 0; i < totalPages + 2; i++) {
    fireEvent.click(nextButton);
   }
   
   const announcement = screen.getByRole('status');
   expect(announcement).toHaveTextContent(new RegExp(`page ${totalPages} of`, 'i'));
  });
 });
 
 describe('City Links', () => {
  it('should render city links with correct hrefs', () => {
   render(<CitiesSection />);
   
   const alamedaLink = screen.getByText('Alameda').closest('a');
   expect(alamedaLink).toHaveAttribute('href', '/alameda');
  });
  
  it('should render all cities on first page', () => {
   render(<CitiesSection />);
   
   // Desktop: 7 cols * 6 rows = 42 items
   const listItems = screen.getAllByRole('listitem');
   expect(listItems.length).toBeLessThanOrEqual(42);
   
   // Verify first few cities
   expect(screen.getByText('Alameda')).toBeInTheDocument();
   expect(screen.getByText('Albany')).toBeInTheDocument();
   expect(screen.getByText('Berkeley')).toBeInTheDocument();
  });
  
  it('should show different cities on page 2', () => {
   render(<CitiesSection />);
   
   const nextButton = screen.getByLabelText('Next page of cities');
   
   // First page should have Alameda
   expect(screen.getByText('Alameda')).toBeInTheDocument();
   
   // Navigate to page 2
   fireEvent.click(nextButton);
   
   // Page 2 should have different cities (items 43+)
   // Alameda should no longer be visible on page 2
   expect(screen.queryByText('Alameda')).not.toBeInTheDocument();
  });
 });
 
 describe('Chip Component Integration', () => {
  it('should render cities using Chip component', () => {
   render(<CitiesSection />);
   
   const cityChip = screen.getByText('Alameda').closest('div');
   expect(cityChip).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });
  
  it('should apply proper styling to chips', () => {
   render(<CitiesSection />);
   
   const cityChip = screen.getByText('Alameda').closest('div');
   expect(cityChip).toHaveClass('rounded-full');
  });
 });
 
 describe('Responsive Behavior', () => {
  it('should render mobile layout', () => {
   mockWindowWidth(500);
   
   render(<CitiesSection />);
   
   // Mobile: 3 cols * 5 rows = 15 items per page
   const listItems = screen.getAllByRole('listitem');
   expect(listItems.length).toBeLessThanOrEqual(15);
  });
  
  it('should render tablet layout', () => {
   mockWindowWidth(800);
   
   render(<CitiesSection />);
   
   // Tablet: 6 cols * 5 rows = 30 items per page 
   const listItems = screen.getAllByRole('listitem');
   expect(listItems.length).toBeLessThanOrEqual(30);
  });
  
  it('should render desktop layout', () => {
   mockWindowWidth(1440);
   
   render(<CitiesSection />);
   
   // Desktop: 7 cols * 6 rows = 42 items per page
   const listItems = screen.getAllByRole('listitem');
   expect(listItems.length).toBeLessThanOrEqual(42);
  });
 });
 
 describe('Design System Integration', () => {
  it('should use design system surface colors for navigation buttons', () => {
   render(<CitiesSection />);
   
   const prevButton = screen.getByLabelText('Previous page of cities');
   const nextButton = screen.getByLabelText('Next page of cities');
   
   expect(prevButton).toHaveClass('bg-surface-tertiary');
   expect(nextButton).toHaveClass('bg-surface-tertiary');
  });
  
  it('should apply transition classes', () => {
   render(<CitiesSection />);
   
   const prevButton = screen.getByLabelText('Previous page of cities');
  });
  
  it('should apply focus-visible styles', () => {
   render(<CitiesSection />);
   
   const prevButton = screen.getByLabelText('Previous page of cities');
   expect(prevButton).toHaveClass('focus-visible');
  });
 });
 
 describe('Edge Cases', () => {
  it('should handle single page of cities gracefully', () => {
   // With 101 cities and 42 per page (desktop), we have 3 pages total
   render(<CitiesSection />);
   
   const prevButton = screen.getByLabelText('Previous page of cities') as HTMLButtonElement;
   const nextButton = screen.getByLabelText('Next page of cities') as HTMLButtonElement;
   
   // On first page: prev disabled, next enabled
   expect(prevButton).toBeDisabled();
   expect(nextButton).not.toBeDisabled();
   
   // Navigate to page 2
   fireEvent.click(nextButton);
   expect(prevButton).not.toBeDisabled();
   expect(nextButton).not.toBeDisabled();
   
   // Navigate to last page (page 3)
   fireEvent.click(nextButton);
   
   // On last page: prev enabled, next disabled
   expect(prevButton).not.toBeDisabled();
   expect(nextButton).toBeDisabled();
  });
  
  it('should handle empty title', () => {
   render(<CitiesSection title="" />);
   
   const heading = screen.getByRole('heading', { level: 1 });
   expect(heading).toHaveTextContent('');
  });
 });
 
 describe('Layout and Spacing', () => {
  it('should apply proper container spacing', () => {
   const { container } = render(<CitiesSection />);
   
   const section = container.querySelector('section');
   expect(section).toHaveClass('mt-12', 'sm:mt-24', 'lg:px-12', 'px-6');
  });
  
  it('should have proper grid gap', () => {
   const { container } = render(<CitiesSection />);
   
   const grid = container.querySelector('[role="list"]');
   expect(grid).toHaveClass('gap-4', 'lg:gap-6');
  });
  
  it('should have proper header spacing', () => {
   const { container } = render(<CitiesSection />);
   
   const header = container.querySelector('.flex.flex-col');
   expect(header).toHaveClass('mb-10');
  });
 });
 
 describe('Keyboard Navigation', () => {
  it('should support keyboard navigation for buttons', () => {
   render(<CitiesSection />);
   
   const nextButton = screen.getByLabelText('Next page of cities');
   nextButton.focus();
   
   expect(document.activeElement).toBe(nextButton);
  });
  
  it('should support keyboard navigation for city links', () => {
   render(<CitiesSection />);
   
   const firstLink = screen.getByText('Alameda').closest('a');
   firstLink?.focus();
   
   expect(document.activeElement).toBe(firstLink);
  });
 });
});

