/**
 * @fileoverview Modal component stories for Storybook
 * Modal component with pure Tailwind CSS, multiple sizes, and accessibility features
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../Button';

const meta = {
  title: 'Components/UI/Primitives/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible modal component built with pure Tailwind CSS. Supports multiple sizes, accessibility features, and customizable behavior.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    title: {
      control: 'text',
      description: 'Modal title',
    },
    variant: {
      control: 'select',
      options: ['default', 'notification'],
      description: 'Modal variant - affects styling and behavior',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Size variant of the modal',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Whether to show the close button',
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Whether clicking outside closes modal',
    },
    showNotificationButton: {
      control: 'boolean',
      description: 'Show a default "Got it, thanks!" button for notifications',
    },
    notificationButtonText: {
      control: 'text',
      description: 'Custom text for the notification button',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for modal content',
    },
    overlayClassName: {
      control: 'text',
      description: 'Additional CSS classes for modal overlay',
    },
    children: {
      control: 'text',
      description: 'Modal content',
    },
  },
  args: {
    open: false,
    showCloseButton: true,
    closeOnOverlayClick: true,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper component for stories
const ModalWrapper: React.FC<{
  children: React.ReactNode;
  buttonText?: string;
  modalProps?: Partial<React.ComponentProps<typeof Modal>>;
}> = ({ children, buttonText = 'Open Modal', modalProps = {} }) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
    // Call the original onClose if provided
    modalProps.onClose?.();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{buttonText}</Button>
      <Modal 
        {...modalProps} 
        open={open} 
        onClose={handleClose}
      >
        {children}
      </Modal>
    </>
  );
};

// Default story
export const Default: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      modalProps={{
        title: 'Default Modal',
      }}
    >
      <div>
        <p>This is the modal content area. You can place any content here.</p>
        <div className="flex gap-2 justify-end mt-12">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Confirm</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

// Size variants
export const Small: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Open Small Modal"
      modalProps={{
        title: 'Small Modal',
        size: 'sm',
      }}
    >
      <p>This is a small modal with limited content space.</p>
    </ModalWrapper>
  ),
};

export const Medium: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Open Medium Modal"
      modalProps={{
        title: 'Medium Modal',
        size: 'md',
      }}
    >
      <div className="space-y-4">
        <p>This is a medium-sized modal with moderate content space.</p>
        <p>Perfect for most use cases like confirmations and forms.</p>
      </div>
    </ModalWrapper>
  ),
};

export const Large: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Open Large Modal"
      modalProps={{
        title: 'Large Modal',
        size: 'lg',
      }}
    >
      <div className="space-y-4">
        <p>This is a large modal with more content space.</p>
        <p>Suitable for complex forms or detailed information.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-semibold">Section 1</h4>
            <p>Content area 1</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-semibold">Section 2</h4>
            <p>Content area 2</p>
          </div>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const ExtraLarge: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Open XL Modal"
      modalProps={{
        title: 'Extra Large Modal',
        size: 'xl',
      }}
    >
      <div className="space-y-6">
        <p>This is an extra-large modal for extensive content.</p>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded">
              <h4 className="font-semibold">Item {i + 1}</h4>
              <p>Content for item {i + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const FullScreen: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Open Full Screen Modal"
      modalProps={{
        title: 'Full Screen Modal',
        size: 'full',
      }}
    >
      <div className="space-y-6 min-h-[70vh]">
        <p>This modal takes up the full available space.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded">
              <h4 className="font-semibold">Section {i + 1}</h4>
              <p>Detailed content for section {i + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  ),
};

// Without close button
export const NoCloseButton: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Modal without Close Button"
      modalProps={{
        title: 'No Close Button',
        showCloseButton: false,
      }}
    >
      <div className="space-y-4">
        <p>This modal can only be closed by clicking Cancel or outside.</p>
        <p>This modal doesn't have a close button in the header.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

// Prevent close on overlay click
export const NoOverlayClose: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Modal with Disabled Overlay Close"
      modalProps={{
        title: 'Overlay Close Disabled',
        closeOnOverlayClick: false,
      }}
    >
      <div className="space-y-4">
        <p>This modal can only be closed using the close button or actions.</p>
        <p>Clicking outside this modal won't close it.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Continue</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

// Without title or description
export const ContentOnly: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper buttonText="Content-Only Modal">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Custom Header</h3>
        <p>This modal doesn't use the built-in title and description props.</p>
        <p>Instead, it relies on custom content for the header and body.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Dismiss</Button>
          <Button variant="primary">Acknowledge</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

// Confirmation modal
export const ConfirmationModal: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Delete Item"
      modalProps={{
        title: 'Confirm Deletion',
        size: 'sm',
      }}
    >
      <div className="space-y-4">
        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">
            <strong>Warning:</strong> This will permanently delete the selected item.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

// Form modal
export const FormModal: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Add New Item"
      modalProps={{
        title: 'Add New Item',
        size: 'lg',
      }}
    >
      <form className="space-y-4">
        <p>Fill out the form below to create a new item.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter item name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select a category</option>
            <option value="category1">Category 1</option>
            <option value="category2">Category 2</option>
            <option value="category3">Category 3</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Item
          </Button>
        </div>
      </form>
    </ModalWrapper>
  ),
};

// Email Quote Modal (matches screenshot design)
export const EmailQuoteModal: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => (
    <ModalWrapper
      buttonText="Email your quote"
      modalProps={{
        title: 'Email your quote',
        size: 'sm',
      }}
    >
      <div className="space-y-4">
        <div className="relative">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Send</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

// All sizes showcase (static)
export const AllSizes: Story = {
  args: {
    onClose: () => {},
    children: null,
  },
  render: () => {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    
    const sizes = [
      { key: 'sm', label: 'Small', description: 'Compact modal for simple content' },
      { key: 'md', label: 'Medium', description: 'Default size for most use cases' },
      { key: 'lg', label: 'Large', description: 'Spacious modal for complex content' },
      { key: 'xl', label: 'Extra Large', description: 'Maximum space for extensive content' },
      { key: 'full', label: 'Full Screen', description: 'Full viewport modal' },
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {sizes.map(({ key, label }) => (
            <Button
              key={key}
              variant="outline"
              onClick={() => setActiveModal(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        
        {sizes.map(({ key, label, description }) => (
          <Modal
            key={key}
            open={activeModal === key}
            onClose={() => setActiveModal(null)}
            title={`${label} Modal`}
            size={key as any}
          >
            <div className="space-y-4">
              <p>{description}</p>
              <p>This is a {label.toLowerCase()} modal example.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setActiveModal(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        ))}
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};

// Notification variant stories
export const NotificationModal: Story = {
  args: {
    title: 'Information',
    variant: 'notification',
    showNotificationButton: true,
    children: 'This is an informational message that will help you understand something important.',
  },
  render: (args) => (
    <ModalWrapper modalProps={args}>
      {args.children}
    </ModalWrapper>
  ),
};

export const NotificationWithoutButton: Story = {
  args: {
    title: 'Simple Notification',
    variant: 'notification',
    showNotificationButton: false,
    children: 'This notification only has the X button to close. Click outside or press Escape to close.',
  },
  render: (args) => (
    <ModalWrapper modalProps={args}>
      {args.children}
    </ModalWrapper>
  ),
};

export const CustomNotificationButton: Story = {
  args: {
    title: 'Custom Button Text',
    variant: 'notification',
    showNotificationButton: true,
    notificationButtonText: 'Understood!',
    children: 'This notification has a custom button text.',
  },
  render: (args) => (
    <ModalWrapper modalProps={args}>
      {args.children}
    </ModalWrapper>
  ),
};
