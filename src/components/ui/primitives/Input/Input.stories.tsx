/**
 * @fileoverview Input component stories for Storybook
 * Input component with icon support, error handling, and accessibility
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './Input';
import { EnvelopeIcon, LockClosedIcon, PhoneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const meta = {
  title: 'Components/UI/Primitives/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible input component with icon support, error handling, and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Input variant for different visual styles',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'tel', 'url', 'search'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    label: {
      control: 'text',
      description: 'Label for the input field',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display below input',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    variant: 'default',
    size: 'md',
    placeholder: 'Enter text...',
    disabled: false,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    placeholder: 'Enter your name',
  },
};

// Input types
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email address',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter your password',
  },
};

export const Phone: Story = {
  args: {
    type: 'tel',
    placeholder: '(555) 123-4567',
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

// States
export const WithValue: Story = {
  args: {
    defaultValue: 'John Doe',
    placeholder: 'Enter your name',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    defaultValue: 'Cannot edit this',
  },
};

export const ErrorState: Story = {
  args: {
    id: 'error-email-input',
    label: 'Email Address',
    variant: 'error',
    placeholder: 'Enter valid email',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
  },
};

export const WithHelperText: Story = {
  args: {
    id: 'helper-email-input',
    label: 'Email Address',
    placeholder: 'Enter your email',
    helperText: 'We will never share your email with anyone else.',
  },
};

// Icon examples
export const WithEmailIcon: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'Enter your email',
    icon: <EnvelopeIcon />,
    iconPosition: 'left',
  },
};

export const WithPasswordIcon: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    icon: <LockClosedIcon />,
    iconPosition: 'left',
  },
};

export const WithPhoneIcon: Story = {
  args: {
    label: 'Phone Number',
    type: 'tel',
    placeholder: '(555) 123-4567',
    icon: <PhoneIcon />,
    iconPosition: 'left',
  },
};

export const WithSearchIcon: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
    icon: <MagnifyingGlassIcon />,
    iconPosition: 'left',
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'Enter your email',
    icon: <EnvelopeIcon />,
    iconPosition: 'right',
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <Input label="Normal Input" placeholder="Enter text..." />
      </div>
      <div>
        <Input 
          label="Email Input" 
          type="email" 
          placeholder="Enter email..." 
          icon={<EnvelopeIcon />}
          iconPosition="left"
        />
      </div>
      <div>
        <Input
          label="Error State"
          variant="error"
          placeholder="Invalid input"
          defaultValue="error@"
          error="Please enter a valid email address"
        />
      </div>
      <div>
        <Input
          label="Success State"
          variant="success"
          placeholder="Valid input"
          defaultValue="success@example.com"
        />
      </div>
      <div>
        <Input
          label="With Helper Text"
          placeholder="Enter your email"
          helperText="We'll use this to send you important updates"
          icon={<EnvelopeIcon />}
          iconPosition="left"
        />
      </div>
      <div>
        <Input
          label="Search Input"
          type="search"
          placeholder="Search..."
          icon={<MagnifyingGlassIcon />}
          iconPosition="left"
        />
      </div>
      <div>
        <Input
          label="Disabled Input"
          disabled
          placeholder="Cannot edit"
          defaultValue="Disabled"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
