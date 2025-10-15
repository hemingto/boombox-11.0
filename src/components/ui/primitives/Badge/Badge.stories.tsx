/**
 * @fileoverview Storybook stories for Badge component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/UI/Primitives/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A badge component for displaying labels, tags, and status indicators with semantic color variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The text content displayed in the badge',
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info', 'pending', 'processing'],
      description: 'Visual variant based on semantic meaning',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the badge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Default Badge',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge label="Default" variant="default" />
      <Badge label="Success" variant="success" />
      <Badge label="Warning" variant="warning" />
      <Badge label="Error" variant="error" />
      <Badge label="Info" variant="info" />
      <Badge label="Pending" variant="pending" />
      <Badge label="Processing" variant="processing" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available badge variants using the design system badge classes.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge label="Small" size="sm" variant="info" />
      <Badge label="Medium" size="md" variant="info" />
      <Badge label="Large" size="lg" variant="info" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different size variants of the badge component.',
      },
    },
  },
};

export const LongText: Story = {
  args: {
    label: 'This is a very long badge label that should be truncated with ellipsis when it exceeds the container width',
    variant: 'info',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates text truncation behavior for long labels.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-48">
        <Story />
      </div>
    ),
  ],
};

export const StatusExamples: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Order Status</h4>
        <div className="flex flex-wrap gap-2">
          <Badge label="Confirmed" variant="success" />
          <Badge label="Pending" variant="pending" />
          <Badge label="Processing" variant="processing" />
          <Badge label="Cancelled" variant="error" />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Payment Status</h4>
        <div className="flex flex-wrap gap-2">
          <Badge label="Paid" variant="success" />
          <Badge label="Pending Payment" variant="warning" />
          <Badge label="Failed" variant="error" />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Driver Status</h4>
        <div className="flex flex-wrap gap-2">
          <Badge label="Available" variant="success" />
          <Badge label="Busy" variant="warning" />
          <Badge label="Offline" variant="error" />
          <Badge label="En Route" variant="processing" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world usage examples showing how badges can be used for different status types in the Boombox application.',
      },
    },
  },
};
