/**
 * @fileoverview Tests for StorageUnitsCard component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * @source boombox-10.0/src/app/components/user-page/storageunitscard.tsx
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import {
  StorageUnitsCard,
  StorageUnitCardProps,
} from '@/components/features/customers/StorageUnitsCard';

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
  }: {
    src: string;
    alt: string;
    onError?: () => void;
    fill?: boolean;
    className?: string;
  }) {
    return (
      <img
        src={src}
        alt={alt}
        onError={onError}
        data-fill={fill ? 'true' : 'false'}
        className={className}
      />
    );
  },
}));

describe('StorageUnitsCard', () => {
  const mockOnDescriptionChange = jest.fn();
  const mockOnUploadClick = jest.fn();
  const mockOnImageClick = jest.fn();
  const mockOnPhotosUploaded = jest.fn();

  const defaultProps: StorageUnitCardProps = {
    id: 123,
    imageSrc: 'https://example.com/storage-unit.jpg',
    title: 'Boombox #1234',
    pickUpDate: 'January 15th, 2025',
    lastAccessedDate: 'February 1st, 2025',
    location: 'San Francisco, CA',
    descriptionPlaceholder: 'Add a description of your stored items...',
    onDescriptionChange: mockOnDescriptionChange,
    onUploadClick: mockOnUploadClick,
    onImageClick: mockOnImageClick,
    description: 'Winter clothes and holiday decorations',
    onPhotosUploaded: mockOnPhotosUploaded,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      expect(screen.getByText('Boombox #1234')).toBeInTheDocument();
    });

    it('displays storage unit title correctly', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      expect(screen.getByText('Boombox #1234')).toBeInTheDocument();
    });

    it('displays pickup date and location correctly', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      expect(screen.getByText(/Picked up January 15th, 2025 from San Francisco, CA/)).toBeInTheDocument();
    });

    it('displays last accessed date when provided', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      expect(screen.getByText('Last accessed February 1st, 2025')).toBeInTheDocument();
    });

    it('does not display last accessed date when not provided', () => {
      const propsWithoutLastAccessed = {
        ...defaultProps,
        lastAccessedDate: null,
      };
      render(<StorageUnitsCard {...propsWithoutLastAccessed} />);
      expect(screen.queryByText(/Last accessed/)).not.toBeInTheDocument();
    });

    it('renders image when imageSrc is provided', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const images = screen.getAllByAltText('Boombox #1234');
      expect(images.length).toBeGreaterThan(0);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/storage-unit.jpg');
    });

    it('displays fallback text when imageSrc is null', () => {
      const propsWithoutImage = {
        ...defaultProps,
        imageSrc: null,
      };
      render(<StorageUnitsCard {...propsWithoutImage} />);
      expect(screen.getAllByText('Image not available').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<StorageUnitsCard {...defaultProps} />);
      await testAccessibility(renderResult);
    });

    it('has proper aria labels for interactive elements', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      
      expect(screen.getByLabelText('Storage unit description')).toBeInTheDocument();
      expect(screen.getByLabelText(/Upload photos of stored items/)).toBeInTheDocument();
    });

    it('supports keyboard navigation for image click', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const imageContainers = screen.getAllByRole('button', { name: /View photos of Boombox #1234/ });
      
      // Test Enter key
      fireEvent.keyDown(imageContainers[0], { key: 'Enter' });
      expect(mockOnImageClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      fireEvent.keyDown(imageContainers[0], { key: ' ' });
      expect(mockOnImageClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Description Input', () => {
    it('displays current description value', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const textarea = screen.getByLabelText('Storage unit description') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Winter clothes and holiday decorations');
    });

    it('displays placeholder when no description', () => {
      const propsWithoutDescription = {
        ...defaultProps,
        description: '',
      };
      render(<StorageUnitsCard {...propsWithoutDescription} />);
      const textarea = screen.getByPlaceholderText('Add a description of your stored items...');
      expect(textarea).toBeInTheDocument();
    });

    it('calls onDescriptionChange when description is edited', async () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const textarea = screen.getByLabelText('Storage unit description');
      
      fireEvent.change(textarea, { target: { value: 'Updated description' } });
      
      expect(mockOnDescriptionChange).toHaveBeenCalledWith('Updated description');
    });

    it('displays character count', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      expect(screen.getByText('43/1000')).toBeInTheDocument();
    });

    it('highlights character count in red when at limit', () => {
      const propsAtLimit = {
        ...defaultProps,
        description: 'a'.repeat(1000),
      };
      render(<StorageUnitsCard {...propsAtLimit} />);
      const charCount = screen.getByText('1000/1000');
      expect(charCount).toHaveClass('text-status-error');
    });

    it('enforces max length of 1000 characters', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const textarea = screen.getByLabelText('Storage unit description') as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(1000);
    });
  });

  describe('Image Interaction', () => {
    it('calls onImageClick when desktop image is clicked', async () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const imageContainers = screen.getAllByRole('button', { name: /View photos of Boombox #1234/ });
      
      await userEvent.click(imageContainers[0]);
      
      expect(mockOnImageClick).toHaveBeenCalledTimes(1);
    });

    it('calls onImageClick when title is clicked', async () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const title = screen.getByText('Boombox #1234');
      
      await userEvent.click(title);
      
      expect(mockOnImageClick).toHaveBeenCalled();
    });

    it('handles image load error gracefully', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const images = screen.getAllByAltText('Boombox #1234');
      
      // Simulate image load error
      fireEvent.error(images[0]);
      
      // Image should still be rendered but fallback will show on next render
      expect(images[0]).toBeInTheDocument();
    });
  });

  describe('Photo Upload', () => {
    it('displays upload button', () => {
      render(<StorageUnitsCard {...defaultProps} />);
      expect(screen.getByText(/Upload photos of your/)).toBeInTheDocument();
    });

    it('opens file input when upload button is clicked', async () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const uploadButton = screen.getByLabelText(/Upload photos of stored items/);
      
      await userEvent.click(uploadButton);
      
      // File input should exist
      const fileInput = screen.getByLabelText('Upload storage unit photos');
      expect(fileInput).toBeInTheDocument();
    });

    it('validates file types', async () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const fileInput = screen.getByLabelText('Upload storage unit photos') as HTMLInputElement;
      
      const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(screen.getByText(/is not a supported image format/)).toBeInTheDocument();
      });
    });

    it('validates file size', async () => {
      render(<StorageUnitsCard {...defaultProps} />);
      const fileInput = screen.getByLabelText('Upload storage unit photos') as HTMLInputElement;
      
      // Create a file larger than 10MB
      const largeFile = new File(['a'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(screen.getByText(/is too large/)).toBeInTheDocument();
      });
    });

    it('successfully uploads valid files', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            uploadedUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
          }),
        })
      ) as jest.Mock;

      render(<StorageUnitsCard {...defaultProps} />);
      const fileInput = screen.getByLabelText('Upload storage unit photos') as HTMLInputElement;
      
      const validFile1 = new File(['content1'], 'photo1.jpg', { type: 'image/jpeg' });
      const validFile2 = new File(['content2'], 'photo2.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [validFile1, validFile2] } });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/storage-units/123/upload-photos',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Successfully uploaded 2 photo(s)!')).toBeInTheDocument();
        expect(mockOnPhotosUploaded).toHaveBeenCalledWith([
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
        ]);
      });
    });

    it('displays error message when upload fails', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Upload failed' }),
        })
      ) as jest.Mock;

      render(<StorageUnitsCard {...defaultProps} />);
      const fileInput = screen.getByLabelText('Upload storage unit photos') as HTMLInputElement;
      
      const validFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });
    });

    it('displays loading state during upload', async () => {
      global.fetch = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ uploadedUrls: ['https://example.com/photo.jpg'] }),
                } as Response),
              100
            )
          )
      ) as jest.Mock;

      render(<StorageUnitsCard {...defaultProps} />);
      const fileInput = screen.getByLabelText('Upload storage unit photos') as HTMLInputElement;
      
      const validFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Uploading photos...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Successfully uploaded 1 photo(s)!')).toBeInTheDocument();
      });
    });

    it('clears file input after upload', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ uploadedUrls: ['https://example.com/photo.jpg'] }),
        })
      ) as jest.Mock;

      render(<StorageUnitsCard {...defaultProps} />);
      const fileInput = screen.getByLabelText('Upload storage unit photos') as HTMLInputElement;
      
      const validFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Successfully uploaded 1 photo(s)!')).toBeInTheDocument();
      });

      expect(fileInput.value).toBe('');
    });

    it('handles network errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

      render(<StorageUnitsCard {...defaultProps} />);
      const fileInput = screen.getByLabelText('Upload storage unit photos') as HTMLInputElement;
      
      const validFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to upload photos. Please try again.')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('clears previous error messages when starting new upload', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Upload failed' }),
        })
      ) as jest.Mock;

      render(<StorageUnitsCard {...defaultProps} />);
      const uploadButton = screen.getByLabelText(/Upload photos of stored items/);
      
      // First upload - trigger error
      const fileInput = screen.getByLabelText('Upload storage unit photos') as HTMLInputElement;
      const validFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });

      // Click upload button again - should clear error
      await userEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Upload failed')).not.toBeInTheDocument();
      });
    });
  });
});

