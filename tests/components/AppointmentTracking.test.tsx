/**
 * @fileoverview Tests for AppointmentTracking component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppointmentTracking } from '@/components/features/tracking/AppointmentTracking';
import { type AppointmentTrackingProps } from '@/hooks/useTrackingData';

expect.extend(toHaveNoViolations);

// Mock Google Maps components
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: function MockGoogleMap({ children, ...props }: any) {
    return (
      <div data-testid="google-map" {...props}>
        {children}
      </div>
    );
  },
  Marker: function MockMarker(props: any) {
    return <div data-testid="map-marker" {...props} />;
  }
}));

// Mock ElapsedTimer component
jest.mock('@/components/ui/primitives/ElapsedTimer', () => ({
  ElapsedTimer: function MockElapsedTimer({ startTime, endTime, ...props }: any) {
    return (
      <span data-testid="elapsed-timer" {...props}>
        {endTime ? '05:30' : '02:15'}
      </span>
    );
  }
}));

// Mock window.open for external link testing
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen
});

// Test data
const mockAppointmentData: AppointmentTrackingProps = {
  appointmentDate: new Date('2024-01-15T10:00:00Z'),
  appointmentType: 'Storage Unit Delivery',
  location: {
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    }
  },
  deliveryUnits: [
    {
      id: 'unit-1',
      status: 'in_transit',
      unitNumber: 1,
      totalUnits: 2,
      provider: 'Boombox Logistics',
      steps: [
        {
          status: 'complete',
          title: 'Package picked up',
          timestamp: '10:00 AM',
          action: {
            label: 'View details',
            url: 'https://example.com/track',
            iconName: 'MapIcon'
          }
        },
        {
          status: 'in_transit',
          title: 'Out for delivery',
          timestamp: 'eta 2:30 PM',
          action: {
            label: 'Track location',
            trackingUrl: 'https://example.com/live-track',
            iconName: 'MapIcon'
          },
          secondaryAction: {
            label: 'Contact driver',
            url: 'tel:+1234567890',
            iconName: 'ClockIcon'
          }
        },
        {
          status: 'pending',
          title: 'Delivered',
          timestamp: 'Pending',
          action: {
            label: 'View proof',
            iconName: 'DocumentCurrencyDollarIcon'
          }
        }
      ]
    },
    {
      id: 'unit-2',
      status: 'pending',
      unitNumber: 2,
      totalUnits: 2,
      provider: 'Boombox Logistics',
      steps: [
        {
          status: 'pending',
          title: 'Awaiting pickup',
          timestamp: 'Scheduled for 3:00 PM',
          action: {
            label: 'Track location',
            iconName: 'MapIcon'
          }
        }
      ]
    }
  ]
};

describe('AppointmentTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowOpen.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Storage Unit Delivery');
    });

    it('displays appointment information correctly', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Storage Unit Delivery');
      expect(screen.getByText(/Monday, Jan 15th scheduled between/)).toBeInTheDocument();
    });

    it('renders Google Map with correct props', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const map = screen.getByTestId('google-map');
      const marker = screen.getByTestId('map-marker');
      
      expect(map).toBeInTheDocument();
      expect(marker).toBeInTheDocument();
    });

    it('displays all delivery units', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      expect(screen.getByText('Boombox delivery (1 of 2)')).toBeInTheDocument();
      expect(screen.getByText('Boombox delivery (2 of 2)')).toBeInTheDocument();
    });

    it('shows correct status badges', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      expect(screen.getByText('In transit')).toBeInTheDocument();
      expect(screen.getByLabelText('Delivery status: Pending')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<AppointmentTracking {...mockAppointmentData} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels for expandable sections', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const expandButton = screen.getByRole('button', { name: /Boombox delivery \(1 of 2\)/ });
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      expect(expandButton).toHaveAttribute('aria-controls', 'unit-content-unit-1');
    });

    it('has proper semantic structure', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText('Delivery location map')).toBeInTheDocument();
      expect(screen.getByLabelText('Delivery units tracking')).toBeInTheDocument();
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const expandButton = screen.getByRole('button', { name: /Boombox delivery \(1 of 2\)/ });
      
      await user.click(expandButton);
      
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('User Interactions', () => {
    it('expands and collapses delivery units', async () => {
      const user = userEvent.setup();
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const expandButton = screen.getByRole('button', { name: /Boombox delivery \(1 of 2\)/ });
      
      // Initially expanded (first unit)
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      
      // Click to collapse
      await user.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      // Click to expand again
      await user.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const expandButton = screen.getByRole('button', { name: /Boombox delivery \(1 of 2\)/ });
      
      // Focus and activate with keyboard
      expandButton.focus();
      await user.keyboard('{Enter}');
      
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens external tracking links', async () => {
      const user = userEvent.setup();
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const trackButton = screen.getByRole('button', { name: /Track location for Out for delivery/ });
      
      await user.click(trackButton);
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com/live-track',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('handles secondary action buttons', async () => {
      const user = userEvent.setup();
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const contactButton = screen.getByRole('button', { name: /Contact driver for Out for delivery/ });
      
      await user.click(contactButton);
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'tel:+1234567890',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('disables buttons for pending steps', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const pendingButton = screen.getByRole('button', { name: /View proof for Delivered/ });
      
      expect(pendingButton).toBeDisabled();
    });
  });

  describe('Status Display', () => {
    it('displays correct step indicators', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      // Check for step indicators (they don't have accessible names, so we check by structure)
      const stepIndicators = screen.getAllByRole('listitem');
      expect(stepIndicators).toHaveLength(4); // 3 steps in unit-1 + 1 step in unit-2 (when expanded)
    });

    it('shows ETA formatting correctly', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      expect(screen.getByText('ETA: 2:30 PM')).toBeInTheDocument();
    });

    it('displays elapsed timer for timer actions', () => {
      const dataWithTimer: AppointmentTrackingProps = {
        ...mockAppointmentData,
        deliveryUnits: [
          {
            ...mockAppointmentData.deliveryUnits[0],
            steps: [
              {
                status: 'in_transit',
                title: 'Active delivery',
                timestamp: '12:00 PM',
                action: {
                  label: 'Elapsed time',
                  iconName: 'ClockIcon',
                  timerData: {
                    type: 'timer',
                    startTime: '1642248000000'
                  }
                }
              }
            ]
          }
        ]
      };
      
      render(<AppointmentTracking {...dataWithTimer} />);
      
      expect(screen.getByTestId('elapsed-timer')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty delivery units array', () => {
      const emptyData: AppointmentTrackingProps = {
        ...mockAppointmentData,
        deliveryUnits: []
      };
      
      render(<AppointmentTracking {...emptyData} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.queryByText(/Boombox delivery/)).not.toBeInTheDocument();
    });

    it('handles units without steps', () => {
      const noStepsData: AppointmentTrackingProps = {
        ...mockAppointmentData,
        deliveryUnits: [
          {
            id: 'unit-1',
            status: 'pending',
            unitNumber: 1,
            totalUnits: 1,
            provider: 'Test Provider',
            steps: []
          }
        ]
      };
      
      render(<AppointmentTracking {...noStepsData} />);
      
      expect(screen.getByText('Boombox delivery (1 of 1)')).toBeInTheDocument();
    });

    it('handles steps without actions', () => {
      const noActionData: AppointmentTrackingProps = {
        ...mockAppointmentData,
        deliveryUnits: [
          {
            id: 'unit-1',
            status: 'complete',
            unitNumber: 1,
            totalUnits: 1,
            provider: 'Test Provider',
            steps: [
              {
                status: 'complete',
                title: 'Simple step',
                timestamp: '10:00 AM'
              }
            ]
          }
        ]
      };
      
      render(<AppointmentTracking {...noActionData} />);
      
      expect(screen.getByText('Simple step')).toBeInTheDocument();
      expect(screen.queryByRole('button')).toBeInTheDocument(); // Only expand/collapse button
    });

    it('handles window.open failures gracefully', async () => {
      const user = userEvent.setup();
      mockWindowOpen.mockReturnValue(null); // Simulate popup blocker
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const trackButton = screen.getByRole('button', { name: /Track location for Out for delivery/ });
      
      await user.click(trackButton);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to open tracking URL. Popup may be blocked:',
        'https://example.com/live-track'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Component State Management', () => {
    it('initializes with first unit expanded', () => {
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const firstUnitButton = screen.getByRole('button', { name: /Boombox delivery \(1 of 2\)/ });
      const secondUnitButton = screen.getByRole('button', { name: /Boombox delivery \(2 of 2\)/ });
      
      expect(firstUnitButton).toHaveAttribute('aria-expanded', 'true');
      expect(secondUnitButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('maintains independent state for multiple units', async () => {
      const user = userEvent.setup();
      render(<AppointmentTracking {...mockAppointmentData} />);
      
      const firstUnitButton = screen.getByRole('button', { name: /Boombox delivery \(1 of 2\)/ });
      const secondUnitButton = screen.getByRole('button', { name: /Boombox delivery \(2 of 2\)/ });
      
      // Expand second unit
      await user.click(secondUnitButton);
      expect(secondUnitButton).toHaveAttribute('aria-expanded', 'true');
      expect(firstUnitButton).toHaveAttribute('aria-expanded', 'true');
      
      // Collapse first unit
      await user.click(firstUnitButton);
      expect(firstUnitButton).toHaveAttribute('aria-expanded', 'false');
      expect(secondUnitButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Performance', () => {
    it('renders large number of units efficiently', () => {
      const manyUnitsData: AppointmentTrackingProps = {
        ...mockAppointmentData,
        deliveryUnits: Array.from({ length: 10 }, (_, i) => ({
          id: `unit-${i + 1}`,
          status: 'pending' as const,
          unitNumber: i + 1,
          totalUnits: 10,
          provider: 'Test Provider',
          steps: [
            {
              status: 'pending' as const,
              title: `Step ${i + 1}`,
              timestamp: 'Pending'
            }
          ]
        }))
      };
      
      const startTime = performance.now();
      render(<AppointmentTracking {...manyUnitsData} />);
      const endTime = performance.now();
      
      // Should render in reasonable time (less than 500ms)
      expect(endTime - startTime).toBeLessThan(500);
      
      expect(screen.getAllByText(/Boombox delivery/)).toHaveLength(10);
    });
  });
});
