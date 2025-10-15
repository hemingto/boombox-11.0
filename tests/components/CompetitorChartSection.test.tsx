/**
 * @fileoverview Tests for CompetitorChartSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { CompetitorChartSection, type CompetitorFeature } from '@/components/features/storage-unit-prices/CompetitorChartSection';

expect.extend(toHaveNoViolations);

describe('CompetitorChartSection', () => {
  // Sample test data
  const mockFeatures: CompetitorFeature[] = [
    { feature: 'Free delivery', boombox: true, competitors: false },
    { feature: 'On-demand access', boombox: true, competitors: false },
    { feature: 'Climate controlled', boombox: false, competitors: true },
    { feature: 'Month-to-month', boombox: true, competitors: true },
  ];

  const mockFeaturesAllBoombox: CompetitorFeature[] = [
    { feature: 'Feature 1', boombox: true, competitors: false },
    { feature: 'Feature 2', boombox: true, competitors: false },
  ];

  const mockFeaturesAllCompetitors: CompetitorFeature[] = [
    { feature: 'Feature 1', boombox: false, competitors: true },
    { feature: 'Feature 2', boombox: false, competitors: true },
  ];

  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders the main heading', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      expect(screen.getByRole('heading', { name: /more service, lower rate/i, level: 1 })).toBeInTheDocument();
    });

    it('renders table headers', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      
      expect(screen.getByRole('columnheader', { name: /boombox/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /competitors/i })).toBeInTheDocument();
    });

    it('renders all feature rows', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      
      mockFeatures.forEach((feature) => {
        expect(screen.getByText(feature.feature)).toBeInTheDocument();
      });
    });

    it('renders correct number of rows', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(mockFeatures.length);
    });

    it('renders check and x icons correctly', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      // Should have check and x icons based on features
      const checkIcons = container.querySelectorAll('svg[class*="text-success"]');
      const xIcons = container.querySelectorAll('svg[class*="text-text-tertiary"]');
      
      expect(checkIcons.length).toBeGreaterThan(0);
      expect(xIcons.length).toBeGreaterThan(0);
    });

    it('handles empty features array', () => {
      const { container } = render(<CompetitorChartSection features={[]} />);
      
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(0);
    });

    it('renders with single feature', () => {
      const singleFeature: CompetitorFeature[] = [
        { feature: 'Single feature', boombox: true, competitors: false },
      ];
      
      render(<CompetitorChartSection features={singleFeature} />);
      expect(screen.getByText('Single feature')).toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<CompetitorChartSection features={mockFeatures} />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA label on section', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      
      const section = screen.getByRole('region', { name: /competitor comparison/i });
      expect(section).toHaveAttribute('aria-label', 'Competitor comparison');
    });

    it('has proper ARIA label on table', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      
      const table = screen.getByRole('table', { name: /feature comparison/i });
      expect(table).toHaveAttribute('aria-label', 'Feature comparison between Boombox and competitors');
    });

    it('has table caption for screen readers', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const caption = container.querySelector('caption');
      expect(caption).toBeInTheDocument();
      expect(caption).toHaveClass('sr-only');
      expect(caption).toHaveTextContent(/comparison of features/i);
    });

    it('has proper scope attributes on table headers', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const columnHeaders = container.querySelectorAll('th[scope="col"]');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });

    it('has proper scope attributes on row headers', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const rowHeaders = container.querySelectorAll('th[scope="row"]');
      expect(rowHeaders.length).toBe(mockFeatures.length);
    });

    it('has screen reader text for available features', () => {
      render(<CompetitorChartSection features={mockFeaturesAllBoombox} />);
      
      const availableTexts = screen.getAllByText('Available');
      expect(availableTexts.length).toBeGreaterThan(0);
      
      availableTexts.forEach((text) => {
        expect(text).toHaveClass('sr-only');
      });
    });

    it('has screen reader text for unavailable features', () => {
      render(<CompetitorChartSection features={mockFeaturesAllBoombox} />);
      
      const unavailableTexts = screen.getAllByText('Not available');
      expect(unavailableTexts.length).toBeGreaterThan(0);
      
      unavailableTexts.forEach((text) => {
        expect(text).toHaveClass('sr-only');
      });
    });

    it('icons have aria-hidden attribute', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('uses semantic heading hierarchy', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      
      // h1 for main title
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // h2 for column headers
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings.length).toBeGreaterThanOrEqual(2); // Boombox + Competitors
      
      // h3 for feature names
      const h3Headings = screen.getAllByRole('heading', { level: 3 });
      expect(h3Headings.length).toBe(mockFeatures.length);
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('uses semantic color tokens for borders', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const thead = container.querySelector('thead');
      const tbody = container.querySelector('tbody');
      
      expect(thead).toHaveClass('border-border');
      expect(tbody).toHaveClass('border-border');
    });

    it('uses semantic color tokens for text', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('uses success color for check icons', () => {
      const { container } = render(<CompetitorChartSection features={mockFeaturesAllBoombox} />);
      
      const checkIcons = container.querySelectorAll('svg[class*="text-success"]');
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('uses tertiary text color for x icons', () => {
      const { container } = render(<CompetitorChartSection features={mockFeaturesAllBoombox} />);
      
      const xIcons = container.querySelectorAll('svg[class*="text-text-tertiary"]');
      expect(xIcons.length).toBeGreaterThan(0);
    });
  });

  // Responsive design
  describe('Responsive Design', () => {
    it('has responsive padding classes', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('has responsive margin classes', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('sm:mb-48', 'mb-24');
    });

    it('has responsive text sizes', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      h2Headings.forEach((heading) => {
        expect(heading).toHaveClass('text-xl', 'sm:text-2xl');
      });
    });

    it('has horizontal scroll container', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  // Data handling
  describe('Data Handling', () => {
    it('displays boombox check when feature is available', () => {
      const { container } = render(<CompetitorChartSection features={mockFeaturesAllBoombox} />);
      
      const rows = container.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const boomboxCell = row.querySelectorAll('td')[0]; // First td (Boombox column)
        const checkIcon = boomboxCell.querySelector('svg[class*="text-success"]');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it('displays boombox x when feature is not available', () => {
      const { container } = render(<CompetitorChartSection features={mockFeaturesAllCompetitors} />);
      
      const rows = container.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const boomboxCell = row.querySelectorAll('td')[0]; // First td (Boombox column)
        const xIcon = boomboxCell.querySelector('svg[class*="text-text-tertiary"]');
        expect(xIcon).toBeInTheDocument();
      });
    });

    it('displays competitor check when feature is available', () => {
      const { container } = render(<CompetitorChartSection features={mockFeaturesAllCompetitors} />);
      
      const rows = container.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const competitorCell = row.querySelectorAll('td')[1]; // Second td (Competitors column)
        const checkIcon = competitorCell.querySelector('svg[class*="text-success"]');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it('displays competitor x when feature is not available', () => {
      const { container } = render(<CompetitorChartSection features={mockFeaturesAllBoombox} />);
      
      const rows = container.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const competitorCell = row.querySelectorAll('td')[1]; // Second td (Competitors column)
        const xIcon = competitorCell.querySelector('svg[class*="text-text-tertiary"]');
        expect(xIcon).toBeInTheDocument();
      });
    });

    it('handles mixed feature availability correctly', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      
      // First feature: boombox true, competitors false
      expect(screen.getByText('Free delivery')).toBeInTheDocument();
      
      // Last feature: boombox true, competitors true  
      expect(screen.getByText('Month-to-month')).toBeInTheDocument();
    });
  });

  // Table structure
  describe('Table Structure', () => {
    it('has proper table structure', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelector('thead')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });

    it('has three columns', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const headerRow = container.querySelector('thead tr');
      const headers = headerRow?.querySelectorAll('th');
      expect(headers).toHaveLength(3);
    });

    it('each row has three cells (one th and two td)', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const rows = container.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const th = row.querySelectorAll('th');
        const td = row.querySelectorAll('td');
        expect(th).toHaveLength(1); // Row header
        expect(td).toHaveLength(2); // Data cells
      });
    });

    it('uses table-auto class for responsive width', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const table = container.querySelector('table');
      expect(table).toHaveClass('table-auto', 'w-full');
    });
  });

  // Content validation
  describe('Content Validation', () => {
    it('renders feature names correctly', () => {
      render(<CompetitorChartSection features={mockFeatures} />);
      
      expect(screen.getByText('Free delivery')).toBeInTheDocument();
      expect(screen.getByText('On-demand access')).toBeInTheDocument();
      expect(screen.getByText('Climate controlled')).toBeInTheDocument();
      expect(screen.getByText('Month-to-month')).toBeInTheDocument();
    });

    it('maintains feature order', () => {
      const { container } = render(<CompetitorChartSection features={mockFeatures} />);
      
      const featureNames = container.querySelectorAll('th[scope="row"] h3');
      featureNames.forEach((element, index) => {
        expect(element.textContent).toBe(mockFeatures[index].feature);
      });
    });
  });
});

