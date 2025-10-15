/**
 * @fileoverview Tests for AccountInfoContent component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { AccountInfoContent } from '@/components/features/service-providers/account/AccountInfoContent';
import { useServiceProviderData } from '@/hooks/useServiceProviderData';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('@/hooks/useServiceProviderData');
jest.mock('@/components/forms/LaborRadioCard', () => ({
  LaborRadioCard: function MockLaborRadioCard(props: any) {
    return (
      <div data-testid="labor-radio-card">
        <h3>{props.title}</h3>
        <p>{props.description}</p>
        <span>{props.price}</span>
      </div>
    );
  },
}));

jest.mock('@/components/ui/primitives/ProfilePicture', () => ({
  ProfilePicture: function MockProfilePicture(props: any) {
    return (
      <div data-testid="profile-picture" data-user-type={props.userType}>
        ProfilePicture for {props.userId}
      </div>
    );
  },
}));

jest.mock('@/components/ui/primitives/LoadingOverlay', () => ({
  LoadingOverlay: function MockLoadingOverlay(props: any) {
    return <div data-testid="loading-overlay">{props.message}</div>;
  },
}));

// Mock child components (placeholders exist, will be migrated later)
jest.mock('@/components/features/service-providers/account/ContactTable', () => ({
  ContactTable: function MockContactTable(props: any) {
    return (
      <div data-testid="contact-table">
        ContactTable for {props.userId} ({props.userType})
      </div>
    );
  },
}));

jest.mock(
  '@/components/features/service-providers/account/DriversLicenseImages',
  () => ({
    DriversLicenseImages: function MockDriversLicenseImages(props: any) {
      return (
        <div data-testid="drivers-license-images">
          DriversLicenseImages for {props.userId} ({props.userType})
        </div>
      );
    },
  })
);

const mockUseServiceProviderData = useServiceProviderData as jest.MockedFunction<
  typeof useServiceProviderData
>;

describe('AccountInfoContent', () => {
  const mockProviderData = {
    id: 123,
    title: 'Test Moving Company',
    description: 'Professional moving services',
    price: '$100/hr',
    reviews: 25,
    rating: 4.8,
    link: 'https://example.com',
    featured: true,
    imageSrc: '/test-image.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing for driver type', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      expect(screen.getByTestId('profile-picture')).toBeInTheDocument();
      expect(screen.getByTestId('contact-table')).toBeInTheDocument();
      expect(screen.getByTestId('drivers-license-images')).toBeInTheDocument();
    });

    it('renders without crashing for mover type', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: mockProviderData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="mover" userId="456" />);

      expect(screen.getByTestId('labor-radio-card')).toBeInTheDocument();
      expect(screen.getByTestId('profile-picture')).toBeInTheDocument();
      expect(screen.getByTestId('contact-table')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with driver type', async () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const renderResult = render(
        <AccountInfoContent userType="driver" userId="123" />
      );
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations with mover type and data', async () => {
      mockUseServiceProviderData.mockReturnValue({
        data: mockProviderData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const renderResult = render(
        <AccountInfoContent userType="mover" userId="456" />
      );
      await testAccessibility(renderResult);
    });

    it('maintains accessibility in error state', async () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Failed to load data',
        refetch: jest.fn(),
      });

      const renderResult = render(
        <AccountInfoContent userType="mover" userId="456" />
      );
      await testAccessibility(renderResult);
    });
  });

  describe('Moving Partner Preview Card', () => {
    it('displays preview card for mover type with data', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: mockProviderData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="mover" userId="456" />);

      expect(screen.getByTestId('labor-radio-card')).toBeInTheDocument();
      expect(screen.getByText('Test Moving Company')).toBeInTheDocument();
      expect(screen.getByText('Professional moving services')).toBeInTheDocument();
      expect(screen.getByText('$100/hr')).toBeInTheDocument();
    });

    it('displays note about customer view', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: mockProviderData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="mover" userId="456" />);

      expect(
        screen.getByText(
          /This is a representation of how customers see your business/i
        )
      ).toBeInTheDocument();
    });

    it('does not display preview card for driver type', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      expect(screen.queryByTestId('labor-radio-card')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('displays loading overlay for mover type when loading', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="mover" userId="456" />);

      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
      expect(
        screen.getByText('Loading account information...')
      ).toBeInTheDocument();
    });

    it('does not display loading overlay for driver type', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message for mover type when error occurs', () => {
      const errorMessage = 'Failed to load moving partner data';
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: errorMessage,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="mover" userId="456" />);

      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display error message for driver type', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Some error',
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });

  describe('Profile Picture Section', () => {
    it('displays company picture heading for mover type', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: mockProviderData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="mover" userId="456" />);

      expect(
        screen.getByText('Set your company picture')
      ).toBeInTheDocument();
    });

    it('does not display company picture heading for driver type', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      expect(
        screen.queryByText('Set your company picture')
      ).not.toBeInTheDocument();
    });

    it('renders ProfilePicture component with correct props', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      const profilePicture = screen.getByTestId('profile-picture');
      expect(profilePicture).toHaveAttribute('data-user-type', 'driver');
      expect(profilePicture).toHaveTextContent('ProfilePicture for 123');
    });
  });

  describe('Contact Information Section', () => {
    it('displays correct heading for driver type', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      expect(screen.getByText('Edit your information')).toBeInTheDocument();
    });

    it('displays correct heading for mover type', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: mockProviderData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="mover" userId="456" />);

      expect(
        screen.getByText('Edit company information')
      ).toBeInTheDocument();
    });

    it('renders ContactTable with correct props', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      const contactTable = screen.getByTestId('contact-table');
      expect(contactTable).toHaveTextContent('ContactTable for 123 (driver)');
    });
  });

  describe('Driver License Section', () => {
    it('renders DriversLicenseImages component', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      const licenseImages = screen.getByTestId('drivers-license-images');
      expect(licenseImages).toHaveTextContent(
        'DriversLicenseImages for 123 (driver)'
      );
    });
  });

  describe('Design System Integration', () => {
    it('uses semantic color classes', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Test error',
        refetch: jest.fn(),
      });

      const { container } = render(
        <AccountInfoContent userType="mover" userId="456" />
      );

      // Check for design system classes (not hardcoded colors)
      const errorDiv = container.querySelector('.bg-status-bg-error');
      expect(errorDiv).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('calls useServiceProviderData with correct parameters', () => {
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountInfoContent userType="mover" userId="456" />);

      expect(mockUseServiceProviderData).toHaveBeenCalledWith({
        userId: '456',
        userType: 'mover',
      });
    });

    it('respects hook data flow for driver type', () => {
      const mockRefetch = jest.fn();
      mockUseServiceProviderData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<AccountInfoContent userType="driver" userId="123" />);

      // Hook should be called but data should not affect driver UI
      expect(mockUseServiceProviderData).toHaveBeenCalled();
      expect(screen.queryByTestId('labor-radio-card')).not.toBeInTheDocument();
    });
  });
});

