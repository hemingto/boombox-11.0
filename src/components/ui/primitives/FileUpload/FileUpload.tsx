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
  error
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const selectedFiles = files.slice(0, maxFiles);
      onFilesSelected(selectedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const selectedFiles = files.slice(0, maxFiles);
      onFilesSelected(selectedFiles);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleClick();
    }
  };

  const uploadAreaClasses = cn(
    // Base styles
    "w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
    "flex flex-col items-center justify-center p-6",
    aspectRatio,
    
    // Interactive states
    !disabled && "focus-visible",
    
    // Drag states
    isDragOver && !disabled && "border-primary bg-surface-secondary",
    !isDragOver && !disabled && "border-border hover:border-border-focus hover:bg-surface-secondary",
    
    // Error states
    error && "border-status-error bg-status-bg-error",
    
    // Disabled states
    disabled && "opacity-50 cursor-not-allowed border-border bg-surface-disabled",
    
    className
  );

  return (
    <div className="w-full">
      <label className="form-label" htmlFor="file-upload">
        {label}
      </label>
      
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Upload ${label}`}
        aria-disabled={disabled}
        className={uploadAreaClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyPress}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className={cn(
            "mb-2",
            error ? "text-status-error" : "text-text-secondary"
          )}>
            {icon}
          </div>
          
          <p className={cn(
            "text-sm mb-2",
            error ? "text-status-text-error" : "text-text-secondary"
          )}>
            Drag and drop your {maxFiles === 1 ? 'file' : 'files'} here, or click to browse
          </p>
          
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            disabled={disabled}
          >
            {buttonText}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        id="file-upload"
        type="file"
        accept={acceptedFileTypes}
        multiple={maxFiles > 1}
        onChange={handleFileSelect}
        className="sr-only"
        aria-hidden="true"
        disabled={disabled}
      />
      
      {error ? (
        <p className="form-error mt-2" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="form-helper mt-2">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default FileUpload;
