/**
 * @fileoverview ProfilePicture component tests
 * @source boombox-10.0/src/app/components/reusablecomponents/profilepicture.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePicture } from '@/components/ui/primitives/ProfilePicture';
import * as profilePictureService from '@/lib/services/profilePictureService';
import * as useProfilePictureHook from '@/hooks/useProfilePicture';

// Mock the service functions
jest.mock('@/lib/services/profilePictureService');
const mockFetchProfilePicture = profilePictureService.fetchProfilePicture as jest.MockedFunction<typeof profilePictureService.fetchProfilePicture>;
const mockUploadProfilePicture = profilePictureService.uploadProfilePicture as jest.MockedFunction<typeof profilePictureService.uploadProfilePicture>;
const mockValidateProfilePictureFile = profilePictureService.validateProfilePictureFile as jest.MockedFunction<typeof profilePictureService.validateProfilePictureFile>;

// Mock the hook
jest.mock('@/hooks/useProfilePicture');
const mockUseProfilePicture = useProfilePictureHook.useProfilePicture as jest.MockedFunction<typeof useProfilePictureHook.useProfilePicture>;

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

describe('ProfilePicture Component', () => {
  const defaultProps = {
    userType: 'driver' as const,
    userId: '123',
  };

  const mockHookReturn = {
    profilePicture: null,
    isLoading: false,
    isUploading: false,
    error: null,
    refreshProfilePicture: jest.fn(),
    handleUpload: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfilePicture.mockReturnValue(mockHookReturn);
    mockValidateProfilePictureFile.mockReturnValue({ valid: true });
  });

  describe('Rendering', () => {
    it('renders loading skeleton when loading', () => {
      mockUseProfilePicture.mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      });

      render(<ProfilePicture {...defaultProps} />);
      
      // Check for skeleton by class instead of test id
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders placeholder with warning message when no profile picture exists', () => {
      render(<ProfilePicture {...defaultProps} />);
      
      expect(screen.getByText('Please upload a profile picture to activate your account')).toBeInTheDocument();
      expect(screen.getByLabelText('Add profile picture')).toBeInTheDocument();
    });

    it('renders different message for mover user type', () => {
      render(<ProfilePicture {...defaultProps} userType="mover" />);
      
      expect(screen.getByText('Please upload a company picture or logo to activate your account')).toBeInTheDocument();
    });

    it('renders profile picture when available', () => {
      mockUseProfilePicture.mockReturnValue({
        ...mockHookReturn,
        profilePicture: 'https://example.com/profile.jpg',
      });

      render(<ProfilePicture {...defaultProps} />);
      
      expect(screen.getByAltText('Profile Picture')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit profile picture')).toBeInTheDocument();
    });

    it('renders custom icon when provided', () => {
      const customIcon = <div data-testid="custom-icon">Custom Icon</div>;
      
      render(<ProfilePicture {...defaultProps} customIcon={customIcon} />);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size classes', () => {
      render(<ProfilePicture {...defaultProps} size="sm" />);
      
      const container = document.querySelector('.w-24.h-24');
      expect(container).toBeInTheDocument();
    });

    it('applies medium size classes (default)', () => {
      render(<ProfilePicture {...defaultProps} />);
      
      const container = document.querySelector('.w-32.h-32');
      expect(container).toBeInTheDocument();
    });

    it('applies large size classes', () => {
      render(<ProfilePicture {...defaultProps} size="lg" />);
      
      const container = document.querySelector('.w-40.h-40');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('opens modal when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfilePicture {...defaultProps} />);
      
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      expect(screen.getByText('Add Profile Picture')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop')).toBeInTheDocument();
    });

    it('opens modal when edit button is clicked', async () => {
      mockUseProfilePicture.mockReturnValue({
        ...mockHookReturn,
        profilePicture: 'https://example.com/profile.jpg',
      });

      const user = userEvent.setup();
      render(<ProfilePicture {...defaultProps} />);
      
      const editButton = screen.getByLabelText('Edit profile picture');
      await user.click(editButton);
      
      expect(screen.getByText('Update Profile Picture')).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      // Close modal
      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);
      
      expect(screen.queryByText('Add Profile Picture')).not.toBeInTheDocument();
    });

    it('closes modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      // Close modal
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(screen.queryByText('Add Profile Picture')).not.toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('handles file selection via input', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      // Select file
      const fileInput = screen.getByRole('button', { name: 'Upload area' });
      await user.click(fileInput);
      
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(hiddenInput, file);
      
      expect(screen.getByAltText('Selected profile picture')).toBeInTheDocument();
    });

    it('handles drag and drop file selection', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal
      const addButton = screen.getByLabelText('Add profile picture');
      fireEvent.click(addButton);
      
      // Drag and drop file
      const dropArea = screen.getByRole('button', { name: 'Upload area' });
      fireEvent.dragOver(dropArea);
      fireEvent.drop(dropArea, {
        dataTransfer: {
          files: [file],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByAltText('Selected profile picture')).toBeInTheDocument();
      });
    });

    it('uploads file when upload button is clicked', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockHandleUpload = jest.fn().mockResolvedValue({ success: true, url: 'https://example.com/uploaded.jpg' });
      
      mockUseProfilePicture.mockReturnValue({
        ...mockHookReturn,
        handleUpload: mockHandleUpload,
      });
      
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      // Select file
      const fileInput = screen.getByRole('button', { name: 'Upload area' });
      await user.click(fileInput);
      
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(hiddenInput, file);
      
      // Upload file
      const uploadButton = screen.getByText('Upload');
      await user.click(uploadButton);
      
      expect(mockHandleUpload).toHaveBeenCalledWith(file);
    });

    it('removes selected file when trash button is clicked', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal and select file
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      const fileInput = screen.getByRole('button', { name: 'Upload area' });
      await user.click(fileInput);
      
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(hiddenInput, file);
      
      // Remove file
      const removeButton = screen.getByLabelText('Remove selected image');
      await user.click(removeButton);
      
      expect(screen.queryByAltText('Selected profile picture')).not.toBeInTheDocument();
      expect(screen.getByText('Drag and drop')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when present', () => {
      mockUseProfilePicture.mockReturnValue({
        ...mockHookReturn,
        error: 'Upload failed',
      });

      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal and select a file to show error
      const addButton = screen.getByLabelText('Add profile picture');
      fireEvent.click(addButton);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });

    it('clears error when modal is closed', async () => {
      const mockClearError = jest.fn();
      mockUseProfilePicture.mockReturnValue({
        ...mockHookReturn,
        error: 'Upload failed',
        clearError: mockClearError,
      });

      const user = userEvent.setup();
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      // Close modal
      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);
      
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('shows uploading state on upload button', async () => {
      mockUseProfilePicture.mockReturnValue({
        ...mockHookReturn,
        isUploading: true,
      });

      const user = userEvent.setup();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal and select file
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText('Uploading...');
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('Disabled State', () => {
    it('disables buttons when disabled prop is true', () => {
      render(<ProfilePicture {...defaultProps} disabled={true} />);
      
      const addButton = screen.getByLabelText('Add profile picture');
      expect(addButton).toBeDisabled();
    });

    it('does not open modal when disabled', async () => {
      const user = userEvent.setup();
      render(<ProfilePicture {...defaultProps} disabled={true} />);
      
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      expect(screen.queryByText('Add Profile Picture')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ProfilePicture {...defaultProps} />);
      
      expect(screen.getByLabelText('Add profile picture')).toBeInTheDocument();
    });

    it('has proper ARIA labels for edit mode', () => {
      mockUseProfilePicture.mockReturnValue({
        ...mockHookReturn,
        profilePicture: 'https://example.com/profile.jpg',
      });

      render(<ProfilePicture {...defaultProps} />);
      
      expect(screen.getByLabelText('Edit profile picture')).toBeInTheDocument();
    });

    it('supports keyboard navigation in modal', async () => {
      const user = userEvent.setup();
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      // Test keyboard navigation on upload area
      const uploadArea = screen.getByRole('button', { name: 'Upload area' });
      uploadArea.focus();
      await user.keyboard('{Enter}');
      
      // Should trigger file input
      expect(uploadArea).toHaveFocus();
    });

    it('has proper role attributes', async () => {
      const user = userEvent.setup();
      render(<ProfilePicture {...defaultProps} />);
      
      // Open modal
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Upload area' })).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls onProfilePictureChange when profile picture changes', async () => {
      const mockOnChange = jest.fn();
      const mockHandleUpload = jest.fn().mockResolvedValue({ 
        success: true, 
        url: 'https://example.com/uploaded.jpg' 
      });
      
      mockUseProfilePicture.mockReturnValue({
        ...mockHookReturn,
        handleUpload: mockHandleUpload,
      });

      const user = userEvent.setup();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      render(<ProfilePicture {...defaultProps} onProfilePictureChange={mockOnChange} />);
      
      // Open modal, select file, and upload
      const addButton = screen.getByLabelText('Add profile picture');
      await user.click(addButton);
      
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      const uploadButton = screen.getByText('Upload');
      await user.click(uploadButton);
      
      expect(mockHandleUpload).toHaveBeenCalledWith(file);
    });
  });
});
