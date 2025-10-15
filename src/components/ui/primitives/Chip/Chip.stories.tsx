/**
 * @fileoverview Storybook stories for Chip component
 * @component Chip
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'Components/UI/Primitives/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Interactive chip/tag component for displaying removable labels, filters, and selections. Supports optional close functionality and click interactions.',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'The text content of the chip',
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'outline'],
      description: 'Visual variant of the chip',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
    removable: {
      control: 'boolean',
      description: 'Whether the chip can be removed/closed',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the chip is disabled',
    },
    onRemove: {
      description: 'Callback when chip is removed',
    },
    onClick: {
      description: 'Callback when chip is clicked',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    label: 'Default Chip',
    variant: 'default',
    size: 'md',
  },
};

export const Primary: Story = {
  args: {
    label: 'Primary Chip',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary Chip',
    variant: 'secondary',
    size: 'md',
  },
};

export const Outline: Story = {
  args: {
    label: 'Outline Chip',
    variant: 'outline',
    size: 'md',
  },
};

// Size Variants
export const SmallSize: Story = {
  args: {
    label: 'Small',
    size: 'sm',
    variant: 'primary',
  },
};

export const MediumSize: Story = {
  args: {
    label: 'Medium',
    size: 'md',
    variant: 'primary',
  },
};

export const LargeSize: Story = {
  args: {
    label: 'Large',
    size: 'lg',
    variant: 'primary',
  },
};

// Interactive Examples
export const Clickable: Story = {
  args: {
    label: 'Clickable Chip',
    variant: 'default',
    onClick: () => console.log('Chip clicked'),
  },
};

export const Removable: Story = {
  args: {
    label: 'Removable Chip',
    variant: 'primary',
    removable: true,
    onRemove: () => console.log('Chip removed'),
  },
};

export const ClickableAndRemovable: Story = {
  args: {
    label: 'Interactive Chip',
    variant: 'secondary',
    removable: true,
    onClick: () => console.log('Chip clicked'),
    onRemove: () => console.log('Chip removed'),
  },
};

// States
export const Disabled: Story = {
  args: {
    label: 'Disabled Chip',
    variant: 'primary',
    disabled: true,
  },
};

export const DisabledRemovable: Story = {
  args: {
    label: 'Disabled Removable',
    variant: 'primary',
    removable: true,
    disabled: true,
    onRemove: () => console.log('Chip removed'),
  },
};

// Long Text Examples
export const LongText: Story = {
  args: {
    label: 'This is a very long chip label that should be truncated',
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the chip handles long text with truncation.',
      },
    },
  },
};

export const LongTextRemovable: Story = {
  args: {
    label: 'This is a very long removable chip label that should be truncated',
    variant: 'primary',
    removable: true,
    onRemove: () => console.log('Chip removed'),
  },
};

// All Variants Showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Chip label="Default" variant="default" />
      <Chip label="Primary" variant="primary" />
      <Chip label="Secondary" variant="secondary" />
      <Chip label="Outline" variant="outline" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available chip variants displayed together.',
      },
    },
  },
};

// All Sizes Showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Chip label="Small" variant="primary" size="sm" />
      <Chip label="Medium" variant="primary" size="md" />
      <Chip label="Large" variant="primary" size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available chip sizes displayed together.',
      },
    },
  },
};

// Removable Variants
export const RemovableVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Chip 
        label="Default Removable" 
        variant="default" 
        removable 
        onRemove={() => console.log('Default chip removed')} 
      />
      <Chip 
        label="Primary Removable" 
        variant="primary" 
        removable 
        onRemove={() => console.log('Primary chip removed')} 
      />
      <Chip 
        label="Secondary Removable" 
        variant="secondary" 
        removable 
        onRemove={() => console.log('Secondary chip removed')} 
      />
      <Chip 
        label="Outline Removable" 
        variant="outline" 
        removable 
        onRemove={() => console.log('Outline chip removed')} 
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All chip variants with remove functionality.',
      },
    },
  },
};

// Filter Chip Example
export const FilterChips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip 
        label="All Items" 
        variant="primary" 
        onClick={() => console.log('Filter: All Items')} 
      />
      <Chip 
        label="Active" 
        variant="outline" 
        onClick={() => console.log('Filter: Active')} 
      />
      <Chip 
        label="Completed" 
        variant="outline" 
        onClick={() => console.log('Filter: Completed')} 
      />
      <Chip 
        label="Archived" 
        variant="outline" 
        onClick={() => console.log('Filter: Archived')} 
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of using chips as filter buttons.',
      },
    },
  },
};

// Tag Chip Example
export const TagChips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip 
        label="React" 
        variant="secondary" 
        removable 
        onRemove={() => console.log('Removed tag: React')} 
      />
      <Chip 
        label="TypeScript" 
        variant="secondary" 
        removable 
        onRemove={() => console.log('Removed tag: TypeScript')} 
      />
      <Chip 
        label="Storybook" 
        variant="secondary" 
        removable 
        onRemove={() => console.log('Removed tag: Storybook')} 
      />
      <Chip 
        label="Design System" 
        variant="secondary" 
        removable 
        onRemove={() => console.log('Removed tag: Design System')} 
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of using chips as removable tags.',
      },
    },
  },
};

// Accessibility Example
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Keyboard Navigation:</h3>
        <p className="text-xs text-gray-600 mb-3">
          Use Tab to focus, Enter/Space to click, Delete/Backspace to remove
        </p>
        <div className="flex flex-wrap gap-2">
          <Chip 
            label="Focusable" 
            variant="primary" 
            onClick={() => console.log('Chip clicked')} 
          />
          <Chip 
            label="Removable" 
            variant="secondary" 
            removable 
            onRemove={() => console.log('Chip removed')} 
          />
          <Chip 
            label="Both Actions" 
            variant="outline" 
            onClick={() => console.log('Chip clicked')} 
            removable 
            onRemove={() => console.log('Chip removed')} 
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features and keyboard navigation.',
      },
    },
  },
};
