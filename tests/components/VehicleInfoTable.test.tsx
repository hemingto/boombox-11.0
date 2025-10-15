/**
 * @fileoverview Tests for VehicleInfoTable component
 * Following boombox-11.0 testing standards
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { VehicleInfoTable } from '@/components/features/service-providers/vehicle/VehicleInfoTable';

expect.extend(toHaveNoViolations);

// Mock fetch globally
global.fetch = jest.fn();

const mockVehicle = {
  id: 1,
  driverId: 123,
  type: 'SUV',
  make: 'Toyota',
  model: 'RAV4',
  year: '2022',
  licensePlate: 'ABC123',
  isApproved: true,
  autoInsurancePhoto: 'https://example.com/insurance.jpg',
  insuranceExpiryDate: new Date('2025-12-31')
};

describe('VehicleInfoTable', () => {
  const mockDriverId = 'driver-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading skeleton', () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      // Check for skeleton elements
      const skeletons = document.querySelectorAll('.skeleton-text, .skeleton-title');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows animate-pulse class during loading', () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {})
      );

      const { container } = render(<VehicleInfoTable driverId={mockDriverId} />);
      
      const animatedElement = container.querySelector('.animate-pulse');
      expect(animatedElement).toBeInTheDocument();
    });
  });

  describe('Empty State - No Vehicle Found', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false
      });
    });

    it('renders no vehicle found message', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText(/To activate your driver account please add a/i)).toBeInTheDocument();
      });
    });

    it('displays add vehicle button', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        const addButton = screen.getByRole('link', { name: /add a vehicle to your profile/i });
        expect(addButton).toBeInTheDocument();
        expect(addButton).toHaveAttribute('href', `/driver-account-page/${mockDriverId}/vehicle/add-vehicle`);
      });
    });

    it('displays qualifying vehicle link', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /qualifying vehicle/i });
        expect(link).toHaveAttribute('href', '/vehicle-requirements');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });

    it('has no accessibility violations in empty state', async () => {
      const renderResult = render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText(/To activate your driver account/i)).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });
  });

  describe('Error State', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    });

    it('renders error message', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('error message has proper ARIA attributes', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('has no accessibility violations in error state', async () => {
      const renderResult = render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });
  });

  describe('Main State - Vehicle Display', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockVehicle
      });
    });

    it('renders vehicle information correctly', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('SUV')).toBeInTheDocument();
        expect(screen.getByText('Toyota')).toBeInTheDocument();
        expect(screen.getByText('RAV4')).toBeInTheDocument();
        expect(screen.getByText('2022')).toBeInTheDocument();
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });
    });

    it('displays approval status badge', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        const approvedBadge = screen.getByRole('status', { name: /vehicle approved/i });
        expect(approvedBadge).toBeInTheDocument();
        expect(approvedBadge).toHaveClass('badge-success');
      });
    });

    it('displays pending approval badge when not approved', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...mockVehicle, isApproved: false })
      });

      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        const pendingBadge = screen.getByRole('status', { name: /vehicle pending approval/i });
        expect(pendingBadge).toBeInTheDocument();
        expect(pendingBadge).toHaveClass('badge-warning');
      });
    });

    it('displays formatted insurance expiry date', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        // formatDateForDisplay formats as "Day, Month Date, Year"
        // Using flexible matching due to timezone considerations
        expect(screen.getByText(/December.*2025/)).toBeInTheDocument();
      });
    });

    it('displays insurance photo link', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /view current insurance photo/i });
        expect(link).toHaveAttribute('href', mockVehicle.autoInsurancePhoto);
        expect(link).toHaveAttribute('target', '_blank');
      });
    });

    it('has no accessibility violations in main state', async () => {
      const renderResult = render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('SUV')).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });
  });

  describe('Inline Editing - Vehicle Type', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockVehicle
      });
    });

    it('enables edit mode when edit button clicked', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('SUV')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit vehicle type/i })[0];
      await user.click(editButton);
      
      const select = screen.getByRole('combobox', { name: /vehicle type/i });
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('SUV');
    });

    it('shows save and cancel buttons in edit mode', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('SUV')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit vehicle type/i })[0];
      await user.click(editButton);
      
      expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel editing vehicle type/i })).toBeInTheDocument();
    });

    it('cancels edit mode when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('SUV')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit vehicle type/i })[0];
      await user.click(editButton);
      
      const cancelButton = screen.getByRole('button', { name: /cancel editing vehicle type/i });
      await user.click(cancelButton);
      
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.getByText('SUV')).toBeInTheDocument();
    });

    it('saves vehicle type change successfully', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVehicle
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockVehicle, type: 'Truck' })
        });

      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('SUV')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit vehicle type/i })[0];
      await user.click(editButton);
      
      const select = screen.getByRole('combobox', { name: /vehicle type/i });
      await user.selectOptions(select, 'Truck');
      
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/drivers/${mockDriverId}/vehicle`,
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'Truck' })
          })
        );
      });
    });
  });

  describe('Inline Editing - Text Fields', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockVehicle
      });
    });

    it('edits make field successfully', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit make/i })[0];
      await user.click(editButton);
      
      const input = screen.getByPlaceholderText(/enter vehicle make/i);
      fireEvent.change(input, { target: { value: 'Honda' } });
      
      expect(input).toHaveValue('Honda');
    });

    it('edits model field successfully', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('RAV4')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit model/i })[0];
      await user.click(editButton);
      
      const input = screen.getByPlaceholderText(/enter vehicle model/i);
      fireEvent.change(input, { target: { value: 'Accord' } });
      
      expect(input).toHaveValue('Accord');
    });

    it('edits license plate successfully', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit license plate/i })[0];
      await user.click(editButton);
      
      const input = screen.getByPlaceholderText(/enter license plate number/i);
      fireEvent.change(input, { target: { value: 'XYZ789' } });
      
      expect(input).toHaveValue('XYZ789');
    });
  });

  describe('Field Validation', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockVehicle
      });
    });

    it('validates year must be 4 digits', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('2022')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit year/i })[0];
      await user.click(editButton);
      
      const input = screen.getByPlaceholderText(/enter vehicle year/i);
      fireEvent.change(input, { target: { value: '22' } });
      
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);
      
      // Error is displayed synchronously without API call for validation errors
      expect(screen.getByText(/year must be a 4-digit number/i)).toBeInTheDocument();
    });

    it('validates empty license plate', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit license plate/i })[0];
      await user.click(editButton);
      
      const input = screen.getByPlaceholderText(/enter license plate number/i);
      fireEvent.change(input, { target: { value: '' } });
      
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);
      
      // Error is displayed synchronously without API call for validation errors
      expect(screen.getByText(/license plate cannot be empty/i)).toBeInTheDocument();
    });

    it('displays error message with proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('2022')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit year/i })[0];
      await user.click(editButton);
      
      const input = screen.getByPlaceholderText(/enter vehicle year/i);
      fireEvent.change(input, { target: { value: '22' } });
      
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);
      
      // Error is displayed synchronously without API call for validation errors
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent(/year must be a 4-digit number/i);
    });

    it('clears error on focus', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('2022')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit year/i })[0];
      await user.click(editButton);
      
      const input = screen.getByPlaceholderText(/enter vehicle year/i);
      fireEvent.change(input, { target: { value: '22' } });
      
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);
      
      // Error is displayed synchronously
      expect(screen.getByText(/year must be a 4-digit number/i)).toBeInTheDocument();

      fireEvent.focus(input);
      
      // Error should not appear immediately (will only reappear on save)
      expect(input).not.toHaveClass('input-field--error');
    });
  });

  describe('Insurance Photo Upload', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...mockVehicle, autoInsurancePhoto: null })
      });
    });

    it('displays upload button when no photo exists', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/upload insurance photo/i)).toBeInTheDocument();
      });
    });

    it('displays view link and upload new button when photo exists', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockVehicle
      });

      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText(/view current insurance photo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/upload new insurance photo/i)).toBeInTheDocument();
      });
    });

    it('shows uploading state', async () => {
      const user = userEvent.setup();
      
      // Mock file upload to hang
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockVehicle, autoInsurancePhoto: null })
        })
        .mockImplementation(() => new Promise(() => {})); // Hang on upload

      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/upload insurance photo/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/upload insurance photo/i) as HTMLInputElement;
      const file = new File(['image content'], 'insurance.jpg', { type: 'image/jpeg' });
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText(/uploading\.\.\./i)).toBeInTheDocument();
      });
    });

    it('uploads file with correct API endpoint', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockVehicle, autoInsurancePhoto: null })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ url: 'https://example.com/new-insurance.jpg' })
        });

      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/upload insurance photo/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/upload insurance photo/i) as HTMLInputElement;
      const file = new File(['image content'], 'insurance.jpg', { type: 'image/jpeg' });
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/drivers/${mockDriverId}/upload-new-insurance`,
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });
  });

  describe('Field Grayout Behavior', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockVehicle
      });
    });

    it('grays out other fields when one is being edited', async () => {
      const user = userEvent.setup();
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit make/i })[0];
      await user.click(editButton);
      
      // Model field edit button should be disabled
      const modelEditButton = screen.getAllByRole('button', { name: /edit model/i })[0];
      expect(modelEditButton).toBeDisabled();
    });
  });

  describe('API Error Handling', () => {
    it('displays error when save fails', async () => {
      const user = userEvent.setup();
      
      // Mock initial fetch and then failed PATCH
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVehicle
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: 'Update failed' })
        });

      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', { name: /edit make/i })[0];
      await user.click(editButton);
      
      const input = screen.getByPlaceholderText(/enter vehicle make/i);
      fireEvent.change(input, { target: { value: 'Honda' } });
      
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility - Comprehensive', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockVehicle
      });
    });

    it('all form fields have labels', async () => {
      render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const editButton = screen.getAllByRole('button', { name: /edit make/i })[0];
      await user.click(editButton);
      
      const input = screen.getByPlaceholderText(/enter vehicle make/i);
      const label = screen.getByLabelText(/^make$/i);
      
      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('id');
    });

    it('maintains accessibility during edit mode', async () => {
      const renderResult = render(<VehicleInfoTable driverId={mockDriverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const editButton = screen.getAllByRole('button', { name: /edit make/i })[0];
      await user.click(editButton);
      
      await testAccessibility(renderResult);
    });
  });
});

