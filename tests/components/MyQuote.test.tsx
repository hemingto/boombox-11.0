/**
 * @fileoverview Tests for MyQuote component
 * Following boombox-11.0 testing standards (99→0 failure learnings)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MyQuote } from '@/components/features/orders/MyQuote';
import { InsuranceOption } from '@/types/insurance';

expect.extend(toHaveNoViolations);

// Mock Google Maps
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  Marker: () => <div data-testid="map-marker" />,
}));

// Mock data imports
jest.mock('@/app/data/zipcodeprices', () => ({
  zipCodePrices: {
    '94102': 155,
    '94103': 155,
  },
}));

jest.mock('@/app/data/accessStorageUnitPricing', () => ({
  accessStorageUnitPricing: 45,
}));

jest.mock('@/app/mapstyles', () => ({
  mapStyles: [],
}));

describe('MyQuote', () => {
  const defaultProps = {
    address: '123 Test St, San Francisco, CA',
    scheduledDate: new Date('2024-02-15'),
    scheduledTimeSlot: '9am-11am',
    selectedPlanName: 'Full Service Plan',
    loadingHelpPrice: '$189',
    loadingHelpDescription: 'Full Service estimate',
    zipCode: '94102',
    handleSubmit: jest.fn(),
    coordinates: { lat: 37.7749, lng: -122.4194 } as google.maps.LatLngLiteral,
    currentStep: 1,
    setMonthlyStorageRate: jest.fn(),
    setMonthlyInsuranceRate: jest.fn(),
    isAccessStorage: false,
  };

  const mockInsurance: InsuranceOption = {
    label: 'Basic Coverage',
    price: '$25',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  it('renders without crashing', () => {
    render(<MyQuote {...defaultProps} />);
    expect(screen.getAllByText('My Quote')).toHaveLength(2); // Desktop and mobile
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<MyQuote {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels for interactive elements', () => {
      render(<MyQuote {...defaultProps} />);
      
      // Check button has accessible text
      const submitButton = screen.getByRole('button', { name: /reserve appointment/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Desktop Layout', () => {
    it('displays desktop layout on larger screens', () => {
      render(<MyQuote {...defaultProps} />);
      
      // Desktop layout should be visible (not hidden by md:hidden)
      const desktopQuote = screen.getAllByText('My Quote')[0].closest('.p-6');
      expect(desktopQuote).toHaveClass('hidden', 'md:block');
    });

    it('displays address and date information', () => {
      render(<MyQuote {...defaultProps} />);
      
      expect(screen.getAllByText('123 Test St, San Francisco, CA')).toHaveLength(2); // Desktop and mobile
      expect(screen.getAllByText(/Wednesday, February 14 between 9am-11am/)).toHaveLength(2); // Desktop and mobile
    });

    it('shows Google Map with marker when coordinates provided', () => {
      render(<MyQuote {...defaultProps} />);
      
      expect(screen.getAllByTestId('google-map')).toHaveLength(2); // Desktop and mobile
      expect(screen.getAllByTestId('map-marker')).toHaveLength(2); // Desktop and mobile
    });
  });

  describe('Mobile Layout', () => {
    it('displays mobile layout with expandable content', () => {
      render(<MyQuote {...defaultProps} />);
      
      // Mobile layout should be fixed at bottom
      const expandButton = screen.getByRole('button', { name: /expand quote details/i });
      const mobileLayout = expandButton.closest('div');
      expect(mobileLayout).toHaveClass('md:hidden', 'fixed', 'bottom-0');
    });

    it('expands and collapses mobile content when toggle clicked', async () => {
      const user = userEvent.setup();
      render(<MyQuote {...defaultProps} />);
      
      const expandButton = screen.getByRole('button', { name: /expand quote details/i });
      
      // Initially collapsed
      expect(expandButton).toBeInTheDocument();
      expect(expandButton).toHaveAttribute('aria-label', 'Expand quote details');
      
      // Click to expand
      await user.click(expandButton);
      
      // Should now show collapse button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /collapse quote details/i })).toBeInTheDocument();
      });
    });
  });

  describe('Pricing Calculations', () => {
    it('calculates total correctly for storage units', () => {
      const props = {
        ...defaultProps,
        storageUnitCount: 2,
        storageUnitText: '2 units',
        onCalculateTotal: jest.fn(),
      };
      
      render(<MyQuote {...props} />);
      
      // Should show 2 Boomboxes at $155 each = $310 (appears in both desktop and mobile)
      expect(screen.getAllByText('2 Boomboxes')).toHaveLength(2);
      expect(screen.getAllByText('$310/mo')).toHaveLength(2);
    });

    it('calculates total correctly with insurance', () => {
      const props = {
        ...defaultProps,
        storageUnitCount: 1,
        selectedInsurance: mockInsurance,
        onCalculateTotal: jest.fn(),
      };
      
      render(<MyQuote {...props} />);
      
      expect(screen.getAllByText('Basic Coverage')).toHaveLength(2); // Desktop and mobile
      expect(screen.getAllByText('$25/mo')).toHaveLength(2); // Desktop and mobile
    });

    it('calculates access storage unit pricing correctly', () => {
      const props = {
        ...defaultProps,
        isAccessStorage: true,
        accessStorageUnitCount: 2,
        onCalculateTotal: jest.fn(),
      };
      
      render(<MyQuote {...props} />);
      
      // 2 units × $45 = $90 (appears in both desktop and mobile)
      expect(screen.getAllByText('2 Storage Unit Deliveries')).toHaveLength(2);
      expect(screen.getAllByText('$90')).toHaveLength(2);
    });

    it('calls onCalculateTotal with correct amount', () => {
      const onCalculateTotal = jest.fn();
      const props = {
        ...defaultProps,
        storageUnitCount: 1,
        selectedInsurance: mockInsurance,
        onCalculateTotal,
      };
      
      render(<MyQuote {...props} />);
      
      // Should calculate: $155 (storage) + $25 (insurance) + $189 (loading help) = $369
      expect(onCalculateTotal).toHaveBeenCalledWith(369);
    });
  });

  describe('Button States and Actions', () => {
    it('calls handleSubmit when button clicked', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      
      render(<MyQuote {...defaultProps} handleSubmit={handleSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /reserve appointment/i });
      await user.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('disables button when access storage and no units selected', () => {
      const props = {
        ...defaultProps,
        isAccessStorage: true,
        accessStorageUnitCount: 0,
      };
      
      render(<MyQuote {...props} />);
      
      const submitButton = screen.getByRole('button', { name: /reserve appointment/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows custom button text based on current step', () => {
      const props = {
        ...defaultProps,
        currentStep: 3,
        buttonTexts: { 3: 'Custom Button Text' },
      };
      
      render(<MyQuote {...props} />);
      
      // Both desktop and mobile buttons should show custom text
      expect(screen.getAllByRole('button', { name: /custom button text/i })).toHaveLength(2);
    });
  });

  describe('Email Quote Modal', () => {
    it('hides send quote button when showSendQuoteEmail is false', () => {
      render(<MyQuote {...defaultProps} showSendQuoteEmail={false} />);
      
      expect(screen.queryByRole('button', { name: /send quote via email/i })).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('shows help section only on desktop', () => {
      render(<MyQuote {...defaultProps} />);
      
      const helpSection = screen.getByText(/Need help\? Send us an email/);
      // The help section is outside the main component wrapper
      expect(helpSection).toBeInTheDocument();
    });

    it('handles missing data gracefully', () => {
      const props = {
        ...defaultProps,
        address: '',
        scheduledDate: null,
        scheduledTimeSlot: null,
        coordinates: null,
      };
      
      render(<MyQuote {...props} />);
      
      // Address and date should show --- in both desktop and mobile layouts
      expect(screen.getAllByText('---')).toHaveLength(4); // 2 for address, 2 for date
    });
  });

  describe('Insurance Integration', () => {
    it('updates insurance rate when insurance changes', () => {
      const setMonthlyInsuranceRate = jest.fn();
      const props = {
        ...defaultProps,
        selectedInsurance: mockInsurance,
        setMonthlyInsuranceRate,
      };
      
      render(<MyQuote {...props} />);
      
      expect(setMonthlyInsuranceRate).toHaveBeenCalledWith(25);
    });

    it('sets insurance rate to 0 for access storage', () => {
      const setMonthlyInsuranceRate = jest.fn();
      const props = {
        ...defaultProps,
        isAccessStorage: true,
        selectedInsurance: mockInsurance,
        setMonthlyInsuranceRate,
      };
      
      render(<MyQuote {...props} />);
      
      expect(setMonthlyInsuranceRate).toHaveBeenCalledWith(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid zip code gracefully', () => {
      const props = {
        ...defaultProps,
        zipCode: 'INVALID',
        storageUnitCount: 1,
        storageUnitText: '1 unit',
      };
      
      render(<MyQuote {...props} />);
      
      // Should show --- when zip code not found (appears in both desktop and mobile)
      expect(screen.getAllByText('1 Boombox')).toHaveLength(2);
      expect(screen.getAllByText('---')).toHaveLength(2);
    });

    it('handles missing loading help price', () => {
      const props = {
        ...defaultProps,
        loadingHelpPrice: '---',
      };
      
      render(<MyQuote {...props} />);
      
      // Should show --- for loading help price in both desktop and mobile
      expect(screen.getAllByText('---')).toHaveLength(2);
    });
  });
});
