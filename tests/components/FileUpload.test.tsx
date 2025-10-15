/**
 * @fileoverview Jest tests for FileUpload primitive component
 * @source Testing component from boombox-11.0/src/components/ui/primitives/FileUpload/FileUpload.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { FileUpload } from '@/components/ui/primitives/FileUpload';

describe('FileUpload Component', () => {
  const mockProps = {
    onFilesSelected: jest.fn(),
    label: 'Upload Document',
    buttonText: 'Browse Files',
    icon: <DocumentArrowDownIcon className="w-16 h-16" data-testid="upload-icon" />,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders upload area with correct props', () => {
      render(<FileUpload {...mockProps} />);

      expect(screen.getByText('Upload Document')).toBeInTheDocument();
      expect(screen.getByText('Browse Files')).toBeInTheDocument();
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
      expect(screen.getByText(/Drag and drop your file here/)).toBeInTheDocument();
    });

    it('applies correct aspect ratio class', () => {
      render(<FileUpload {...mockProps} aspectRatio="aspect-video" />);
      
      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      expect(uploadArea).toHaveClass('aspect-video');
    });

    it('uses default aspect ratio when not provided', () => {
      render(<FileUpload {...mockProps} />);
      
      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      expect(uploadArea).toHaveClass('aspect-square');
    });

    it('displays custom helper text', () => {
      render(<FileUpload {...mockProps} helperText="Custom helper text" />);
      
      expect(screen.getByText('Custom helper text')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(<FileUpload {...mockProps} error="File too large" />);
      
      expect(screen.getByText('File too large')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('handles file input change', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText('Upload Document');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      expect(mockProps.onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('limits files to maxFiles setting', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} maxFiles={2} />);

      const fileInput = screen.getByLabelText('Upload Document');
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      const file3 = new File(['test3'], 'test3.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, [file1, file2, file3]);

      expect(mockProps.onFilesSelected).toHaveBeenCalledWith([file1, file2]);
    });

    it('handles click on upload area', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      // Mock click on hidden file input
      const fileInput = screen.getByLabelText('Upload Document');
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation();

      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      await user.click(uploadArea);

      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('handles click on browse button', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      // Mock click on hidden file input
      const fileInput = screen.getByLabelText('Upload Document');
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation();

      const browseButton = screen.getByText('Browse Files');
      await user.click(browseButton);

      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over event', () => {
      render(<FileUpload {...mockProps} />);
      
      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      
      fireEvent.dragOver(uploadArea);
      
      expect(uploadArea).toHaveClass('border-primary', 'bg-surface-secondary');
    });

    it('handles drag leave event', () => {
      render(<FileUpload {...mockProps} />);
      
      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      
      fireEvent.dragOver(uploadArea);
      fireEvent.dragLeave(uploadArea);
      
      expect(uploadArea).not.toHaveClass('border-primary', 'bg-surface-secondary');
    });

    it('handles file drop', () => {
      render(<FileUpload {...mockProps} />);
      
      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file]
        }
      });

      expect(mockProps.onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('limits dropped files to maxFiles setting', () => {
      render(<FileUpload {...mockProps} maxFiles={1} />);
      
      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file1, file2]
        }
      });

      expect(mockProps.onFilesSelected).toHaveBeenCalledWith([file1]);
    });

    it('resets drag state after drop', () => {
      render(<FileUpload {...mockProps} />);
      
      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.dragOver(uploadArea);
      expect(uploadArea).toHaveClass('border-primary');
      
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file]
        }
      });
      
      expect(uploadArea).not.toHaveClass('border-primary', 'bg-surface-secondary');
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles Enter key press', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText('Upload Document');
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation();

      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      
      uploadArea.focus();
      await user.keyboard('{Enter}');

      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('handles Space key press', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText('Upload Document');
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation();

      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      
      uploadArea.focus();
      await user.keyboard(' ');

      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('does not trigger on other key presses', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} />);

      const fileInput = screen.getByLabelText('Upload Document');
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation();

      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      
      uploadArea.focus();
      await user.keyboard('{Escape}');
      await user.keyboard('{Tab}');

      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styling when disabled', () => {
      render(<FileUpload {...mockProps} disabled />);

      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      
      expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(uploadArea).toHaveAttribute('aria-disabled', 'true');
      expect(uploadArea).toHaveAttribute('tabIndex', '-1');
    });

    it('does not respond to interactions when disabled', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...mockProps} disabled />);

      const fileInput = screen.getByLabelText('Upload Document');
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation();

      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      await user.click(uploadArea);

      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('does not respond to drag events when disabled', () => {
      render(<FileUpload {...mockProps} disabled />);
      
      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      
      fireEvent.dragOver(uploadArea);
      
      expect(uploadArea).not.toHaveClass('border-primary', 'bg-surface-secondary');
    });
  });

  describe('Multiple Files', () => {
    it('shows plural text for multiple files', () => {
      render(<FileUpload {...mockProps} maxFiles={3} />);
      
      expect(screen.getByText(/Drag and drop your files here/)).toBeInTheDocument();
    });

    it('shows singular text for single file', () => {
      render(<FileUpload {...mockProps} maxFiles={1} />);
      
      expect(screen.getByText(/Drag and drop your file here/)).toBeInTheDocument();
    });

    it('sets multiple attribute on file input when maxFiles > 1', () => {
      render(<FileUpload {...mockProps} maxFiles={3} />);
      
      const fileInput = screen.getByLabelText('Upload Document');
      expect(fileInput).toHaveAttribute('multiple');
    });

    it('does not set multiple attribute when maxFiles = 1', () => {
      render(<FileUpload {...mockProps} maxFiles={1} />);
      
      const fileInput = screen.getByLabelText('Upload Document');
      expect(fileInput).not.toHaveAttribute('multiple');
    });
  });

  describe('Error State', () => {
    it('applies error styling when error is provided', () => {
      render(<FileUpload {...mockProps} error="Test error" />);

      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      
      expect(uploadArea).toHaveClass('border-status-error', 'bg-status-bg-error');
    });

    it('shows error text instead of helper text', () => {
      render(
        <FileUpload 
          {...mockProps} 
          error="Test error" 
          helperText="This should not show"
        />
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.queryByText('This should not show')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<FileUpload {...mockProps} />);

      const uploadArea = screen.getByRole('button', { name: 'Upload Upload Document' });
      const fileInput = screen.getByLabelText('Upload Document');
      
      expect(uploadArea).toHaveAttribute('tabIndex', '0');
      expect(uploadArea).toHaveAttribute('role', 'button');
      expect(uploadArea).toHaveAttribute('aria-label', 'Upload Upload Document');
      
      expect(fileInput).toHaveClass('sr-only');
      expect(fileInput).toHaveAttribute('aria-hidden', 'true');
    });

    it('has proper file input attributes', () => {
      render(<FileUpload {...mockProps} acceptedFileTypes="image/*" />);

      const fileInput = screen.getByLabelText('Upload Document');
      
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
      expect(fileInput).toHaveAttribute('id', 'file-upload');
    });

    it('has proper label association', () => {
      render(<FileUpload {...mockProps} />);

      const label = screen.getByText('Upload Document');
      const fileInput = screen.getByLabelText('Upload Document');
      
      expect(label).toHaveAttribute('for', 'file-upload');
      expect(fileInput).toHaveAttribute('id', 'file-upload');
    });
  });
});
