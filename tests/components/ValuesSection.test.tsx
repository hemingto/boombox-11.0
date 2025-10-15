/**
 * @fileoverview Tests for ValuesSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { ValuesSection, type Value } from '@/components/features/careers/ValuesSection';

expect.extend(toHaveNoViolations);

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => ({
  CheckCircleIcon: function MockCheckCircleIcon(props: any) {
    return <svg data-testid="check-circle-icon" {...props} />;
  }
}));

describe('ValuesSection', () => {
  const mockValues: Value[] = [
    {
      title: 'Test Value 1',
      description: 'Test description 1'
    },
    {
      title: 'Test Value 2', 
      description: 'Test description 2'
    }
  ];

  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ValuesSection />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('renders with default values', () => {
      render(<ValuesSection />);
      
      // Check title
      expect(screen.getByRole('heading', { level: 1, name: /boombox values/i })).toBeInTheDocument();
      
      // Check default values are rendered
      expect(screen.getByText('Safety')).toBeInTheDocument();
      expect(screen.getByText('Professionalism')).toBeInTheDocument();
      expect(screen.getByText('Delight the Customer')).toBeInTheDocument();
      expect(screen.getByText('Accountability')).toBeInTheDocument();
      
      // Check list structure
      expect(screen.getByRole('list')).toBeInTheDocument();
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(4); // Default values count
    });

    it('renders with custom props', () => {
      const customTitle = 'Custom Values Title';
      
      render(
        <ValuesSection 
          values={mockValues}
          title={customTitle}
        />
      );
      
      expect(screen.getByRole('heading', { level: 1, name: customTitle })).toBeInTheDocument();
      expect(screen.getByText('Test Value 1')).toBeInTheDocument();
      expect(screen.getByText('Test Value 2')).toBeInTheDocument();
      expect(screen.getByText('Test description 1')).toBeInTheDocument();
      expect(screen.getByText('Test description 2')).toBeInTheDocument();
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<ValuesSection />);
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with custom props', async () => {
      const renderResult = render(
        <ValuesSection 
          values={mockValues}
          title="Custom Title"
        />
      );
      await testAccessibility(renderResult);
    });

    it('has proper semantic HTML structure', () => {
      render(<ValuesSection />);
      
      // Check section element
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'values-heading');
      
      // Check heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAttribute('id', 'values-heading');
      
      // Check list structure
      expect(screen.getByRole('list')).toBeInTheDocument();
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('has proper ARIA attributes for icons', () => {
      render(<ValuesSection />);
      
      const icons = screen.getAllByTestId('check-circle-icon');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('maintains proper heading hierarchy', () => {
      render(<ValuesSection />);
      
      // Main heading should be h1
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      
      // Value titles should be h2
      const valueHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(valueHeadings.length).toBeGreaterThan(0);
    });
  });

  // REQUIRED: Component behavior testing
  describe('Component Behavior', () => {
    it('renders correct number of values', () => {
      render(<ValuesSection values={mockValues} />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(mockValues.length);
      
      const icons = screen.getAllByTestId('check-circle-icon');
      expect(icons).toHaveLength(mockValues.length);
    });

    it('handles empty values array', () => {
      render(<ValuesSection values={[]} />);
      
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      
      const listItems = screen.queryAllByRole('listitem');
      expect(listItems).toHaveLength(0);
    });

    it('renders value descriptions correctly', () => {
      const valueWithLongDescription = {
        title: 'Long Description Value',
        description: 'This is a very long description that should be rendered correctly and maintain proper formatting and accessibility.'
      };
      
      render(<ValuesSection values={[valueWithLongDescription]} />);
      
      expect(screen.getByText(valueWithLongDescription.title)).toBeInTheDocument();
      expect(screen.getByText(valueWithLongDescription.description)).toBeInTheDocument();
    });
  });

  // REQUIRED: Design system integration
  describe('Design System Integration', () => {
    it('uses design system color classes', () => {
      render(<ValuesSection />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveClass('bg-primary');
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-text-inverse');
      
      const valueHeadings = screen.getAllByRole('heading', { level: 2 });
      valueHeadings.forEach(heading => {
        expect(heading).toHaveClass('text-text-inverse');
      });
    });

    it('uses design system spacing classes', () => {
      render(<ValuesSection />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveClass('px-6', 'lg:px-16', 'pt-24', 'pb-36', 'sm:mb-24', 'mb-12');
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-10');
    });

    it('maintains consistent icon styling', () => {
      render(<ValuesSection />);
      
      const icons = screen.getAllByTestId('check-circle-icon');
      icons.forEach(icon => {
        expect(icon).toHaveClass('flex-shrink-0', 'w-8', 'h-8', 'mt-1', 'text-text-inverse');
      });
    });

    it('applies proper typography classes', () => {
      render(<ValuesSection />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveClass('font-bold');
      
      const valueHeadings = screen.getAllByRole('heading', { level: 2 });
      valueHeadings.forEach(heading => {
        expect(heading).toHaveClass('font-semibold');
      });
    });
  });

  // REQUIRED: Component props testing
  describe('Component Props', () => {
    it('handles all optional props correctly', () => {
      const props = {
        values: mockValues,
        title: 'Custom Title',
        className: 'custom-class'
      };
      
      render(<ValuesSection {...props} />);
      
      expect(screen.getByRole('heading', { level: 1, name: props.title })).toBeInTheDocument();
      expect(screen.getByText('Test Value 1')).toBeInTheDocument();
      expect(screen.getByText('Test Value 2')).toBeInTheDocument();
    });

    it('uses default values when props are not provided', () => {
      render(<ValuesSection />);
      
      expect(screen.getByRole('heading', { level: 1, name: /boombox values/i })).toBeInTheDocument();
      expect(screen.getByText('Safety')).toBeInTheDocument();
      expect(screen.getByText('Professionalism')).toBeInTheDocument();
    });

    it('handles Value interface correctly', () => {
      const testValue: Value = {
        title: 'Interface Test',
        description: 'Testing Value interface'
      };
      
      render(<ValuesSection values={[testValue]} />);
      
      expect(screen.getByText(testValue.title)).toBeInTheDocument();
      expect(screen.getByText(testValue.description)).toBeInTheDocument();
    });
  });
});
