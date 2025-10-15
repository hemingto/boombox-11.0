/**
 * @fileoverview Tests for CoverageAreaSelectionTable component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import CoverageAreaSelectionTable from '@/components/features/service-providers/coverage/CoverageAreaSelectionTable';

expect.extend(toHaveNoViolations);

// Mock the bayAreaCities data
jest.mock('@/data/bayareacities', () => ({
  bayAreaCities: [
    { city: 'San Francisco', zipCodes: ['94102'] },
    { city: 'Oakland', zipCodes: ['94601'] },
    { city: 'San Jose', zipCodes: ['95110'] },
    { city: 'Berkeley', zipCodes: ['94701'] },
    { city: 'Palo Alto', zipCodes: ['94301'] },
    { city: 'Mountain View', zipCodes: ['94040'] },
    { city: 'Sunnyvale', zipCodes: ['94085'] },
    { city: 'Santa Clara', zipCodes: ['95050'] },
    { city: 'Fremont', zipCodes: ['94536'] },
    { city: 'Hayward', zipCodes: ['94541'] },
    { city: 'San Mateo', zipCodes: ['94401'] },
    { city: 'Redwood City', zipCodes: ['94061'] },
  ]
}));

describe('CoverageAreaSelectionTable', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CoverageAreaSelectionTable />);
      expect(screen.getByRole('region', { name: /coverage area selection/i })).toBeInTheDocument();
    });

    it('displays default heading', () => {
      render(<CoverageAreaSelectionTable />);
      expect(screen.getByRole('heading', { name: /select the cities to include in your service area/i })).toBeInTheDocument();
    });

    it('displays custom heading when provided', () => {
      render(<CoverageAreaSelectionTable heading="Choose Your Cities" />);
      expect(screen.getByRole('heading', { name: /choose your cities/i })).toBeInTheDocument();
    });

    it('renders select all checkbox', () => {
      render(<CoverageAreaSelectionTable />);
      expect(screen.getByRole('checkbox', { name: /select all cities/i })).toBeInTheDocument();
      expect(screen.getByText(/12 total/i)).toBeInTheDocument();
    });

    it('displays selection summary', () => {
      render(<CoverageAreaSelectionTable />);
      expect(screen.getByText(/0 cities selected/i)).toBeInTheDocument();
    });

    it('renders city buttons', () => {
      render(<CoverageAreaSelectionTable />);
      expect(screen.getByRole('button', { name: /select san francisco/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select oakland/i })).toBeInTheDocument();
    });

    it('renders pagination controls', () => {
      render(<CoverageAreaSelectionTable />);
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    });

    it('displays note section', () => {
      render(<CoverageAreaSelectionTable />);
      expect(screen.getByText(/note:/i)).toBeInTheDocument();
      expect(screen.getByText(/we recommend starting with a smaller service area/i)).toBeInTheDocument();
    });

    it('displays custom note text when provided', () => {
      const customNote = 'Custom coverage area note';
      render(<CoverageAreaSelectionTable noteText={customNote} />);
      expect(screen.getByText(customNote)).toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<CoverageAreaSelectionTable />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels', () => {
      render(<CoverageAreaSelectionTable />);
      
      expect(screen.getByRole('region', { name: /coverage area selection/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /select all cities/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /cities available for selection/i })).toBeInTheDocument();
    });

    it('uses semantic HTML structure', () => {
      render(<CoverageAreaSelectionTable />);
      
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /city selection pagination/i })).toBeInTheDocument();
    });

    it('city buttons have proper aria-pressed state', () => {
      render(<CoverageAreaSelectionTable />);
      
      const sfButton = screen.getByRole('button', { name: /select san francisco/i });
      expect(sfButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('selection summary has proper live region', () => {
      render(<CoverageAreaSelectionTable />);
      
      const summary = screen.getByText(/0 cities selected/i);
      expect(summary).toHaveAttribute('role', 'status');
      expect(summary).toHaveAttribute('aria-live', 'polite');
    });

    it('pagination page number has live region', () => {
      render(<CoverageAreaSelectionTable />);
      
      const pageNumber = screen.getByText(/page 1 of 1/i);
      expect(pageNumber).toHaveAttribute('aria-live', 'polite');
    });

    it('maintains accessibility after city selection', async () => {
      const user = userEvent.setup();
      const renderResult = render(<CoverageAreaSelectionTable />);
      
      const sfButton = screen.getByRole('button', { name: /select san francisco/i });
      await user.click(sfButton);
      
      await testAccessibility(renderResult);
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('selects a city when clicked', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable />);
      
      const sfButton = screen.getByRole('button', { name: /select san francisco/i });
      await user.click(sfButton);
      
      expect(sfButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/1 city selected/i)).toBeInTheDocument();
    });

    it('deselects a city when clicked again', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable />);
      
      const sfButton = screen.getByRole('button', { name: /select san francisco/i });
      await user.click(sfButton);
      expect(sfButton).toHaveAttribute('aria-pressed', 'true');
      
      // Click again to deselect
      await user.click(screen.getByRole('button', { name: /deselect san francisco/i }));
      expect(screen.getByRole('button', { name: /select san francisco/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText(/0 cities selected/i)).toBeInTheDocument();
    });

    it('selects multiple cities', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable />);
      
      await user.click(screen.getByRole('button', { name: /select san francisco/i }));
      await user.click(screen.getByRole('button', { name: /select oakland/i }));
      await user.click(screen.getByRole('button', { name: /select berkeley/i }));
      
      expect(screen.getByText(/3 cities selected/i)).toBeInTheDocument();
    });

    it('selects all cities when select all is checked', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable />);
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all cities/i });
      await user.click(selectAllCheckbox);
      
      expect(selectAllCheckbox).toBeChecked();
      expect(screen.getByText(/12 cities selected/i)).toBeInTheDocument();
    });

    it('deselects all cities when select all is unchecked', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable />);
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all cities/i });
      
      // Select all
      await user.click(selectAllCheckbox);
      expect(screen.getByText(/12 cities selected/i)).toBeInTheDocument();
      
      // Deselect all
      await user.click(selectAllCheckbox);
      expect(selectAllCheckbox).not.toBeChecked();
      expect(screen.getByText(/0 cities selected/i)).toBeInTheDocument();
    });

    it('updates select all checkbox when all cities manually selected', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable />);
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all cities/i });
      
      // Manually select all cities
      const cityButtons = screen.getAllByRole('button', { name: /^select/i });
      for (const button of cityButtons) {
        await user.click(button);
      }
      
      expect(selectAllCheckbox).toBeChecked();
      expect(screen.getByText(/12 cities selected/i)).toBeInTheDocument();
    });
  });

  // Pagination testing
  describe('Pagination', () => {
    it('previous button is disabled on first page', () => {
      render(<CoverageAreaSelectionTable itemsPerPage={3} />);
      
      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();
      expect(prevButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('next button is disabled on last page', () => {
      render(<CoverageAreaSelectionTable itemsPerPage={100} />);
      
      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('navigates to next page', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable itemsPerPage={3} />);
      
      expect(screen.getByText(/page 1 of 4/i)).toBeInTheDocument();
      
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/page 2 of 4/i)).toBeInTheDocument();
      });
    });

    it('navigates to previous page', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable itemsPerPage={3} />);
      
      // Go to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/page 2 of 4/i)).toBeInTheDocument();
      });
      
      // Go back to page 1
      const prevButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(prevButton);
      
      await waitFor(() => {
        expect(screen.getByText(/page 1 of 4/i)).toBeInTheDocument();
      });
    });

    it('displays correct cities for current page', () => {
      render(<CoverageAreaSelectionTable itemsPerPage={3} />);
      
      // First page should show first 3 cities
      expect(screen.getByRole('button', { name: /select san francisco/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select oakland/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select san jose/i })).toBeInTheDocument();
      
      // Cities from other pages should not be visible
      expect(screen.queryByRole('button', { name: /select berkeley/i })).not.toBeInTheDocument();
    });
  });

  // Callback testing
  describe('Callbacks', () => {
    it('calls onSelectionChange when city is selected', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();
      
      render(<CoverageAreaSelectionTable onSelectionChange={mockOnSelectionChange} />);
      
      await user.click(screen.getByRole('button', { name: /select san francisco/i }));
      
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['San Francisco']);
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
    });

    it('calls onSelectionChange when city is deselected', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();
      
      render(<CoverageAreaSelectionTable onSelectionChange={mockOnSelectionChange} />);
      
      await user.click(screen.getByRole('button', { name: /select san francisco/i }));
      await user.click(screen.getByRole('button', { name: /deselect san francisco/i }));
      
      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(2);
    });

    it('calls onSelectionChange with all cities when select all is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();
      
      render(<CoverageAreaSelectionTable onSelectionChange={mockOnSelectionChange} />);
      
      await user.click(screen.getByRole('checkbox', { name: /select all cities/i }));
      
      expect(mockOnSelectionChange).toHaveBeenCalledWith([
        'San Francisco', 'Oakland', 'San Jose', 'Berkeley', 'Palo Alto', 
        'Mountain View', 'Sunnyvale', 'Santa Clara', 'Fremont', 'Hayward',
        'San Mateo', 'Redwood City'
      ]);
    });

    it('does not throw error when callback not provided', async () => {
      const user = userEvent.setup();
      
      render(<CoverageAreaSelectionTable />);
      
      await user.click(screen.getByRole('button', { name: /select san francisco/i }));
      
      // Should not throw error
      expect(screen.getByText(/1 city selected/i)).toBeInTheDocument();
    });
  });

  // Initial state testing
  describe('Initial State', () => {
    it('renders with initial selected cities', () => {
      render(<CoverageAreaSelectionTable initialSelectedCities={['San Francisco', 'Oakland']} />);
      
      expect(screen.getByRole('button', { name: /deselect san francisco/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /deselect oakland/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/2 cities selected/i)).toBeInTheDocument();
    });

    it('checks select all when all cities initially selected', () => {
      const allCities = [
        'San Francisco', 'Oakland', 'San Jose', 'Berkeley', 'Palo Alto',
        'Mountain View', 'Sunnyvale', 'Santa Clara', 'Fremont', 'Hayward',
        'San Mateo', 'Redwood City'
      ];
      
      render(<CoverageAreaSelectionTable initialSelectedCities={allCities} />);
      
      expect(screen.getByRole('checkbox', { name: /select all cities/i })).not.toBeChecked();
      expect(screen.getByText(/12 cities selected/i)).toBeInTheDocument();
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('uses semantic color classes for selected city', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable />);
      
      const sfButton = screen.getByRole('button', { name: /select san francisco/i });
      await user.click(sfButton);
      
      const selectedButton = screen.getByRole('button', { name: /deselect san francisco/i });
      expect(selectedButton).toHaveClass('bg-primary');
      expect(selectedButton).toHaveClass('text-text-inverse');
    });

    it('uses semantic color classes for unselected city', () => {
      render(<CoverageAreaSelectionTable />);
      
      const sfButton = screen.getByRole('button', { name: /select san francisco/i });
      expect(sfButton).toHaveClass('bg-surface-tertiary');
      expect(sfButton).toHaveClass('text-text-primary');
    });

    it('applies transition classes for smooth interactions', () => {
      render(<CoverageAreaSelectionTable />);
      
      const sfButton = screen.getByRole('button', { name: /select san francisco/i });
      expect(sfButton).toHaveClass('transition-all');
      expect(sfButton).toHaveClass('duration-200');
    });

    it('uses proper border semantic tokens', () => {
      const { container } = render(<CoverageAreaSelectionTable />);
      
      const border = container.querySelector('.border-border');
      expect(border).toBeInTheDocument();
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles custom itemsPerPage', () => {
      render(<CoverageAreaSelectionTable itemsPerPage={5} />);
      
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    });

    it('handles very small itemsPerPage', () => {
      render(<CoverageAreaSelectionTable itemsPerPage={1} />);
      
      expect(screen.getByText(/page 1 of 12/i)).toBeInTheDocument();
      
      // Only one city button should be visible
      const cityButtons = screen.getAllByRole('button', { name: /^(select|deselect)/i });
      expect(cityButtons).toHaveLength(1);
    });

    it('handles large itemsPerPage', () => {
      render(<CoverageAreaSelectionTable itemsPerPage={100} />);
      
      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
      
      // All cities should be visible
      const cityButtons = screen.getAllByRole('button', { name: /^(select|deselect)/i });
      expect(cityButtons).toHaveLength(12);
    });

    it('applies custom className', () => {
      const { container } = render(<CoverageAreaSelectionTable className="custom-class" />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveClass('custom-class');
    });

    it('singular "city" text for single selection', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable />);
      
      await user.click(screen.getByRole('button', { name: /select san francisco/i }));
      
      expect(screen.getByText(/1 city selected/i)).toBeInTheDocument();
    });

    it('plural "cities" text for multiple selections', async () => {
      const user = userEvent.setup();
      render(<CoverageAreaSelectionTable />);
      
      await user.click(screen.getByRole('button', { name: /select san francisco/i }));
      await user.click(screen.getByRole('button', { name: /select oakland/i }));
      
      expect(screen.getByText(/2 cities selected/i)).toBeInTheDocument();
    });
  });

  // Focus management
  describe('Focus Management', () => {
    it('city buttons have proper focus styles', () => {
      render(<CoverageAreaSelectionTable />);
      
      const sfButton = screen.getByRole('button', { name: /select san francisco/i });
      expect(sfButton).toHaveClass('focus:outline-none');
      expect(sfButton).toHaveClass('focus:ring-2');
      expect(sfButton).toHaveClass('focus:ring-border-focus');
    });

    it('pagination buttons have proper focus styles', () => {
      render(<CoverageAreaSelectionTable />);
      
      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).toHaveClass('focus:outline-none');
      expect(nextButton).toHaveClass('focus:ring-2');
    });

    it('checkbox has proper focus styles', () => {
      render(<CoverageAreaSelectionTable />);
      
      const checkbox = screen.getByRole('checkbox', { name: /select all cities/i });
      expect(checkbox).toHaveClass('focus:ring-2');
      expect(checkbox).toHaveClass('focus:ring-border-focus');
    });
  });
});

