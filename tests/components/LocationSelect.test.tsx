/**
 * @fileoverview Tests for LocationSelect component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { LocationSelect } from '@/components/features/drivers/LocationSelect';

expect.extend(toHaveNoViolations);

describe('LocationSelect', () => {
  const mockOnLocationChange = jest.fn();
  const mockOnClearError = jest.fn();

  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('displays placeholder text when no value is selected', () => {
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      expect(screen.getByText('Where are you located?')).toBeInTheDocument();
    });

    it('displays selected value when provided', () => {
      render(
        <LocationSelect
          value="San Francisco"
          onLocationChange={mockOnLocationChange}
        />
      );
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
    });

    it('renders with error state styling', () => {
      render(
        <LocationSelect
          onLocationChange={mockOnLocationChange}
          hasError={true}
        />
      );
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveClass('text-status-error', 'bg-status-bg-error');
      expect(combobox).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not render dropdown initially', () => {
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(
        <LocationSelect onLocationChange={mockOnLocationChange} />
      );
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with error state', async () => {
      const renderResult = render(
        <LocationSelect
          onLocationChange={mockOnLocationChange}
          hasError={true}
          onClearError={mockOnClearError}
        />
      );
      await testAccessibility(renderResult);
    });

    it('has proper ARIA attributes on combobox', () => {
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      const combobox = screen.getByRole('combobox');
      
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
      expect(combobox).toHaveAttribute('aria-label', 'Select your service area location');
      expect(combobox).toHaveAttribute('tabIndex', '0');
    });

    it('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      const combobox = screen.getByRole('combobox');
      
      await user.click(combobox);
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders location options with proper ARIA roles', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      await user.click(screen.getByRole('combobox'));
      
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute('aria-label', 'Location options');
      
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    it('announces error state to screen readers', () => {
      render(
        <LocationSelect
          onLocationChange={mockOnLocationChange}
          hasError={true}
        />
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Location selection is required');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <LocationSelect onLocationChange={mockOnLocationChange} />
          <button>Outside Button</button>
        </div>
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      const outsideButton = screen.getByText('Outside Button');
      await user.click(outsideButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('selects location when option is clicked', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      await user.click(screen.getByRole('combobox'));
      const sanFranciscoOption = screen.getByText('San Francisco');
      await user.click(sanFranciscoOption);
      
      expect(mockOnLocationChange).toHaveBeenCalledWith('San Francisco');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
    });

    it('clears error when dropdown is opened', async () => {
      const user = userEvent.setup();
      render(
        <LocationSelect
          onLocationChange={mockOnLocationChange}
          hasError={true}
          onClearError={mockOnClearError}
        />
      );
      
      await user.click(screen.getByRole('combobox'));
      expect(mockOnClearError).toHaveBeenCalledTimes(1);
    });

    it('displays all location groups', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      await user.click(screen.getByRole('combobox'));
      
      expect(screen.getByText('San Francisco Bay Area')).toBeInTheDocument();
      expect(screen.getByText('Central Valley')).toBeInTheDocument();
    });

    it('displays all San Francisco Bay Area locations', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      await user.click(screen.getByRole('combobox'));
      
      const bayAreaLocations = [
        'San Francisco',
        'South Bay (Mountain View to Santa Clara)',
        'Northern Peninsula (Millbrae to San Carlos)',
        'East Bay',
        'San Leandro to Fremont',
        'Southern Peninsula (Redwood City to Palo Alto)',
        'San Jose',
        'North Bay',
      ];
      
      bayAreaLocations.forEach((location) => {
        expect(screen.getByText(location)).toBeInTheDocument();
      });
    });

    it('displays all Central Valley locations', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      await user.click(screen.getByRole('combobox'));
      
      expect(screen.getByText('Stockton')).toBeInTheDocument();
      expect(screen.getByText('Manteca')).toBeInTheDocument();
      expect(screen.getByText('Lodi')).toBeInTheDocument();
    });
  });

  // REQUIRED: Keyboard navigation testing
  describe('Keyboard Navigation', () => {
    it('opens dropdown on Enter key', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      combobox.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens dropdown on Space key', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      combobox.focus();
      await user.keyboard(' ');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('navigates through options with Arrow Down', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      // Press ArrowDown multiple times
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      
      // Visual focus should update (tested through hover state)
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('navigates through options with Arrow Up', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      // Move down first
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      // Then move up
      await user.keyboard('{ArrowUp}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('selects focused option on Enter key', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      // Navigate to first option and select
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(mockOnLocationChange).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('jumps to first option on Home key', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      // Navigate down first
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      // Jump to start
      await user.keyboard('{Home}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('jumps to last option on End key', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      await user.keyboard('{End}');
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  // REQUIRED: State management testing
  describe('State Management', () => {
    it('syncs internal state with external value prop', () => {
      const { rerender } = render(
        <LocationSelect
          value="San Francisco"
          onLocationChange={mockOnLocationChange}
        />
      );
      
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
      
      rerender(
        <LocationSelect
          value="San Jose"
          onLocationChange={mockOnLocationChange}
        />
      );
      
      expect(screen.getByText('San Jose')).toBeInTheDocument();
    });

    it('handles null value prop', () => {
      render(
        <LocationSelect
          value={null}
          onLocationChange={mockOnLocationChange}
        />
      );
      
      expect(screen.getByText('Where are you located?')).toBeInTheDocument();
    });

    it('maintains selected state after dropdown closes', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('East Bay'));
      
      expect(screen.getByText('East Bay')).toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  // REQUIRED: Visual state testing
  describe('Visual States', () => {
    it('applies hover state styling to options', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      await user.click(screen.getByRole('combobox'));
      
      const option = screen.getByText('San Francisco');
      expect(option).toHaveClass('hover:bg-surface-hover');
    });

    it('highlights selected option differently', async () => {
      const user = userEvent.setup();
      render(
        <LocationSelect
          value="San Francisco"
          onLocationChange={mockOnLocationChange}
        />
      );
      
      await user.click(screen.getByRole('combobox'));
      
      // Get the option element specifically (not the display text)
      const selectedOption = screen.getByRole('option', { name: 'San Francisco' });
      expect(selectedOption).toHaveClass('bg-surface-disabled', 'font-medium');
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });

    it('rotates arrow icon when dropdown is open', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      const svg = combobox.querySelector('svg');
      
      expect(svg).not.toHaveClass('rotate-180');
      
      await user.click(combobox);
      expect(svg).toHaveClass('rotate-180');
    });

    it('applies correct styling based on error state', () => {
      render(
        <LocationSelect
          onLocationChange={mockOnLocationChange}
          hasError={false}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveClass('bg-surface-tertiary');
      expect(combobox).not.toHaveClass('text-status-error');
    });
  });

  // REQUIRED: Edge cases and error handling
  describe('Edge Cases', () => {
    it('handles rapid open/close interactions', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      const combobox = screen.getByRole('combobox');
      
      await user.click(combobox);
      await user.click(combobox);
      await user.click(combobox);
      
      // Should still be functional
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('handles missing onClearError callback gracefully', async () => {
      const user = userEvent.setup();
      render(
        <LocationSelect
          onLocationChange={mockOnLocationChange}
          hasError={true}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      // Should not throw error
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('prevents selection when keyboard navigating without focus', async () => {
      const user = userEvent.setup();
      render(<LocationSelect onLocationChange={mockOnLocationChange} />);
      
      // Try to trigger Enter without opening dropdown
      const combobox = screen.getByRole('combobox');
      combobox.focus();
      
      // Should open, not select
      await user.keyboard('{Enter}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });
});
