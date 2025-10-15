/**
 * @fileoverview File upload service for handling Cloudinary uploads
 * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx
 * 
 * SERVICE FUNCTIONALITY:
 * Centralized service for handling file uploads to Cloudinary with progress tracking,
 * error handling, and support for multiple file types (images, PDFs).
 * 
 * BUSINESS LOGIC EXTRACTED:
 * - File upload API calls with XMLHttpRequest for progress tracking
 * - FormData construction and metadata handling
 * - Upload progress monitoring
 * - Error handling and response parsing
 * - Support for multiple upload endpoints
 * 
 * @refactor Extracted from PhotoUploads component to separate business logic
 * from UI rendering, following clean architecture principles
 */

export interface FileUploadOptions {
  files: File[];
  uploadEndpoint: string;
  entityId?: string;
  entityType?: string;
  photoDescription?: string;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResult {
  urls: string[];
  success: boolean;
  error?: string;
}

export class FileUploadService {
  /**
   * Upload files to Cloudinary with progress tracking
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (lines 81-209)
   */
  static async uploadFiles(options: FileUploadOptions): Promise<FileUploadResult> {
    const { files, uploadEndpoint, entityId, entityType, photoDescription, onProgress } = options;

    if (!files.length) {
      return { urls: [], success: false, error: 'No files provided' };
    }

    if (!uploadEndpoint) {
      return { urls: [], success: false, error: 'Upload endpoint is required' };
    }

    try {
      // Create FormData for the API request
      const formData = new FormData();
      
      // Add files with a specific key that the server expects
      files.forEach(file => {
        formData.append('file', file);
      });
      
      // Add metadata if provided
      if (entityId) formData.append('entityId', entityId);
      if (entityType) formData.append('entityType', entityType);
      if (photoDescription) formData.append('photoDescription', photoDescription);
      
      // Log what we're sending for debugging
      console.log('Uploading files:', files.map(f => f.name));
      console.log('Photo description:', photoDescription);
      console.log('Upload endpoint:', uploadEndpoint);
      
      // Use XMLHttpRequest for progress tracking
      const uploadResult = await new Promise<{ urls: string[] }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', uploadEndpoint);
        
        // Progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded * 100) / event.total);
            onProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              // Handle case where response doesn't have urls array
              const urls = response.urls || [response.url || ''];
              resolve({ urls });
            } catch (e) {
              console.error('Error parsing response:', e);
              // If we can't parse the response but got a 200, assume success with empty urls
              resolve({ urls: [] });
            }
          } else {
            console.error('Upload failed with status:', xhr.status);
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              console.error('Error response:', errorResponse);
              reject(new Error(`Upload failed: ${errorResponse.message || xhr.statusText}`));
            } catch (e) {
              console.error('Response text:', xhr.responseText);
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
          }
        };
        
        xhr.onerror = () => {
          console.error('Network error during upload');
          reject(new Error('Network error'));
        };
        
        xhr.send(formData);
      });
      
      return {
        urls: uploadResult.urls || [],
        success: true
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        urls: [],
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Validate file types and sizes before upload
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (file validation logic)
   */
  static validateFiles(files: File[], maxFiles: number = 1, maxSizeBytes: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
    if (files.length === 0) {
      return { valid: false, error: 'No files selected' };
    }

    if (files.length > maxFiles) {
      return { valid: false, error: `Maximum ${maxFiles} file(s) allowed` };
    }

    for (const file of files) {
      if (file.size > maxSizeBytes) {
        return { valid: false, error: `File "${file.name}" is too large. Maximum size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB` };
      }

      // Check if file type is supported
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      
      if (!isImage && !isPdf) {
        return { valid: false, error: `File "${file.name}" is not a supported format. Please use JPG, PNG, or PDF files.` };
      }
    }

    return { valid: true };
  }

  /**
   * Create object URLs for file preview
   * @source boombox-10.0/src/app/components/reusablecomponents/photouploads.tsx (preview logic)
   */
  static createFilePreviewUrls(files: File[]): string[] {
    return files.map(file => URL.createObjectURL(file));
  }

  /**
   * Clean up object URLs to prevent memory leaks
   */
  static revokeFilePreviewUrls(urls: string[]): void {
    urls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }
}
