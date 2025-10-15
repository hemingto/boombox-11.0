/**
 * @fileoverview Tests for MoverAccountHomepage component
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { MoverAccountHomepage } from '@/components/features/service-providers/account/MoverAccountHomepage';

expect.extend(toHaveNoViolations);

// Mock child components
jest.mock('@/components/features/service-providers/account/MoverAccountOptions', () => ({
  MoverAccountOptions: function MockMoverAccountOptions(props: any) {
    return (
      <div data-testid="mock-mover-account-option">
        <div data-testid="option-title">{props.title}</div>
        <div data-testid="option-description">{props.description}</div>
        {props.disabled && <div data-testid="option-disabled">disabled</div>}
      </div>
    );
  }
}));

jest.mock('@/components/features/service-providers/account/AccountSetupChecklist', () => ({
  AccountSetupChecklist: function MockAccountSetupChecklist(props: any) {
    return (
      <div data-testid="mock-account-setup-checklist">
        Checklist for {props.userType}
      </div>
    );
  }
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return {
    __esModule: true,
    default: MockLink
  };
});

// Mock fetch globally
global.fetch = jest.fn();

describe('MoverAccountHomepage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({})
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing for driver user type', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders without crashing for mover user type', () => {
      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays correct title for driver', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Driver Dashboard');
    });

    it('displays correct title for mover', () => {
      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mover Dashboard');
    });

    it('renders account setup checklist', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      expect(screen.getByTestId('mock-account-setup-checklist')).toBeInTheDocument();
    });

    it('renders account options grid', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      const grid = screen.getByRole('region', { name: /account management options/i });
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations for driver view', async () => {
      const renderResult = render(
        <MoverAccountHomepage userType="driver" userId="driver-123" />
      );
      await testAccessibility(renderResult);
    });

    it('has no accessibility violations for mover view', async () => {
      const renderResult = render(
        <MoverAccountHomepage userType="mover" userId="mover-456" />
      );
      await testAccessibility(renderResult);
    });

    it('uses semantic HTML main element', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('includes proper ARIA labels for sections', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      expect(screen.getByRole('region', { name: /account setup progress/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /account management options/i })).toBeInTheDocument();
    });

    it('includes aria-label for external links', () => {
      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      const onfleetLink = screen.getByLabelText(/open onfleet dashboard in new tab/i);
      expect(onfleetLink).toBeInTheDocument();
    });

    it('includes proper button types', () => {
      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('API Integration - Driver', () => {
    it('fetches moving partner status for drivers', async () => {
      const mockStatus = {
        isLinkedToMovingPartner: false,
        movingPartner: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockStatus
      });

      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/drivers/driver-123/moving-partner-status');
      });
    });

    it('handles moving partner status fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching moving partner status:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('does not fetch moving partner status without userId', () => {
      render(<MoverAccountHomepage userType="driver" />);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('API Integration - Mover', () => {
    it('fetches mover approval status', async () => {
      const mockData = {
        isApproved: true
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockData
      });

      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/moving-partners/mover-456/profile');
      });
    });

    it('handles mover status fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching mover status:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('does not fetch mover status without userId', () => {
      render(<MoverAccountHomepage userType="mover" />);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Links', () => {
    it('renders calendar link for driver', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      const calendarLink = screen.getByLabelText(/view calendar in new tab/i);
      expect(calendarLink).toHaveAttribute('href', '/driver-account-page/driver-123/view-calendar');
      expect(calendarLink).toHaveAttribute('target', '_blank');
      expect(calendarLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders calendar link for mover', () => {
      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      const calendarLink = screen.getByLabelText(/view calendar in new tab/i);
      expect(calendarLink).toHaveAttribute('href', '/mover-account-page/mover-456/view-calendar');
    });

    it('renders Onfleet dashboard link for movers only', () => {
      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      const onfleetLink = screen.getByLabelText(/open onfleet dashboard in new tab/i);
      expect(onfleetLink).toHaveAttribute('href', 'https://onfleet.com/login');
      expect(onfleetLink).toHaveAttribute('target', '_blank');
      expect(onfleetLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does not render Onfleet dashboard link for drivers', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      const onfleetLink = screen.queryByText(/onfleet dashboard/i);
      expect(onfleetLink).not.toBeInTheDocument();
    });
  });

  describe('Conditional Option Rendering - Driver', () => {
    it('always shows Jobs option for drivers', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      const titles = screen.getAllByTestId('option-title');
      expect(titles.some(el => el.textContent === 'Jobs')).toBe(true);
    });

    it('shows Work Schedule for independent drivers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          isLinkedToMovingPartner: false,
          movingPartner: null
        })
      });

      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);

      await waitFor(() => {
        const titles = screen.getAllByTestId('option-title');
        const hasWorkSchedule = titles.some(el => el.textContent === 'Work Schedule');
        expect(hasWorkSchedule).toBe(true);
      });
    });

    it('hides Work Schedule for drivers linked to moving partners', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          isLinkedToMovingPartner: true,
          movingPartner: { id: 1, name: 'Test Mover' }
        })
      });

      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);

      await waitFor(() => {
        const titles = screen.getAllByTestId('option-title');
        const hasWorkSchedule = titles.some(el => el.textContent === 'Work Schedule');
        expect(hasWorkSchedule).toBe(false);
      });
    });

    it('shows Vehicle Information for independent drivers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          isLinkedToMovingPartner: false,
          movingPartner: null
        })
      });

      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);

      await waitFor(() => {
        const titles = screen.getAllByTestId('option-title');
        const hasVehicle = titles.some(el => el.textContent === 'Vehicle information');
        expect(hasVehicle).toBe(true);
      });
    });

    it('hides Vehicle Information for drivers linked to moving partners', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          isLinkedToMovingPartner: true,
          movingPartner: { id: 1, name: 'Test Mover' }
        })
      });

      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);

      await waitFor(() => {
        const titles = screen.getAllByTestId('option-title');
        const hasVehicle = titles.some(el => el.textContent === 'Vehicle information');
        expect(hasVehicle).toBe(false);
      });
    });

    it('shows Payment for independent drivers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          isLinkedToMovingPartner: false,
          movingPartner: null
        })
      });

      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);

      await waitFor(() => {
        const titles = screen.getAllByTestId('option-title');
        const hasPayment = titles.some(el => el.textContent === 'Payment');
        expect(hasPayment).toBe(true);
      });
    });

    it('hides Payment for drivers linked to moving partners', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          isLinkedToMovingPartner: true,
          movingPartner: { id: 1, name: 'Test Mover' }
        })
      });

      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);

      await waitFor(() => {
        const titles = screen.getAllByTestId('option-title');
        const hasPayment = titles.some(el => el.textContent === 'Payment');
        expect(hasPayment).toBe(false);
      });
    });
  });

  describe('Conditional Option Rendering - Mover', () => {
    it('always shows all standard options for movers', () => {
      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      const titles = screen.getAllByTestId('option-title');
      const titleTexts = titles.map(el => el.textContent);

      expect(titleTexts).toContain('Jobs');
      expect(titleTexts).toContain('Work Schedule');
      expect(titleTexts).toContain('Vehicle information');
      expect(titleTexts).toContain('Account Information');
      expect(titleTexts).toContain('Coverage Area');
      expect(titleTexts).toContain('Best Practices');
    });

    it('shows disabled Driver Information option for unapproved movers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ isApproved: false })
      });

      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/moving-partners/mover-456/profile');
      });

      await waitFor(() => {
        const disabledOptions = screen.queryAllByTestId('option-disabled');
        expect(disabledOptions.length).toBeGreaterThan(0);
      });
    });

    it('shows enabled Driver Information option for approved movers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ isApproved: true })
      });

      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/moving-partners/mover-456/profile');
      });

      await waitFor(() => {
        const titles = screen.getAllByTestId('option-title');
        const hasDriverInfo = titles.some(el => el.textContent === 'Driver Information');
        expect(hasDriverInfo).toBe(true);
      });

      // After approval status is loaded, there should be no disabled options
      await waitFor(() => {
        const disabledOptions = screen.queryAllByTestId('option-disabled');
        expect(disabledOptions.length).toBe(0);
      });
    });

    it('displays correct description for disabled Driver Information', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ isApproved: false })
      });

      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);

      await waitFor(() => {
        const descriptions = screen.getAllByTestId('option-description');
        const hasCorrectDesc = descriptions.some(
          el => el.textContent === 'Complete account checklist before adding drivers'
        );
        expect(hasCorrectDesc).toBe(true);
      });
    });

    it('displays correct description for enabled Driver Information', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ isApproved: true })
      });

      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);

      await waitFor(() => {
        const descriptions = screen.getAllByTestId('option-description');
        const hasCorrectDesc = descriptions.some(
          el => el.textContent === 'Add your company drivers'
        );
        expect(hasCorrectDesc).toBe(true);
      });
    });
  });

  describe('Common Options', () => {
    it('always shows Coverage Area for both user types', () => {
      const { rerender } = render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      let titles = screen.getAllByTestId('option-title');
      expect(titles.some(el => el.textContent === 'Coverage Area')).toBe(true);

      rerender(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      titles = screen.getAllByTestId('option-title');
      expect(titles.some(el => el.textContent === 'Coverage Area')).toBe(true);
    });

    it('always shows Best Practices for both user types', () => {
      const { rerender } = render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      let titles = screen.getAllByTestId('option-title');
      expect(titles.some(el => el.textContent === 'Best Practices')).toBe(true);

      rerender(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      titles = screen.getAllByTestId('option-title');
      expect(titles.some(el => el.textContent === 'Best Practices')).toBe(true);
    });
  });

  describe('Design System Integration', () => {
    it('applies semantic color classes', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('applies btn-primary class to View Calendar button', () => {
      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);
      const button = screen.getByRole('button', { name: /view calendar/i });
      expect(button).toHaveClass('btn-primary');
    });

    it('applies correct surface colors to Onfleet button', () => {
      render(<MoverAccountHomepage userType="mover" userId="mover-456" />);
      const button = screen.getByRole('button', { name: /onfleet dashboard/i });
      expect(button).toHaveClass('bg-surface-tertiary');
      expect(button).toHaveClass('hover:bg-surface-disabled');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty userId gracefully', () => {
      render(<MoverAccountHomepage userType="driver" userId="" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles undefined userId gracefully', () => {
      render(<MoverAccountHomepage userType="driver" />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('renders correctly with null API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => null
      });

      render(<MoverAccountHomepage userType="driver" userId="driver-123" />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });
});

