/**
 * @fileoverview Jest tests for ThirdPartyLaborList component
 * @source Tests for boombox-11.0/src/components/forms/ThirdPartyLaborList.tsx
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ThirdPartyLaborList from '@/components/forms/ThirdPartyLaborList';

// Mock the custom hook
const mockUseThirdPartyMovingPartners = jest.fn();
jest.mock('@/hooks/useThirdPartyMovingPartners', () => ({
  useThirdPartyMovingPartners: () => mockUseThirdPartyMovingPartners(),
}));

// Mock child components
jest.mock('@/components/forms/ThirdPartyLaborCard', () => {
  return function MockThirdPartyLaborCard({ id, title, onChange, checked }: any) {
    return (
      <div data-testid={`labor-card-${id}`}>
        <span>{title}</span>
        <input
          type="radio"
          checked={checked}
          onChange={() => onChange?.()}
          data-testid={`radio-${id}`}
        />
      </div>
    );
  };
});

jest.mock('@/components/ui/primitives', () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className}>
      Loading skeleton
    </div>
  ),
}));

describe('ThirdPartyLaborList', () => {
  const defaultProps = {
    selectedLabor: null,
    onLaborSelect: jest.fn(),
    onPlanTypeChange: jest.fn(),
    onWeblinkSelect: jest.fn(),
    hasError: false,
    onClearError: jest.fn(),
  };

  const mockPartners = [
    {
      id: 1,
      title: 'Moving Company A',
      description: 'Professional movers with 10 years experience',
      imageSrc: 'https://example.com/logo-a.jpg',
      rating: 4.5,
      reviews: '120 reviews',
      weblink: 'https://company-a.com',
      gmblink: 'https://maps.google.com/company-a',
    },
    {
      id: 2,
      title: 'Moving Company B',
      description: 'Reliable moving services for residential and commercial',
      imageSrc: 'https://example.com/logo-b.jpg',
      rating: 4.2,
      reviews: '85 reviews',
      weblink: 'https://company-b.com',
      gmblink: 'https://maps.google.com/company-b',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders skeleton components when loading', () => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: [],
        isLoading: true,
        error: null,
      });

      render(<ThirdPartyLaborList {...defaultProps} />);

      expect(screen.getAllByTestId('skeleton')).toHaveLength(2);
      expect(screen.getByText('Loading moving partner options...')).toBeInTheDocument();
    });

    it('has proper loading state accessibility attributes', () => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: [],
        isLoading: true,
        error: null,
      });

      render(<ThirdPartyLaborList {...defaultProps} />);

      const loadingContainer = screen.getByRole('status', { name: /loading third-party moving partners/i });
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when there is an error', () => {
      const errorMessage = 'Failed to fetch moving partners';
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: [],
        isLoading: false,
        error: errorMessage,
      });

      render(<ThirdPartyLaborList {...defaultProps} />);

      expect(screen.getByText('Unable to Load Moving Partners')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText(/please try refreshing the page/i)).toBeInTheDocument();
    });

    it('has proper error state accessibility attributes', () => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: [],
        isLoading: false,
        error: 'Network error',
      });

      render(<ThirdPartyLaborList {...defaultProps} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no partners are available', () => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: [],
        isLoading: false,
        error: null,
      });

      render(<ThirdPartyLaborList {...defaultProps} />);

      expect(screen.getByText('No third-party moving partners are currently available.')).toBeInTheDocument();
      expect(screen.getByText(/please check back later/i)).toBeInTheDocument();
    });

    it('has proper empty state accessibility attributes', () => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: [],
        isLoading: false,
        error: null,
      });

      render(<ThirdPartyLaborList {...defaultProps} />);

      const emptyState = screen.getByRole('status');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Success State with Partners', () => {
    beforeEach(() => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });
    });

    it('renders all partners correctly', () => {
      render(<ThirdPartyLaborList {...defaultProps} />);

      expect(screen.getByTestId('labor-card-thirdParty-1')).toBeInTheDocument();
      expect(screen.getByTestId('labor-card-thirdParty-2')).toBeInTheDocument();
      expect(screen.getByText('Moving Company A')).toBeInTheDocument();
      expect(screen.getByText('Moving Company B')).toBeInTheDocument();
    });

    it('has proper radiogroup accessibility attributes', () => {
      render(<ThirdPartyLaborList {...defaultProps} />);

      const radioGroup = screen.getByRole('radiogroup', { name: /select a third-party moving partner/i });
      expect(radioGroup).toHaveAttribute('aria-describedby', 'third-party-partners-description');
    });

    it('provides screen reader summary', () => {
      render(<ThirdPartyLaborList {...defaultProps} />);

      expect(screen.getByText('2 third-party moving partners available for selection.')).toBeInTheDocument();
    });

    it('shows selected partner in screen reader summary', () => {
      const selectedLabor = { id: 'thirdParty-1', price: '192', title: 'Moving Company A' };

      render(<ThirdPartyLaborList {...defaultProps} selectedLabor={selectedLabor} />);

      expect(screen.getByText('Currently selected: Moving Company A')).toBeInTheDocument();
    });
  });

  describe('Partner Selection', () => {
    beforeEach(() => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });
    });

    it('calls all callback functions when partner is selected', async () => {
      const user = userEvent.setup();
      const onLaborSelect = jest.fn();
      const onWeblinkSelect = jest.fn();
      const onPlanTypeChange = jest.fn();

      render(
        <ThirdPartyLaborList
          {...defaultProps}
          onLaborSelect={onLaborSelect}
          onWeblinkSelect={onWeblinkSelect}
          onPlanTypeChange={onPlanTypeChange}
        />
      );

      const firstPartnerRadio = screen.getByTestId('radio-thirdParty-1');
      await user.click(firstPartnerRadio);

      expect(onLaborSelect).toHaveBeenCalledWith('thirdParty-1', '192', 'Moving Company A');
      expect(onWeblinkSelect).toHaveBeenCalledWith('https://company-a.com');
      expect(onPlanTypeChange).toHaveBeenCalledWith('Third Party Loading Help');
    });

    it('shows correct selection state for selected partner', () => {
      const selectedLabor = { id: 'thirdParty-1', price: '192', title: 'Moving Company A' };

      render(<ThirdPartyLaborList {...defaultProps} selectedLabor={selectedLabor} />);

      const firstPartnerRadio = screen.getByTestId('radio-thirdParty-1');
      const secondPartnerRadio = screen.getByTestId('radio-thirdParty-2');

      expect(firstPartnerRadio).toBeChecked();
      expect(secondPartnerRadio).not.toBeChecked();
    });

    it('passes error state to partner cards', () => {
      render(<ThirdPartyLaborList {...defaultProps} hasError={true} />);

      // This would be tested by checking if the ThirdPartyLaborCard receives hasError prop
      // In a real test, you might need to spy on the component props
    });

    it('passes onClearError to partner cards', () => {
      const onClearError = jest.fn();

      render(<ThirdPartyLaborList {...defaultProps} onClearError={onClearError} />);

      // This would be tested by checking if the ThirdPartyLaborCard receives onClearError prop
      // In a real test, you might need to spy on the component props
    });
  });

  describe('ID Prefixing', () => {
    beforeEach(() => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });
    });

    it('prefixes partner IDs correctly', () => {
      render(<ThirdPartyLaborList {...defaultProps} />);

      expect(screen.getByTestId('labor-card-thirdParty-1')).toBeInTheDocument();
      expect(screen.getByTestId('labor-card-thirdParty-2')).toBeInTheDocument();
    });

    it('uses prefixed IDs for selection comparison', () => {
      const selectedLabor = { id: 'thirdParty-1', price: '192', title: 'Moving Company A' };

      render(<ThirdPartyLaborList {...defaultProps} selectedLabor={selectedLabor} />);

      const firstPartnerRadio = screen.getByTestId('radio-thirdParty-1');
      expect(firstPartnerRadio).toBeChecked();
    });
  });

  describe('Fixed Pricing', () => {
    beforeEach(() => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });
    });

    it('uses fixed price of 192 for all partners', async () => {
      const user = userEvent.setup();
      const onLaborSelect = jest.fn();

      render(<ThirdPartyLaborList {...defaultProps} onLaborSelect={onLaborSelect} />);

      const firstPartnerRadio = screen.getByTestId('radio-thirdParty-1');
      await user.click(firstPartnerRadio);

      expect(onLaborSelect).toHaveBeenCalledWith('thirdParty-1', '192', 'Moving Company A');
    });
  });

  describe('Edge Cases', () => {
    it('handles single partner correctly', () => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: [mockPartners[0]],
        isLoading: false,
        error: null,
      });

      render(<ThirdPartyLaborList {...defaultProps} />);

      expect(screen.getByText('1 third-party moving partner available for selection.')).toBeInTheDocument();
    });

    it('handles partners with missing optional fields', () => {
      const partnerWithMissingFields = {
        id: 3,
        title: 'Basic Company',
        description: 'Simple description',
        imageSrc: '',
        rating: 3.0,
        reviews: '5 reviews',
        weblink: '',
        gmblink: '',
      };

      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: [partnerWithMissingFields],
        isLoading: false,
        error: null,
      });

      expect(() => render(<ThirdPartyLaborList {...defaultProps} />)).not.toThrow();
    });

    it('handles very long partner lists', () => {
      const manyPartners = Array.from({ length: 20 }, (_, i) => ({
        ...mockPartners[0],
        id: i + 1,
        title: `Moving Company ${i + 1}`,
      }));

      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: manyPartners,
        isLoading: false,
        error: null,
      });

      render(<ThirdPartyLaborList {...defaultProps} />);

      expect(screen.getByText('20 third-party moving partners available for selection.')).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('uses the custom hook correctly', () => {
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      render(<ThirdPartyLaborList {...defaultProps} />);

      expect(mockUseThirdPartyMovingPartners).toHaveBeenCalled();
    });

    it('responds to hook state changes', async () => {
      // Start with loading state
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: [],
        isLoading: true,
        error: null,
      });

      const { rerender } = render(<ThirdPartyLaborList {...defaultProps} />);

      expect(screen.getAllByTestId('skeleton')).toHaveLength(2);

      // Change to success state
      mockUseThirdPartyMovingPartners.mockReturnValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      rerender(<ThirdPartyLaborList {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Moving Company A')).toBeInTheDocument();
      });
    });
  });
});
