/**
 * @fileoverview Spinner component stories for Storybook
 * Spinner component for loading states with multiple sizes and color variants
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/UI/Primitives/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible spinner component for loading states. Supports multiple sizes, color variants, and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the spinner',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'white', 'current'],
      description: 'Color variant of the spinner',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    label: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
  },
  args: {
    size: 'md',
    variant: 'primary',
    label: 'Loading...',
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    size: 'md',
    variant: 'primary',
  },
};

// Size variants
export const ExtraSmall: Story = {
  args: {
    size: 'xs',
    variant: 'primary',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    variant: 'primary',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    variant: 'primary',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    variant: 'primary',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    variant: 'primary',
  },
};

// Color variants
export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
  },
};

export const White: Story = {
  args: {
    variant: 'white',
    size: 'md',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const Current: Story = {
  render: () => (
    <div className="text-blue-500">
      <p className="mb-4 text-center">Inherits color from parent</p>
      <Spinner variant="current" size="md" />
    </div>
  ),
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center space-x-8">
      <div className="text-center">
        <Spinner size="xs" />
        <p className="mt-2 text-xs text-gray-600">xs</p>
      </div>
      <div className="text-center">
        <Spinner size="sm" />
        <p className="mt-2 text-xs text-gray-600">sm</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="mt-2 text-xs text-gray-600">md</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-2 text-xs text-gray-600">lg</p>
      </div>
      <div className="text-center">
        <Spinner size="xl" />
        <p className="mt-2 text-xs text-gray-600">xl</p>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="flex items-center space-x-8">
        <div className="text-center">
          <Spinner variant="primary" size="lg" />
          <p className="mt-2 text-sm text-gray-600">Primary</p>
        </div>
        <div className="text-center">
          <Spinner variant="secondary" size="lg" />
          <p className="mt-2 text-sm text-gray-600">Secondary</p>
        </div>
      </div>
      
      <div className="bg-zinc-950 p-6 rounded-lg">
        <div className="flex items-center space-x-8">
          <div className="text-center">
            <Spinner variant="white" size="lg" />
            <p className="mt-2 text-sm text-white">White</p>
          </div>
          <div className="text-center text-blue-400">
            <Spinner variant="current" size="lg" />
            <p className="mt-2 text-sm">Current Color</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// In context examples
export const InButton: Story = {
  render: () => (
    <div className="space-y-4">
      <button className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" disabled>
        <Spinner size="sm" variant="white" className="mr-2" />
        Loading...
      </button>
      
      <button className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50" disabled>
        <Spinner size="md" variant="white" className="mr-3" />
        Processing Payment
      </button>
      
      <button className="inline-flex items-center px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50" disabled>
        <Spinner size="xs" variant="white" className="mr-2" />
        Save
      </button>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <Spinner size="lg" variant="primary" className="mx-auto" />
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const InModal: Story = {
  render: () => (
    <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="p-8">
        <div className="text-center">
          <Spinner size="xl" variant="primary" className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Uploading Files
          </h3>
          <p className="text-gray-600">
            Please wait while we process your files...
          </p>
        </div>
      </div>
    </div>
  ),
};

export const InlineWithText: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="flex items-center text-gray-700">
        <Spinner size="xs" variant="current" className="mr-2" />
        Saving changes...
      </p>
      
      <p className="flex items-center text-blue-600">
        <Spinner size="sm" variant="current" className="mr-2" />
        Syncing with server...
      </p>
      
      <p className="flex items-center text-green-600 text-lg">
        <Spinner size="md" variant="current" className="mr-3" />
        Processing your request...
      </p>
    </div>
  ),
};

// Different contexts and backgrounds
export const OnDifferentBackgrounds: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Light background */}
      <div className="bg-white p-6 rounded-lg border">
        <p className="text-center mb-4 text-gray-700">Light Background</p>
        <div className="flex justify-center space-x-4">
          <Spinner size="md" variant="primary" />
          <Spinner size="md" variant="secondary" />
        </div>
      </div>
      
      {/* Gray background */}
      <div className="bg-gray-100 p-6 rounded-lg">
        <p className="text-center mb-4 text-gray-700">Gray Background</p>
        <div className="flex justify-center space-x-4">
          <Spinner size="md" variant="primary" />
          <Spinner size="md" variant="secondary" />
        </div>
      </div>
      
      {/* Dark background */}
      <div className="bg-zinc-950 p-6 rounded-lg">
        <p className="text-center mb-4 text-white">Dark Background</p>
        <div className="flex justify-center space-x-4">
          <Spinner size="md" variant="white" />
          <Spinner size="md" variant="secondary" />
        </div>
      </div>
      
      {/* Colored background */}
      <div className="bg-blue-500 p-6 rounded-lg">
        <p className="text-center mb-4 text-white">Colored Background</p>
        <div className="flex justify-center space-x-4">
          <Spinner size="md" variant="white" />
          <Spinner size="md" variant="current" className="text-blue-200" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Loading states comparison
export const LoadingStatesComparison: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Minimal loading */}
      <div className="text-center p-4 border rounded-lg">
        <h4 className="font-semibold mb-4">Minimal</h4>
        <Spinner size="sm" />
      </div>
      
      {/* Standard loading */}
      <div className="text-center p-4 border rounded-lg">
        <h4 className="font-semibold mb-4">Standard</h4>
        <Spinner size="md" className="mb-2" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
      
      {/* Detailed loading */}
      <div className="text-center p-4 border rounded-lg">
        <h4 className="font-semibold mb-4">Detailed</h4>
        <Spinner size="lg" className="mb-3" />
        <p className="font-medium">Processing</p>
        <p className="text-sm text-gray-600">Please wait...</p>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Accessibility example
export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-2">With Custom Label</h4>
        <Spinner 
          size="md" 
          label="Loading user data, please wait" 
          aria-label="Loading user data, please wait"
        />
        <p className="text-sm text-gray-600 mt-2">
          Screen readers will announce: "Loading user data, please wait"
        </p>
      </div>
      
      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-2">In Live Region</h4>
        <div aria-live="polite" aria-atomic="true">
          <Spinner size="md" className="mr-2" />
          <span>Status: Loading content...</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Changes in this region will be announced automatically
        </p>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Animation showcase
export const AnimationShowcase: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Animation Speed Comparison</h3>
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <div className="animate-spin rounded-full w-8 h-8 border-2 border-zinc-950 border-t-transparent" style={{ animationDuration: '0.5s' }}></div>
            <p className="mt-2 text-xs">Fast (0.5s)</p>
          </div>
          <div className="text-center">
            <Spinner size="md" />
            <p className="mt-2 text-xs">Normal (1s)</p>
          </div>
          <div className="text-center">
            <div className="animate-spin rounded-full w-8 h-8 border-2 border-zinc-950 border-t-transparent" style={{ animationDuration: '2s' }}></div>
            <p className="mt-2 text-xs">Slow (2s)</p>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Multiple Spinners</h3>
        <div className="flex justify-center items-center space-x-4">
          <Spinner size="xs" />
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Spinner size="xl" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
