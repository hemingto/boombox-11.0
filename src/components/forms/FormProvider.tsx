/**
 * @fileoverview FormProvider component with React Hook Form and Zod integration
 * @source boombox-10.0/src/app/components/getquote/getquoteform.tsx (form patterns)
 * @source boombox-10.0/src/app/components/driver-signup/driversignupform.tsx (form patterns)
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (form patterns)
 * @refactor Created unified form provider using React Hook Form + Zod for consistent form handling
 */

import { ReactNode } from 'react';
import {
  useForm,
  FormProvider as RHFFormProvider,
  UseFormReturn,
  SubmitHandler,
  UseFormProps,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormProviderProps<T extends Record<string, any>> {
  /**
   * Zod schema for form validation
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<any, any, T>;

  /**
   * Default values for the form
   */
  defaultValues?: UseFormProps<T>['defaultValues'];

  /**
   * Form submission handler
   */
  onSubmit: SubmitHandler<T>;

  /**
   * Children components (form fields)
   */
  children: ReactNode | ((methods: UseFormReturn<T>) => ReactNode);

  /**
   * Additional form configuration
   */
  formConfig?: Omit<UseFormProps<T>, 'resolver' | 'defaultValues'>;

  /**
   * Loading state during form submission
   */
  isLoading?: boolean;

  /**
   * Additional CSS classes for form element
   */
  className?: string;

  /**
   * Form ID for accessibility
   */
  id?: string;
}

/**
 * FormProvider component that wraps React Hook Form with Zod validation
 * Provides consistent form handling across the application
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormProvider<T extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
  children,
  formConfig = {},
  isLoading = false,
  className,
  id,
}: FormProviderProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange', // Real-time validation as user types
    ...formConfig,
  });

  const handleSubmit = methods.handleSubmit(onSubmit);

  return (
    <RHFFormProvider {...methods}>
      <form
        onSubmit={handleSubmit}
        className={className}
        id={id}
        noValidate // We handle validation with Zod
        aria-busy={isLoading}
      >
        {typeof children === 'function' ? children(methods) : children}
      </form>
    </RHFFormProvider>
  );
}

// Export hook for accessing form context in child components
export { useFormContext, useController, useWatch } from 'react-hook-form';

// Export common types for form components
export type {
  FieldError,
  FieldErrors,
  Control,
  UseFormReturn,
  SubmitHandler,
} from 'react-hook-form';
