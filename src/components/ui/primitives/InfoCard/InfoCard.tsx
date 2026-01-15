/**
 * @fileoverview A reusable info card component.
 * @source boombox-10.0/src/app/components/reusablecomponents/infocard.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays an informational card with a title, description, a call-to-action button, and an optional close button.
 * The component's color scheme can be customized through variants.
 *
 * API ROUTES UPDATED:
 * - Old: N/A -> New: N/A
 *
 * DESIGN SYSTEM UPDATES:
 * - Replaced dynamic color classes with design system color tokens for variants.
 * - The `color` prop is replaced with a `variant` prop to align with design system principles.
 *
 * @refactor Converted to a stateless component where visibility is controlled by the parent.
 * Uses a variant-based system for styling instead of a free-form `color` prop.
 */

import { ReactNode } from 'react';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';

type CardVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface InfoCardProps {
  title: string;
  description: ReactNode;
  buttonText: string;
  buttonIcon: React.ReactNode;
  onButtonClick: () => void;
  onClose?: () => void;
  showCloseIcon?: boolean;
  variant?: CardVariant;
  className?: string;
}

const variantClasses: Record<CardVariant, { base: string; border: string; hover: string; active: string }> = {
  default: {
    base: 'bg-slate-100',
    border: 'border-border',
    hover: 'hover:bg-slate-50',
    active: 'active:bg-slate-200',
  },
  success: {
    base: 'bg-status-bg-success',
    border: 'border-status-success',
    hover: 'hover:bg-emerald-200',
    active: 'active:bg-emerald-300',
  },
  warning: {
    base: 'bg-status-bg-warning',
    border: 'border-border-warning',
    hover: 'hover:bg-amber-200',
    active: 'active:bg-amber-300',
  },
  error: {
    base: 'bg-status-bg-error',
    border: 'border-status-error',
    hover: 'hover:bg-red-200',
    active: 'active:bg-red-300',
  },
  info: {
    base: 'bg-sky-100',
    border: 'border-sky-100',
    hover: 'hover:bg-sky-100',
    active: 'active:bg-sky-200',
  },
};

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  buttonText,
  buttonIcon,
  onButtonClick,
  onClose,
  showCloseIcon = false,
  variant = 'default',
  className,
}) => {
  const variants = variantClasses[variant];

  return (
    <div
      className={twMerge(
        'pt-4 mb-4 rounded-md relative',
        variants.base,
        className
      )}
      role="region"
      aria-labelledby="info-card-title"
    >
      {showCloseIcon && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-primary"
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}

      <div className="px-4 pb-4">
        <h3 id="info-card-title" className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-sm mt-2 text-text-primary">{description}</p>
      </div>

      <button
        onClick={onButtonClick}
        className={twMerge(
          'px-4 py-4 flex items-center justify-between w-full rounded-b-md transition border-t border-white',
          variants.active
        )}
      >
        <div className="flex items-center">
          <span className="mr-2 text-text-primary">{buttonIcon}</span>
          <span className="text-sm font-medium text-text-primary">{buttonText}</span>
        </div>
        <ChevronRightIcon className="w-4 h-4 shrink-0 text-text-primary" />
      </button>
    </div>
  );
};

export default InfoCard;
export type { InfoCardProps, CardVariant };
