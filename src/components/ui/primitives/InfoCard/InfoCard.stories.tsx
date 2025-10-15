/**
 * @fileoverview Storybook stories for InfoCard component
 */

import type { Meta, StoryObj } from '@storybook/react';
import InfoCard from './InfoCard';
import { CalendarIcon, TruckIcon, MapPinIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const meta: Meta<typeof InfoCard> = {
  title: 'Components/UI/Primitives/InfoCard',
  component: InfoCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A reusable info card component that displays information with a title, description, call-to-action button, and optional close button. Supports different variants for different use cases.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'The main title of the card',
    },
    description: {
      control: 'text',
      description: 'The description text or content',
    },
    buttonText: {
      control: 'text',
      description: 'Text displayed on the action button',
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
      description: 'Visual variant of the card',
    },
    showCloseIcon: {
      control: 'boolean',
      description: 'Whether to show the close icon',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InfoCard>;

// Base story
export const Default: Story = {
  args: {
    title: 'Schedule Your Move',
    description: 'Book your moving appointment and get started with our professional service.',
    buttonText: 'Book Now',
    buttonIcon: <CalendarIcon className="w-4 h-4" />,
    onButtonClick: () => alert('Button clicked!'),
    variant: 'default',
    showCloseIcon: false,
  },
};

// Variants
export const Success: Story = {
  args: {
    ...Default.args,
    title: 'Booking Confirmed',
    description: 'Your moving appointment has been successfully scheduled. You will receive a confirmation email shortly.',
    buttonText: 'View Details',
    buttonIcon: <CheckCircleIcon className="w-4 h-4" />,
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    ...Default.args,
    title: 'Weather Alert',
    description: 'There may be weather-related delays in your area. Please stay updated on your appointment status.',
    buttonText: 'Check Status',
    buttonIcon: <ExclamationTriangleIcon className="w-4 h-4" />,
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    ...Default.args,
    title: 'Booking Failed',
    description: 'We encountered an issue processing your booking. Please try again or contact support.',
    buttonText: 'Retry',
    buttonIcon: <XCircleIcon className="w-4 h-4" />,
    variant: 'error',
  },
};

export const Info: Story = {
  args: {
    ...Default.args,
    title: 'Service Area Information',
    description: 'Learn more about our service areas and coverage to ensure we can help with your move.',
    buttonText: 'View Coverage',
    buttonIcon: <InformationCircleIcon className="w-4 h-4" />,
    variant: 'info',
  },
};

// With close button
export const WithCloseButton: Story = {
  args: {
    ...Default.args,
    title: 'Limited Time Offer',
    description: 'Get 20% off your first move when you book this month. Don\'t miss out on this special promotion!',
    buttonText: 'Get Discount',
    buttonIcon: <TruckIcon className="w-4 h-4" />,
    showCloseIcon: true,
    onClose: () => alert('Close clicked!'),
  },
};

// With longer content
export const LongContent: Story = {
  args: {
    ...Default.args,
    title: 'Moving Guidelines and Preparation',
    description: (
      <div>
        <p>Prepare for your move with these important guidelines:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Pack fragile items with extra care</li>
          <li>Label boxes clearly with contents and destination room</li>
          <li>Keep important documents with you during the move</li>
          <li>Take photos of valuable items before packing</li>
        </ul>
      </div>
    ),
    buttonText: 'Full Checklist',
    buttonIcon: <MapPinIcon className="w-4 h-4" />,
    showCloseIcon: true,
  },
};

// Custom styling
export const CustomStyling: Story = {
  args: {
    ...Default.args,
    title: 'Custom Styled Card',
    description: 'This card demonstrates custom styling capabilities.',
    buttonText: 'Learn More',
    buttonIcon: <InformationCircleIcon className="w-4 h-4" />,
    className: 'max-w-md mx-auto shadow-lg',
    variant: 'info',
  },
};
