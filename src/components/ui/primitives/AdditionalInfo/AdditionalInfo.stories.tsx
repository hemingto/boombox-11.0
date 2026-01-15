/**
 * @fileoverview Storybook stories for AdditionalInfo component
 * Component for displaying supplemental information in a styled container
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AdditionalInfo } from './AdditionalInfo';

const meta: Meta<typeof AdditionalInfo> = {
  title: 'Components/UI/Primitives/AdditionalInfo',
  component: AdditionalInfo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A component for displaying additional context or helper text in a visually distinct container. Perfect for form hints, explanatory notes, and supplemental information.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'The informational text content to display',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for styling customization',
    },
    id: {
      control: 'text',
      description: 'Unique identifier for the component',
    },
    'aria-label': {
      control: 'text',
      description: 'ARIA label for screen readers (optional, defaults to text content)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: 'This is additional information to help explain the context.',
  },
};

export const FormHint: Story = {
  args: {
    text: 'Your password must be at least 8 characters long and contain at least one number.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Common usage as a form field hint providing instructions to users.',
      },
    },
  },
};

export const ImportantNotice: Story = {
  args: {
    text: 'Important: Please review your information carefully before submitting. Changes cannot be undone after confirmation.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Used for important notices or warnings that require user attention.',
      },
    },
  },
};

export const ShortText: Story = {
  args: {
    text: 'Required field',
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays properly even with very short text content.',
      },
    },
  },
};

export const LongText: Story = {
  args: {
    text: 'This is a much longer piece of additional information that demonstrates how the component handles extensive text content. It will wrap naturally within the container while maintaining proper spacing and readability. The component automatically adjusts its height to accommodate the content while preserving the design system styling.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates text wrapping behavior for longer content while maintaining design consistency.',
      },
    },
  },
};

export const CustomStyling: Story = {
  args: {
    text: 'This example shows custom styling applied to the component.',
    className: 'border-border-warning bg-status-bg-warning',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of applying custom styling using the className prop while maintaining design system compliance.',
      },
    },
  },
};

export const WithAccessibilityLabel: Story = {
  args: {
    text: 'Processing your request...',
    'aria-label': 'Request processing status update',
    id: 'processing-status',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including custom ARIA labels and unique IDs for enhanced screen reader support.',
      },
    },
  },
};

export const MultipleTogether: Story = {
  render: () => (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="form-label">Email Address</label>
        <input type="email" className="input-field" placeholder="Enter your email" />
        <AdditionalInfo text="We'll use this email to send you updates about your order." />
      </div>
      
      <div>
        <label className="form-label">Phone Number</label>
        <input type="tel" className="input-field" placeholder="(555) 123-4567" />
        <AdditionalInfo text="Include area code. This number will be used for delivery coordination." />
      </div>
      
      <div>
        <label className="form-label">Special Instructions</label>
        <textarea className="input-field h-24" placeholder="Any special delivery instructions..."></textarea>
        <AdditionalInfo text="Optional: Let us know about parking restrictions, access codes, or other important details." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world example showing multiple AdditionalInfo components used with form fields to provide contextual help.',
      },
    },
  },
};

export const ResponsiveLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Desktop View</h3>
        <AdditionalInfo text="On larger screens, this information appears alongside other content with proper spacing." />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Mobile View</h3>
        <AdditionalInfo text="On smaller screens, the responsive spacing ensures optimal readability and touch accessibility." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates responsive spacing behavior across different screen sizes (sm:mb-4 mb-2).',
      },
    },
  },
};

export const BoomboxUseCases: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h4 className="text-md font-medium mb-3">Moving Quote Information</h4>
        <AdditionalInfo text="Prices are estimates based on the information provided. Final pricing will be confirmed after our team reviews your specific requirements." />
      </div>
      
      <div>
        <h4 className="text-md font-medium mb-3">Storage Unit Guidelines</h4>
        <AdditionalInfo text="All items must be properly packaged and labeled. Hazardous materials, perishables, and valuables are not permitted in storage units." />
      </div>
      
      <div>
        <h4 className="text-md font-medium mb-3">Driver Assignment</h4>
        <AdditionalInfo text="Our system automatically matches you with the most qualified driver in your area. You'll receive driver details 24 hours before your scheduled move." />
      </div>
      
      <div>
        <h4 className="text-md font-medium mb-3">Packing Supplies</h4>
        <AdditionalInfo text="Free delivery on orders over $50. Eco-friendly options available. Return unused supplies for a full refund within 30 days." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of how AdditionalInfo is used throughout the Boombox application to provide context and guidance to users.',
      },
    },
  },
};

export const AccessibilityShowcase: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Standard Implementation</h4>
        <AdditionalInfo text="This uses the default accessibility features with auto-generated aria-label." />
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Enhanced Accessibility</h4>
        <AdditionalInfo 
          text="Status: Your request is being processed..." 
          aria-label="Real-time processing status for your moving quote request"
          id="quote-processing-status"
        />
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Live Region Updates</h4>
        <AdditionalInfo text="Changes to this information will be announced to screen readers thanks to aria-live='polite'." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the accessibility features including ARIA roles, labels, and live regions for screen reader compatibility.',
      },
    },
  },
};

export const DesignSystemIntegration: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Design System Colors</h4>
        <AdditionalInfo text="Uses bg-surface-primary and border-border from the design system." />
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Semantic Typography</h4>
        <AdditionalInfo text="Text uses text-text-tertiary for proper hierarchy and readability." />
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Consistent Spacing</h4>
        <AdditionalInfo text="Spacing follows the design system with mt-4, p-3, and responsive margins." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how the component integrates with the design system using semantic color tokens and spacing patterns.',
      },
    },
  },
};
