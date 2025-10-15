/**
 * @fileoverview Vehicle Display and Management Component
 * @source boombox-10.0/src/app/components/reusablecomponents/addedvehicle.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Cross-domain vehicle management component for both drivers and movers.
 * Displays vehicle information, handles insurance uploads, vehicle removal,
 * and approval status management with photo display capabilities.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId}/vehicle → New: /api/drivers/[id]/vehicle/route.ts
 * - Old: /api/movers/${userId}/vehicle → New: /api/moving-partners/[id]/vehicle/route.ts
 * - Old: /api/drivers/${userId}/remove-vehicle → New: /api/drivers/[id]/remove-vehicle/route.ts
 * - Old: /api/movers/${userId}/remove-vehicle → New: /api/moving-partners/[id]/remove-vehicle/route.ts
 * - Old: /api/drivers/${userId}/upload-new-insurance → New: /api/drivers/[id]/upload-new-insurance/route.ts
 * - Old: /api/movers/${userId}/upload-new-insurance → New: /api/moving-partners/[id]/upload-new-insurance/route.ts
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom colors with design system tokens (bg-primary, status-success, etc.)
 * - Applied .btn-primary and .badge-success/.badge-pending utility classes
 * - Used .card design system pattern for consistent styling
 * - Applied proper focus states with design system focus utilities
 * 
 * BUSINESS LOGIC SEPARATION:
 * - Extracted API calls to VehicleService
 * - Moved state management to useVehicle custom hook
 * - Component now focuses purely on UI rendering and user interactions
 * 
 * @refactor Replaced hardcoded colors with semantic design tokens, applied utility classes,
 * enhanced accessibility with ARIA labels and keyboard navigation, used Modal primitive,
 * extracted business logic into service layer and custom hooks
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { EllipsisHorizontalIcon, TruckIcon } from "@heroicons/react/24/outline";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';
import { Modal } from '@/components/ui/primitives/Modal';
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage';
import { FileUpload } from '@/components/ui/primitives/FileUpload';
import { useVehicle } from '@/hooks/useVehicle';
import { UserType } from '@/lib/services/vehicleService';
import { useClickOutside } from '@/hooks/useClickOutside';

interface AddedVehicleProps {
  userId: string;
  userType: UserType;
  onRemove?: () => void;
}

const AddedVehicle: React.FC<AddedVehicleProps> = ({ userId, userType, onRemove }) => {
  // UI state management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showInsuranceUpload, setShowInsuranceUpload] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  // Vehicle business logic via custom hook
  const {
    vehicle,
    isLoading,
    error,
    isRemoving,
    isUploading,
    removeVehicle,
    uploadInsurance,
    clearError,
  } = useVehicle(userId, userType, onRemove);

  // Event handlers
  const handleRemoveVehicle = async () => {
    if (!vehicle) return;
    
    try {
      await removeVehicle();
      setIsMenuOpen(false);
      setShowDeleteConfirmation(false);
    } catch (err) {
      // Error is handled by the hook
      setIsMenuOpen(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleInsuranceFilesSelected = async (files: File[]) => {
    try {
      await uploadInsurance(files);
      setShowInsuranceUpload(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  useClickOutside(optionsRef, () => setIsMenuOpen(false));

  if (isLoading) {
    return (
      <div className="page-container mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Your vehicles</h2>
          <Link href={`/${userType}-account-page/${userId}/vehicle/add-vehicle`}>
            <button className="btn-primary hidden sm:block">
              Add Vehicle
            </button>
          </Link>
        </div>
        <div className="card p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="skeleton w-36 h-36 rounded-md"></div>
            <div className="flex-1">
              <div className="skeleton-title w-1/3 mb-2"></div>
              <div className="skeleton-text w-1/4 mb-2"></div>
              <div className="skeleton-text w-1/5"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Your vehicles</h2>
          <Link href={`/${userType}-account-page/${userId}/vehicle/add-vehicle`}>
            <button className="btn-primary hidden sm:block">
              Add Vehicle
            </button>
          </Link>
        </div>
        <div className="bg-status-bg-error border border-status-error rounded-lg p-4">
          <p className="text-status-text-error">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="page-container mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Your vehicles</h2>
          <Link href={`/${userType}-account-page/${userId}/vehicle/add-vehicle`}>
            <button className="btn-primary hidden sm:block">
              Add Vehicle
            </button>
          </Link>
        </div>
        <div className="bg-status-bg-warning border border-status-warning rounded-lg p-4">
          <p className="text-status-text-warning">
            There is currently no vehicle information in your {userType} profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container mb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
        <h2 className="text-2xl text-text-primary">Your vehicles</h2>
        <Link href={`/${userType}-account-page/${userId}/vehicle/add-vehicle`}>
          <button className="btn-primary hidden sm:block">
            Add Vehicle
          </button>
        </Link>
      </div>
      
      <div className="card p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            {vehicle.frontVehiclePhoto ? (
              <div className="relative w-36 h-36 rounded-md bg-surface-tertiary overflow-hidden">
                <OptimizedImage 
                  src={vehicle.frontVehiclePhoto} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-surface-tertiary rounded-md flex items-center justify-center">
                <TruckIcon className="w-12 h-12 text-text-secondary" aria-hidden="true" />
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-lg text-text-primary">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-text-secondary">{vehicle.licensePlate}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {vehicle.isApproved ? (
              <span className="badge-success" role="status" aria-label="Vehicle approved">
                Approved
              </span>
            ) : (
              <span className="badge-pending" role="status" aria-label="Vehicle pending approval">
                Pending Approval
              </span>
            )}
            
            <div className="relative">
              <button 
                onClick={toggleMenu}
                aria-label="Vehicle options"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                className="p-1 rounded-md hover:bg-surface-tertiary focus-visible"
              >
                <EllipsisHorizontalIcon className="w-8 h-8 text-text-primary" />
              </button>
              
              {isMenuOpen && (
                <div 
                  ref={optionsRef}
                  role="menu"
                  className="absolute w-48 right-0 top-7 bg-surface-primary border border-border rounded-md shadow-custom-shadow z-10"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowDeleteConfirmation(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary rounded-md focus-visible"
                  >
                    Remove
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowInsuranceUpload(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary rounded-md focus-visible"
                  >
                    Upload New Insurance
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        title="Remove Vehicle"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-text-primary">Are you sure you want to remove this vehicle?</p>
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-2 text-sm text-text-primary underline-offset-4 underline hover:text-text-secondary focus-visible"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              Cancel
            </button>
            <button
              className="btn-destructive"
              onClick={handleRemoveVehicle}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove Vehicle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Insurance Upload Modal */}
      <Modal
        open={showInsuranceUpload}
        onClose={() => setShowInsuranceUpload(false)}
        title="Upload Insurance Document"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-text-primary">Please upload a new insurance document for your vehicle.</p>
          
          <div className="w-full">
            <FileUpload 
              onFilesSelected={handleInsuranceFilesSelected} 
              label="Auto Insurance Document"
              buttonText="Choose Insurance File"
              icon={<DocumentArrowDownIcon className="w-16 h-16 text-text-secondary" />}
              aspectRatio="aspect-video"
              acceptedFileTypes="image/*,.pdf,application/pdf"
              helperText="Upload your insurance card or policy document (JPG, PNG, PDF)"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              className="btn-secondary"
              onClick={() => setShowInsuranceUpload(false)}
              disabled={isUploading}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddedVehicle;
