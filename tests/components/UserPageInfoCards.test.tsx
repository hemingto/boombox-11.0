/**
 * @fileoverview Tests for UserPageInfoCards component
 * @source boombox-10.0/src/app/components/user-page/userpageinfocards.tsx
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { UserPageInfoCards } from '@/components/features/customers/UserPageInfoCards';
import { getActiveCustomerAppointments } from '@/lib/utils/customerUtils';
import { testAccessibility } from '../utils/accessibility';

// Mock the customerUtils module
jest.mock('@/lib/utils/customerUtils', () => ({
  getActiveCustomerAppointments: jest.fn(),
}));

// Mock the router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock child components
jest.mock('@/components/features/customers', () => ({
  MoveDetailsForm: jest.fn(({ appointmentId, onClose, onUpdateAppointment }) => (
    <div data-testid="move-details-form">
      <div>Move Details Form for Appointment {appointmentId}</div>
      <button onClick={onClose}>Close Form</button>
      <button onClick={() => onUpdateAppointment(appointmentId)}>Submit Form</button>
    </div>
  )),
}));

jest.mock('@/components/ui/primitives/InfoCard', () => ({
  __esModule: true,
  default: jest.fn(({ title, description, buttonText, onButtonClick, onClose, showCloseIcon }) => (
    <div data-testid="info-card">
      <h3>{title}</h3>
      <div>{description}</div>
      <button onClick={onButtonClick}>{buttonText}</button>
      {showCloseIcon && <button onClick={onClose}>Close</button>}
    </div>
  )),
}));

jest.mock('@/components/ui/primitives/Skeleton', () => ({
  SkeletonCard: jest.fn(({ className }) => <div className={className}>Skeleton Card</div>),
  SkeletonTitle: jest.fn(({ className }) => <div className={className}>Skeleton Title</div>),
  SkeletonText: jest.fn(({ className }) => <div className={className}>Skeleton Text</div>),
}));

const mockAppointments = [
  {
    id: 1,
    date: '2024-03-15T10:00:00.000Z',
    time: '2024-03-15T10:00:00.000Z',
    numberOfUnits: 2,
    planType: 'Monthly',
    address: '123 Main St, CA 94102',
    status: 'Scheduled',
    appointmentType: 'Pick Up',
    loadingHelpPrice: 100,
    monthlyStorageRate: 150,
    monthlyInsuranceRate: 20,
    insuranceCoverage: 'Standard',
    trackingUrl: 'http://tracking.url',
    hasAdditionalInfo: false,
    movingPartnerName: 'Movers Inc',
    thirdPartyTitle: null,
    requestedStorageUnits: [
      { id: 1, storageUnitNumber: '5' },
      { id: 2, storageUnitNumber: '12' },
    ],
  },
  {
    id: 2,
    date: '2024-03-20T14:00:00.000Z',
    time: '2024-03-20T14:00:00.000Z',
    numberOfUnits: 1,
    planType: 'Monthly',
    address: '456 Oak Ave, CA 94103',
    status: 'Scheduled',
    appointmentType: 'Storage Unit Access',
    loadingHelpPrice: 0,
    monthlyStorageRate: 150,
    monthlyInsuranceRate: 20,
    insuranceCoverage: null,
    trackingUrl: null,
    hasAdditionalInfo: false,
    movingPartnerName: null,
    thirdPartyTitle: null,
    requestedStorageUnits: [{ id: 3, storageUnitNumber: '8' }],
  },
  {
    id: 3,
    date: '2024-03-25T09:00:00.000Z',
    time: '2024-03-25T09:00:00.000Z',
    numberOfUnits: 3,
    planType: 'Monthly',
    address: '789 Pine Rd, CA 94104',
    status: 'Scheduled',
    appointmentType: 'Drop Off',
    loadingHelpPrice: 120,
    monthlyStorageRate: 200,
    monthlyInsuranceRate: 30,
    insuranceCoverage: 'Premium',
    trackingUrl: null,
    hasAdditionalInfo: true, // This one already has additional info
    movingPartnerName: 'Movers Inc',
    thirdPartyTitle: null,
    requestedStorageUnits: [],
  },
];

describe('UserPageInfoCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should display skeleton loaders while fetching appointments', () => {
      (getActiveCustomerAppointments as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<UserPageInfoCards userId="123" />);

      // Check for skeleton elements by text content
      expect(screen.getAllByText('Skeleton Card')).toHaveLength(2);
    });
  });

  describe('Packing Supplies Card', () => {
    it('should display packing supplies card when there are active appointments', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(mockAppointments);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Need packing supplies?')).toBeInTheDocument();
      });
    });

    it('should navigate to packing supplies page when button is clicked', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(mockAppointments);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Need packing supplies?')).toBeInTheDocument();
      });

      const button = screen.getByText('Order packing supplies');
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/user-page/123/packing-supplies');
    });

    it('should not display packing supplies card when all appointments are completed or canceled', async () => {
      const completedAppointments = mockAppointments.map(apt => ({
        ...apt,
        status: 'Completed',
      }));
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(completedAppointments);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(getActiveCustomerAppointments).toHaveBeenCalledWith('123');
      });

      await waitFor(() => {
        expect(screen.queryByText('Need packing supplies?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Move Details Cards', () => {
    it('should display info cards for appointments without additional info', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(mockAppointments);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Make sure your pickup goes smoothly')).toBeInTheDocument();
      });
    });

    it('should not display card for Storage Unit Access appointments', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(mockAppointments);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Make sure your pickup goes smoothly')).toBeInTheDocument();
      });

      // Should only have 1 move details card (for appointment 1, not 2 which is Storage Unit Access)
      const buttons = screen.queryAllByText(/Tell us more about your/i);
      expect(buttons).toHaveLength(1);
    });

    it('should not display card for appointments with additional info', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(mockAppointments);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(getActiveCustomerAppointments).toHaveBeenCalledWith('123');
      });

      // Appointment 3 has hasAdditionalInfo: true, so it shouldn't show a card
      expect(screen.queryByText(/Tell us more about your drop off/i)).not.toBeInTheDocument();
    });

    it('should format appointment date correctly', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue([mockAppointments[0]]);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        // The date should be formatted like "Friday, Mar 15th"
        const dateMatch = screen.getByText(/Friday, Mar 15th/i);
        expect(dateMatch).toBeInTheDocument();
      });
    });
  });

  describe('MoveDetailsForm Interaction', () => {
    it('should open MoveDetailsForm when info card button is clicked', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(mockAppointments);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Make sure your pickup goes smoothly')).toBeInTheDocument();
      });

      const button = screen.getByText('Tell us more about your pick up');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('move-details-form')).toBeInTheDocument();
        expect(screen.getByText('Move Details Form for Appointment 1')).toBeInTheDocument();
      });
    });

    it('should close MoveDetailsForm when close button is clicked', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(mockAppointments);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Make sure your pickup goes smoothly')).toBeInTheDocument();
      });

      const openButton = screen.getByText('Tell us more about your pick up');
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(screen.getByTestId('move-details-form')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close Form');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('move-details-form')).not.toBeInTheDocument();
      });
    });

    it('should update appointment state after form submission', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(mockAppointments);

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Make sure your pickup goes smoothly')).toBeInTheDocument();
      });

      const openButton = screen.getByText('Tell us more about your pick up');
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(screen.getByTestId('move-details-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);

      // The card should disappear after submission since hasAdditionalInfo is now true
      await waitFor(() => {
        expect(screen.queryByTestId('move-details-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should render nothing when user has no active appointments', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue([]);

      const { container } = render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(getActiveCustomerAppointments).toHaveBeenCalledWith('123');
      });

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Skeleton Card')).not.toBeInTheDocument();
      });

      // Should only have the container div with no cards
      const cards = container.querySelectorAll('[data-testid="info-card"]');
      expect(cards).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (getActiveCustomerAppointments as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching appointments:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      (getActiveCustomerAppointments as jest.Mock).mockResolvedValue(mockAppointments);

      const renderResult = render(<UserPageInfoCards userId="123" />);

      await waitFor(() => {
        expect(screen.getByText('Need packing supplies?')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });
  });
});

