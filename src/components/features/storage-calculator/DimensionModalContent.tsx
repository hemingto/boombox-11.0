'use client';

import { Button } from '@/components/ui/primitives/Button';
import { StorageUnitIcon, OpenStorageUnitIcon } from '@/components/icons';

interface DimensionModalContentProps {
  onClose: () => void;
}

export function DimensionModalContent({ onClose }: DimensionModalContentProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-text-primary">
        Exact Dimensions
      </h2>
      <p className="text-text-primary mb-6">
        All measurements are as accurate as possible, but should be viewed as
        close approximations. If you are unsure if one of your items will fit
        please reach out at our Help Center
      </p>

      <div className="flex flex-col sm:flex-row gap-8 mt-10">
        {/* Interior Dimensions */}
        <div className="flex-1 border-r border-border pr-6">
          <OpenStorageUnitIcon
            className="w-28 h-24 mb-4 mx-auto"
            aria-hidden="true"
          />
          <h3 className="mb-4 text-lg font-semibold text-center text-text-primary">
            Interior Dimensions
          </h3>
          <ul className="text-sm space-y-2 text-text-primary" role="list">
            <li>
              <span className="font-semibold text-text-primary">Length:</span>{' '}
              95 ins. or 7ft. 11 in. (241cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Width:</span> 56
              ins. or 4ft. 8 in. (142cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Height:</span>{' '}
              83.5 ins. or 6ft. 11.5 in. (212cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Diagonal:</span>{' '}
              110 ins. or 9ft. 2 in. (280cm)
            </li>
          </ul>
        </div>

        {/* Exterior Dimensions */}
        <div className="flex-1 pl-6">
          <StorageUnitIcon
            className="w-24 h-24 mb-4 mx-auto"
            aria-hidden="true"
          />
          <h3 className="mb-4 text-lg font-semibold text-center text-text-primary">
            Exterior Dimensions
          </h3>
          <ul className="text-sm space-y-2 text-text-primary" role="list">
            <li>
              <span className="font-semibold text-text-primary">Length:</span>{' '}
              96 ins. or 8ft. (244cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Width:</span> 60
              ins. or 5ft. (152cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Height:</span>{' '}
              96 ins. or 8ft. (244cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Diagonal:</span>{' '}
              90 ins. or 7ft. 6 in. (228cm)
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          variant="primary"
          onClick={onClose}
          aria-label="Close dimensions modal"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

export default DimensionModalContent;
