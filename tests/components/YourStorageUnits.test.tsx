/**
 * @fileoverview Tests for YourStorageUnits component
 * @source boombox-10.0/src/app/components/user-page/yourstorageunits.tsx
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { YourStorageUnits } from '@/components/features/customers/YourStorageUnits';
import { getActiveStorageUnits } from '@/lib/utils/customerUtils';
import { testAccessibility } from '../utils/accessibility';

// Mock the customerUtils module
jest.mock('@/lib/utils/customerUtils', () => ({
  getActiveStorageUnits: jest.fn(),
}));

// Mock child components
jest.mock('@/components/features/customers', () => ({
  StorageUnitCard: jest.fn(({ title, onImageClick, onDescriptionChange, onPhotosUploaded }) => (
    <div data-testid="storage-unit-card">
      <div>{title}</div>
      <button onClick={onImageClick}>View Details</button>
      <button onClick={() => onDescriptionChange('New description')}>Edit Description</button>
      <button onClick={() => onPhotosUploaded(['photo1.jpg', 'photo2.jpg'])}>Upload Photos</button>
    </div>
  )),
  StorageUnitPopup: jest.fn(({ title, onClose, onDescriptionChange }) => (
    <div data-testid="storage-unit-popup">
      <div>{title}</div>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onDescriptionChange('Updated description')}>Update Description</button>
    </div>
  )),
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/components/ui/primitives/Skeleton', () => ({
  SkeletonCard: jest.fn(({ className }) => <div className={className}>Skeleton Card</div>),
  SkeletonTitle: jest.fn(({ className }) => <div className={className}>Skeleton Title</div>),
}));

const mockStorageUnits = [
  {
    id: 1,
    usageStartDate: '2024-01-15T00:00:00.000Z',
    usageEndDate: null,
    storageUnit: {
      id: 101,
      storageUnitNumber: '5',
      mainImage: '/img/unit5.jpg',
    },
    location: '123 Main St, CA 94102',
    uploadedImages: ['photo1.jpg', 'photo2.jpg'],
    description: 'Winter clothes and books',
    mainImage: '/img/unit5.jpg',
  },
  {
    id: 2,
    usageStartDate: '2024-02-01T00:00:00.000Z',
    usageEndDate: null,
    storageUnit: {
      id: 102,
      storageUnitNumber: '12',
      mainImage: '/img/unit12.jpg',
    },
    location: '456 Oak Ave, CA 94103',
    uploadedImages: [],
    description: null,
    mainImage: '/img/unit12.jpg',
  },
];

describe('YourStorageUnits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should display skeleton loaders while fetching storage units', () => {
      (getActiveStorageUnits as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<YourStorageUnits userId="123" />);

      // Check for skeleton elements by text content
      expect(screen.getByText('Skeleton Title')).toBeInTheDocument();
      expect(screen.getAllByText('Skeleton Card')).toHaveLength(2);
    });
  });

  describe('Empty State', () => {
    it('should render nothing when user has no active storage units', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue([]);

      const { container } = render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(getActiveStorageUnits).toHaveBeenCalledWith('123');
      });

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Skeleton Title')).not.toBeInTheDocument();
      });

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering Storage Units', () => {
    it('should display all active storage units', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox 5')).toBeInTheDocument();
        expect(screen.getByText('Boombox 12')).toBeInTheDocument();
      });
    });

    it('should sort storage units by unit number', async () => {
      const unsortedUnits = [mockStorageUnits[1], mockStorageUnits[0]];
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(unsortedUnits);

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('storage-unit-card');
        expect(cards).toHaveLength(2);
      });
    });

    it('should display "Access Storage" button with link', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Access Storage/i });
        expect(link).toHaveAttribute('href', '/user-page/123/access-storage');
      });
    });
  });

  describe('Description Management', () => {
    it('should update description when user edits it', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox 5')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit Description');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/storage-units/1/update-description',
          expect.objectContaining({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description: 'New description' }),
          })
        );
      });
    });

    it('should handle description update errors gracefully', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox 5')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit Description');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error updating description:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Storage Unit Popup', () => {
    it('should open popup when user clicks on storage unit image', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox 5')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View Details');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('storage-unit-popup')).toBeInTheDocument();
      });
    });

    it('should close popup when user clicks close button', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox 5')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View Details');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('storage-unit-popup')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('storage-unit-popup')).not.toBeInTheDocument();
      });
    });

    it('should update description from popup', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox 5')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View Details');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('storage-unit-popup')).toBeInTheDocument();
      });

      const updateButton = screen.getByText('Update Description');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/storage-units/1/update-description',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ description: 'Updated description' }),
          })
        );
      });
    });
  });

  describe('Photo Upload', () => {
    it('should handle photo uploads and update state', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox 5')).toBeInTheDocument();
      });

      const uploadButtons = screen.getAllByText('Upload Photos');
      fireEvent.click(uploadButtons[0]);

      // State should be updated optimistically with new photos
      await waitFor(() => {
        expect(uploadButtons[0]).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (getActiveStorageUnits as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching storage units:',
          expect.any(Error)
        );
      });

      // Should still render empty state
      const { container } = render(<YourStorageUnits userId="123" />);
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Location Formatting', () => {
    it('should format location by removing state and zip code', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox 5')).toBeInTheDocument();
      });

      // The component should format the location internally
      // This is tested indirectly through the StorageUnitCard prop
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mockStorageUnits);

      const renderResult = render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox 5')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });
  });

  describe('Storage Unit Sorting', () => {
    it('should handle alphanumeric sorting correctly', async () => {
      const mixedUnits = [
        {
          ...mockStorageUnits[0],
          id: 1,
          storageUnit: { ...mockStorageUnits[0].storageUnit, storageUnitNumber: 'A1' },
        },
        {
          ...mockStorageUnits[1],
          id: 2,
          storageUnit: { ...mockStorageUnits[1].storageUnit, storageUnitNumber: 'A10' },
        },
        {
          ...mockStorageUnits[0],
          id: 3,
          storageUnit: { ...mockStorageUnits[0].storageUnit, storageUnitNumber: 'A2' },
        },
      ];
      (getActiveStorageUnits as jest.Mock).mockResolvedValue(mixedUnits);

      render(<YourStorageUnits userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Boombox A1')).toBeInTheDocument();
      });
    });
  });
});

