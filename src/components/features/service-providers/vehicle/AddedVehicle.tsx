/**
 * @fileoverview Vehicle Display and Management Component
 * @source boombox-10.0/src/app/components/reusablecomponents/addedvehicle.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Cross-domain vehicle management component for both drivers and movers.
 * - Drivers: Limited to one vehicle (uses useVehicle hook)
 * - Movers: Can have multiple vehicles in their fleet (uses useVehicles hook)
 * Displays vehicle information, handles insurance uploads, vehicle removal,
 * and approval status management with photo display capabilities.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId}/vehicle → New: /api/drivers/[id]/vehicle/route.ts
 * - Old: /api/movers/${userId}/vehicle → New: /api/moving-partners/[id]/vehicle/route.ts
 * - New: /api/moving-partners/[id]/vehicles/route.ts (returns all vehicles for movers)
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
 * - Moved state management to useVehicle/useVehicles custom hooks
 * - Component now focuses purely on UI rendering and user interactions
 * 
 * @refactor Replaced hardcoded colors with semantic design tokens, applied utility classes,
 * enhanced accessibility with ARIA labels and keyboard navigation, used Modal primitive,
 * extracted business logic into service layer and custom hooks, added multi-vehicle support for movers
 */

'use client';

import { useState, useRef } from 'react';
import { EllipsisHorizontalIcon, TruckIcon } from "@heroicons/react/24/outline";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';
import Image from 'next/image';
import { Modal } from '@/components/ui/primitives/Modal';
import { FileUpload } from '@/components/ui/primitives/FileUpload';
import { Button } from '@/components/ui/primitives/Button';
import { Tooltip } from '@/components/ui/primitives/Tooltip';
import { useVehicle } from '@/hooks/useVehicle';
import { useVehicles } from '@/hooks/useVehicles';
import { Vehicle, UserType } from '@/lib/services/vehicleService';
import { useClickOutside } from '@/hooks/useClickOutside';

interface AddedVehicleProps {
  userId: string;
  userType: UserType;
  onRemove?: () => void;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onRemove: () => void;
  onUploadInsurance: () => void;
  isRemoving: boolean;
  showAccountDeactivationWarning?: boolean;
}

/**
 * Individual vehicle card component
 */
