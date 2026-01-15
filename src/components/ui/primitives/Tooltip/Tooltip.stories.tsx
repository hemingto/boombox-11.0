/**
 * @fileoverview Storybook stories for Tooltip component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { InformationCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid';

const meta: Meta<typeof Tooltip> = {
 title: 'Components/UI/Primitives/Tooltip',
 component: Tooltip,
 parameters: {
  layout: 'centered',
  docs: {
   description: {
    component: 'An accessible tooltip component built with Headless UI that provides contextual information on hover or focus. Features proper ARIA support and customizable positioning.',
   },
  },
 },
 tags: ['autodocs'],
 argTypes: {
  text: {
   control: 'text',
   description: 'The tooltip content text',
  },
  position: {
   control: 'select',
   options: ['top', 'bottom', 'left', 'right'],
   description: 'Position of tooltip relative to trigger',
  },
  iconSize: {
   control: 'select',
   options: ['sm', 'md', 'lg'],
   description: 'Size of default icon when no children provided',
  },
  showOnHover: {
   control: 'boolean',
   description: 'Whether to show on hover (true) or click (false)',
  },
  delay: {
   control: 'number',
   description: 'Delay before showing tooltip on hover (in ms)',
  },
 },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
 args: {
  text: 'This is a helpful tooltip message that provides additional context.',
 },
};

export const Positions: Story = {
 render: () => (
  <div className="grid grid-cols-2 gap-8 p-8">
   <div className="flex justify-center">
    <Tooltip text="Tooltip on top" position="top" />
    <span className="ml-2">Top</span>
   </div>
   <div className="flex justify-center">
    <Tooltip text="Tooltip on bottom" position="bottom" />
    <span className="ml-2">Bottom</span>
   </div>
   <div className="flex justify-center">
    <Tooltip text="Tooltip on left" position="left" />
    <span className="ml-2">Left</span>
   </div>
   <div className="flex justify-center">
    <Tooltip text="Tooltip on right" position="right" />
    <span className="ml-2">Right</span>
   </div>
  </div>
 ),
 parameters: {
  docs: {
   description: {
    story: 'Tooltip positioning options. Hover over each icon to see the tooltip in different positions.',
   },
  },
 },
};

export const IconSizes: Story = {
 render: () => (
  <div className="flex items-center gap-6">
   <div className="flex items-center gap-2">
    <Tooltip text="Small tooltip icon" iconSize="sm" />
    <span>Small</span>
   </div>
   <div className="flex items-center gap-2">
    <Tooltip text="Medium tooltip icon" iconSize="md" />
    <span>Medium</span>
   </div>
   <div className="flex items-center gap-2">
    <Tooltip text="Large tooltip icon" iconSize="lg" />
    <span>Large</span>
   </div>
  </div>
 ),
 parameters: {
  docs: {
   description: {
    story: 'Different icon sizes for the default question mark trigger.',
   },
  },
 },
};

export const CustomTriggers: Story = {
 render: () => (
  <div className="flex items-center gap-6">
   <Tooltip text="Information about this feature">
    <InformationCircleIcon className="w-5 h-5 text-blue-500 cursor-help" />
   </Tooltip>
   
   <Tooltip text="Click for help">
    <button className="px-3 py-1 text-sm bg-zinc-100 rounded hover:bg-zinc-200">
     Help
    </button>
   </Tooltip>
   
   <Tooltip text="This text has a tooltip">
    <span className="underline decoration-dotted cursor-help">
     Hover me
    </span>
   </Tooltip>
  </div>
 ),
 parameters: {
  docs: {
   description: {
    story: 'Custom trigger elements can be used instead of the default question mark icon.',
   },
  },
 },
};

export const LongContent: Story = {
 args: {
  text: 'This is a much longer tooltip that demonstrates how the component handles multiline content. It should wrap appropriately and maintain good readability while staying within the maximum width constraints.',
  position: 'top',
 },
 parameters: {
  docs: {
   description: {
    story: 'Tooltips with longer content automatically wrap to multiple lines with a maximum width.',
   },
  },
 },
};

export const DelayVariations: Story = {
 render: () => (
  <div className="flex items-center gap-6">
   <div className="flex items-center gap-2">
    <Tooltip text="No delay" delay={0} />
    <span>No delay</span>
   </div>
   <div className="flex items-center gap-2">
    <Tooltip text="200ms delay (default)" delay={200} />
    <span>Default delay</span>
   </div>
   <div className="flex items-center gap-2">
    <Tooltip text="500ms delay" delay={500} />
    <span>Slow delay</span>
   </div>
  </div>
 ),
 parameters: {
  docs: {
   description: {
    story: 'Different delay timings for showing tooltips on hover.',
   },
  },
 },
};

export const FormField: Story = {
 render: () => (
  <div className="space-y-4 max-w-md">
   <div>
    <label className="flex items-center gap-2 text-sm font-medium text-zinc-950 mb-1">
     Email Address
     <Tooltip text="We'll use this email to send you important updates about your orders." />
    </label>
    <input
     type="email"
     className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950"
     placeholder="Enter your email"
    />
   </div>
   
   <div>
    <label className="flex items-center gap-2 text-sm font-medium text-zinc-950 mb-1">
     Storage Duration
     <Tooltip 
      text="Storage charges are calculated monthly. You can retrieve your items anytime with 24-hour notice."
      position="right"
     />
    </label>
    <select className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950">
     <option>1 month</option>
     <option>3 months</option>
     <option>6 months</option>
     <option>12 months</option>
    </select>
   </div>
  </div>
 ),
 parameters: {
  docs: {
   description: {
    story: 'Real-world usage example showing tooltips providing helpful context in form fields.',
   },
  },
 },
};

export const AccessibilityDemo: Story = {
 render: () => (
  <div className="space-y-4">
   <p className="text-sm text-zinc-600 mb-4">
    Use Tab to navigate and see keyboard accessibility in action:
   </p>
   <div className="flex items-center gap-6">
    <Tooltip text="Accessible via keyboard navigation">
     <button className="px-4 py-2 bg-zinc-950 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2">
      Focus me
     </button>
    </Tooltip>
    
    <Tooltip text="Also keyboard accessible" position="bottom">
     <a href="#" className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
      Link with tooltip
     </a>
    </Tooltip>
   </div>
  </div>
 ),
 parameters: {
  docs: {
   description: {
    story: 'Accessibility features including keyboard navigation and proper ARIA attributes.',
   },
  },
 },
};
