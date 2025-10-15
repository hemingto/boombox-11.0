# Routing Number Input Usage Examples

This document demonstrates how to use the `useRoutingNumberInput` hook and `RoutingNumberInput` component in boombox-11.0.

## Using the Custom Hook with Input Component

The most flexible approach is to use the `useRoutingNumberInput` hook directly with the unified `Input` component:

```tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/primitives/Input';
import { useRoutingNumberInput } from '@/hooks/useRoutingNumberInput';

export const BankAccountForm: React.FC = () => {
  const [routingNumber, setRoutingNumber] = useState('');

  const routingInput = useRoutingNumberInput(routingNumber, {
    required: true,
    onRoutingNumberChange: setRoutingNumber,
    validateOnChange: false, // Validate on blur instead
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    if (routingInput.validateRoutingNumber()) {
      console.log('Valid routing number:', routingNumber);
      // Process form submission
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        {...routingInput.inputProps}
        label="Bank Routing Number"
        error={routingInput.hasError ? routingInput.errorMessage : undefined}
        onClearError={routingInput.clearError}
        fullWidth
        required
        helperText="Enter your bank's 9-digit routing number"
      />
      
      <button type="submit" disabled={routingInput.hasError}>
        Submit
      </button>
    </form>
  );
};
```

## Using the Pre-built Component

For simpler use cases, use the `RoutingNumberInput` component:

```tsx
import React, { useState } from 'react';
import { RoutingNumberInput } from '@/components/forms/RoutingNumberInput';

export const SimpleForm: React.FC = () => {
  const [routingNumber, setRoutingNumber] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <div>
      <RoutingNumberInput
        value={routingNumber}
        onRoutingNumberChange={setRoutingNumber}
        required
        showLabel
        fullWidth
        hasError={hasError}
        errorMessage={errorMessage}
        onClearError={() => {
          setHasError(false);
          setErrorMessage('');
        }}
      />
    </div>
  );
};
```

## Advanced Usage with Custom Validation

You can provide custom validation logic:

```tsx
import React, { useState } from 'react';
import { RoutingNumberInput } from '@/components/forms/RoutingNumberInput';

export const AdvancedForm: React.FC = () => {
  const [routingNumber, setRoutingNumber] = useState('');

  // Custom validator that checks against a list of known routing numbers
  const customValidator = (value: string) => {
    const validRoutingNumbers = ['123456789', '987654321', '111000025'];
    
    if (!validRoutingNumbers.includes(value)) {
      return {
        isValid: false,
        message: 'This routing number is not supported by our system',
      };
    }
    
    return { isValid: true };
  };

  return (
    <RoutingNumberInput
      value={routingNumber}
      onRoutingNumberChange={setRoutingNumber}
      customValidator={customValidator}
      required
      showLabel
      label="Supported Bank Routing Number"
      validateOnChange={true} // Validate as user types
      fullWidth
    />
  );
};
```

## Integration with React Hook Form

The hook works seamlessly with React Hook Form:

```tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/primitives/Input';
import { useRoutingNumberInput } from '@/hooks/useRoutingNumberInput';

interface FormData {
  routingNumber: string;
  accountNumber: string;
}

export const ReactHookFormExample: React.FC = () => {
  const { control, handleSubmit, watch, setValue } = useForm<FormData>();
  const routingNumberValue = watch('routingNumber') || '';

  const routingInput = useRoutingNumberInput(routingNumberValue, {
    required: true,
    onRoutingNumberChange: (value) => setValue('routingNumber', value),
  });

  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="routingNumber"
        control={control}
        rules={{ required: 'Routing number is required' }}
        render={({ field, fieldState }) => (
          <Input
            {...routingInput.inputProps}
            label="Routing Number"
            error={fieldState.error?.message || (routingInput.hasError ? routingInput.errorMessage : undefined)}
            onClearError={routingInput.clearError}
            fullWidth
            required
          />
        )}
      />
      
      <button type="submit">Submit</button>
    </form>
  );
};
```

## Key Features

### Automatic Numeric Filtering
- Only accepts numeric input (0-9)
- Automatically filters out non-numeric characters
- Limits input to 9 digits maximum

### Validation Options
- Built-in routing number format validation
- Required field validation
- Custom validator support
- Real-time or on-blur validation

### Accessibility
- Proper ARIA labels and attributes
- Screen reader support
- Keyboard navigation support
- Error state announcements

### Error Handling
- Automatic error clearing on focus
- Customizable error messages
- Integration with design system error states

### Design System Integration
- Uses unified Input component
- Follows design system color tokens
- Consistent styling with other form inputs
- Responsive design support

## Migration from boombox-10.0

If migrating from the old `RoutingNumberInput` component:

```tsx
// Old boombox-10.0 approach
<RoutingNumberInput
  hasError={hasError}
  errorMessage={errorMessage}
  onRoutingNumberChange={setRoutingNumber}
  onClearError={clearError}
  value={routingNumber}
/>

// New boombox-11.0 approach (Option 1: Pre-built component)
<RoutingNumberInput
  value={routingNumber}
  onRoutingNumberChange={setRoutingNumber}
  hasError={hasError}
  errorMessage={errorMessage}
  onClearError={clearError}
  showLabel
  fullWidth
/>

// New boombox-11.0 approach (Option 2: Hook + Input)
const routingInput = useRoutingNumberInput(routingNumber, {
  onRoutingNumberChange: setRoutingNumber,
  hasError,
  errorMessage,
  onClearError: clearError,
});

<Input
  {...routingInput.inputProps}
  error={routingInput.hasError ? routingInput.errorMessage : undefined}
  onClearError={routingInput.clearError}
  fullWidth
/>
```

The new approach provides better flexibility, design system integration, and follows the established patterns in boombox-11.0.