const VehicleCard: React.FC<VehicleCardProps> = ({ 
  vehicle, 
  onRemove, 
  onUploadInsurance,
  isRemoving,
  showAccountDeactivationWarning = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(optionsRef, () => setIsMenuOpen(false));

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRemoveClick = () => {
    setShowDeleteConfirmation(true);
    setIsMenuOpen(false);
  };

  const handleConfirmRemove = () => {
    onRemove();
    setShowDeleteConfirmation(false);
  };

  const handleUploadClick = () => {
    onUploadInsurance();
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="card p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            {vehicle.frontVehiclePhoto ? (
              <div className="relative w-36 h-36 rounded-md bg-surface-tertiary overflow-hidden">
                <Image 
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
              <p className="text-text-tertiary">{vehicle.licensePlate}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {vehicle.isApproved ? (
              <span className="badge badge-success" role="status" aria-label="Vehicle approved">
                Approved
              </span>
            ) : (
              <span className="badge badge-pending" role="status" aria-label="Vehicle pending approval">
                Pending Approval
              </span>
            )}
            
            <div className="relative" ref={optionsRef}>
              <button 
                onClick={toggleMenu}
                aria-label="Vehicle options"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                className="p-1 rounded-full hover:bg-surface-tertiary focus-visible"
              >
                <EllipsisHorizontalIcon className="w-8 h-8 text-text-primary" />
              </button>
              
              {isMenuOpen && (
                <div 
                  role="menu"
                  className="absolute w-48 right-0 top-10 bg-surface-primary border border-border rounded-md shadow-custom-shadow z-10"
                >
                  <button
                    role="menuitem"
                    onClick={handleRemoveClick}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary focus-visible focus:bg-surface-secondary rounded-t-md"
                  >
                    Remove
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleUploadClick}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary focus-visible focus:bg-surface-secondary rounded-b-md"
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
          <p className="text-text-primary">
            Are you sure you want to remove this {vehicle.year} {vehicle.make} {vehicle.model}?
          </p>
          
          {/* Warning about account deactivation for drivers with approved vehicles */}
          {showAccountDeactivationWarning && vehicle.isApproved && (
            <div className="bg-status-bg-warning border border-border-warning rounded-lg p-4">
              <p className="text-status-warning text-sm font-medium mb-2">
                This will deactivate your account
              </p>
              <p className="text-status-warning text-sm">
                Removing your vehicle will make your account inactive. You won&apos;t be able to receive job offers and your account won&apos;t be active until you add a new vehicle.
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove Vehicle'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/**
 * Driver vehicle view - single vehicle only
 */
const DriverVehicleView: React.FC<{ userId: string; onRemove?: () => void }> = ({ userId, onRemove }) => {
  const [showInsuranceUpload, setShowInsuranceUpload] = useState(false);
  const [selectedInsuranceFile, setSelectedInsuranceFile] = useState<File | null>(null);

  const {
    vehicle,
    isLoading,
    error,
    isRemoving,
    isUploading,
    removeVehicle,
    uploadInsurance,
  } = useVehicle(userId, 'driver', onRemove);

  const handleInsuranceFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedInsuranceFile(files[0]);
    }
  };

  const handleUploadInsurance = async () => {
    if (!selectedInsuranceFile) return;
    
    try {
      await uploadInsurance([selectedInsuranceFile]);
      setShowInsuranceUpload(false);
      setSelectedInsuranceFile(null);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleClearInsuranceFile = () => {
    setSelectedInsuranceFile(null);
  };

  const handleCloseInsuranceModal = () => {
    setShowInsuranceUpload(false);
    setSelectedInsuranceFile(null);
  };

  // Determine if the Add Vehicle button should be disabled
  // Drivers can only have one vehicle
  const isAddVehicleDisabled = vehicle !== null;

  if (isLoading) {
    return (
      <div className="account-page-container mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Your vehicle</h2>
          <Link href={`/service-provider/driver/${userId}/vehicle/add-vehicle`}>
            <Button variant="primary" className="hidden sm:block">
              Add Vehicle
            </Button>
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
      <div className="account-page-container mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Your vehicle</h2>
          <Link href={`/service-provider/driver/${userId}/vehicle/add-vehicle`}>
            <Button variant="primary" className="hidden sm:block">
              Add Vehicle
            </Button>
          </Link>
        </div>
        <div className="bg-status-bg-error border border-status-error rounded-lg p-4">
          <p className="text-status-error">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="account-page-container mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Your vehicle</h2>
          <Link href={`/service-provider/driver/${userId}/vehicle/add-vehicle`}>
            <Button variant="primary" className="hidden sm:block">
              Add Vehicle
            </Button>
          </Link>
        </div>
        <div className="bg-status-bg-warning border border-border-warning rounded-lg p-4">
          <p className="text-status-warning">
            There is currently no vehicle information in your driver profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page-container mb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
        <h2 className="text-2xl text-text-primary">Your vehicle</h2>
        {isAddVehicleDisabled ? (
          <Tooltip 
            text="Driver accounts are limited to one vehicle. Remove your current vehicle to add a different one."
            position="top"
          >
            <Button 
              variant="primary" 
              className="hidden sm:block" 
              disabled
              aria-disabled="true"
            >
              Add Vehicle
            </Button>
          </Tooltip>
        ) : (
          <Link href={`/service-provider/driver/${userId}/vehicle/add-vehicle`}>
            <Button variant="primary" className="hidden sm:block">
              Add Vehicle
            </Button>
          </Link>
        )}
      </div>
      
      <VehicleCard
        vehicle={vehicle}
        onRemove={removeVehicle}
        onUploadInsurance={() => setShowInsuranceUpload(true)}
        isRemoving={isRemoving}
        showAccountDeactivationWarning={true}
      />

      {/* Insurance Upload Modal */}
      <Modal
        open={showInsuranceUpload}
        onClose={handleCloseInsuranceModal}
        title="Upload Insurance Document"
        size="md"
      >
        <div className="space-y-8">
          <p className="text-text-primary">Please upload a new insurance document for your vehicle.</p>
          
          <div className="w-full">
            <FileUpload 
              onFilesSelected={handleInsuranceFileSelected} 
              label="Auto Insurance Document"
              buttonText="Choose Insurance File"
              icon={<DocumentArrowDownIcon className="w-16 h-16 text-text-secondary" />}
              aspectRatio="aspect-video"
              acceptedFileTypes="image/*,.pdf,application/pdf"
              helperText="Upload your insurance card or policy document (JPG, PNG, PDF)"
              selectedFiles={selectedInsuranceFile ? [selectedInsuranceFile] : []}
              onClearFile={handleClearInsuranceFile}
              showPreview={true}
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-12">
            <Button
              variant="ghost"
              onClick={handleCloseInsuranceModal}
              disabled={isUploading}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadInsurance}
              disabled={!selectedInsuranceFile || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/**
 * Mover vehicle view - multiple vehicles supported
 */
const MoverVehicleView: React.FC<{ userId: string; onRemove?: () => void }> = ({ userId, onRemove }) => {
  const [showInsuranceUpload, setShowInsuranceUpload] = useState(false);
  const [selectedInsuranceFile, setSelectedInsuranceFile] = useState<File | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const {
    vehicles,
    isLoading,
    error,
    isRemoving,
    isUploading,
    removingVehicleId,
    removeVehicle,
    uploadInsurance,
  } = useVehicles(userId, onRemove);

  const handleInsuranceFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedInsuranceFile(files[0]);
    }
  };

  const handleUploadInsurance = async () => {
    if (!selectedInsuranceFile || !selectedVehicleId) return;
    
    try {
      await uploadInsurance(selectedVehicleId, [selectedInsuranceFile]);
      setShowInsuranceUpload(false);
      setSelectedInsuranceFile(null);
      setSelectedVehicleId(null);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleClearInsuranceFile = () => {
    setSelectedInsuranceFile(null);
  };

  const handleCloseInsuranceModal = () => {
    setShowInsuranceUpload(false);
    setSelectedInsuranceFile(null);
    setSelectedVehicleId(null);
  };

  const openInsuranceModal = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    setShowInsuranceUpload(true);
  };

  if (isLoading) {
    return (
      <div className="account-page-container mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Your vehicles</h2>
          <Link href={`/service-provider/mover/${userId}/vehicle/add-vehicle`}>
            <Button variant="primary" className="hidden sm:block">
              Add Vehicle
            </Button>
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
      <div className="account-page-container mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Your vehicles</h2>
          <Link href={`/service-provider/mover/${userId}/vehicle/add-vehicle`}>
            <Button variant="primary" className="hidden sm:block">
              Add Vehicle
            </Button>
          </Link>
        </div>
        <div className="bg-status-bg-error border border-status-error rounded-lg p-4">
          <p className="text-status-error">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="account-page-container mb-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Your vehicles</h2>
          <Link href={`/service-provider/mover/${userId}/vehicle/add-vehicle`}>
            <Button variant="primary" className="hidden sm:block">
              Add Vehicle
            </Button>
          </Link>
        </div>
        <div className="bg-status-bg-warning border border-border-warning rounded-lg p-4">
          <p className="text-status-warning">
            There are currently no vehicles in your fleet. Add a vehicle to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page-container mb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
        <h2 className="text-2xl text-text-primary">Your vehicles</h2>
        <Link href={`/service-provider/mover/${userId}/vehicle/add-vehicle`}>
          <Button variant="primary" className="hidden sm:block">
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Vehicle count indicator */}
      <p className="text-text-secondary text-sm mb-4">
        {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in your fleet
      </p>
      
      {/* Vehicle list */}
      <div className="space-y-4">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onRemove={() => removeVehicle(vehicle.id)}
            onUploadInsurance={() => openInsuranceModal(vehicle.id)}
            isRemoving={isRemoving && removingVehicleId === vehicle.id}
            showAccountDeactivationWarning={false}
          />
        ))}
      </div>

      {/* Insurance Upload Modal */}
      <Modal
        open={showInsuranceUpload}
        onClose={handleCloseInsuranceModal}
        title="Upload Insurance Document"
        size="md"
      >
        <div className="space-y-8">
          <p className="text-text-primary">Please upload a new insurance document for this vehicle.</p>
          
          <div className="w-full">
            <FileUpload 
              onFilesSelected={handleInsuranceFileSelected} 
              label="Auto Insurance Document"
              buttonText="Choose Insurance File"
              icon={<DocumentArrowDownIcon className="w-16 h-16 text-text-secondary" />}
              aspectRatio="aspect-video"
              acceptedFileTypes="image/*,.pdf,application/pdf"
              helperText="Upload your insurance card or policy document (JPG, PNG, PDF)"
              selectedFiles={selectedInsuranceFile ? [selectedInsuranceFile] : []}
              onClearFile={handleClearInsuranceFile}
              showPreview={true}
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-12">
            <Button
              variant="ghost"
              onClick={handleCloseInsuranceModal}
              disabled={isUploading}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadInsurance}
              disabled={!selectedInsuranceFile || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/**
 * Main component - delegates to Driver or Mover view based on userType
 */
const AddedVehicle: React.FC<AddedVehicleProps> = ({ userId, userType, onRemove }) => {
  if (userType === 'driver') {
    return <DriverVehicleView userId={userId} onRemove={onRemove} />;
  }
  
  return <MoverVehicleView userId={userId} onRemove={onRemove} />;
};

export default AddedVehicle;
