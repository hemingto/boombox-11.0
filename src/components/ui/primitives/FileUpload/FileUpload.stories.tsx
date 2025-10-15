/**
 * @fileoverview FileUpload component stories for Storybook
 * Generic file upload component with drag-and-drop support
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DocumentArrowDownIcon, PhotoIcon } from '@heroicons/react/24/outline';
import FileUpload from './FileUpload';

const meta = {
  title: 'Components/UI/Primitives/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible file upload component with drag-and-drop support. Designed for various file types including images, PDFs, and documents. Features proper accessibility, validation states, and design system integration.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label for the upload area',
    },
    buttonText: {
      control: 'text', 
      description: 'Text displayed on the upload button',
    },
    aspectRatio: {
      control: 'select',
      options: ['aspect-square', 'aspect-video', 'aspect-[4/3]', 'aspect-[3/2]'],
      description: 'Aspect ratio of the upload area',
    },
    maxFiles: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum number of files to accept',
    },
    acceptedFileTypes: {
      control: 'text',
      description: 'Accepted file types (MIME types)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the upload area is disabled',
    },
    helperText: {
      control: 'text',
      description: 'Helper text displayed below the upload area',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
  },
  args: {
    label: 'Upload Document',
    buttonText: 'Browse Files',
    aspectRatio: 'aspect-video',
    maxFiles: 1,
    acceptedFileTypes: 'image/*,.pdf,application/pdf',
    disabled: false,
    helperText: 'Accepted formats: JPG, PNG, PDF. Maximum file size: 10MB',
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    icon: <DocumentArrowDownIcon className="w-16 h-16 text-text-secondary" />,
    onFilesSelected: (files: File[]) => console.log('Files selected:', files),
  },
};

// Image upload variant
export const ImageUpload: Story = {
  args: {
    label: 'Upload Profile Picture',
    buttonText: 'Choose Image',
    icon: <PhotoIcon className="w-16 h-16 text-text-secondary" />,
    aspectRatio: 'aspect-square',
    acceptedFileTypes: 'image/*',
    helperText: 'Accepted formats: JPG, PNG. Maximum file size: 5MB',
    onFilesSelected: (files) => console.log('Images selected:', files),
  },
};

// Multiple files
export const MultipleFiles: Story = {
  args: {
    label: 'Upload Documents',
    buttonText: 'Choose Files',
    icon: <DocumentArrowDownIcon className="w-16 h-16 text-text-secondary" />,
    maxFiles: 5,
    helperText: 'Select up to 5 files. Accepted formats: JPG, PNG, PDF.',
    onFilesSelected: (files) => console.log('Multiple files selected:', files),
  },
};

// Error state
export const WithError: Story = {
  args: {
    label: 'Upload Document',
    buttonText: 'Try Again',
    icon: <DocumentArrowDownIcon className="w-16 h-16 text-status-error" />,
    error: 'File size too large. Please choose a file under 10MB.',
    onFilesSelected: (files: File[]) => console.log('Files selected:', files),
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: 'Upload Document',
    buttonText: 'Browse Files',
    icon: <DocumentArrowDownIcon className="w-16 h-16 text-text-secondary" />,
    disabled: true,
    helperText: 'File upload is currently disabled',
    onFilesSelected: (files: File[]) => console.log('Files selected:', files),
  },
};

// Compact version
export const Compact: Story = {
  args: {
    label: 'Upload Insurance',
    buttonText: 'Add File',
    icon: <DocumentArrowDownIcon className="w-12 h-12 text-text-secondary" />,
    aspectRatio: 'aspect-[3/2]',
    helperText: 'PDF or image files only',
    className: 'p-4',
    onFilesSelected: (files: File[]) => console.log('Files selected:', files),
  },
};
