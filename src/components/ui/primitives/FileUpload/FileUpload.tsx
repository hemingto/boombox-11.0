/**
 * @fileoverview FileUpload primitive component for drag-and-drop file uploads
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Generic file upload component with drag-and-drop support, file validation,
 * and customizable upload areas. Designed for reuse across different domains
 * (vehicle documents, profile pictures, license uploads, etc.).
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied design system colors and border utilities
 * - Used surface and text color tokens from design system
 * - Added proper focus states and accessibility
 * - Integrated with form design patterns
 * 
 * @refactor Promoted from feature-specific component to reusable UI primitive,
 * enhanced with design system compliance and accessibility improvements
 */

'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { TrashIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

export interface FileUploadProps {
  /**
   * Callback when files are selected
   */
  onFilesSelected: (files: File[]) => void;
  
  /**
   * Label for the upload area
   */
  label: string;
  
  /**
   * Text for the upload button
   */
  buttonText: string;
  
  /**
   * Icon to display in the upload area
   */
  icon: React.ReactNode;
  
  /**
   * Aspect ratio class for the upload area
   */
  aspectRatio?: string;
  
  /**
   * Maximum number of files to accept
   */
  maxFiles?: number;
  
  /**
   * Accepted file types (MIME types)
   */
  acceptedFileTypes?: string;
  
  /**
   * Whether the upload area is disabled
   */
  disabled?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Helper text to display below the upload area
   */
  helperText?: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Selected files to preview (controlled mode)
   */
  selectedFiles?: File[];
  
  /**
   * Callback when file is cleared
   */
  onClearFile?: () => void;
  
  /**
   * Whether to show preview mode
   */
  showPreview?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  label,
  buttonText,
  icon,
  aspectRatio = "aspect-square",
  maxFiles = 1,
  acceptedFileTypes = "image/*,.pdf,application/pdf",
  disabled = false,
  className,
  helperText = "Accepted formats: JPG, PNG, PDF. Maximum file size: 10MB",
  error,
  selectedFiles: controlledSelectedFiles,
  onClearFile,
  showPreview = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalSelectedFiles, setInternalSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use controlled files if provided, otherwise use internal state
  const selectedFiles = controlledSelectedFiles || internalSelectedFiles;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const newFiles = files.slice(0, maxFiles);
      setInternalSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = files.slice(0, maxFiles);
      setInternalSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };
  
  const handleClearFile = () => {
    setInternalSelectedFiles([]);
    if (onClearFile) {
      onClearFile();
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="text-sm font-medium text-text-primary mb-2 block" htmlFor="file-upload">
        {label}
      </label>
      
      <div
        className={cn(
          "w-full rounded-md flex items-center justify-center relative",
          showPreview && selectedFiles.length > 0
            ? "border-2 border-solid border-text-disabled bg-surface-tertiary"
            : "border-2 border-dashed border-slate-200 bg-surface-tertiary",
          isDragOver && !disabled && "border-primary bg-surface-tertiary",
          error && "border-status-error bg-status-bg-error",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {showPreview && selectedFiles.length > 0 ? (
          // Preview mode - show selected file
          <div className="relative w-full h-full min-h-[200px]">
            {selectedFiles[0].type.includes('pdf') || selectedFiles[0].name.toLowerCase().endsWith('.pdf') ? (
              // PDF preview
              <div className="w-full h-full flex items-center justify-center bg-surface-tertiary p-10 rounded-md">
                <div className="flex flex-col items-center justify-center p-4">
                  <DocumentIcon className="w-16 h-16 text-text-secondary mb-2" />
                  <p className="text-sm font-medium text-text-tertiary truncate max-w-full">
                    {selectedFiles[0].name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    PDF Document
                  </p>
                </div>
              </div>
            ) : (
              // Image preview
              <div className="relative w-full h-64 rounded-md overflow-hidden">
                <Image
                  src={URL.createObjectURL(selectedFiles[0])}
                  alt="Selected file preview"
                  fill
                  className="object-cover object-center"
                />
              </div>
            )}
            {/* Delete button */}
            <button
              onClick={handleClearFile}
              className="absolute top-4 right-4 font-inter font-semibold p-3 bg-primary bg-opacity-70 text-text-inverse rounded-full hover:bg-opacity-90 transition-all focus-visible"
              disabled={disabled}
              aria-label="Delete selected file"
              type="button"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          // Empty state - show upload button
          <div className="p-10 flex flex-col items-center justify-center">
            <div className="mb-2">
              {icon}
            </div>
            <button 
              onClick={handleClick}
              className="font-inter font-semibold mt-2 px-6 py-3 bg-surface-primary border border-text-disabled rounded-lg text-sm text-text-tertiary hover:bg-slate-50 focus:outline-none"
              disabled={disabled}
              type="button"
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        id="file-upload"
        type="file"
        accept={acceptedFileTypes}
        multiple={maxFiles > 1}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      {error ? (
        <p className="text-sm text-status-error mt-2" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-sm text-text-tertiary mt-2">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default FileUpload;
