/**
 * @fileoverview Tests for ChooseLabor component
 * Following boombox-11.0 testing standards (99→0 failure learnings)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ChooseLabor } from '@/components/features/orders/ChooseLabor';

expect.extend(toHaveNoViolations);

// Mock the hooks
jest.mock('@/hooks', () => ({
  useMovingPartners: jest.fn(),
  useLaborSelection: jest.fn(),
}));

jest.mock('@/hooks/useThirdPartyMovingPartners', () => ({
  useThirdPartyMovingPartners: jest.fn(),
}));

// Note: The component now uses inline placeholder components until reusable components are migrated

const { useMovingPartners, useLaborSelection } = require('@/hooks');
const { useThirdPartyMovingPartners } = require('@/hooks/useThirdPartyMovingPartners');

const defaultProps = {
  goBackToStep1: jest.fn(),
  onLaborSelect: jest.fn(),
  onMovingPartnerSelect: jest.fn(),
  laborError: null,
  clearLaborError: jest.fn(),
  selectedLabor: null,
  planType: 'Full Service Plan',
  cityName: 'San Francisco',
  selectedDateObject: new Date('2024-02-15T10:00:00Z'),
  onPlanTypeChange: jest.fn(),
  onUnavailableLaborChange: jest.fn(),
};

const mockMovingPartners = [
  {
    id: 1,
    name: 'Best Movers',
    description: 'Professional moving service',
    hourlyRate: 120,
    numberOfReviews: 50,
    rating: 4.8,
    gmbLink: 'https://example.com',
    featured: true,
    imageSrc: '/images/mover1.jpg',
    onfleetTeamId: 'team-1',
    availability: [],
    status: 'active',
  },
  {
    id: 2,
    name: 'Quick Movers',
    description: 'Fast and reliable',
    hourlyRate: 100,
    numberOfReviews: 30,
    rating: 4.5,
    gmbLink: 'https://example.com',
    featured: false,
    imageSrc: '/images/mover2.jpg',
    onfleetTeamId: 'team-2',
    availability: [],
    status: 'active',
  },
];

describe('ChooseLabor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    useMovingPartners.mockReturnValue({
      movingPartners: mockMovingPartners,
      currentItems: mockMovingPartners,
      isLoading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      sortBy: 'featured',
      setSortBy: jest.fn(),
      nextPage: jest.fn(),
      prevPage: jest.fn(),
    });

    useLaborSelection.mockReturnValue({
      selectedWeblink: null,
      unavailableLaborError: null,
      setSelectedWeblink: jest.fn(),
    });

    useThirdPartyMovingPartners.mockReturnValue({
      partners: [
        {
          id: 'third-party-1',
          title: 'Third Party Loading Help',
          description: 'Professional loading assistance',
          imageSrc: '/images/third-party.jpg',
          rating: 4.5,
          reviews: '25 reviews',
          weblink: 'https://example.com',
          gmblink: 'https://gmb.example.com',
        }
      ],
      isLoading: false,
      error: null,
    });
  });

  // REQUIRED: Basic rendering
  it('renders without crashing', () => {
    render(<ChooseLabor {...defaultProps} />);
    expect(screen.getByText('Select moving help')).toBeInTheDocument();
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ChooseLabor {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels for interactive elements', () => {
      render(<ChooseLabor {...defaultProps} />);
      
      // Check that radio inputs exist for the moving partners
      const radioInputs = screen.getAllByRole('radio');
      expect(radioInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Moving Partners Display', () => {
    it('displays available moving partners', () => {
      render(<ChooseLabor {...defaultProps} />);
      
      expect(screen.getByText('Best Movers')).toBeInTheDocument();
      expect(screen.getByText('Quick Movers')).toBeInTheDocument();
    });

    it('shows loading state when fetching partners', () => {
      useMovingPartners.mockReturnValue({
        movingPartners: [],
        currentItems: [],
        isLoading: true,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        sortBy: 'featured',
        setSortBy: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
      });

      render(<ChooseLabor {...defaultProps} />);
      
      // Should show loading skeletons
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons).toHaveLength(2);
    });

    it('shows third party options when no partners available', () => {
      useMovingPartners.mockReturnValue({
        movingPartners: [],
        currentItems: [],
        isLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        sortBy: 'featured',
        setSortBy: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
      });

      render(<ChooseLabor {...defaultProps} />);
      
      expect(screen.getByText('Third Party Loading Help')).toBeInTheDocument();
      expect(screen.getByText('Do It Yourself Plan')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('shows sort dropdown when multiple partners available', () => {
      // Mock more than 2 partners
      const manyPartners = [...mockMovingPartners, { ...mockMovingPartners[0], id: 3, name: 'Third Mover' }];
      useMovingPartners.mockReturnValue({
        movingPartners: manyPartners,
        currentItems: manyPartners,
        isLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        sortBy: 'featured',
        setSortBy: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
      });

      render(<ChooseLabor {...defaultProps} />);
      
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('handles sort option selection', async () => {
      const mockSetSortBy = jest.fn();
      const manyPartners = [...mockMovingPartners, { ...mockMovingPartners[0], id: 3, name: 'Third Mover' }];
      
      useMovingPartners.mockReturnValue({
        movingPartners: manyPartners,
        currentItems: manyPartners,
        isLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        sortBy: 'featured',
        setSortBy: mockSetSortBy,
        nextPage: jest.fn(),
        prevPage: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChooseLabor {...defaultProps} />);
      
      // Click sort dropdown
      const sortButton = screen.getByText('Featured');
      await user.click(sortButton);
      
      // Click price option
      const priceOption = screen.getByText('Price: Low to High');
      await user.click(priceOption);
      
      expect(mockSetSortBy).toHaveBeenCalledWith('price');
    });
  });

  describe('Labor Selection', () => {
    it('calls onLaborSelect when partner is selected', async () => {
      const user = userEvent.setup();
      render(<ChooseLabor {...defaultProps} />);
      
      // Click on the first moving partner label
      const bestMoversLabel = screen.getByLabelText('Select Best Movers for $120/hr');
      await user.click(bestMoversLabel);
      
      expect(defaultProps.onLaborSelect).toHaveBeenCalledWith(
        '1',
        '120',
        'Best Movers',
        'team-1'
      );
    });

    it('shows selected labor as checked', () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedLabor: {
          id: '1',
          price: '120',
          title: 'Best Movers',
          onfleetTeamId: 'team-1',
        },
      };

      render(<ChooseLabor {...propsWithSelection} />);
      
      // Find the radio input for Best Movers
      const bestMoversInput = screen.getByRole('radio', { name: 'Select Best Movers for $120/hr' });
      expect(bestMoversInput).toBeChecked();
    });

    it('handles third party labor selection', async () => {
      useMovingPartners.mockReturnValue({
        movingPartners: [],
        currentItems: [],
        isLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        sortBy: 'featured',
        setSortBy: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChooseLabor {...defaultProps} />);
      
      const thirdPartyButton = screen.getByText('Third Party Loading Help');
      await user.click(thirdPartyButton);
      
      expect(defaultProps.onLaborSelect).toHaveBeenCalledWith(
        'thirdParty-third-party-1',
        '192',
        'Third Party Loading Help'
      );
    });

    it('handles DIY selection', async () => {
      useMovingPartners.mockReturnValue({
        movingPartners: [],
        currentItems: [],
        isLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        sortBy: 'featured',
        setSortBy: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChooseLabor {...defaultProps} />);
      
      const diyCard = screen.getByText('Do It Yourself Plan');
      await user.click(diyCard);
      
      expect(defaultProps.onLaborSelect).toHaveBeenCalledWith(
        'Do It Yourself Plan',
        '0',
        'Do It Yourself Plan'
      );
    });
  });

  describe('Error Handling', () => {
    it('displays labor error message', () => {
      const propsWithError = {
        ...defaultProps,
        laborError: 'Please select a moving partner',
      };

      render(<ChooseLabor {...propsWithError} />);
      
      expect(screen.getByText('Please select a moving partner')).toBeInTheDocument();
    });

    it('displays unavailable labor error', () => {
      useLaborSelection.mockReturnValue({
        selectedWeblink: null,
        unavailableLaborError: 'Your selected mover is no longer available',
        setSelectedWeblink: jest.fn(),
      });

      render(<ChooseLabor {...defaultProps} />);
      
      expect(screen.getByText('Your selected mover is no longer available')).toBeInTheDocument();
    });

    it('displays moving partners API error', () => {
      useMovingPartners.mockReturnValue({
        movingPartners: [],
        currentItems: [],
        isLoading: false,
        error: 'Failed to fetch moving partners',
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        sortBy: 'featured',
        setSortBy: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
      });

      render(<ChooseLabor {...defaultProps} />);
      
      expect(screen.getByText('Failed to fetch moving partners')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('shows pagination when more than 5 partners', () => {
      const mockNextPage = jest.fn();
      const mockPrevPage = jest.fn();
      
      useMovingPartners.mockReturnValue({
        movingPartners: new Array(10).fill(mockMovingPartners[0]),
        currentItems: mockMovingPartners,
        isLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
        sortBy: 'featured',
        setSortBy: jest.fn(),
        nextPage: mockNextPage,
        prevPage: mockPrevPage,
      });

      render(<ChooseLabor {...defaultProps} />);
      
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    });

    it('handles pagination navigation', async () => {
      const mockNextPage = jest.fn();
      
      useMovingPartners.mockReturnValue({
        movingPartners: new Array(10).fill(mockMovingPartners[0]),
        currentItems: mockMovingPartners,
        isLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
        sortBy: 'featured',
        setSortBy: jest.fn(),
        nextPage: mockNextPage,
        prevPage: jest.fn(),
      });

      const user = userEvent.setup();
      render(<ChooseLabor {...defaultProps} />);
      
      const nextButton = screen.getByLabelText('Next page');
      await user.click(nextButton);
      
      expect(mockNextPage).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('calls goBackToStep1 when back button clicked', async () => {
      const user = userEvent.setup();
      render(<ChooseLabor {...defaultProps} />);
      
      // Find the ChevronLeftIcon by its SVG element
      const backButton = document.querySelector('svg.w-8.cursor-pointer');
      expect(backButton).toBeInTheDocument();
      
      await user.click(backButton!);
      
      expect(defaultProps.goBackToStep1).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('shows different headers for mobile and desktop', () => {
      render(<ChooseLabor {...defaultProps} />);
      
      expect(screen.getByText('Select moving help')).toBeInTheDocument();
      expect(screen.getByText('Select movers')).toBeInTheDocument();
    });
  });
});
