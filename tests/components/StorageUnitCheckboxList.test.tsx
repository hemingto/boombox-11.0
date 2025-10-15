/**
 * @fileoverview Comprehensive Jest tests for StorageUnitCheckboxList component
 * @source Created for boombox-11.0 refactored component
 * 
 * TEST COVERAGE:
 * - Component rendering with various props
 * - Storage unit selection functionality
 * - Select All functionality
 * - Error state handling
 * - Disabled state behavior
 * - Image error handling
 * - Keyboard navigation
 * - Accessibility compliance
 * - Custom hooks behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StorageUnitCheckboxList } from '@/components/forms/StorageUnitCheckboxList';
import { FormattedStorageUnit } from '@/types/storage.types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage', () => ({
  OptimizedImage: ({ src, alt, onError, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      onError={onError}
      data-testid="optimized-image"
      {...props}
    />
  ),
}));

// Mock utility functions
jest.mock('@/lib/utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('StorageUnitCheckboxList', () => {
  // Helper function to find unit checkbox by name
  const findUnitCheckbox = (unitName: string) => {
    const allCheckboxes = screen.getAllByRole('checkbox');
    return allCheckboxes.find(checkbox => 
      checkbox.getAttribute('aria-label')?.includes(unitName)
    );
  };

  // Mock data
  const mockStorageUnits: FormattedStorageUnit[] = [
    {
      id: '1',
      imageSrc: '/img/unit1.jpg',
      title: 'Boombox Unit 001',
      pickUpDate: '2024-01-15',
      lastAccessedDate: '2024-01-20',
      description: 'Living room furniture and boxes',
    },
    {
      id: '2',
      imageSrc: '/img/unit2.jpg',
      title: 'Boombox Unit 002',
      pickUpDate: '2024-01-10',
      lastAccessedDate: '2024-01-18',
      description: 'Bedroom items and clothing',
    },
    {
      id: '3',
      imageSrc: '/img/unit3.jpg',
      title: 'Boombox Unit 003',
      pickUpDate: '2024-01-05',
      lastAccessedDate: '2024-01-15',
      description: 'Kitchen appliances and dishes',
    },
  ];

  const defaultProps = {
    storageUnits: mockStorageUnits,
    onSelectionChange: jest.fn(),
    selectedIds: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders storage units correctly', () => {
      render(<StorageUnitCheckboxList {...defaultProps} />);

      expect(screen.getByText('Boombox Unit 001')).toBeInTheDocument();
      expect(screen.getByText('Boombox Unit 002')).toBeInTheDocument();
      expect(screen.getByText('Boombox Unit 003')).toBeInTheDocument();
      expect(screen.getByText('Living room furniture and boxes')).toBeInTheDocument();
      expect(screen.getByText('Last accessed 2024-01-20')).toBeInTheDocument();
    });

    it('renders Select All checkbox', () => {
      render(<StorageUnitCheckboxList {...defaultProps} />);

      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /select all storage units/i })).toBeInTheDocument();
    });

    it('renders empty state when no storage units', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          storageUnits={[]}
        />
      );

      expect(screen.getByText('You currently have no storage units with us')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('applies custom className and testId', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          className="custom-class"
          testId="storage-list"
        />
      );

      const container = screen.getByTestId('storage-list');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Selection Functionality', () => {
    it('calls onSelectionChange when unit is selected', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      await user.click(firstUnit!);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
    });

    it('handles multiple unit selection', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
          selectedIds={['1']}
        />
      );

      const secondUnit = findUnitCheckbox('Boombox Unit 002');
      await user.click(secondUnit!);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2']);
    });

    it('handles unit deselection', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
          selectedIds={['1', '2']}
        />
      );

      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      await user.click(firstUnit!);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['2']);
    });

    it('shows selected units with correct styling', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          selectedIds={['1']}
        />
      );

      const selectedUnit = findUnitCheckbox('Boombox Unit 001');
      expect(selectedUnit).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Select All Functionality', () => {
    it('selects all units when Select All is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      await user.click(selectAllCheckbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
    });

    it('deselects all units when Select All is clicked and all are selected', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
          selectedIds={['1', '2', '3']}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      await user.click(selectAllCheckbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    it('updates Select All state when all units are individually selected', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          selectedIds={['1', '2', '3']}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'true');
    });

    it('updates Select All state when not all units are selected', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          selectedIds={['1', '2']}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Error State', () => {
    it('displays error message when hasError is true', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          hasError={true}
          errorMessage="Please select at least one unit"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Please select at least one unit');
    });

    it('applies error styling to units when hasError is true', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          hasError={true}
        />
      );

      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      expect(firstUnit).toHaveClass('ring-status-error');
    });

    it('calls onClearError when unit is selected and error exists', async () => {
      const user = userEvent.setup();
      const mockOnClearError = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          hasError={true}
          onClearError={mockOnClearError}
        />
      );

      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      await user.click(firstUnit!);

      expect(mockOnClearError).toHaveBeenCalled();
    });

    it('uses default error message when none provided', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          hasError={true}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Please select at least one storage unit');
    });
  });

  describe('Disabled State', () => {
    it('prevents selection when disabled', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
          disabled={true}
        />
      );

      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      await user.click(firstUnit!);

      expect(mockOnSelectionChange).not.toHaveBeenCalled();
    });

    it('prevents Select All when disabled', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
          disabled={true}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      await user.click(selectAllCheckbox);

      expect(mockOnSelectionChange).not.toHaveBeenCalled();
    });

    it('applies disabled styling when disabled', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          disabled={true}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      expect(selectAllCheckbox).toHaveClass('opacity-70', 'cursor-not-allowed');
    });

    it('sets correct tabIndex when disabled', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          disabled={true}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      expect(selectAllCheckbox).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Image Handling', () => {
    it('renders OptimizedImage components for units with images', () => {
      render(<StorageUnitCheckboxList {...defaultProps} />);

      const images = screen.getAllByTestId('optimized-image');
      expect(images).toHaveLength(3);
    });

    it('handles image error by showing fallback text', async () => {
      render(<StorageUnitCheckboxList {...defaultProps} />);

      const firstImage = screen.getAllByTestId('optimized-image')[0];
      fireEvent.error(firstImage);

      await waitFor(() => {
        expect(screen.getByText('Image not available')).toBeInTheDocument();
      });
    });

    it('shows fallback text for units without images', () => {
      const unitsWithoutImages = mockStorageUnits.map(unit => ({
        ...unit,
        imageSrc: '',
      }));

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          storageUnits={unitsWithoutImages}
        />
      );

      const fallbackTexts = screen.getAllByText('Image not available');
      expect(fallbackTexts).toHaveLength(3);
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles Space key for unit selection', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      firstUnit!.focus();
      await user.keyboard(' ');

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
    });

    it('handles Enter key for unit selection', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      firstUnit!.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
    });

    it('handles Space key for Select All', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      selectAllCheckbox.focus();
      await user.keyboard(' ');

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
    });

    it('handles keyboard selection for Space and Enter keys', async () => {
      const mockOnSelectionChange = jest.fn();
      
      render(
        <StorageUnitCheckboxList 
          {...defaultProps} 
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      firstUnit!.focus();
      
      // Test Space key triggers selection
      fireEvent.keyDown(firstUnit!, { key: ' ' });
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
      
      // Reset mock
      mockOnSelectionChange.mockClear();
      
      // Test Enter key triggers selection
      fireEvent.keyDown(firstUnit!, { key: 'Enter' });
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<StorageUnitCheckboxList {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels', () => {
      render(<StorageUnitCheckboxList {...defaultProps} />);

      expect(screen.getByRole('group', { name: 'Storage unit selection' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /select all storage units/i })).toBeInTheDocument();
    });

    it('provides screen reader announcements', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          selectedIds={['1', '2']}
          hasError={true}
          errorMessage="Selection required"
        />
      );

      expect(screen.getByText('2 of 3 storage units selected. Error: Selection required')).toBeInTheDocument();
    });

    it('uses proper ARIA attributes for checkboxes', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          selectedIds={['1']}
        />
      );

      const selectedUnit = findUnitCheckbox('Boombox Unit 001');
      const unselectedUnit = findUnitCheckbox('Boombox Unit 002');

      expect(selectedUnit).toHaveAttribute('aria-checked', 'true');
      expect(unselectedUnit).toHaveAttribute('aria-checked', 'false');
    });

    it('provides proper describedby relationships', () => {
      render(<StorageUnitCheckboxList {...defaultProps} />);

      // Check that description elements exist with proper IDs
      mockStorageUnits.forEach((unit) => {
        const descriptionElement = screen.getByText(unit.description);
        expect(descriptionElement).toHaveAttribute('id', `unit-${unit.id}-description`);
      });
    });

    it('announces error state to screen readers', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          hasError={true}
          errorMessage="Please select at least one unit"
        />
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Custom Hooks', () => {
    it('updates selection state correctly', async () => {
      const user = userEvent.setup();
      const mockOnSelectionChange = jest.fn();

      const { rerender } = render(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
          selectedIds={[]}
        />
      );

      // Select first unit
      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      await user.click(firstUnit!);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);

      // Rerender with updated selection
      rerender(
        <StorageUnitCheckboxList
          {...defaultProps}
          onSelectionChange={mockOnSelectionChange}
          selectedIds={['1']}
        />
      );

      // Verify Select All state is updated
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'false');
    });

    it('manages image error state correctly', async () => {
      render(<StorageUnitCheckboxList {...defaultProps} />);

      const firstImage = screen.getAllByTestId('optimized-image')[0];
      
      // Initially no error
      expect(screen.queryByText('Image not available')).not.toBeInTheDocument();

      // Trigger error
      fireEvent.error(firstImage);

      // Should show fallback
      await waitFor(() => {
        expect(screen.getByText('Image not available')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty selectedIds array', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          selectedIds={[]}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'false');
    });

    it('handles selectedIds with non-existent unit IDs', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          selectedIds={['1', '999']} // '999' doesn't exist
        />
      );

      const firstUnit = findUnitCheckbox('Boombox Unit 001');
      expect(firstUnit).toHaveAttribute('aria-checked', 'true');
    });

    it('handles single storage unit', () => {
      render(
        <StorageUnitCheckboxList
          {...defaultProps}
          storageUnits={[mockStorageUnits[0]]}
          selectedIds={['1']}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all storage units/i });
      expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'true');
    });
  });
});
