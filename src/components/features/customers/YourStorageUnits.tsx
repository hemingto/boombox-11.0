/**
 * @fileoverview YourStorageUnits component - Displays active storage units for a customer
 * @source boombox-10.0/src/app/components/user-page/yourstorageunits.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LockOpenIcon } from '@heroicons/react/20/solid';
import { 
  getActiveStorageUnits, 
  StorageUnitUsageDisplay 
} from '@/lib/utils/customerUtils';
import { 
  StorageUnitsCard, 
  StorageUnitPopup 
} from '@/components/features/customers';
import { 
  SkeletonCard, 
  SkeletonTitle 
} from '@/components/ui/primitives/Skeleton';

export interface YourStorageUnitsProps {
  userId: string;
}

/**
 * YourStorageUnits - Container component for displaying user's active storage units
 * 
 * Features:
 * - Fetches and displays active storage units from the database
 * - Sorts units by storage unit number
 * - Allows description editing and photo uploads
 * - Opens popup for detailed view with image carousel
 * - Provides "Access Storage" CTA button
 * - Uses skeleton primitives for loading state
 */
export const YourStorageUnits: React.FC<YourStorageUnitsProps> = ({ userId }) => {
  const [activeStorageUnits, setActiveStorageUnits] = useState<StorageUnitUsageDisplay[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedStorageUnit, setSelectedStorageUnit] = useState<StorageUnitUsageDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch storage units when component mounts
  useEffect(() => {
    const fetchStorageUnits = async () => {
      try {
        const units = await getActiveStorageUnits(userId);
        
        // Sort by storageUnitNumber
        const sorted = [...units].sort((a, b) => {
          const numA = parseInt(a.storageUnit.storageUnitNumber);
          const numB = parseInt(b.storageUnit.storageUnitNumber);
          
          if (isNaN(numA) || isNaN(numB)) {
            return a.storageUnit.storageUnitNumber.localeCompare(b.storageUnit.storageUnitNumber);
          }
          
          return numA - numB;
        });
        
        setActiveStorageUnits(sorted);
      } catch (error) {
        console.error('Error fetching storage units:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStorageUnits();
  }, [userId]);

  const handleDescriptionChange = async (id: number, newDescription: string) => {
    // Optimistically update local state
    setActiveStorageUnits((prev) =>
      prev.map((unit) =>
        unit.id === id ? { ...unit, description: newDescription } : unit
      )
    );

    try {
      const response = await fetch(`/api/admin/storage-units/${id}/update-description`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: newDescription }),
      });

      if (!response.ok) {
        throw new Error('Failed to update description');
      }

      console.log('Description updated successfully');
    } catch (error) {
      console.error('Error updating description:', error);
      // Revert local state on error
      const units = await getActiveStorageUnits(userId);
      setActiveStorageUnits(units);
    }
  };

  const handleImageClick = (storageUnit: StorageUnitUsageDisplay) => {
    setSelectedStorageUnit(storageUnit); // Set the clicked storage unit data
    setShowPopup(true); // Show the popup
  };

  const handleClosePopup = () => {
    setShowPopup(false); // Close the popup
    setSelectedStorageUnit(null); // Reset the selected storage unit
  };

  const handlePhotosUploaded = async (storageUnitUsageId: number, newPhotoUrls: string[]) => {
    // Update the local state to include the new photos
    setActiveStorageUnits((prev) =>
      prev.map((unit) =>
        unit.id === storageUnitUsageId 
          ? { ...unit, uploadedImages: [...unit.uploadedImages, ...newPhotoUrls] }
          : unit
      )
    );
  };

  const formatLocation = (location: string | null): string => {
    if (!location) return 'Location not available';

    const match = location.match(/^(.*?), [A-Z]{2} \d{5}/);
    return match ? match[1] : location;
  };

  // Loading state with skeleton primitives
  if (isLoading) {
    return (
      <div className="mb-24">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center lg:px-16 px-6 max-w-5xl mx-auto mb-8">
          <SkeletonTitle className="w-48 h-8" />
        </div>
        <div className="lg:px-16 px-6 max-w-5xl w-full mx-auto space-y-4">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  // Don't render anything if there are no active storage units
  if (activeStorageUnits.length === 0) {
    return null;
  }

  return (
    <div className="mb-24">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center lg:px-16 px-6 max-w-5xl mx-auto mb-8">
        <h2 className="text-2xl font-semibold text-primary">Your storage units</h2>
        <Link href={`/user-page/${userId}/access-storage`}>
          <button className="hidden sm:block rounded-md py-2.5 px-5 font-semibold bg-primary text-white text-md hover:bg-primary-hover active:bg-primary-active transition-colors font-inter">
            <span className="flex items-center text-nowrap">
              <LockOpenIcon className="w-4 h-4 mr-2" />
              Access Storage
            </span>
          </button>
        </Link>
      </div>
      <div className="lg:px-16 px-6 max-w-5xl w-full mx-auto">
        {activeStorageUnits.map((usage) => (
          <StorageUnitsCard
            key={usage.id}
            id={usage.id}
            imageSrc={usage.storageUnit.mainImage}
            title={`Boombox ${usage.storageUnit.storageUnitNumber}`}
            pickUpDate={new Date(usage.usageStartDate).toLocaleDateString()}
            lastAccessedDate={
              usage.usageEndDate
                ? new Date(usage.usageEndDate).toLocaleDateString()
                : null
            }
            location={formatLocation(usage.location)}
            descriptionPlaceholder="Add a description of your stored items..."
            onDescriptionChange={(newDescription) =>
              handleDescriptionChange(usage.id, newDescription)
            }
            onUploadClick={() => console.log('Upload clicked')}
            description={usage.description ?? 'Add a description of your stored items...'}
            onImageClick={() => handleImageClick(usage)}
            onPhotosUploaded={(newPhotoUrls) => handlePhotosUploaded(usage.id, newPhotoUrls)}
          />
        ))}

        {/* Popup */}
        {showPopup && selectedStorageUnit && (
          <StorageUnitPopup
            key={selectedStorageUnit.id}
            isOpen={showPopup}
            images={selectedStorageUnit.uploadedImages}
            mainImage={selectedStorageUnit.storageUnit.mainImage}
            onClose={handleClosePopup}
            description={selectedStorageUnit.description ?? 'Add a description of your stored items...'}
            onDescriptionChange={(newDescription) =>
              handleDescriptionChange(selectedStorageUnit.id, newDescription)
            }
            title={`Boombox ${selectedStorageUnit.storageUnit.storageUnitNumber}`}
            pickUpDate={new Date(selectedStorageUnit.usageStartDate).toLocaleDateString()}
            lastAccessedDate={
              selectedStorageUnit.usageEndDate
                ? new Date(selectedStorageUnit.usageEndDate).toLocaleDateString()
                : 'Not accessed yet'
            }
            location={formatLocation(selectedStorageUnit.location)}
          />
        )}
      </div>
    </div>
  );
};

