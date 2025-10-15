/**
 * @fileoverview Jest tests for LaborPlanDetails component
 * Tests the informational component that displays labor plan comparisons
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LaborPlanDetails from '@/components/forms/LaborPlanDetails';
import { LABOR_PLAN_TYPES } from '@/data/laborOptions';

describe('LaborPlanDetails', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<LaborPlanDetails />);
      expect(screen.getByText(LABOR_PLAN_TYPES.DO_IT_YOURSELF)).toBeInTheDocument();
      expect(screen.getByText(LABOR_PLAN_TYPES.FULL_SERVICE)).toBeInTheDocument();
    });

    it('displays both plan sections with correct headings', () => {
      render(<LaborPlanDetails />);
      
      const diyHeading = screen.getByText(LABOR_PLAN_TYPES.DO_IT_YOURSELF);
      const fullServiceHeading = screen.getByText(LABOR_PLAN_TYPES.FULL_SERVICE);
      
      expect(diyHeading).toBeInTheDocument();
      expect(fullServiceHeading).toBeInTheDocument();
      expect(diyHeading.tagName).toBe('H3');
      expect(fullServiceHeading.tagName).toBe('H3');
    });

    it('applies custom className when provided', () => {
      const customClass = 'custom-test-class';
      const { container } = render(<LaborPlanDetails className={customClass} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass(customClass);
    });

    it('applies default classes when no className provided', () => {
      const { container } = render(<LaborPlanDetails />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex', 'flex-row', 'justify-around', 'gap-3');
    });
  });

  describe('Do It Yourself Plan Content', () => {
    it('displays all DIY plan features', () => {
      render(<LaborPlanDetails />);
      
      // Check for specific DIY plan features (using getAllByText for shared content)
      expect(screen.getAllByText(/We'll deliver your storage unit to your pickup address/)).toHaveLength(2);
      expect(screen.getByText(/We'll wait for Free for 1 full hour while you pack your unit/)).toBeInTheDocument();
      expect(screen.getAllByText(/We'll return your storage unit back to our storage facility/)).toHaveLength(2);
      expect(screen.getByText(/Loading help, disassembly, packing, and supplies are not included/)).toBeInTheDocument();
    });

    it('has proper list structure for DIY plan', () => {
      render(<LaborPlanDetails />);
      
      const diyList = screen.getByRole('list', { name: /Do It Yourself Plan features/i });
      expect(diyList).toBeInTheDocument();
      
      const diyListItems = screen.getAllByRole('listitem');
      // Should have 4 items for DIY + 4 items for Full Service = 8 total
      expect(diyListItems).toHaveLength(8);
    });
  });

  describe('Full Service Plan Content', () => {
    it('displays all Full Service plan features', () => {
      render(<LaborPlanDetails />);
      
      // Check for specific Full Service plan features (using getAllByText for shared content)
      expect(screen.getAllByText(/We'll deliver your storage unit to your pickup address/)).toHaveLength(2);
      expect(screen.getByText(/We'll wrap furniture, pack boxes, and disassemble furniture/)).toBeInTheDocument();
      expect(screen.getByText(/We'll provide basic packing supplies/)).toBeInTheDocument();
      expect(screen.getAllByText(/We'll return your storage unit back to our storage facility/)).toHaveLength(2);
    });

    it('has proper list structure for Full Service plan', () => {
      render(<LaborPlanDetails />);
      
      const fullServiceList = screen.getByRole('list', { name: /Full Service Plan features/i });
      expect(fullServiceList).toBeInTheDocument();
    });
  });

  describe('Design System Compliance', () => {
    it('uses design system text colors', () => {
      render(<LaborPlanDetails />);
      
      const diyHeading = screen.getByText(LABOR_PLAN_TYPES.DO_IT_YOURSELF);
      const fullServiceHeading = screen.getByText(LABOR_PLAN_TYPES.FULL_SERVICE);
      
      expect(diyHeading).toHaveClass('text-text-primary');
      expect(fullServiceHeading).toHaveClass('text-text-primary');
    });

    it('applies proper border styling using design system', () => {
      const { container } = render(<LaborPlanDetails />);
      
      const diySection = container.querySelector('.border-r');
      expect(diySection).toHaveClass('border-border');
    });

    it('uses semantic font weights', () => {
      render(<LaborPlanDetails />);
      
      const headings = screen.getAllByRole('heading', { level: 3 });
      headings.forEach(heading => {
        expect(heading).toHaveClass('font-semibold');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for lists', () => {
      render(<LaborPlanDetails />);
      
      const diyList = screen.getByRole('list', { name: /Do It Yourself Plan features/i });
      const fullServiceList = screen.getByRole('list', { name: /Full Service Plan features/i });
      
      expect(diyList).toHaveAttribute('aria-label', 'Do It Yourself Plan features');
      expect(fullServiceList).toHaveAttribute('aria-label', 'Full Service Plan features');
    });

    it('marks bullet points as decorative with aria-hidden', () => {
      const { container } = render(<LaborPlanDetails />);
      
      const bulletPoints = container.querySelectorAll('span[aria-hidden="true"]');
      expect(bulletPoints.length).toBeGreaterThan(0);
      
      bulletPoints.forEach(bullet => {
        expect(bullet).toHaveAttribute('aria-hidden', 'true');
        expect(bullet.textContent).toBe('•');
      });
    });

    it('has proper list item roles', () => {
      render(<LaborPlanDetails />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(8); // 4 DIY + 4 Full Service
      
      listItems.forEach(item => {
        expect(item).toHaveAttribute('role', 'listitem');
      });
    });

    it('has semantic heading structure', () => {
      render(<LaborPlanDetails />);
      
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
      
      expect(headings[0]).toHaveTextContent(LABOR_PLAN_TYPES.DO_IT_YOURSELF);
      expect(headings[1]).toHaveTextContent(LABOR_PLAN_TYPES.FULL_SERVICE);
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive text sizing classes', () => {
      const { container } = render(<LaborPlanDetails />);
      
      const lists = container.querySelectorAll('ul');
      lists.forEach(list => {
        expect(list).toHaveClass('text-xs', 'sm:text-sm');
      });
    });

    it('uses flexbox layout for responsive behavior', () => {
      const { container } = render(<LaborPlanDetails />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex', 'flex-row', 'justify-around');
      
      const sections = container.querySelectorAll('.basis-1\\/2');
      expect(sections).toHaveLength(2);
    });
  });

  describe('Content Accuracy', () => {
    it('displays correct pricing information for DIY plan', () => {
      render(<LaborPlanDetails />);
      
      expect(screen.getByText(/\$50\/hr after your 1st hour/)).toBeInTheDocument();
    });

    it('mentions key differentiators between plans', () => {
      render(<LaborPlanDetails />);
      
      // DIY plan exclusions
      expect(screen.getByText(/Loading help, disassembly, packing, and supplies are not included/)).toBeInTheDocument();
      
      // Full Service inclusions
      expect(screen.getByText(/We'll wrap furniture, pack boxes, and disassemble furniture/)).toBeInTheDocument();
      expect(screen.getByText(/We'll provide basic packing supplies/)).toBeInTheDocument();
    });
  });

  describe('Integration with Labor Options Data', () => {
    it('uses centralized labor plan types from data constants', () => {
      render(<LaborPlanDetails />);
      
      // Verify it's using the constants, not hardcoded strings
      expect(screen.getByText(LABOR_PLAN_TYPES.DO_IT_YOURSELF)).toBeInTheDocument();
      expect(screen.getByText(LABOR_PLAN_TYPES.FULL_SERVICE)).toBeInTheDocument();
    });
  });
});
