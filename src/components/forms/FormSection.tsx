/**
 * @fileoverview FormSection component for grouping related form fields
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx (section grouping patterns)
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (form step sections)
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (form organization)
 * @refactor Created reusable form section component for consistent field grouping
 */

import { cn } from '@/lib/utils/cn';

export interface FormSectionProps {
  /**
   * Section title
   */
  title?: string;

  /**
   * Section description
   */
  description?: string;

  /**
   * Whether this section is required
   */
  required?: boolean;

  /**
   * Additional CSS classes for the section container
   */
  className?: string;

  /**
   * Additional CSS classes for the title
   */
  titleClassName?: string;

  /**
   * Additional CSS classes for the description
   */
  descriptionClassName?: string;

  /**
   * Form fields and content
   */
  children: React.ReactNode;

  /**
   * Section spacing variant
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Whether to show a border around the section
   */
  bordered?: boolean;

  /**
   * Background variant
   */
  background?: 'none' | 'subtle' | 'card';
}

/**
 * FormSection component for grouping related form fields
 * Provides consistent spacing and styling for form organization
 */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  required = false,
  className,
  titleClassName,
  descriptionClassName,
  children,
  spacing = 'md',
  bordered = false,
  background = 'none',
}) => {
  const sectionClasses = cn(
    // Base section styles
    'w-full',

    // Spacing variants (matching boombox-10.0 patterns)
    {
      'mb-0': spacing === 'none',
      'mb-4': spacing === 'sm',
      'mb-6 sm:mb-8': spacing === 'md', // Common pattern
      'mb-8 sm:mb-12': spacing === 'lg',
    },

    // Background variants
    {
      'bg-transparent': background === 'none',
      'bg-slate-50': background === 'subtle',
      'bg-white rounded-md shadow-sm p-6': background === 'card',
    },

    // Border variant
    {
      'border border-slate-200 rounded-md p-4':
        bordered && background === 'none',
    },

    className
  );

  const titleClasses = cn(
    // Base title styles (matching boombox-10.0 h2 patterns)
    'text-lg sm:text-xl font-semibold mb-2',
    'text-zinc-950',
    titleClassName
  );

  const descriptionClasses = cn(
    // Base description styles
    'text-sm text-zinc-600 mb-4',
    descriptionClassName
  );

  return (
    <section className={sectionClasses}>
      {/* Section Header */}
      {(title || description) && (
        <div className="mb-4 sm:mb-6">
          {title && (
            <h2 className={titleClasses}>
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h2>
          )}
          {description && <p className={descriptionClasses}>{description}</p>}
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">{children}</div>
    </section>
  );
};

// Specialized form sections for common patterns

export interface FieldGroupProps
  extends Omit<FormSectionProps, 'title' | 'description'> {
  /**
   * Layout direction for fields
   */
  direction?: 'vertical' | 'horizontal';

  /**
   * Gap between fields
   */
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * FieldGroup for organizing fields without headers
 * Common pattern for name fields, address fields, etc.
 */
const FieldGroup: React.FC<FieldGroupProps> = ({
  direction = 'vertical',
  gap = 'md',
  className,
  children,
  ...props
}) => {
  const groupClasses = cn(
    // Layout direction
    {
      'flex flex-col': direction === 'vertical',
      'flex flex-col sm:flex-row': direction === 'horizontal',
    },

    // Gap variants (matching boombox-10.0 patterns)
    {
      'gap-2': gap === 'sm',
      'gap-4': gap === 'md',
      'gap-6': gap === 'lg',
    },

    className
  );

  return (
    <FormSection {...props} spacing="sm" className={groupClasses}>
      {children}
    </FormSection>
  );
};

export interface StepSectionProps extends FormSectionProps {
  /**
   * Step number
   */
  stepNumber?: number;

  /**
   * Total number of steps
   */
  totalSteps?: number;

  /**
   * Whether this step is active
   */
  isActive?: boolean;

  /**
   * Whether this step is completed
   */
  isCompleted?: boolean;
}

/**
 * StepSection for multi-step forms (like quote forms)
 */
const StepSection: React.FC<StepSectionProps> = ({
  stepNumber,
  totalSteps,
  isActive = true,
  isCompleted = false,
  title,
  className,
  titleClassName,
  ...props
}) => {
  const stepTitle =
    stepNumber && totalSteps
      ? `Step ${stepNumber} of ${totalSteps}${title ? `: ${title}` : ''}`
      : title;

  const stepTitleClasses = cn(
    // Step-specific styling
    {
      'text-zinc-400': !isActive && !isCompleted,
      'text-zinc-950': isActive,
      'text-green-600': isCompleted,
    },
    titleClassName
  );

  const stepSectionClasses = cn(
    // Step section styling
    {
      'opacity-50': !isActive && !isCompleted,
      'opacity-100': isActive || isCompleted,
    },
    className
  );

  return (
    <FormSection
      {...props}
      title={stepTitle}
      className={stepSectionClasses}
      titleClassName={stepTitleClasses}
      background="card"
      spacing="lg"
    />
  );
};

export { FormSection, FieldGroup, StepSection };
