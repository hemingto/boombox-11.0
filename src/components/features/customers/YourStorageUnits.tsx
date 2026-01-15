/**
 * @fileoverview YourStorageUnits component - Displays active storage units for a customer
 * @source boombox-10.0/src/app/components/user-page/yourstorageunits.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 *
 * COMPONENT FUNCTIONALITY:
 * - Receives storage units as props from parent (page-level data fetching)
 * - Allows description editing and photo uploads
 * - Opens popup for detailed view with image carousel
 * - Provides "Access Storage" CTA button
 *
 * ARCHITECTURE:
 * - Data is fetched at page level via useCustomerHomePageData hook
 * - Component receives data as props, no internal data fetching
 * - Parent handles conditional rendering (component only mounts when data exists)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LockOpenIcon } from '@heroicons/react/20/solid';
import { StorageUnitUsageDisplay } from '@/lib/services/customerDataService';
import { 
  StorageUnitsCard, 
  StorageUnitPopup 
} from '@/components/features/customers';
import { Button } from '@/components/ui/primitives/Button';

export interface YourStorageUnitsProps {
  userId: string;
  storageUnits: StorageUnitUsageDisplay[];
  onStorageUnitsChange: React.Dispatch<React.SetStateAction<StorageUnitUsageDisplay[]>>;
}

/**
 * YourStorageUnits - Container component for displaying user's active storage units
 * 
 * Features:
 * - Displays active storage units from props
 * - Allows description editing and photo uploads
 * - Opens popup for detailed view with image carousel
 * - Provides "Access Storage" CTA button
 */
export const YourStorageUnits: React.FC<YourStorageUnitsProps> = ({ 
  userId,
  storageUnits,
  onStorageUnitsChange,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedStorageUnit, setSelectedStorageUnit] = useState<StorageUnitUsageDisplay | null>(null);

  const handleDescriptionChange = async (id: number, newDescription: string) => {
    // Optimistically update local state via parent
    onStorageUnitsChange((prev) =>
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
      // On error, the parent would need to refetch data
      // For now, we'll just log the error since the parent handles data
    }
  };

  const handleImageClick = (storageUnit: StorageUnitUsageDisplay) => {
    setSelectedStorageUnit(storageUnit);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedStorageUnit(null);
  };

  const handlePhotosUploaded = async (storageUnitUsageId: number, newPhotoUrls: string[]) => {
    // Update the parent state to include the new photos
    onStorageUnitsChange((prev) =>
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

  return (
    <div className="mb-24">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center lg:px-16 px-6 max-w-5xl mx-auto mb-8">
        <h2 className="text-2xl font-semibold text-primary">Your storage units</h2>
        <Link href={`/customer/${userId}/access-storage`}>
          <Button
            variant="primary"
            size="md"
            icon={<LockOpenIcon className="w-4 h-4" />}
            iconPosition="left"
            noWrap
            className="hidden sm:inline-flex"
          >
            Access Storage
          </Button>
        </Link>
      </div>
      <div className="lg:px-16 px-6 max-w-5xl w-full mx-auto">
        {storageUnits.map((usage) => (
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
            description={usage.description ?? ''}
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
            description={selectedStorageUnit.description ?? ''}
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
