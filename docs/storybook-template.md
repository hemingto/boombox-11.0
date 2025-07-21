# Storybook Story Template

This template provides a standardized format for creating new component stories in Boombox 11.0.

## Story Template

Use this template when creating new `.stories.tsx` files:

```typescript
/**
 * @fileoverview [ComponentName] component stories for Storybook
 * [Brief description of component functionality]
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ComponentName } from './ComponentName';

const meta = {
  title: 'Components/[Category]/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered', // or 'fullscreen', 'padded'
    docs: {
      description: {
        component: '[Detailed component description with usage notes]',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    propName: {
      control: 'select', // or 'boolean', 'text', 'number'
      options: ['option1', 'option2'],
      description: 'Description of what this prop does',
    },
    // Add more prop controls as needed
  },
  args: {
    // Default args for all stories
    propName: 'defaultValue',
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    // Override default args for this story
  },
};

// Variant stories
export const VariantName: Story = {
  args: {
    variant: 'variantValue',
  },
};

// State stories
export const StateName: Story = {
  args: {
    state: true,
  },
};

// Complex render story
export const ComplexExample: Story = {
  render: () => (
    <div className="space-y-4">
      <ComponentName prop1="value1" />
      <ComponentName prop1="value2" />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
```

## Story Organization

### Categories

- `Components/UI` - Design system components (Button, Input, etc.)
- `Components/Features` - Business domain components
- `Components/Layouts` - Layout components
- `Design System` - Design token showcases

### Required Stories

Each component should have at least:

1. **Default** - Basic usage
2. **All Variants** - If component has variants
3. **All States** - Loading, error, disabled, etc.
4. **Edge Cases** - Empty states, long text, etc.

### Story Naming

- Use descriptive names: `WithError`, `LoadingState`, `LongText`
- Group related stories: `AllVariants`, `AllSizes`, `AllStates`
- Use PascalCase for story names

## ArgTypes Configuration

### Common Control Types

```typescript
argTypes: {
  // Select dropdown
  variant: {
    control: 'select',
    options: ['primary', 'secondary'],
  },

  // Boolean toggle
  disabled: {
    control: 'boolean',
  },

  // Text input
  placeholder: {
    control: 'text',
  },

  // Number input
  count: {
    control: 'number',
  },

  // Color picker
  color: {
    control: 'color',
  },
}
```

### Layout Parameters

- `centered` - Center component in viewport
- `fullscreen` - Full viewport (for pages/layouts)
- `padded` - Add padding around component

## Accessibility Testing

All stories automatically include accessibility testing via `@storybook/addon-a11y`. Ensure:

- Proper ARIA labels
- Color contrast compliance
- Keyboard navigation support
- Screen reader compatibility

## Best Practices

1. **Include comprehensive prop documentation** in argTypes
2. **Test edge cases** with dedicated stories
3. **Use realistic data** in examples
4. **Group related functionality** in single stories when appropriate
5. **Add accessibility considerations** in component descriptions
6. **Test responsive behavior** with viewport addon
7. **Include interactive examples** for complex components

## Example Usage

See existing stories for reference:

- `src/components/ui/primitives/Button.stories.tsx`
- `src/components/ui/primitives/Input.stories.tsx`
- `src/components/ui/DesignSystem.stories.tsx`
