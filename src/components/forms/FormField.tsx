/**
 * @fileoverview FormField wrapper component with React Hook Form integration
 * @source boombox-10.0/src/app/components/reusablecomponents/textinput.tsx (field wrapper pattern)
 * @source boombox-10.0/src/app/components/reusablecomponents/firstnameinput.tsx (error handling)
 * @source boombox-10.0/src/app/components/reusablecomponents/emailinput.tsx (field styling)
 * @refactor Created unified form field wrapper with React Hook Form integration
 */

import { forwardRef, useId } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils/cn';
import { Input, InputProps } from '@/components/ui/primitives/Input';
import { TextArea, TextAreaProps } from '@/components/ui/primitives/TextArea';
import { Select, SelectProps } from '@/components/ui/primitives/Select';
import { FieldError } from './FieldError';

export interface FormFieldProps {
  /**
   * Field name for React Hook Form
   */
  name: string;

  /**
   * Field type determines which component to render
   */
  type?: 'input' | 'textarea' | 'select';

  /**
   * Label for the field
   */
  label?: string;

  /**
   * Helper text displayed below the field
   */
  helperText?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Additional CSS classes for the wrapper
   */
  className?: string;

  /**
   * Props specific to the input component
   */
  inputProps?: Omit<InputProps, 'error' | 'name'>;

  /**
   * Props specific to the textarea component
   */
  textAreaProps?: Omit<TextAreaProps, 'error' | 'name'>;

  /**
   * Props specific to the select component
   */
  selectProps?: Omit<SelectProps, 'error' | 'name'>;
}

/**
 * FormField wrapper component that integrates with React Hook Form
 * Automatically handles error states and applies boombox-10.0 styling patterns
 */
const FormField = forwardRef<HTMLElement, FormFieldProps>(
  ({
    name,
    type = 'input',
    label,
    helperText,
    required = false,
    className,
    inputProps,
    textAreaProps,
    selectProps,
  }) => {
    const { control } = useFormContext();
    const fieldId = useId();
    const errorId = `${fieldId}-error`;
    const helperTextId = `${fieldId}-helper`;

    const {
      field,
      fieldState: { error, invalid },
    } = useController({
      name,
      control,
    });

    // Apply boombox-10.0 error styling patterns to input components
    const getErrorStyles = () => {
      if (invalid && error) {
        return {
          variant: 'error' as const,
          className:
            'ring-red-500 ring-2 bg-red-100 placeholder:text-red-500 text-red-500',
        };
      }
      return {
        variant: 'default' as const,
        className:
          'bg-slate-100 focus:outline-none placeholder:text-zinc-400 focus:placeholder:text-zinc-950 placeholder:text-sm focus-within:ring-2 focus-within:ring-zinc-950 focus:bg-white',
      };
    };

    const errorStyles = getErrorStyles();

    // Build aria-describedby attribute
    const ariaDescribedBy =
      [error ? errorId : null, helperText ? helperTextId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    const renderField = () => {
      const { ref: fieldRef, ...fieldProps } = field;
      const commonProps = {
        ...fieldProps,
        id: fieldId,
        'aria-describedby': ariaDescribedBy,
        'aria-invalid': invalid,
        'aria-required': required,
        className: cn(
          // Base field styles from boombox-10.0
          'py-2.5 px-3 w-full mb-2 sm:mb-4 rounded-md focus:outline-none focus:ring-zinc-950',
          errorStyles.className
        ),
      };

      switch (type) {
        case 'textarea':
          return (
            <TextArea
              ref={fieldRef}
              {...commonProps}
              {...textAreaProps}
              error={error?.message}
            />
          );

        case 'select':
          return (
            <Select
              ref={fieldRef}
              {...commonProps}
              {...selectProps}
              error={error?.message}
            />
          );

        default:
          return (
            <Input
              ref={fieldRef}
              {...commonProps}
              {...inputProps}
              error={error?.message}
            />
          );
      }
    };

    return (
      <div className={cn('w-full', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium mb-1',
              // Error state for label
              invalid && error ? 'text-red-500' : 'text-zinc-950'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Field Component */}
        {renderField()}

        {/* Error Message */}
        <FieldError
          id={errorId}
          message={error?.message}
          show={invalid && !!error}
        />

        {/* Helper Text */}
        {helperText && !error && (
          <p id={helperTextId} className="text-zinc-400 text-sm mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };
