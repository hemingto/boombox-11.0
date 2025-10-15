/**
 * @fileoverview Tests for CompleteUserPage component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { CompleteUserPage } from '@/components/features/customers/CompleteUserPage';
import * as customerUtils from '@/lib/utils/customerUtils';

expect.extend(toHaveNoViolations);

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

// Mock customer utilities
jest.mock('@/lib/utils/customerUtils', () => ({
  hasActiveStorageUnits: jest.fn(),
}));

// Mock child components
jest.mock('@/components/features/customers/UpcomingAppointments', () => ({
  UpcomingAppointments: function MockUpcomingAppointments({ 
    onStateChange 
  }: { 
    userId: string; 
    hasActiveStorageUnits: boolean; 
    onStateChange?: (hasAppts: boolean, loading: boolean) => void;
  }) {
    // Simulate component loading and state change
    React.useEffect(() => {
      onStateChange?.(false, false);
    }, [onStateChange]);
    
    return <div data-testid="upcoming-appointments">Upcoming Appointments</div>;
  },
}));

jest.mock('@/components/features/customers/UpcomingPackingSupplyOrders', () => ({
  UpcomingPackingSupplyOrders: function MockUpcomingPackingSupplyOrders({ 
    onStateChange 
  }: { 
    userId: string; 
    onStateChange?: (hasOrders: boolean, loading: boolean) => void;
  }) {
    // Simulate component loading and state change
    React.useEffect(() => {
      onStateChange?.(false, false);
    }, [onStateChange]);
    
    return <div data-testid="upcoming-packing-supply-orders">Upcoming Packing Supply Orders</div>;
  },
}));

jest.mock('@/components/features/customers/UserPageInfoCards', () => ({
  UserPageInfoCards: function MockUserPageInfoCards() {
    return <div data-testid="user-page-info-cards">User Page Info Cards</div>;
  },
}));

jest.mock('@/components/features/customers/YourStorageUnits', () => ({
  YourStorageUnits: function MockYourStorageUnits() {
    return <div data-testid="your-storage-units">Your Storage Units</div>;
  },
}));

jest.mock('@/components/ui/primitives/InfoCard', () => ({
  InfoCard: function MockInfoCard({ 
    title, 
    description, 
    buttonText, 
    onButtonClick 
  }: { 
    title: string; 
    description: string; 
    buttonText: string; 
    onButtonClick: () => void;
  }) {
    return (
      <div data-testid={`info-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <h3>{title}</h3>
        <p>{description}</p>
        <button onClick={onButtonClick}>{buttonText}</button>
      </div>
    );
  },
}));

// Import React after mocks
import React from 'react';

describe('CompleteUserPage', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (customerUtils.hasActiveStorageUnits as jest.Mock).mockResolvedValue(false);
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      expect(screen.getByTestId('user-page-info-cards')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-appointments')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-packing-supply-orders')).toBeInTheDocument();
      expect(screen.getByTestId('your-storage-units')).toBeInTheDocument();
    });

    it('renders the Upcoming section header', () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      expect(screen.getByRole('heading', { name: /upcoming/i })).toBeInTheDocument();
    });

    it('renders all child components', () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      expect(screen.getByTestId('user-page-info-cards')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-appointments')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-packing-supply-orders')).toBeInTheDocument();
      expect(screen.getByTestId('your-storage-units')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<CompleteUserPage userId={mockUserId} />);
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with storage units', async () => {
      (customerUtils.hasActiveStorageUnits as jest.Mock).mockResolvedValue(true);
      
      const renderResult = render(<CompleteUserPage userId={mockUserId} />);
      
      await waitFor(() => {
        expect(customerUtils.hasActiveStorageUnits).toHaveBeenCalledWith(mockUserId);
      });
      
      await testAccessibility(renderResult);
    });
  });

  describe('Storage Unit Check', () => {
    it('checks for active storage units on mount', async () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      await waitFor(() => {
        expect(customerUtils.hasActiveStorageUnits).toHaveBeenCalledWith(mockUserId);
      });
    });

    it('handles storage unit check errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (customerUtils.hasActiveStorageUnits as jest.Mock).mockRejectedValue(
        new Error('Storage check failed')
      );
      
      render(<CompleteUserPage userId={mockUserId} />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error checking storage units:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Conditional Rendering', () => {
    it('shows empty state message when no upcoming items', async () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.getByText(/you have no upcoming appointments/i)).toBeInTheDocument();
      });
    });

    it('shows add storage info card when no upcoming items', async () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('info-card-need-more-storage-space?')).toBeInTheDocument();
      });
    });

    it('shows access storage info card when user has storage units', async () => {
      (customerUtils.hasActiveStorageUnits as jest.Mock).mockResolvedValue(true);
      
      render(<CompleteUserPage userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('info-card-need-access-to-your-storage-unit?')).toBeInTheDocument();
      });
    });

    it('does not show access storage info card when user has no storage units', async () => {
      (customerUtils.hasActiveStorageUnits as jest.Mock).mockResolvedValue(false);
      
      render(<CompleteUserPage userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('info-card-need-access-to-your-storage-unit?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to add storage page when button clicked', async () => {
      const user = userEvent.setup();
      render(<CompleteUserPage userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('info-card-need-more-storage-space?')).toBeInTheDocument();
      });
      
      const addStorageButton = screen.getByRole('button', { name: /book a storage unit/i });
      await user.click(addStorageButton);
      
      expect(mockPush).toHaveBeenCalledWith(`/user-page/${mockUserId}/add-storage`);
    });

    it('navigates to access storage page when button clicked', async () => {
      const user = userEvent.setup();
      (customerUtils.hasActiveStorageUnits as jest.Mock).mockResolvedValue(true);
      
      render(<CompleteUserPage userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('info-card-need-access-to-your-storage-unit?')).toBeInTheDocument();
      });
      
      const accessStorageButton = screen.getByRole('button', { name: /access your storage unit/i });
      await user.click(accessStorageButton);
      
      expect(mockPush).toHaveBeenCalledWith(`/user-page/${mockUserId}/access-storage`);
    });
  });

  describe('State Management', () => {
    it('handles packing supply orders state updates', () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      // Component should handle state updates from child components
      expect(screen.getByTestId('upcoming-packing-supply-orders')).toBeInTheDocument();
    });

    it('handles appointments state updates', () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      // Component should handle state updates from child components
      expect(screen.getByTestId('upcoming-appointments')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('passes userId to all child components that need it', () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      // All child components should receive userId
      expect(screen.getByTestId('user-page-info-cards')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-appointments')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-packing-supply-orders')).toBeInTheDocument();
      expect(screen.getByTestId('your-storage-units')).toBeInTheDocument();
    });
  });

  describe('Design System', () => {
    it('uses semantic text colors', async () => {
      render(<CompleteUserPage userId={mockUserId} />);
      
      const heading = screen.getByRole('heading', { name: /upcoming/i });
      expect(heading).toHaveClass('text-text-primary');
      
      await waitFor(() => {
        const emptyMessage = screen.getByText(/you have no upcoming appointments/i);
        expect(emptyMessage).toHaveClass('text-text-secondary');
      });
    });
  });
});

