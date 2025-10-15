/**
 * @fileoverview TextButton component stories for Storybook
 * TextButton component for secondary actions with 3 variants, 3 sizes, and customizable styling
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextButton } from './TextButton';

const meta = {
  title: 'Components/UI/Primitives/TextButton',
  component: TextButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A minimal text-only button component for secondary actions like Cancel, Skip, or Clear. Features underline styling, multiple variants, and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'destructive'],
      description: 'Visual style variant of the text button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the text button',
    },
    underline: {
      control: 'boolean',
      description: 'Whether to show underline styling',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the button is in loading state',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    children: 'Cancel',
    disabled: false,
    loading: false,
    underline: true,
  },
} satisfies Meta<typeof TextButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Cancel',
  },
};

// Variant stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Cancel',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Skip',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

// Size stories
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <TextButton variant="primary" size="sm">
        Small
      </TextButton>
      <TextButton variant="primary" size="md">
        Medium
      </TextButton>
      <TextButton variant="primary" size="lg">
        Large
      </TextButton>
    </div>
  ),
};

// Underline variations
export const WithoutUnderline: Story = {
  args: {
    variant: 'primary',
    underline: false,
    children: 'No Underline',
  },
};

export const WithUnderline: Story = {
  args: {
    variant: 'primary',
    underline: true,
    children: 'With Underline',
  },
};

// State stories
export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled',
  },
};

// Interactive story with actions
export const Interactive: Story = {
  args: {
    variant: 'primary',
    children: 'Click Me',
    onClick: () => alert('TextButton clicked!'),
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <div className="flex gap-4 items-center">
        <TextButton variant="primary">Primary</TextButton>
        <TextButton variant="secondary">Secondary</TextButton>
        <TextButton variant="destructive">Destructive</TextButton>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <div className="flex gap-4 items-center">
        <TextButton variant="primary" size="sm">Small</TextButton>
        <TextButton variant="primary" size="md">Medium</TextButton>
        <TextButton variant="primary" size="lg">Large</TextButton>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Use case examples
export const UseCases: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Modal actions */}
      <div className="p-4 bg-surface-secondary rounded-lg">
        <h3 className="text-sm font-medium mb-3 text-text-tertiary">Modal Actions</h3>
        <div className="flex gap-4 justify-end">
          <TextButton variant="primary">Cancel</TextButton>
          <button className="btn-primary">Submit</button>
        </div>
      </div>

      {/* Form actions */}
      <div className="p-4 bg-surface-secondary rounded-lg">
        <h3 className="text-sm font-medium mb-3 text-text-tertiary">Form Actions</h3>
        <div className="flex gap-4 justify-between">
          <TextButton variant="secondary">Clear Form</TextButton>
          <div className="flex gap-2">
            <TextButton variant="primary">Back</TextButton>
            <button className="btn-primary">Continue</button>
          </div>
        </div>
      </div>

      {/* Destructive actions */}
      <div className="p-4 bg-surface-secondary rounded-lg">
        <h3 className="text-sm font-medium mb-3 text-text-tertiary">Destructive Actions</h3>
        <div className="flex gap-4 items-center">
          <TextButton variant="destructive">Remove Item</TextButton>
          <TextButton variant="destructive">Delete Account</TextButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Edge cases
export const LongText: Story = {
  args: {
    variant: 'primary',
    children: 'This is a very long text button that might need wrapping',
  },
  parameters: {
    layout: 'padded',
  },
};

export const EmptyButton: Story = {
  args: {
    variant: 'primary',
    children: '',
    'aria-label': 'Empty text button',
  },
};
