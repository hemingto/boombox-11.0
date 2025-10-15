/**
 * @fileoverview Tests for StorageUnitPopup component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * @source boombox-10.0/src/app/components/user-page/storageunitpopup.tsx
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import {
  StorageUnitPopup,
  StorageUnitPopupProps,
} from '@/components/features/customers/StorageUnitPopup';

expect.extend(toHaveNoViolations);

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    onError,
    fill,
    className,
    priority,
  }: {
    src: string;
    alt: string;
    onError?: () => void;
    fill?: boolean;
    className?: string;
    priority?: boolean;
  }) {
    return (
      <img
        src={src}
        alt={alt}
        onError={onError}
        data-fill={fill ? 'true' : 'false'}
        data-priority={priority ? 'true' : 'false'}
        className={className}
      />
    );
  },
}));

// Mock Modal component
jest.mock('@/components/ui/primitives/Modal', () => ({
  Modal: function MockModal({ children, open, onClose, title, size }: any) {
    if (!open) return null;
    return (
      <div data-testid="modal" role="dialog" aria-labelledby="modal-title" data-size={size}>
        <h2 id="modal-title">{title}</h2>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        {children}
      </div>
    );
  },
}));

describe('StorageUnitPopup', () => {
  const mockOnClose = jest.fn();
  const mockOnDescriptionChange = jest.fn();

  const defaultProps: StorageUnitPopupProps = {
    images: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg',
    ],
    mainImage: 'https://example.com/main.jpg',
    onClose: mockOnClose,
    description: 'Winter clothes and holiday decorations',
    onDescriptionChange: mockOnDescriptionChange,
    title: 'Boombox #1234',
    pickUpDate: 'January 15th, 2025',
    lastAccessedDate: 'February 1st, 2025',
    location: 'San Francisco, CA',
    isOpen: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing when open', () => {
      render(<StorageUnitPopup {...defaultProps} />);
      expect(screen.getByText('Boombox #1234')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      const closedProps = { ...defaultProps, isOpen: false };
      render(<StorageUnitPopup {...closedProps} />);
      expect(screen.queryByText('Boombox #1234')).not.toBeInTheDocument();
    });

    it('displays storage unit details correctly', () => {
      render(<StorageUnitPopup {...defaultProps} />);
      expect(screen.getByText('Boombox #1234')).toBeInTheDocument();
      expect(screen.getByText(/Picked up January 15th, 2025 from San Francisco, CA/)).toBeInTheDocument();
      expect(screen.getByText(/Last Accessed: February 1st, 2025/)).toBeInTheDocument();
    });

    it('does not display last accessed date when not provided', () => {
      const propsWithoutLastAccessed = {
        ...defaultProps,
        lastAccessedDate: null,
      };
      render(<StorageUnitPopup {...propsWithoutLastAccessed} />);
      expect(screen.queryByText(/Last Accessed/)).not.toBeInTheDocument();
    });

    it('displays main image on first page', () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const image = screen.getByAltText(/Boombox #1234 - Image 1 of 4/);
      expect(image).toHaveAttribute('src', 'https://example.com/main.jpg');
    });

    it('displays pagination when multiple images exist', () => {
      render(<StorageUnitPopup {...defaultProps} />);
      expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });

    it('does not display pagination when only one image exists', () => {
      const singleImageProps = {
        ...defaultProps,
        images: [],
        mainImage: 'https://example.com/main.jpg',
      };
      render(<StorageUnitPopup {...singleImageProps} />);
      expect(screen.queryByText(/of/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<StorageUnitPopup {...defaultProps} />);
      await testAccessibility(renderResult);
    });

    it('has proper aria labels for navigation controls', () => {
      render(<StorageUnitPopup {...defaultProps} />);
      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('has proper aria label for description toggle', () => {
      render(<StorageUnitPopup {...defaultProps} />);
      expect(screen.getByLabelText('Show description editor')).toBeInTheDocument();
    });

    it('updates aria-label when description is visible', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Hide description editor')).toBeInTheDocument();
      });
    });

    it('has proper aria-live region for page counter', () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const pageCounter = screen.getByText('1 of 4');
      expect(pageCounter).toHaveAttribute('aria-live', 'polite');
      expect(pageCounter).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Image Navigation', () => {
    it('navigates to next image when next button is clicked', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const nextButton = screen.getByLabelText('Next image');
      
      await userEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('2 of 4')).toBeInTheDocument();
      });
    });

    it('navigates to previous image when previous button is clicked', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const nextButton = screen.getByLabelText('Next image');
      const prevButton = screen.getByLabelText('Previous image');
      
      await userEvent.click(nextButton);
      await userEvent.click(prevButton);
      
      await waitFor(() => {
        expect(screen.getByText('1 of 4')).toBeInTheDocument();
      });
    });

    it('disables previous button on first page', () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const prevButton = screen.getByLabelText('Previous image');
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const nextButton = screen.getByLabelText('Next image');
      
      // Click next 3 times to reach last page
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('4 of 4')).toBeInTheDocument();
        expect(nextButton).toBeDisabled();
      });
    });

    it('resets to first page when modal is closed and reopened', async () => {
      const { rerender } = render(<StorageUnitPopup {...defaultProps} />);
      const nextButton = screen.getByLabelText('Next image');
      
      await userEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText('2 of 4')).toBeInTheDocument();
      });

      // Close modal
      rerender(<StorageUnitPopup {...defaultProps} isOpen={false} />);
      
      // Reopen modal
      rerender(<StorageUnitPopup {...defaultProps} isOpen={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('1 of 4')).toBeInTheDocument();
      });
    });

    it('resets image broken state when navigating', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const image = screen.getByAltText(/Image 1 of 4/);
      
      // Trigger image error
      fireEvent.error(image);
      
      await waitFor(() => {
        expect(screen.getByText('Image not available')).toBeInTheDocument();
      });

      // Navigate to next image
      const nextButton = screen.getByLabelText('Next image');
      await userEvent.click(nextButton);
      
      // Image should be attempted to load again
      await waitFor(() => {
        expect(screen.getByText('2 of 4')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates to next image with ArrowRight key', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(screen.getByText('2 of 4')).toBeInTheDocument();
      });
    });

    it('navigates to previous image with ArrowLeft key', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByText('2 of 4')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByText('1 of 4')).toBeInTheDocument();
      });
    });

    it('closes modal with Escape key', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('does not respond to keyboard when modal is closed', () => {
      const closedProps = { ...defaultProps, isOpen: false };
      render(<StorageUnitPopup {...closedProps} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Description Editing', () => {
    it('hides description editor by default', () => {
      render(<StorageUnitPopup {...defaultProps} />);
      expect(screen.getByText('Add Description')).toBeInTheDocument();
    });

    it('shows description editor when toggle button is clicked', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Storage unit description')).toBeVisible();
        expect(screen.getByText('Hide Description')).toBeInTheDocument();
      });
    });

    it('hides description editor when toggle button is clicked again', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByText('Hide Description')).toBeInTheDocument();
      });
      
      const hideButton = screen.getByLabelText('Hide description editor');
      await userEvent.click(hideButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add Description')).toBeInTheDocument();
      });
    });

    it('displays current description value', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Storage unit description') as HTMLTextAreaElement;
        expect(textarea.value).toBe('Winter clothes and holiday decorations');
      });
    });

    it('calls onDescriptionChange when description is edited', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      
      await waitFor(async () => {
        const textarea = screen.getByLabelText('Storage unit description');
        fireEvent.change(textarea, { target: { value: 'Updated description' } });
        
        await waitFor(() => {
          expect(mockOnDescriptionChange).toHaveBeenCalledWith('Updated description');
        });
      });
    });

    it('displays character count when description is visible', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText('43/1000')).toBeInTheDocument();
      });
    });

    it('highlights character count in red when at limit', async () => {
      const propsAtLimit = {
        ...defaultProps,
        description: 'a'.repeat(1000),
      };
      render(<StorageUnitPopup {...propsAtLimit} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      
      await waitFor(() => {
        const charCount = screen.getByText('1000/1000');
        expect(charCount).toHaveClass('text-status-error');
      });
    });

    it('focuses textarea when description becomes visible', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Storage unit description');
        expect(textarea).toHaveFocus();
      }, { timeout: 500 });
    });

    it('updates local description when prop changes', async () => {
      const { rerender } = render(<StorageUnitPopup {...defaultProps} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Storage unit description') as HTMLTextAreaElement;
        expect(textarea.value).toBe('Winter clothes and holiday decorations');
      });

      // Update description prop
      const updatedProps = {
        ...defaultProps,
        description: 'New description from parent',
      };
      rerender(<StorageUnitPopup {...updatedProps} />);
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Storage unit description') as HTMLTextAreaElement;
        expect(textarea.value).toBe('New description from parent');
      });
    });

    it('resets description visibility when modal closes', async () => {
      const { rerender } = render(<StorageUnitPopup {...defaultProps} />);
      const toggleButton = screen.getByLabelText('Show description editor');
      
      await userEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByText('Hide Description')).toBeInTheDocument();
      });

      // Close modal
      rerender(<StorageUnitPopup {...defaultProps} isOpen={false} />);
      
      // Reopen modal
      rerender(<StorageUnitPopup {...defaultProps} isOpen={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Description')).toBeInTheDocument();
      });
    });
  });

  describe('Image Error Handling', () => {
    it('displays fallback text when image fails to load', async () => {
      render(<StorageUnitPopup {...defaultProps} />);
      const image = screen.getByAltText(/Image 1 of 4/);
      
      fireEvent.error(image);
      
      await waitFor(() => {
        expect(screen.getByText('Image not available')).toBeInTheDocument();
      });
    });

    it('uses placeholder image when no images are available', () => {
      const noImagesProps = {
        ...defaultProps,
        images: [],
        mainImage: null,
      };
      render(<StorageUnitPopup {...noImagesProps} />);
      
      const image = screen.getByAltText(/Image 1 of 1/);
      expect(image).toHaveAttribute('src', '/placeholder.jpg');
    });
  });
});

