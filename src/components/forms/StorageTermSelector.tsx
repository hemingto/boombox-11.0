'use client';

import React, { useId } from 'react';

import { StorageTerm, STORAGE_TERM_TIERS } from '@/data/storageTermPricing';

export interface StorageTermSelectorProps {
  selectedTerm: StorageTerm | null;
  onTermChange: (term: StorageTerm) => void;
  hasError?: boolean;
  onClearError?: () => void;
}

export const StorageTermSelector: React.FC<StorageTermSelectorProps> = ({
  selectedTerm,
  onTermChange,
  hasError,
  onClearError,
}) => {
  const groupId = useId();
  const radioName = `storage-term-${groupId}`;
  const headingId = `storage-term-heading-${groupId}`;
  const showErrorState = Boolean(hasError && selectedTerm === null);

  return (
    <div className="w-full">
      <div className="mb-4 mt-4">
        <p id={headingId} className="text-text-primary">
          How long do you plan on storing?
        </p>
      </div>

      <div
        className="flex flex-row gap-2 sm:gap-3"
        role="radiogroup"
        aria-labelledby={headingId}
      >
        {STORAGE_TERM_TIERS.map(tier => {
          const inputId = `${radioName}-${tier.id}`;
          const isSelected = selectedTerm === tier.id;

          const cardClass = showErrorState
            ? 'ring-border-error bg-red-50 ring-2'
            : isSelected
              ? 'ring-primary ring-2 bg-surface-primary'
              : 'ring-slate-100 ring-2 bg-slate-100';

          const handleChange = () => {
            onTermChange(tier.id);
            onClearError?.();
          };

          return (
            <label
              key={tier.id}
              htmlFor={inputId}
              className={`mb-2 flex flex-1 cursor-pointer items-center justify-center rounded-md py-2.5 px-4 ${cardClass}`}
            >
              <p
                className={`text-sm font-medium text-center ${showErrorState ? 'text-red-500' : 'text-text-primary'}`}
              >
                {tier.label}
              </p>

              <input
                id={inputId}
                type="radio"
                name={radioName}
                value={tier.id}
                checked={isSelected}
                onChange={handleChange}
                className="sr-only"
              />
            </label>
          );
        })}
      </div>

      {showErrorState ? (
        <p className="mt-2 text-sm text-status-error" role="alert">
          Please select a storage term
        </p>
      ) : null}

      <div className="mt-4 p-3 mb-12 border border-slate-100 bg-white rounded-md max-w-fit">
        <p className="text-xs">
          Not sure? Don&apos;t worry, if your plans change your monthly bill
          still stays the same.
        </p>
        <p className="text-xs mt-2">
          Store longer to unlock pickup and delivery perks.
        </p>
      </div>
    </div>
  );
};

export default StorageTermSelector;
