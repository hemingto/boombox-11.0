/**
 * @fileoverview Tests for NumberOfUnitsSection component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { NumberOfUnitsSection } from '@/components/features/storage-calculator/NumberOfUnitsSection';

expect.extend(toHaveNoViolations);

// Mock icon components
jest.mock('@/components/icons/StorageUnitIcon', () => ({
  StorageUnitIcon: function MockStorageUnitIcon(props: any) {
    return <div data-testid="storage-unit-icon" {...props} />;
  },
}));

jest.mock('@/components/icons/TwoUnitIcon', () => {
  const MockTwoUnitIcon = (props: any) => <div data-testid="two-unit-icon" {...props} />;
  MockTwoUnitIcon.displayName = 'MockTwoUnitIcon';
  return {
    __esModule: true,
    default: MockTwoUnitIcon,
  };
});

jest.mock('@/components/icons/ThreeUnitIcon', () => {
  const MockThreeUnitIcon = (props: any) => <div data-testid="three-unit-icon" {...props} />;
  MockThreeUnitIcon.displayName = 'MockThreeUnitIcon';
  return {
    __esModule: true,
    default: MockThreeUnitIcon,
  };
});

describe('NumberOfUnitsSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<NumberOfUnitsSection />);
      expect(screen.getByRole('heading', { name: /generally speaking/i })).toBeInTheDocument();
    });

    it('renders all five storage size rows', () => {
      render(<NumberOfUnitsSection />);
      
      expect(screen.getByText('Extra Items')).toBeInTheDocument();
      expect(screen.getByText('Studio')).toBeInTheDocument();
      expect(screen.getByText('1 bedroom apartment')).toBeInTheDocument();
      expect(screen.getByText('2 bedroom apartment')).toBeInTheDocument();
      expect(screen.getByText('Full home')).toBeInTheDocument();
    });

    it('renders container counts correctly', () => {
      render(<NumberOfUnitsSection />);
      
      expect(screen.getByText('1 unit')).toBeInTheDocument();
      expect(screen.getByText('1-2 units')).toBeInTheDocument();
      expect(screen.getByText('2 units')).toBeInTheDocument();
      expect(screen.getByText('3 units')).toBeInTheDocument();
      expect(screen.getByText('3+ units')).toBeInTheDocument();
    });

    it('renders table structure correctly', () => {
      render(<NumberOfUnitsSection />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check for thead and tbody
      const thead = table.querySelector('thead');
      const tbody = table.querySelector('tbody');
      
      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
    });

    it('renders column header', () => {
      render(<NumberOfUnitsSection />);
      
      expect(screen.getByRole('columnheader', { name: /# of boomboxes/i })).toBeInTheDocument();
    });

    it('renders appropriate icons for each row', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      // Extra Items: 1 StorageUnitIcon
      expect(container.querySelectorAll('[data-testid="storage-unit-icon"]')).toHaveLength(1);
      
      // Studio and 1 bedroom: 2 TwoUnitIcons
      expect(container.querySelectorAll('[data-testid="two-unit-icon"]')).toHaveLength(2);
      
      // 2 bedroom and Full home: 2 ThreeUnitIcons
      expect(container.querySelectorAll('[data-testid="three-unit-icon"]')).toHaveLength(2);
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<NumberOfUnitsSection />);
      await testAccessibility(renderResult);
    });

    it('has proper table structure with caption', () => {
      render(<NumberOfUnitsSection />);
      
      const table = screen.getByRole('table', { 
        name: /number of boombox storage units needed by home size/i 
      });
      expect(table).toBeInTheDocument();
    });

    it('has proper column headers with scope', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const columnHeaders = container.querySelectorAll('th[scope="col"]');
      expect(columnHeaders).toHaveLength(2);
    });

    it('has proper section landmark with aria-labelledby', () => {
      render(<NumberOfUnitsSection />);
      
      const section = screen.getByRole('region', { name: /generally speaking/i });
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'units-by-size-heading');
    });

    it('has aria-hidden on decorative icons', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('has proper heading hierarchy', () => {
      render(<NumberOfUnitsSection />);
      
      // Main heading
      const mainHeading = screen.getByRole('heading', { level: 1, name: /generally speaking/i });
      expect(mainHeading).toBeInTheDocument();
      
      // Subheadings
      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    it('has role="group" for unit count cells with descriptive labels', () => {
      render(<NumberOfUnitsSection />);
      
      const groups = screen.getAllByRole('group');
      expect(groups.length).toBe(5); // One for each row
      
      // Check first group has proper label
      expect(screen.getByRole('group', { name: /1 unit for extra items/i })).toBeInTheDocument();
    });
  });

  // Table structure and content
  describe('Table Structure', () => {
    it('renders correct number of table rows', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      
      expect(rows).toHaveLength(5);
    });

    it('each row has correct number of cells', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      
      rows?.forEach(row => {
        const cells = row.querySelectorAll('td');
        expect(cells).toHaveLength(2); // Home size and unit count
      });
    });

    it('renders table borders correctly', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const thead = container.querySelector('thead');
      const tbody = container.querySelector('tbody');
      
      expect(thead).toHaveClass('border-b-2', 'border-border');
      expect(tbody).toHaveClass('border-b-2', 'border-border');
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('uses semantic color classes for main heading', () => {
      render(<NumberOfUnitsSection />);
      
      const heading = screen.getByRole('heading', { name: /generally speaking/i });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('uses semantic color classes for column header', () => {
      render(<NumberOfUnitsSection />);
      
      const columnHeader = screen.getByRole('columnheader', { name: /# of boomboxes/i });
      expect(columnHeader).toHaveClass('text-text-primary');
    });

    it('uses semantic border colors', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const thead = container.querySelector('thead');
      const tbody = container.querySelector('tbody');
      
      expect(thead).toHaveClass('border-border');
      expect(tbody).toHaveClass('border-border');
    });

    it('applies proper spacing classes', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('sm:mb-48', 'mb-24', 'lg:px-16', 'px-6');
    });

    it('uses semantic text colors for home sizes', () => {
      render(<NumberOfUnitsSection />);
      
      const extraItems = screen.getByText('Extra Items');
      const parentHeading = extraItems.closest('h2');
      
      expect(parentHeading).toHaveClass('text-text-primary');
    });

    it('applies proper text sizes responsively', () => {
      render(<NumberOfUnitsSection />);
      
      const mainHeading = screen.getByRole('heading', { name: /generally speaking/i });
      expect(mainHeading).toHaveClass('text-3xl');
      
      const columnHeader = screen.getByRole('columnheader', { name: /# of boomboxes/i });
      const h2 = columnHeader.querySelector('h2');
      expect(h2).toHaveClass('text-xl', 'sm:text-2xl');
    });
  });

  // Content validation
  describe('Content Validation', () => {
    it('displays Extra Items with correct unit count', () => {
      render(<NumberOfUnitsSection />);
      
      expect(screen.getByText('Extra Items')).toBeInTheDocument();
      expect(screen.getByText('1 unit')).toBeInTheDocument();
    });

    it('displays Studio with correct unit count', () => {
      render(<NumberOfUnitsSection />);
      
      expect(screen.getByText('Studio')).toBeInTheDocument();
      expect(screen.getByText('1-2 units')).toBeInTheDocument();
    });

    it('displays 1 bedroom apartment with correct unit count', () => {
      render(<NumberOfUnitsSection />);
      
      expect(screen.getByText('1 bedroom apartment')).toBeInTheDocument();
      expect(screen.getByText('2 units')).toBeInTheDocument();
    });

    it('displays 2 bedroom apartment with correct unit count', () => {
      render(<NumberOfUnitsSection />);
      
      expect(screen.getByText('2 bedroom apartment')).toBeInTheDocument();
      expect(screen.getByText('3 units')).toBeInTheDocument();
    });

    it('displays Full home with correct unit count', () => {
      render(<NumberOfUnitsSection />);
      
      expect(screen.getByText('Full home')).toBeInTheDocument();
      expect(screen.getByText('3+ units')).toBeInTheDocument();
    });
  });

  // Icon rendering
  describe('Icon Rendering', () => {
    it('renders single unit icon for Extra Items', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const tbody = container.querySelector('tbody');
      const firstRow = tbody?.querySelector('tr:first-child');
      const icon = firstRow?.querySelector('[data-testid="storage-unit-icon"]');
      
      expect(icon).toBeInTheDocument();
    });

    it('renders two unit icons for Studio and 1 bedroom', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const twoUnitIcons = container.querySelectorAll('[data-testid="two-unit-icon"]');
      expect(twoUnitIcons).toHaveLength(2);
    });

    it('renders three unit icons for 2 bedroom and Full home', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const threeUnitIcons = container.querySelectorAll('[data-testid="three-unit-icon"]');
      expect(threeUnitIcons).toHaveLength(2);
    });

    it('applies correct width classes to icons', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      // StorageUnitIcon should have w-12
      const storageUnitIcon = container.querySelector('[data-testid="storage-unit-icon"]');
      expect(storageUnitIcon).toHaveClass('w-12');
      
      // TwoUnitIcons should have w-16
      const twoUnitIcons = container.querySelectorAll('[data-testid="two-unit-icon"]');
      twoUnitIcons.forEach(icon => {
        expect(icon).toHaveClass('w-16');
      });
      
      // ThreeUnitIcons should have w-20
      const threeUnitIcons = container.querySelectorAll('[data-testid="three-unit-icon"]');
      threeUnitIcons.forEach(icon => {
        expect(icon).toHaveClass('w-20');
      });
    });

    it('icons have text-text-primary color class', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const allIcons = container.querySelectorAll('[data-testid*="-icon"]');
      allIcons.forEach(icon => {
        expect(icon).toHaveClass('text-text-primary');
      });
    });
  });

  // Responsive design
  describe('Responsive Design', () => {
    it('applies responsive padding to container', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies responsive margin to section', () => {
      const { container } = render(<NumberOfUnitsSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('sm:mb-48', 'mb-24');
    });

    it('applies responsive text sizes to headings', () => {
      render(<NumberOfUnitsSection />);
      
      const columnHeader = screen.getByRole('columnheader', { name: /# of boomboxes/i });
      const h2 = columnHeader.querySelector('h2');
      
      expect(h2).toHaveClass('text-xl', 'sm:text-2xl');
    });

    it('applies responsive text sizes to unit counts', () => {
      render(<NumberOfUnitsSection />);
      
      const unitCount = screen.getByText('1 unit');
      const h2 = unitCount.closest('h2');
      
      expect(h2).toHaveClass('text-lg', 'sm:text-xl');
    });
  });

  // Integration test
  describe('Integration', () => {
    it('renders complete table with all components', () => {
      render(<NumberOfUnitsSection />);
      
      // Section
      expect(screen.getByRole('region', { name: /generally speaking/i })).toBeInTheDocument();
      
      // Table
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Headers
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /# of boomboxes/i })).toBeInTheDocument();
      
      // All rows
      expect(screen.getByText('Extra Items')).toBeInTheDocument();
      expect(screen.getByText('Studio')).toBeInTheDocument();
      expect(screen.getByText('1 bedroom apartment')).toBeInTheDocument();
      expect(screen.getByText('2 bedroom apartment')).toBeInTheDocument();
      expect(screen.getByText('Full home')).toBeInTheDocument();
      
      // All unit counts
      expect(screen.getByText('1 unit')).toBeInTheDocument();
      expect(screen.getByText('1-2 units')).toBeInTheDocument();
      expect(screen.getByText('2 units')).toBeInTheDocument();
      expect(screen.getByText('3 units')).toBeInTheDocument();
      expect(screen.getByText('3+ units')).toBeInTheDocument();
    });
  });
});

