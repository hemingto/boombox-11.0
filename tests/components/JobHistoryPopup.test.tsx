/**
 * @fileoverview Tests for JobHistoryPopup component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { JobHistoryPopup } from '@/components/features/service-providers/jobs/JobHistoryPopup';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('@/components/ui/primitives/Modal', () => ({
  Modal: function MockModal({ open, onClose, title, children }: any) {
    if (!open) return null;
    return (
      <div 
        data-testid="mock-modal" 
        role="dialog" 
        aria-modal="true"
        aria-label={title || 'Job History Dialog'}
      >
        <button onClick={onClose} data-testid="close-button">Close</button>
        {children}
      </div>
    );
  }
}));

describe('JobHistoryPopup', () => {
  const mockRegularJob = {
    id: 1,
    address: '123 Main St, San Francisco, CA',
    date: '2024-10-15T14:00:00.000Z',
    time: '2:00 PM - 4:00 PM',
    appointmentType: 'Storage Unit Delivery',
    numberOfUnits: 2,
    planType: 'Monthly Plan',
    insuranceCoverage: 'Standard Coverage',
    loadingHelpPrice: 75,
    requestedStorageUnits: [
      { unitType: 'Standard', quantity: 2 }
    ],
    serviceStartTime: '1697378400000', // Oct 15, 2024 2:00 PM
    serviceEndTime: '1697385600000', // Oct 15, 2024 4:00 PM
    user: {
      firstName: 'John',
      lastName: 'Doe'
    },
    driver: {
      firstName: 'Jane',
      lastName: 'Smith'
    },
    feedback: {
      rating: 5,
      comment: 'Excellent service! Very professional.',
      tipAmount: 20
    }
  };

  const mockPackingSupplyRoute = {
    id: 2,
    address: 'Route 123',
    date: '2024-10-16T09:00:00.000Z',
    time: '9:00 AM - 5:00 PM',
    appointmentType: 'Packing Supply Delivery',
    numberOfUnits: 0,
    planType: '',
    routeId: 'RT-2024-001',
    routeStatus: 'completed',
    totalStops: 8,
    completedStops: 8,
    estimatedMiles: 25,
    estimatedDurationMinutes: 180,
    estimatedPayout: 150,
    payoutStatus: 'paid',
    driver: {
      firstName: 'Mike',
      lastName: 'Johnson'
    },
    orders: [
      {
        routeStopNumber: 1,
        contactName: 'Alice Brown',
        deliveryAddress: '456 Oak Ave'
      },
      {
        routeStopNumber: 2,
        contactName: 'Bob White',
        deliveryAddress: '789 Pine St'
      }
    ],
    routeMetrics: {
      totalDistance: 25.5,
      totalTime: 185,
      startTime: new Date('2024-10-16T09:00:00.000Z'),
      endTime: new Date('2024-10-16T12:05:00.000Z')
    }
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <JobHistoryPopup
          isOpen={false}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when job is null', () => {
      const { container } = render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={null}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders regular job details correctly', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('Storage Unit Delivery')).toBeInTheDocument();
      expect(screen.getByText('2 Boombox')).toBeInTheDocument();
      expect(screen.getByText('Monthly Plan')).toBeInTheDocument();
      expect(screen.getByText('Standard Coverage')).toBeInTheDocument();
    });

    it('renders packing supply route details correctly', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockPackingSupplyRoute}
        />
      );

      expect(screen.getByText('Route RT-2024-001')).toBeInTheDocument();
      expect(screen.getByText(/8 stops • 8 completed/)).toBeInTheDocument();
      expect(screen.getByText('8 Delivery Stops')).toBeInTheDocument();
      expect(screen.getByText(/Distance: 25 miles/)).toBeInTheDocument();
    });

    it('renders customer feedback with star rating', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      expect(screen.getByText('Excellent service! Very professional.')).toBeInTheDocument();
      expect(screen.getByText('- John Doe')).toBeInTheDocument();
      expect(screen.getByText('customer')).toBeInTheDocument();
      
      // Check for star rating accessibility
      const ratingElement = screen.getByRole('img', { name: /5 out of 5 stars/i });
      expect(ratingElement).toBeInTheDocument();
    });

    it('renders driver information', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });

    it('renders service duration and pricing', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      expect(screen.getByText(/\$75\.00\/hr/)).toBeInTheDocument();
      expect(screen.getByText(/2h/)).toBeInTheDocument();
      expect(screen.getByText(/\$20\.00/)).toBeInTheDocument();
    });

    it('renders requested storage units', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      expect(screen.getByText('Requested Units')).toBeInTheDocument();
      expect(screen.getByText('2x Standard')).toBeInTheDocument();
    });

    it('renders route status for packing supply routes', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockPackingSupplyRoute}
        />
      );

      expect(screen.getByText('Route Status')).toBeInTheDocument();
      
      // Check Progress field
      expect(screen.getByText(/Progress:/)).toBeInTheDocument();
      expect(screen.getByText(/8 of 8 stops completed/)).toBeInTheDocument();
      
      // Check Status field - use getAllByText since "Status" appears twice
      const statusElements = screen.getAllByText(/Status:/);
      expect(statusElements.length).toBeGreaterThan(0);
      
      // Check for completed status - "completed" appears multiple times
      const completedElements = screen.getAllByText(/completed/);
      expect(completedElements.length).toBeGreaterThan(0);
      
      // Check Payout field - "Payout" and "paid" appear multiple times
      const payoutElements = screen.getAllByText(/Payout:/);
      expect(payoutElements.length).toBeGreaterThan(0);
      const paidElements = screen.getAllByText(/paid/);
      expect(paidElements.length).toBeGreaterThan(0);
    });

    it('renders delivery stops list', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockPackingSupplyRoute}
        />
      );

      expect(screen.getByText('Delivery Stops')).toBeInTheDocument();
      expect(screen.getByText(/1\. Alice Brown - 456 Oak Ave/)).toBeInTheDocument();
      expect(screen.getByText(/2\. Bob White - 789 Pine St/)).toBeInTheDocument();
    });

    it('shows "more stops" message when route has more than 5 orders', () => {
      const jobWithManyOrders = {
        ...mockPackingSupplyRoute,
        orders: [
          { routeStopNumber: 1, contactName: 'Stop 1', deliveryAddress: 'Address 1' },
          { routeStopNumber: 2, contactName: 'Stop 2', deliveryAddress: 'Address 2' },
          { routeStopNumber: 3, contactName: 'Stop 3', deliveryAddress: 'Address 3' },
          { routeStopNumber: 4, contactName: 'Stop 4', deliveryAddress: 'Address 4' },
          { routeStopNumber: 5, contactName: 'Stop 5', deliveryAddress: 'Address 5' },
          { routeStopNumber: 6, contactName: 'Stop 6', deliveryAddress: 'Address 6' },
          { routeStopNumber: 7, contactName: 'Stop 7', deliveryAddress: 'Address 7' }
        ]
      };

      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={jobWithManyOrders}
        />
      );

      expect(screen.getByText('+2 more stops...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with regular job', async () => {
      const renderResult = render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations with packing supply route', async () => {
      const renderResult = render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockPackingSupplyRoute}
        />
      );
      await testAccessibility(renderResult);
    });

    it('provides proper ARIA label for star rating', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      const ratingElement = screen.getByRole('img', { name: /5 out of 5 stars/i });
      expect(ratingElement).toBeInTheDocument();
    });

    it('has proper modal dialog role', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      const closeButton = screen.getByTestId('close-button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing feedback gracefully', () => {
      const jobWithoutFeedback = {
        ...mockRegularJob,
        feedback: undefined
      };

      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={jobWithoutFeedback}
        />
      );

      expect(screen.queryByText('Excellent service!')).not.toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /stars/i })).not.toBeInTheDocument();
    });

    it('handles missing driver information', () => {
      const jobWithoutDriver = {
        ...mockRegularJob,
        driver: undefined
      };

      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={jobWithoutDriver}
        />
      );

      expect(screen.queryByText(/Jane Smith/)).not.toBeInTheDocument();
    });

    it('handles missing service times', () => {
      const jobWithoutServiceTimes = {
        ...mockRegularJob,
        serviceStartTime: undefined,
        serviceEndTime: undefined
      };

      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={jobWithoutServiceTimes}
        />
      );

      // Service time should not be displayed
      const serviceTimeElements = screen.queryByText(/Service Time/);
      expect(serviceTimeElements).not.toBeInTheDocument();
    });

    it('handles zero loading help price', () => {
      const jobWithZeroPrice = {
        ...mockRegularJob,
        loadingHelpPrice: 0
      };

      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={jobWithZeroPrice}
        />
      );

      expect(screen.queryByText(/Hourly Rate/)).not.toBeInTheDocument();
    });

    it('handles invalid date gracefully', () => {
      const jobWithInvalidDate = {
        ...mockRegularJob,
        date: 'invalid-date'
      };

      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={jobWithInvalidDate}
        />
      );

      // Should still render without crashing
      expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();
    });

    it('handles empty requested storage units array', () => {
      const jobWithoutUnits = {
        ...mockRegularJob,
        requestedStorageUnits: []
      };

      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={jobWithoutUnits}
        />
      );

      expect(screen.queryByText('Requested Units')).not.toBeInTheDocument();
    });

    it('handles route without orders', () => {
      const routeWithoutOrders = {
        ...mockPackingSupplyRoute,
        orders: undefined
      };

      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={routeWithoutOrders}
        />
      );

      expect(screen.queryByText('Delivery Stops')).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('updates when job prop changes', () => {
      const { rerender } = render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      expect(screen.getByText('123 Main St, San Francisco, CA')).toBeInTheDocument();

      rerender(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockPackingSupplyRoute}
        />
      );

      expect(screen.getByText('Route RT-2024-001')).toBeInTheDocument();
      expect(screen.queryByText('123 Main St, San Francisco, CA')).not.toBeInTheDocument();
    });

    it('hides modal when isOpen changes to false', () => {
      const { rerender } = render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(
        <JobHistoryPopup
          isOpen={false}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('formats currency values correctly', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      // Check various currency formats
      expect(screen.getByText(/\$75\.00\/hr/)).toBeInTheDocument();
      expect(screen.getByText(/\$20\.00/)).toBeInTheDocument();
    });

    it('formats large currency values correctly', () => {
      const jobWithLargeAmount = {
        ...mockPackingSupplyRoute,
        estimatedPayout: 1500.50
      };

      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={jobWithLargeAmount}
        />
      );

      expect(screen.getByText(/\$1,500\.50/)).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats regular appointment date and time correctly', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockRegularJob}
        />
      );

      // Should show date and time range
      expect(screen.getByText(/October/)).toBeInTheDocument();
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('formats packing supply route date correctly', () => {
      render(
        <JobHistoryPopup
          isOpen={true}
          onClose={mockOnClose}
          job={mockPackingSupplyRoute}
        />
      );

      expect(screen.getByText(/delivery route/)).toBeInTheDocument();
    });
  });
});

