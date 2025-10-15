/**
 * @fileoverview Tests for TrainingTips component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TrainingTips } from '@/components/features/training/TrainingTips';

expect.extend(toHaveNoViolations);

describe('TrainingTips', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing with driver userType', () => {
      render(<TrainingTips userType="driver" />);
      expect(screen.getByRole('heading', { name: /driver tips/i })).toBeInTheDocument();
    });

    it('renders without crashing with mover userType', () => {
      render(<TrainingTips userType="mover" />);
      expect(screen.getByRole('heading', { name: /mover tips/i })).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<TrainingTips userType="driver" className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations with driver tips', async () => {
      const { container } = render(<TrainingTips userType="driver" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with mover tips', async () => {
      const { container } = render(<TrainingTips userType="mover" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels and roles', () => {
      render(<TrainingTips userType="driver" />);
      
      // Check section has proper labeling
      const section = screen.getByRole('region', { name: /driver tips/i });
      expect(section).toBeInTheDocument();
      
      // Check list has proper role and label
      const list = screen.getByRole('list', { name: /driver tips checklist/i });
      expect(list).toBeInTheDocument();
      
      // Check list items have proper roles
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(6); // 6 driver tips
    });

    it('has proper heading structure', () => {
      render(<TrainingTips userType="driver" />);
      const heading = screen.getByRole('heading', { name: /driver tips/i });
      expect(heading).toHaveAttribute('id', 'training-tips-heading');
    });

    it('has accessible check icons', () => {
      const { container } = render(<TrainingTips userType="driver" />);
      const checkIcons = screen.getAllByRole('img', { name: /completed tip indicator/i });
      expect(checkIcons).toHaveLength(6);
      
      // Verify SVG icons are properly hidden from screen readers with aria-hidden
      const svgIcons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgIcons).toHaveLength(6);
    });
  });

  // REQUIRED: Content testing
  describe('Content Display', () => {
    it('displays correct driver tips content', () => {
      render(<TrainingTips userType="driver" />);
      
      // Check for specific driver tip content
      expect(screen.getByText(/head directly to customer's location/i)).toBeInTheDocument();
      expect(screen.getByText(/make sure you and your vehicle are clean/i)).toBeInTheDocument();
      expect(screen.getByText(/park in a safe location/i)).toBeInTheDocument();
      expect(screen.getByText(/greet the customer in a professional manner/i)).toBeInTheDocument();
      expect(screen.getByText(/take a photo of the storage unit/i)).toBeInTheDocument();
      expect(screen.getByText(/door is securely shut/i)).toBeInTheDocument();
    });

    it('displays correct mover tips content', () => {
      render(<TrainingTips userType="mover" />);
      
      // Check for specific mover tip content
      expect(screen.getByText(/wrap all furniture items/i)).toBeInTheDocument();
      expect(screen.getByText(/load heavier items on the base/i)).toBeInTheDocument();
      expect(screen.getByText(/items are secure and will not shift/i)).toBeInTheDocument();
      expect(screen.getByText(/never slide furniture across a floor/i)).toBeInTheDocument();
      expect(screen.getByText(/think before lifting/i)).toBeInTheDocument();
      expect(screen.getByText(/use tools.*dollies.*shoulder straps/i)).toBeInTheDocument();
    });

    it('displays correct number of tips for each user type', () => {
      // Test driver tips count
      const { rerender } = render(<TrainingTips userType="driver" />);
      let listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(6);
      
      // Test mover tips count
      rerender(<TrainingTips userType="mover" />);
      listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(6);
    });
  });

  // REQUIRED: Design system compliance testing
  describe('Design System Integration', () => {
    it('uses semantic color classes', () => {
      const { container } = render(<TrainingTips userType="driver" />);
      
      // Check for design system color usage
      const list = container.querySelector('ul');
      expect(list).toHaveClass('border-border');
      expect(list).toHaveClass('bg-surface-primary');
      
      // Check check icon styling
      const checkIcon = container.querySelector('.outline-primary');
      expect(checkIcon).toBeInTheDocument();
      expect(checkIcon).toHaveClass('bg-primary');
    });

    it('applies proper spacing and layout classes', () => {
      const { container } = render(<TrainingTips userType="driver" />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('mt-4');
      
      const list = container.querySelector('ul');
      expect(list).toHaveClass('space-y-6', 'p-6', 'rounded-md');
    });

    it('uses proper text color classes', () => {
      const { container } = render(<TrainingTips userType="driver" />);
      
      const heading = container.querySelector('h2');
      expect(heading).toHaveClass('text-text-primary');
      
      const tipText = container.querySelector('p');
      expect(tipText).toHaveClass('text-text-primary');
    });
  });

  // REQUIRED: Props and state management
  describe('Props Handling', () => {
    it('handles userType prop correctly', () => {
      const { rerender } = render(<TrainingTips userType="driver" />);
      expect(screen.getByRole('heading', { name: /driver tips/i })).toBeInTheDocument();
      
      rerender(<TrainingTips userType="mover" />);
      expect(screen.getByRole('heading', { name: /mover tips/i })).toBeInTheDocument();
    });

    it('handles optional className prop', () => {
      const { container, rerender } = render(<TrainingTips userType="driver" />);
      let section = container.querySelector('section');
      expect(section).not.toHaveClass('custom-class');
      
      rerender(<TrainingTips userType="driver" className="custom-class" />);
      section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('maintains default className when no custom className provided', () => {
      const { container } = render(<TrainingTips userType="driver" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('mt-4');
    });
  });

  // REQUIRED: Component structure testing
  describe('Component Structure', () => {
    it('renders proper HTML structure', () => {
      const { container } = render(<TrainingTips userType="driver" />);
      
      // Check main structure
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      
      const heading = container.querySelector('h2');
      expect(heading).toBeInTheDocument();
      
      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
      
      const listItems = container.querySelectorAll('li');
      expect(listItems).toHaveLength(6);
    });

    it('renders check icons for each tip', () => {
      const { container } = render(<TrainingTips userType="driver" />);
      
      const checkIcons = container.querySelectorAll('.w-5.h-5');
      expect(checkIcons).toHaveLength(6);
      
      // Verify each has the CheckIcon
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons).toHaveLength(6);
    });

    it('renders tip content in paragraphs', () => {
      const { container } = render(<TrainingTips userType="driver" />);
      
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(6);
      
      // Check each paragraph has content
      paragraphs.forEach(p => {
        expect(p.textContent).toBeTruthy();
        expect(p.textContent!.length).toBeGreaterThan(10);
      });
    });
  });
});
