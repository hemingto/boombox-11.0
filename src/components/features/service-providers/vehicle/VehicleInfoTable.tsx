/**
 * @fileoverview Vehicle information management table for service providers
 * @source boombox-10.0/src/app/components/mover-account/vehicleinfotable.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays comprehensive vehicle information for drivers/movers
 * - Inline editing for all vehicle fields (type, make, model, year, license plate, insurance date)
 * - Field validation with specific rules for each field type
 * - Insurance photo upload with file handling
 * - Approval status display with badge styling
 * - Empty state with add vehicle prompt
 * - Loading skeleton state
 * - Error handling and display
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${driverId}/vehicle → New: /api/drivers/${driverId}/vehicle (unchanged)
 * - Old: /api/upload/insurance → New: /api/drivers/${driverId}/upload-new-insurance
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced all hardcoded colors with semantic design tokens
 * - Applied form-group, form-label, input-field classes
 * - Used btn-primary for buttons and semantic badge colors
 * - Applied status colors for approval badges
 * - Used skeleton component classes for loading states
 * - Improved error message styling with semantic colors
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added proper ARIA labels for all interactive elements
 * - Added role="alert" for error messages
 * - Added aria-invalid for error states
 * - Improved focus management and keyboard navigation
 * - Added descriptive labels and helper text
 * 
 * @refactor
 * - Applied comprehensive design system integration
 * - Enhanced accessibility with WCAG 2.1 AA compliance
 * - Used centralized date formatting utilities
 * - Improved validation and error handling
 * - Added proper TypeScript interfaces
 */

'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { formatDateForDisplay, formatDateForInput } from '@/lib/utils/dateUtils';
import Link from 'next/link';
import { PlusCircleIcon } from "@heroicons/react/24/outline";

interface Vehicle {
  id: number;
  driverId: number;
  type: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  isApproved: boolean;
  autoInsurancePhoto: string | null;
  insuranceExpiryDate: Date | null;
}

interface VehicleInfoTableProps {
  /** Driver ID for fetching vehicle information */
  driverId: string;
}

/**
 * Vehicle information management table component
 * 
 * Displays and allows editing of vehicle information for service providers.
 * Includes inline editing, file upload, validation, and approval status.
 * 
 * @example
 * ```tsx
 * <VehicleInfoTable driverId="driver-123" />
 * ```
 */
