/**
 * @fileoverview Tests for DriversLicenseImages component
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import DriversLicenseImages from '@/components/features/service-providers/drivers/DriversLicenseImages';

expect.extend(toHaveNoViolations);

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    const { onLoad, onError, ...otherProps } = props;
    return (
      <img
        {...otherProps}
        onLoad={onLoad}
        onError={onError}
        data-testid="next-image"
      />
    );
  },
}));

// Mock PhotoUploads component
jest.mock('@/components/forms/PhotoUploads', () => ({
  __esModule: true,
  default: function MockPhotoUploads({ 
    photoUploadTitle, 
    buttonText,
    onPhotosSelected,
    onUploadSuccess 
  }: any) {
    return (
      <div data-testid="photo-uploads">
        <p>{photoUploadTitle}</p>
        <button onClick={() => {
          onPhotosSelected([new File([''], 'test.jpg')]);
          if (onUploadSuccess) onUploadSuccess();
        }}>
          {buttonText}
        </button>
      </div>
    );
  },
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  CreditCardIcon: function MockCreditCardIcon(props: any) {
    return <div data-testid="credit-card-icon" {...props} />;
  },
  TrashIcon: function MockTrashIcon(props: any) {
    return <div data-testid="trash-icon" {...props} />;
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('DriversLicenseImages', () => {
  const mockUserId = 'driver-123';
  const mockLicensePhotos = {
    frontPhoto: 'https://example.com/front.jpg',
    backPhoto: 'https://example.com/back.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/license-photos') && !options) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLicensePhotos),
        });
      }
      if (url.includes('/remove-license-photos') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders null for mover user type', () => {
      const { container } = render(
        <DriversLicenseImages userId={mockUserId} userType="mover" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders heading for driver user type', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /driver's license/i })).toBeInTheDocument();
      });
    });

    it('shows loading placeholders initially', () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);
      
      const creditCardIcons = screen.getAllByTestId('credit-card-icon');
      expect(creditCardIcons.length).toBeGreaterThan(0);
    });

    it('displays alert message when no photos exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ frontPhoto: null, backPhoto: null }),
      });

      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/to activate your driver account/i)).toBeInTheDocument();
      });
    });

    it('does not show alert when photos exist', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('renders grid layout with 2 columns', async () => {
      const { container } = render(
        <DriversLicenseImages userId={mockUserId} userType="driver" />
      );

      await waitFor(() => {
        const grid = container.querySelector('.grid-cols-1.md\\:grid-cols-2');
        expect(grid).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('fetches license photos from correct endpoint', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/drivers/driver-123/license-photos'
        );
      });
    });

    it('handles fetch failure gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching driver's license photos:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('displays front photo when available', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        const frontImage = screen.getByRole('img', { name: /front of driver's license/i });
        expect(frontImage).toBeInTheDocument();
        expect(frontImage).toHaveAttribute('src', mockLicensePhotos.frontPhoto);
      });
    });

    it('displays back photo when available', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        const backImage = screen.getByRole('img', { name: /back of driver's license/i });
        expect(backImage).toBeInTheDocument();
        expect(backImage).toHaveAttribute('src', mockLicensePhotos.backPhoto);
      });
    });

    it('shows photo upload components when no photos exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ frontPhoto: null, backPhoto: null }),
      });

      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText("Front of Driver's License Photo")).toBeInTheDocument();
        expect(screen.getByText("Back of Driver's License Photo")).toBeInTheDocument();
      });
    });
  });

  describe('Photo Labels', () => {
    it('displays "Front" label for front photo', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Front')).toBeInTheDocument();
      });
    });

    it('displays "Back" label for back photo', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('shows delete button for front photo', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
        expect(deleteButton).toBeInTheDocument();
      });
    });

    it('shows delete button for back photo', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete back license photo/i });
        expect(deleteButton).toBeInTheDocument();
      });
    });

    it('opens confirmation modal when delete button clicked', async () => {
      const user = userEvent.setup();
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Remove Photo')).toBeInTheDocument();
      });
    });

    it('displays confirmation message in modal', async () => {
      const user = userEvent.setup();
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to remove/i)).toBeInTheDocument();
      });
    });

    it('closes modal when Close button clicked', async () => {
      const user = userEvent.setup();
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /cancel deletion/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('calls delete API when Remove button clicked', async () => {
      const user = userEvent.setup();
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/drivers/driver-123/remove-license-photos',
          expect.objectContaining({
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoType: 'front' }),
          })
        );
      });
    });

    it('removes front photo from display after successful deletion', async () => {
      const user = userEvent.setup();
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByRole('img', { name: /front of driver's license/i })).not.toBeInTheDocument();
      });
    });

    it('shows loading state while deleting', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/license-photos') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLicensePhotos),
          });
        }
        if (url.includes('/remove-license-photos')) {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              100
            )
          );
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const user = userEvent.setup();
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText('Removing...')).toBeInTheDocument();
        expect(removeButton).toBeDisabled();
        expect(removeButton).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('handles delete failure gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/license-photos') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLicensePhotos),
          });
        }
        if (url.includes('/remove-license-photos')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Failed' }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup();
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete photo');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with photos', async () => {
      const renderResult = render(
        <DriversLicenseImages userId={mockUserId} userType="driver" />
      );

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });

    it('has no accessibility violations without photos', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ frontPhoto: null, backPhoto: null }),
      });

      const renderResult = render(
        <DriversLicenseImages userId={mockUserId} userType="driver" />
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels for delete buttons', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete front license photo/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete back license photo/i })).toBeInTheDocument();
      });
    });

    it('modal has proper aria attributes', async () => {
      const user = userEvent.setup();
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'delete-modal-title');
      });
    });

    it('alert has proper aria attributes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ frontPhoto: null, backPhoto: null }),
      });

      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('icons have aria-hidden attribute', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        const icons = screen.getAllByTestId('credit-card-icon');
        icons.forEach(icon => {
          expect(icon).toHaveAttribute('aria-hidden', 'true');
        });
      });
    });
  });

  describe('Design System Integration', () => {
    it('applies semantic color classes', async () => {
      const { container } = render(
        <DriversLicenseImages userId={mockUserId} userType="driver" />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /driver's license/i })).toHaveClass('text-text-primary');
      });
    });

    it('uses design system button classes', async () => {
      const user = userEvent.setup();
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /front of driver's license/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete front license photo/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const removeButton = screen.getByRole('button', { name: /remove/i });
        expect(removeButton).toHaveClass('bg-primary', 'hover:bg-primary-hover');
      });
    });

    it('uses surface-tertiary for loading states', () => {
      const { container } = render(
        <DriversLicenseImages userId={mockUserId} userType="driver" />
      );

      const loadingContainers = container.querySelectorAll('.bg-surface-tertiary');
      expect(loadingContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Image Loading States', () => {
    it('handles image load event', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        const frontImage = screen.getByRole('img', { name: /front of driver's license/i });
        fireEvent.load(frontImage);
      });
    });

    it('handles image error event', async () => {
      render(<DriversLicenseImages userId={mockUserId} userType="driver" />);

      await waitFor(() => {
        const frontImage = screen.getByRole('img', { name: /front of driver's license/i });
        fireEvent.error(frontImage);
      });
    });
  });
});

