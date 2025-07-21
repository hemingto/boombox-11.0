/**
 * @fileoverview Design System showcase for Storybook
 * Demonstrates design tokens, colors, typography, and component patterns
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Mock component for design system showcase
const DesignSystemShowcase = () => <div>Design System</div>;

const meta = {
  title: 'Design System/Overview',
  component: DesignSystemShowcase,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Boombox Design System - Colors, typography, spacing, and component patterns.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DesignSystemShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

// Color System
export const Colors: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        Color System
      </h1>

      {/* Brand Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Brand Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-primary h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Primary</p>
            <p className="text-xs text-text-secondary">bg-primary</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-hover h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Primary Hover</p>
            <p className="text-xs text-text-secondary">bg-primary-hover</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-active h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Primary Active</p>
            <p className="text-xs text-text-secondary">bg-primary-active</p>
          </div>
        </div>
      </section>

      {/* Status Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Status Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-status-success h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Success</p>
            <p className="text-xs text-text-secondary">bg-status-success</p>
          </div>
          <div className="text-center">
            <div className="bg-status-warning h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Warning</p>
            <p className="text-xs text-text-secondary">bg-status-warning</p>
          </div>
          <div className="text-center">
            <div className="bg-status-error h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Error</p>
            <p className="text-xs text-text-secondary">bg-status-error</p>
          </div>
          <div className="text-center">
            <div className="bg-status-info h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Info</p>
            <p className="text-xs text-text-secondary">bg-status-info</p>
          </div>
        </div>
      </section>

      {/* Surface Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Surface Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-surface-primary border border-border h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Primary</p>
            <p className="text-xs text-text-secondary">bg-surface-primary</p>
          </div>
          <div className="text-center">
            <div className="bg-surface-secondary border border-border h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Secondary</p>
            <p className="text-xs text-text-secondary">bg-surface-secondary</p>
          </div>
          <div className="text-center">
            <div className="bg-surface-tertiary border border-border h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Tertiary</p>
            <p className="text-xs text-text-secondary">bg-surface-tertiary</p>
          </div>
          <div className="text-center">
            <div className="bg-surface-disabled border border-border h-20 w-full rounded-lg mb-2"></div>
            <p className="text-sm font-medium">Disabled</p>
            <p className="text-xs text-text-secondary">bg-surface-disabled</p>
          </div>
        </div>
      </section>
    </div>
  ),
};

// Typography Scale
export const Typography: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        Typography System
      </h1>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Headings</h2>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-text-primary">
            Heading 1 - text-4xl font-bold
          </h1>
          <h2 className="text-3xl font-bold text-text-primary">
            Heading 2 - text-3xl font-bold
          </h2>
          <h3 className="text-2xl font-semibold text-text-primary">
            Heading 3 - text-2xl font-semibold
          </h3>
          <h4 className="text-xl font-semibold text-text-primary">
            Heading 4 - text-xl font-semibold
          </h4>
          <h5 className="text-lg font-medium text-text-primary">
            Heading 5 - text-lg font-medium
          </h5>
          <h6 className="text-base font-medium text-text-primary">
            Heading 6 - text-base font-medium
          </h6>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Body Text</h2>
        <div className="space-y-2">
          <p className="text-lg text-text-primary">Large body text - text-lg</p>
          <p className="text-base text-text-primary">
            Regular body text - text-base
          </p>
          <p className="text-sm text-text-secondary">
            Small body text - text-sm
          </p>
          <p className="text-xs text-text-tertiary">
            Extra small text - text-xs
          </p>
          <p className="text-2xs text-text-tertiary">
            Very small text - text-2xs
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Text Colors</h2>
        <div className="space-y-2">
          <p className="text-text-primary">
            Primary text color - text-text-primary
          </p>
          <p className="text-text-secondary">
            Secondary text color - text-text-secondary
          </p>
          <p className="text-text-tertiary">
            Tertiary text color - text-text-tertiary
          </p>
          <div className="bg-zinc-950 p-4 rounded-lg">
            <p className="text-text-inverse">
              Inverse text color - text-text-inverse
            </p>
          </div>
        </div>
      </section>
    </div>
  ),
};

// Status Badges
export const StatusBadges: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        Status Badge System
      </h1>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Badge Variants</h2>
        <div className="flex flex-wrap gap-4">
          <span className="badge-success">Completed</span>
          <span className="badge-warning">Pending</span>
          <span className="badge-error">Failed</span>
          <span className="badge-info">Processing</span>
          <span className="badge-pending">Pending Approval</span>
          <span className="badge-processing">In Progress</span>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Usage Examples</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="badge-success">Active</span>
            <span>User account is active</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-warning">Busy</span>
            <span>Driver is currently busy</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-error">Payment Failed</span>
            <span>Transaction could not be processed</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-info">Scheduled</span>
            <span>Appointment is scheduled</span>
          </div>
        </div>
      </section>
    </div>
  ),
};

// Component Utilities
export const ComponentUtilities: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        Component Utilities
      </h1>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Button Classes</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn-primary">Primary Button</button>
          <button className="btn-secondary">Secondary Button</button>
          <button className="btn-destructive">Destructive Button</button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Card Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Standard Card</h3>
            <p className="text-text-secondary">Uses .card class with shadow</p>
          </div>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold mb-2">Elevated Card</h3>
            <p className="text-text-secondary">
              Uses .card-elevated class with larger shadow
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
        <div className="space-y-4">
          <div className="skeleton w-48 h-6"></div>
          <div className="skeleton-text w-32 h-4"></div>
          <div className="skeleton-title w-64 h-8"></div>
          <div className="skeleton-avatar w-12 h-12 rounded-full"></div>
        </div>
      </section>
    </div>
  ),
};