export function VehicleInfoTable({ driverId }: VehicleInfoTableProps) {
  const [vehicleInfo, setVehicleInfo] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editField, setEditField] = useState<keyof Vehicle | null>(null);
  const [editedInfo, setEditedInfo] = useState<Partial<Vehicle>>({});
  const [localHasError, setLocalHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [noVehicleFound, setNoVehicleFound] = useState(false);

  useEffect(() => {
    const fetchVehicleInfo = async () => {
      try {
        const response = await fetch(`/api/drivers/${driverId}/vehicle`);
        
        if (response.status === 404) {
          setNoVehicleFound(true);
          setVehicleInfo(null);
        } else if (!response.ok) {
          throw new Error('Failed to fetch vehicle info');
        } else {
          const data = await response.json();
          
          // Convert insuranceExpiryDate string to Date object if it exists
          if (data.insuranceExpiryDate) {
            data.insuranceExpiryDate = new Date(data.insuranceExpiryDate);
          }
          
          setVehicleInfo(data);
          setNoVehicleFound(false);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicleInfo();
  }, [driverId]);

  const handleEdit = (field: keyof Vehicle) => {
    setEditField(field);
    setEditedInfo({ [field]: vehicleInfo?.[field] });
    setErrorMessage(null);
    setLocalHasError(false);
  };

  const handleSave = async () => {
    if (!editField) {
      setErrorMessage('No field selected for editing.');
      setLocalHasError(true);
      return;
    }

    // Validation logic based on the field being edited
    switch (editField) {
      case 'licensePlate':
        if (!editedInfo.licensePlate?.trim()) {
          setErrorMessage('License plate cannot be empty.');
          setLocalHasError(true);
          return;
        }
        break;
      case 'year':
        const yearRegex = /^\d{4}$/;
        if (!yearRegex.test(editedInfo.year || '')) {
          setErrorMessage('Year must be a 4-digit number.');
          setLocalHasError(true);
          return;
        }
        break;
      case 'insuranceExpiryDate':
        if (!editedInfo.insuranceExpiryDate) {
          setErrorMessage('Insurance expiry date is required.');
          setLocalHasError(true);
          return;
        }
        break;
      default:
        if (typeof editedInfo[editField] === 'string' && !(editedInfo[editField] as string).trim()) {
          setErrorMessage(`${editField} cannot be empty.`);
          setLocalHasError(true);
          return;
        }
        break;
    }

    try {
      const response = await fetch(`/api/drivers/${driverId}/vehicle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editField]: editedInfo[editField] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update vehicle info');
      }
      
      const updatedData = await response.json();
      
      // Convert insuranceExpiryDate string to Date object if it exists
      if (updatedData.insuranceExpiryDate) {
        updatedData.insuranceExpiryDate = new Date(updatedData.insuranceExpiryDate);
      }
      
      setVehicleInfo(prev => prev ? { ...prev, ...updatedData } : prev);
      setEditField(null);
      setLocalHasError(false);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message);
      setLocalHasError(true);
    }
  };

  const handleCancel = () => {
    setEditedInfo({});
    setEditField(null);
    setLocalHasError(false);
    setErrorMessage(null);
  };

  const handleFocus = () => {
    setLocalHasError(false);
  };

  const handleChange = (field: keyof Vehicle, value: any) => {
    setEditedInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('driverId', driverId);
      
      // Updated API endpoint
      const response = await fetch(`/api/drivers/${driverId}/upload-new-insurance`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload insurance photo');
      }
      
      const data = await response.json();
      setVehicleInfo(prev => prev ? { ...prev, autoInsurancePhoto: data.url } : prev);
    } catch (err: any) {
      setErrorMessage(err.message);
      setLocalHasError(true);
    } finally {
      setIsUploading(false);
    }
  };

  const isEditable = (field: keyof Vehicle) => {
    return editField === field;
  };
  
  const isGrayedOut = (field: keyof Vehicle) => {
    // Gray out other fields if another field is being edited
    return editField !== null && editField !== field;
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto">
        <div className="card p-6 animate-pulse">
          {/* Vehicle Type Section Skeleton */}
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="w-full">
              <div className="skeleton-text mb-3 w-24"></div>
              <div className="skeleton-title w-32"></div>
            </div>
            <div className="skeleton-text w-8"></div>
          </div>

          {/* Make/Model Section Skeleton */}
          <div className="flex items-start justify-between border-b border-border py-4">
            <div className="w-full">
              <div className="skeleton-text mb-3 w-20"></div>
              <div className="skeleton-title w-48"></div>
            </div>
            <div className="skeleton-text w-8"></div>
          </div>

          {/* Year Section Skeleton */}
          <div className="flex items-start justify-between border-b border-border py-4">
            <div className="w-full">
              <div className="skeleton-text mb-3 w-12"></div>
              <div className="skeleton-title w-16"></div>
            </div>
            <div className="skeleton-text w-8"></div>
          </div>

          {/* License Plate Section Skeleton */}
          <div className="flex items-start justify-between border-b border-border py-4">
            <div className="w-full">
              <div className="skeleton-text mb-3 w-28"></div>
              <div className="skeleton-title w-24"></div>
            </div>
            <div className="skeleton-text w-8"></div>
          </div>

          {/* Insurance Section Skeleton */}
          <div className="flex items-start justify-between py-4">
            <div className="w-full">
              <div className="skeleton-text mb-3 w-32"></div>
              <div className="skeleton-title mb-3 w-40"></div>
              <div className="h-10 w-48 bg-surface-tertiary rounded"></div>
            </div>
            <div className="skeleton-text w-8"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Empty State - No Vehicle Found
  if (noVehicleFound) {
    return (
      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto">
        <div className="card p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-status-bg-warning border border-status-warning p-4 rounded-md mb-4 w-full max-w-md text-center">
              <p className="font-medium text-status-warning">
                To activate your driver account please add a{' '}
                <Link 
                  href="/vehicle-requirements" 
                  className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  qualifying vehicle
                </Link>
                {' '}to your profile
              </p>
            </div>
            <a 
              href={`/driver-account-page/${driverId}/vehicle/add-vehicle`}
              className="btn-primary flex items-center mt-4"
              aria-label="Add a vehicle to your profile"
            >
              <PlusCircleIcon className="w-6 h-6 mr-2" aria-hidden="true" />
              Add Vehicle
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Error State
  if (error) {
    return (
      <div className="max-w-5xl lg:px-16 px-6 mx-auto">
        <div 
          className="p-4 bg-status-bg-error border border-border-error rounded-md max-w-fit"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-status-error font-medium">{error}</p>
        </div>
      </div>
    );
  }
  
  // Main Vehicle Information Display
  return (
    <div className="flex flex-col max-w-5xl w-full mx-auto mb-12">
      <div className="card p-6">
        {/* Vehicle Type Field */}
        <div className="flex items-start justify-between border-b border-border">
          <div className="w-full pb-4">
            <label 
              htmlFor="vehicle-type"
              className={`form-label ${isGrayedOut('type') ? 'opacity-50' : ''}`}
            >
              Vehicle Type
            </label>
            {isEditable('type') ? (
              <>
                <div className="mt-2 max-w-sm">
                  <select
                    id="vehicle-type"
                    value={editedInfo.type || ''}
                    onChange={(e) => handleChange('type', e.target.value)}
                    onFocus={handleFocus}
                    className={`input-field w-full sm:mb-4 mb-2 ${localHasError && editField === 'type' ? 'input-field--error' : ''}`}
                    aria-invalid={localHasError && editField === 'type'}
                    aria-describedby={localHasError && editField === 'type' ? 'type-error' : undefined}
                  >
                    <option value="">Select a vehicle type</option>
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                {localHasError && editField === 'type' && (
                  <p id="type-error" className="form-error sm:-mt-2 mb-3" role="alert">{errorMessage}</p>
                )}
                <div className="flex space-x-4">
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                    type="button"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <p className={`mt-2 text-sm text-text-secondary ${isGrayedOut('type') ? 'opacity-50' : ''}`}>
                {vehicleInfo?.type || 'Not specified'}
              </p>
            )}
          </div>
          {isEditable('type') ? (
            <button 
              onClick={handleCancel} 
              className="decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm text-text-secondary hover:text-text-primary"
              type="button"
              aria-label="Cancel editing vehicle type"
            >
              Cancel
            </button>
          ) : (
            <button 
              onClick={() => handleEdit('type')} 
              className={`decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm text-text-secondary hover:text-text-primary ${isGrayedOut('type') ? 'opacity-50' : ''}`}
              type="button"
              aria-label="Edit vehicle type"
              disabled={isGrayedOut('type')}
            >
              Edit
            </button>
          )}
        </div>

        {/* Make Field */}
        <VehicleField
          label="Make"
          fieldName="make"
          value={vehicleInfo?.make || 'Not specified'}
          editedValue={editedInfo.make || ''}
          isEditable={isEditable('make')}
          isGrayedOut={isGrayedOut('make')}
          localHasError={localHasError && editField === 'make'}
          errorMessage={errorMessage}
          onEdit={() => handleEdit('make')}
          onChange={(value) => handleChange('make', value)}
          onSave={handleSave}
          onCancel={handleCancel}
          onFocus={handleFocus}
          placeholder="Enter vehicle make"
          inputType="text"
        />

        {/* Model Field */}
        <VehicleField
          label="Model"
          fieldName="model"
          value={vehicleInfo?.model || 'Not specified'}
          editedValue={editedInfo.model || ''}
          isEditable={isEditable('model')}
          isGrayedOut={isGrayedOut('model')}
          localHasError={localHasError && editField === 'model'}
          errorMessage={errorMessage}
          onEdit={() => handleEdit('model')}
          onChange={(value) => handleChange('model', value)}
          onSave={handleSave}
          onCancel={handleCancel}
          onFocus={handleFocus}
          placeholder="Enter vehicle model"
          inputType="text"
        />

        {/* Year Field */}
        <VehicleField
          label="Year"
          fieldName="year"
          value={vehicleInfo?.year || 'Not specified'}
          editedValue={editedInfo.year || ''}
          isEditable={isEditable('year')}
          isGrayedOut={isGrayedOut('year')}
          localHasError={localHasError && editField === 'year'}
          errorMessage={errorMessage}
          onEdit={() => handleEdit('year')}
          onChange={(value) => handleChange('year', value)}
          onSave={handleSave}
          onCancel={handleCancel}
          onFocus={handleFocus}
          placeholder="Enter vehicle year (e.g., 2020)"
          inputType="text"
          maxWidth="max-w-xs"
        />

        {/* License Plate Field */}
        <VehicleField
          label="License Plate"
          fieldName="licensePlate"
          value={vehicleInfo?.licensePlate || 'Not specified'}
          editedValue={editedInfo.licensePlate || ''}
          isEditable={isEditable('licensePlate')}
          isGrayedOut={isGrayedOut('licensePlate')}
          localHasError={localHasError && editField === 'licensePlate'}
          errorMessage={errorMessage}
          onEdit={() => handleEdit('licensePlate')}
          onChange={(value) => handleChange('licensePlate', value)}
          onSave={handleSave}
          onCancel={handleCancel}
          onFocus={handleFocus}
          placeholder="Enter license plate number"
          inputType="text"
          maxWidth="max-w-xs"
        />

        {/* Insurance Expiry Date Field */}
        <div className={`flex items-start justify-between border-b border-border ${isGrayedOut('insuranceExpiryDate') ? 'opacity-50' : ''}`}>
          <div className="flex flex-col w-full pt-4 pb-4">
            <label 
              htmlFor="insurance-expiry"
              className="form-label"
            >
              Insurance Expiry Date
            </label>
            {isEditable('insuranceExpiryDate') ? (
              <div>
                <input
                  id="insurance-expiry"
                  type="date"
                  value={editedInfo.insuranceExpiryDate ? formatDateForInput(new Date(editedInfo.insuranceExpiryDate)) : ''}
                  onFocus={handleFocus}
                  onChange={(e) => handleChange('insuranceExpiryDate', new Date(e.target.value))}
                  className={`input-field mt-2 max-w-xs w-full sm:mb-4 mb-2 ${localHasError && editField === 'insuranceExpiryDate' ? 'input-field--error' : ''}`}
                  aria-invalid={localHasError && editField === 'insuranceExpiryDate'}
                  aria-describedby={localHasError && editField === 'insuranceExpiryDate' ? 'insurance-error' : undefined}
                />
                {localHasError && editField === 'insuranceExpiryDate' && (
                  <p id="insurance-error" className="form-error sm:-mt-2 mb-3" role="alert">{errorMessage}</p>
                )}
                <div className="flex space-x-4">
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                    type="button"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-text-secondary">
                {vehicleInfo?.insuranceExpiryDate ? formatDateForDisplay(vehicleInfo.insuranceExpiryDate) : 'Not specified'}
              </p>
            )}
          </div>
          {isEditable('insuranceExpiryDate') ? (
            <button 
              onClick={handleCancel} 
              className="decoration-dotted hover:decoration-solid underline underline-offset-2 pt-4 text-sm text-text-secondary hover:text-text-primary"
              type="button"
              aria-label="Cancel editing insurance expiry date"
            >
              Cancel
            </button>
          ) : (
            <button 
              onClick={() => handleEdit('insuranceExpiryDate')} 
              className="mt-4 decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm text-text-secondary hover:text-text-primary"
              type="button"
              aria-label="Edit insurance expiry date"
              disabled={isGrayedOut('insuranceExpiryDate')}
            >
              Edit
            </button>
          )}
        </div>

        {/* Auto Insurance Photo Field */}
        <div className={`flex items-start justify-between ${isGrayedOut('autoInsurancePhoto') ? 'opacity-50' : ''}`}>
          <div className="flex flex-col w-full pt-4 pb-4">
            <label 
              htmlFor="insurance-photo"
              className="form-label"
            >
              Auto Insurance Photo
            </label>
            <div className="mt-2">
              {vehicleInfo?.autoInsurancePhoto ? (
                <div className="flex flex-col gap-2">
                  <a 
                    href={vehicleInfo.autoInsurancePhoto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    View current insurance photo
                  </a>
                  <div className="flex items-center gap-2">
                    <label 
                      htmlFor="insurance-photo"
                      className="cursor-pointer px-4 py-2 bg-surface-tertiary hover:bg-surface-disabled rounded-md text-sm font-medium text-text-primary transition-colors"
                    >
                      Upload new photo
                      <input 
                        id="insurance-photo"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        aria-label="Upload new insurance photo"
                      />
                    </label>
                    {isUploading && (
                      <span className="text-sm text-text-secondary" aria-live="polite">
                        Uploading...
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor="insurance-photo"
                    className="cursor-pointer px-4 py-2 bg-surface-tertiary hover:bg-surface-disabled rounded-md text-sm font-medium text-text-primary transition-colors"
                  >
                    Upload insurance photo
                    <input 
                      id="insurance-photo"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      aria-label="Upload insurance photo"
                    />
                  </label>
                  {isUploading && (
                    <span className="text-sm text-text-secondary" aria-live="polite">
                      Uploading...
                    </span>
                  )}
                </div>
              )}
              {localHasError && editField === 'autoInsurancePhoto' && (
                <p className="form-error mt-2" role="alert">{errorMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Approval Status */}
        <div className="flex items-start justify-between pt-4">
          <div className="flex flex-col w-full">
            <label className="form-label">Approval Status</label>
            <div className="mt-2">
              {vehicleInfo?.isApproved ? (
                <span className="badge-success" role="status" aria-label="Vehicle approved">
                  Approved
                </span>
              ) : (
                <span className="badge-warning" role="status" aria-label="Vehicle pending approval">
                  Pending Approval
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable vehicle field component for inline editing
 */
interface VehicleFieldProps {
  label: string;
  fieldName: string;
  value: string;
  editedValue: string;
  isEditable: boolean;
  isGrayedOut: boolean;
  localHasError: boolean;
  errorMessage: string | null;
  onEdit: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onFocus: () => void;
  placeholder: string;
  inputType: string;
  maxWidth?: string;
}

function VehicleField({
  label,
  fieldName,
  value,
  editedValue,
  isEditable,
  isGrayedOut,
  localHasError,
  errorMessage,
  onEdit,
  onChange,
  onSave,
  onCancel,
  onFocus,
  placeholder,
  inputType,
  maxWidth = 'max-w-sm'
}: VehicleFieldProps) {
  const fieldId = `vehicle-${fieldName}`;
  const errorId = `${fieldName}-error`;

  return (
    <div className={`flex items-start justify-between border-b border-border ${isGrayedOut ? 'opacity-50' : ''}`}>
      <div className="flex flex-col w-full pt-4 pb-4">
        <label htmlFor={fieldId} className="form-label">
          {label}
        </label>
        {isEditable ? (
          <div>
            <input
              id={fieldId}
              type={inputType}
              value={editedValue}
              onFocus={onFocus}
              onChange={(e) => onChange(e.target.value)}
              className={`input-field mt-2 ${maxWidth} w-full sm:mb-4 mb-2 ${localHasError ? 'input-field--error' : ''}`}
              placeholder={placeholder}
              aria-invalid={localHasError}
              aria-describedby={localHasError ? errorId : undefined}
            />
            {localHasError && (
              <p id={errorId} className="form-error sm:-mt-2 mb-3" role="alert">{errorMessage}</p>
            )}
            <div className="flex space-x-4">
              <button
                onClick={onSave}
                className="btn-primary"
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-secondary">{value}</p>
        )}
      </div>
      {isEditable ? (
        <button 
          onClick={onCancel} 
          className="decoration-dotted hover:decoration-solid underline underline-offset-2 pt-4 text-sm text-text-secondary hover:text-text-primary"
          type="button"
          aria-label={`Cancel editing ${label.toLowerCase()}`}
        >
          Cancel
        </button>
      ) : (
        <button 
          onClick={onEdit} 
          className="mt-4 decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm text-text-secondary hover:text-text-primary"
          type="button"
          aria-label={`Edit ${label.toLowerCase()}`}
          disabled={isGrayedOut}
        >
          Edit
        </button>
      )}
    </div>
  );
}

export default VehicleInfoTable;

