/**
 * @fileoverview Comprehensive Jest tests for AddedVehicle component
 * @source Testing migrated component from boombox-10.0/src/app/components/reusablecomponents/addedvehicle.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AddedVehicle from '@/components/features/vehicles/AddedVehicle';
import { VehicleService } from '@/lib/services/vehicleService';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  );
});

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage', () => {
  return {
    OptimizedImage: ({ src, alt, ...props }: any) => (
      <img src={src} alt={alt} {...props} />
    )
  };
});

// Mock Modal component
jest.mock('@/components/ui/primitives/Modal', () => {
  return {
    Modal: ({ open, children, title, onClose }: any) => 
      open ? (
        <div data-testid="modal" role="dialog">
          <h2>{title}</h2>
          <button onClick={onClose} data-testid="modal-close">Close</button>
          {children}
        </div>
      ) : null
  };
});

// Mock FileUpload component
jest.mock('@/components/ui/primitives/FileUpload', () => {
  return {
    FileUpload: function MockFileUpload({ onFilesSelected }: any) {
      return (
        <div data-testid="file-upload">
          <button 
            onClick={() => onFilesSelected([new File(['test'], 'test.jpg', { type: 'image/jpeg' })])}
            data-testid="upload-button"
          >
            Choose File
          </button>
        </div>
      );
    }
  };
});

// Mock VehicleService instead of fetch
jest.mock('@/lib/services/vehicleService', () => ({
  VehicleService: {
    fetchVehicle: jest.fn(),
    removeVehicle: jest.fn(),
    uploadInsurance: jest.fn(),
    refreshVehicle: jest.fn(),
  },
}));

// Mock fetch globally as backup
global.fetch = jest.fn();

const mockVehicle = {
  id: 1,
  driverId: 123,
  movingPartnerId: null,
  make: 'Toyota',
  model: 'Camry',
  year: '2020',
  licensePlate: 'ABC123',
  isApproved: true,
  frontVehiclePhoto: 'https://example.com/front.jpg',
  backVehiclePhoto: 'https://example.com/back.jpg',
  autoInsurancePhoto: 'https://example.com/insurance.pdf'
};

describe('AddedVehicle Component', () => {
  const defaultProps = {
    userId: '123',
    userType: 'driver' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear all VehicleService mocks
    (VehicleService.fetchVehicle as jest.Mock).mockClear();
    (VehicleService.removeVehicle as jest.Mock).mockClear();
    (VehicleService.uploadInsurance as jest.Mock).mockClear();
    (VehicleService.refreshVehicle as jest.Mock).mockClear();
  });

  describe('Loading State', () => {
    it('renders loading skeleton when isLoading is true', async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<AddedVehicle {...defaultProps} />);

      expect(screen.getByText('Your vehicles')).toBeInTheDocument();
      expect(screen.getByText('Add Vehicle')).toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(document.querySelector('.skeleton')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when fetch fails', async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
      });

      expect(screen.getByText('Your vehicles')).toBeInTheDocument();
      expect(screen.getByText('Add Vehicle')).toBeInTheDocument();
    });
  });

  describe('No Vehicle State', () => {
    it('renders no vehicle message when vehicle is null', async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValueOnce(null);

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/There is currently no vehicle information in your driver profile/)).toBeInTheDocument();
      });
    });

    it('shows correct message for mover user type', async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValueOnce(null);

      render(<AddedVehicle {...defaultProps} userType="mover" />);

      await waitFor(() => {
        expect(screen.getByText(/There is currently no vehicle information in your mover profile/)).toBeInTheDocument();
      });
    });
  });

  describe('Vehicle Display', () => {
    beforeEach(() => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValue(mockVehicle);
    });

    it('renders vehicle information correctly', async () => {
      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
        expect(screen.getByText('ABC123')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
      });

      // Check for vehicle image
      const vehicleImage = screen.getByAltText('Toyota Camry');
      expect(vehicleImage).toBeInTheDocument();
      expect(vehicleImage).toHaveAttribute('src', 'https://example.com/front.jpg');
    });

    it('renders pending approval status for unapproved vehicle', async () => {
      const unapprovedVehicle = { ...mockVehicle, isApproved: false };
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValueOnce(unapprovedVehicle);

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      });
    });

    it('renders truck icon when no vehicle photo is available', async () => {
      const vehicleWithoutPhoto = { ...mockVehicle, frontVehiclePhoto: null };
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValueOnce(vehicleWithoutPhoto);

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
      });

      // Check for the truck icon SVG element
      const truckIcon = document.querySelector('svg');
      expect(truckIcon).toBeInTheDocument();
    });
  });

  describe('API Endpoints', () => {
    it('calls correct driver API endpoints', async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValueOnce(mockVehicle);

      render(<AddedVehicle {...defaultProps} userType="driver" />);

      await waitFor(() => {
        expect(VehicleService.fetchVehicle).toHaveBeenCalledWith('123', 'driver');
      });
    });

    it('calls correct mover API endpoints', async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValueOnce(mockVehicle);

      render(<AddedVehicle {...defaultProps} userType="mover" />);

      await waitFor(() => {
        expect(VehicleService.fetchVehicle).toHaveBeenCalledWith('123', 'mover');
      });
    });
  });

  describe('Options Menu', () => {
    beforeEach(async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValue(mockVehicle);

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
      });
    });

    it('opens options menu when ellipsis button is clicked', async () => {
      const user = userEvent.setup();
      const optionsButton = screen.getByLabelText('Vehicle options');
      
      await user.click(optionsButton);

      expect(screen.getByText('Remove')).toBeInTheDocument();
      expect(screen.getByText('Upload New Insurance')).toBeInTheDocument();
    });

    it('closes options menu when clicking outside', async () => {
      const user = userEvent.setup();
      const optionsButton = screen.getByLabelText('Vehicle options');
      
      await user.click(optionsButton);
      expect(screen.getByText('Remove')).toBeInTheDocument();

      // Click outside the menu
      await user.click(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('Remove')).not.toBeInTheDocument();
      });
    });
  });

  describe('Vehicle Removal', () => {
    beforeEach(async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValue(mockVehicle);

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
      });
    });

    it('opens delete confirmation modal when remove is clicked', async () => {
      const user = userEvent.setup();
      
      // Open options menu
      await user.click(screen.getByLabelText('Vehicle options'));
      
      // Click remove
      await user.click(screen.getByText('Remove'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to remove this vehicle?')).toBeInTheDocument();
    });

    it('calls remove API when confirmed', async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValue(mockVehicle);
      (VehicleService.removeVehicle as jest.Mock).mockResolvedValue(undefined);

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
      });

      const user = userEvent.setup();

      // Open options menu and click remove
      await user.click(screen.getByLabelText('Vehicle options'));
      await user.click(screen.getByText('Remove'));

      // Confirm removal - click the button, not the heading
      await user.click(screen.getByRole('button', { name: /Remove Vehicle/i }));

      await waitFor(() => {
        expect(VehicleService.removeVehicle).toHaveBeenCalledWith('123', 'driver');
      });
    });

    it('calls onRemove callback when provided', async () => {
      // Clean up any existing renders to avoid interference
      cleanup();
      
      const onRemoveMock = jest.fn();
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValue(mockVehicle);
      (VehicleService.removeVehicle as jest.Mock).mockResolvedValue(undefined);

      render(<AddedVehicle {...defaultProps} onRemove={onRemoveMock} />);

      await waitFor(() => {
        expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
      });

      const user = userEvent.setup();

      // Open options menu and click remove
      await user.click(screen.getByLabelText('Vehicle options'));
      await user.click(screen.getByText('Remove'));

      // Confirm removal - click the button, not the heading
      await user.click(screen.getByRole('button', { name: /Remove Vehicle/i }));

      // Wait for the service call first
      await waitFor(() => {
        expect(VehicleService.removeVehicle).toHaveBeenCalledWith('123', 'driver');
      });

      // Then wait for the callback
      await waitFor(() => {
        expect(onRemoveMock).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Insurance Upload', () => {
    beforeEach(async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValue(mockVehicle);

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
      });
    });

    it('opens insurance upload modal when clicked', async () => {
      const user = userEvent.setup();
      
      // Open options menu
      await user.click(screen.getByLabelText('Vehicle options'));
      
      // Click upload insurance
      await user.click(screen.getByText('Upload New Insurance'));

      expect(screen.getByText('Upload Insurance Document')).toBeInTheDocument();
      expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    });

    it('handles insurance photo upload', async () => {
      (VehicleService.uploadInsurance as jest.Mock).mockResolvedValue(undefined);
      (VehicleService.refreshVehicle as jest.Mock).mockResolvedValue(mockVehicle);

      const user = userEvent.setup();

      // Open options menu and click upload insurance
      await user.click(screen.getByLabelText('Vehicle options'));
      await user.click(screen.getByText('Upload New Insurance'));

      // Trigger file upload
      await user.click(screen.getByTestId('upload-button'));

      await waitFor(() => {
        expect(VehicleService.uploadInsurance).toHaveBeenCalledWith('123', 'driver', expect.any(File));
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValue(mockVehicle);

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels', () => {
      expect(screen.getByLabelText('Vehicle options')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Vehicle approved' })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const optionsButton = screen.getByLabelText('Vehicle options');
      
      // Directly focus the options button
      optionsButton.focus();
      expect(optionsButton).toHaveFocus();

      // Press Enter to open menu
      await user.keyboard('{Enter}');
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });

    it('has proper modal accessibility', async () => {
      const user = userEvent.setup();
      
      // Open remove modal
      await user.click(screen.getByLabelText('Vehicle options'));
      await user.click(screen.getByText('Remove'));

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('data-testid', 'modal');
    });
  });

  describe('Component Integration', () => {
    it('integrates properly with design system classes', async () => {
      (VehicleService.fetchVehicle as jest.Mock).mockResolvedValue(mockVehicle);

      render(<AddedVehicle {...defaultProps} />);

      await waitFor(() => {
        // Check for design system utility classes
        expect(document.querySelector('.page-container')).toBeInTheDocument();
        expect(document.querySelector('.card')).toBeInTheDocument();
        expect(document.querySelector('.btn-primary')).toBeInTheDocument();
        expect(document.querySelector('.badge-success')).toBeInTheDocument();
      });
    });
  });
});
