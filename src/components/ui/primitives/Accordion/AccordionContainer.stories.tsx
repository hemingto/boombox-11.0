/**
 * @fileoverview AccordionContainer component stories for Storybook
 * Container component for managing multiple accordion items with various behaviors
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AccordionContainer, type AccordionData } from './AccordionContainer';

const meta = {
  title: 'Components/UI/Primitives/AccordionContainer',
  component: AccordionContainer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Container component that manages the state and behavior of multiple accordion items. Supports single or multiple open accordions, default open states, and centralized event handling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Array of accordion data items to render',
    },
    defaultOpenIndex: {
      control: { type: 'number', min: 0 },
      description: 'Index of accordion to be open by default (null for none)',
    },
    alwaysOpen: {
      control: 'boolean',
      description: 'Whether at least one accordion should always remain open',
    },
    allowMultiple: {
      control: 'boolean',
      description: 'Whether multiple accordions can be open simultaneously',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the container',
    },
    accordionClassName: {
      control: 'text',
      description: 'Additional CSS classes for individual accordion items',
    },
    contentClassName: {
      control: 'text',
      description: 'Additional CSS classes for accordion content',
    },
    ariaLabel: {
      control: 'text',
      description: 'ARIA label for the accordion group',
    },
  },
  args: {
    defaultOpenIndex: 0,
    alwaysOpen: false,
    allowMultiple: false,
    onAccordionChange: (index: number) => console.log('Accordion changed:', index),
  },
} satisfies Meta<typeof AccordionContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for stories
const faqData: AccordionData[] = [
  {
    question: 'What is your return policy?',
    answer: 'You can return items within 30 days of purchase for a full refund. Items must be in original condition with tags attached.',
    category: 'policy',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
  },
  {
    question: 'How do I track my order?',
    answer: 'You can track your order using the tracking number provided in your confirmation email. Visit our tracking page and enter your order number.',
    category: 'shipping',
  },
  {
    question: 'What payment methods do you accept?',
    answer: (
      <div>
        <p className="mb-2">We accept the following payment methods:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Credit and debit cards (Visa, MasterCard, American Express)</li>
          <li>PayPal</li>
          <li>Apple Pay and Google Pay</li>
          <li>Bank transfers for orders over $500</li>
        </ul>
      </div>
    ),
    category: 'payment',
  },
  {
    question: 'Do you offer international shipping?',
    answer: 'Yes, we ship to over 50 countries worldwide. International shipping rates and delivery times vary by destination.',
    category: 'shipping',
  },
];

const helpData: AccordionData[] = [
  {
    id: 'getting-started',
    question: 'Getting Started',
    answer: (
      <div>
        <p className="mb-4">Welcome! Here's how to get started:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Create your account</li>
          <li>Verify your email address</li>
          <li>Complete your profile</li>
          <li>Start exploring our features</li>
        </ol>
      </div>
    ),
    category: 'onboarding',
  },
  {
    id: 'account-management',
    question: 'Account Management',
    answer: 'Learn how to update your profile, change your password, and manage your account settings.',
    category: 'account',
  },
  {
    id: 'troubleshooting',
    question: 'Troubleshooting',
    answer: 'Common issues and solutions to help you resolve problems quickly.',
    category: 'support',
  },
];

const productData: AccordionData[] = [
  {
    question: 'Product Specifications',
    answer: (
      <div>
        <h4 className="font-semibold mb-2">Technical Details:</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dimensions: 24" × 18" × 12"</li>
          <li>Weight: 15 lbs</li>
          <li>Material: Premium aluminum alloy</li>
          <li>Color options: Black, Silver, White</li>
          <li>Warranty: 2 years</li>
        </ul>
      </div>
    ),
    category: 'specs',
  },
  {
    question: 'Installation Guide',
    answer: 'Step-by-step installation instructions with diagrams and video tutorials.',
    category: 'installation',
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&h=400&fit=crop',
  },
  {
    question: 'Maintenance & Care',
    answer: 'Keep your product in excellent condition with these maintenance tips and cleaning instructions.',
    category: 'maintenance',
  },
];

// Default FAQ accordion
export const Default: Story = {
  args: {
    data: faqData,
    ariaLabel: 'Frequently Asked Questions',
  },
};

// No default open accordion
export const NoneOpenByDefault: Story = {
  args: {
    data: faqData,
    defaultOpenIndex: null,
    ariaLabel: 'FAQ - All Closed Initially',
  },
};

// Always keep one open
export const AlwaysOpen: Story = {
  args: {
    data: helpData,
    defaultOpenIndex: 0,
    alwaysOpen: true,
    ariaLabel: 'Help Documentation',
  },
};

// Allow multiple open
export const AllowMultiple: Story = {
  args: {
    data: productData,
    defaultOpenIndex: 0,
    allowMultiple: true,
    ariaLabel: 'Product Information',
  },
};

// Multiple open with always open behavior
export const MultipleAlwaysOpen: Story = {
  args: {
    data: helpData,
    defaultOpenIndex: 0,
    allowMultiple: true,
    alwaysOpen: true,
    ariaLabel: 'Help Center - Multiple Sections',
  },
};

// Custom styling
export const CustomStyling: Story = {
  args: {
    data: faqData.slice(0, 3), // Use fewer items for this example
    defaultOpenIndex: 1,
    className: 'bg-surface-secondary p-4 rounded-lg',
    accordionClassName: 'bg-surface-primary rounded-md mb-2 last:mb-0',
    contentClassName: 'bg-surface-tertiary',
    ariaLabel: 'Styled FAQ Section',
  },
};

// Compact FAQ
export const CompactFAQ: Story = {
  args: {
    data: [
      {
        question: 'Is shipping free?',
        answer: 'Yes, we offer free shipping on orders over $50.',
        category: 'shipping',
      },
      {
        question: 'How long is the warranty?',
        answer: 'All products come with a 1-year manufacturer warranty.',
        category: 'warranty',
      },
      {
        question: 'Can I return opened items?',
        answer: 'Yes, as long as they are returned within 30 days.',
        category: 'returns',
      },
    ],
    defaultOpenIndex: null,
    ariaLabel: 'Quick FAQ',
  },
};

// Help center with rich content
export const HelpCenter: Story = {
  args: {
    data: [
      {
        id: 'video-tutorials',
        question: 'Video Tutorials',
        answer: (
          <div>
            <p className="mb-4">Watch our comprehensive video tutorials:</p>
            <div className="grid gap-3">
              <div className="p-3 bg-surface-secondary rounded-md">
                <h5 className="font-medium">Getting Started (5 min)</h5>
                <p className="text-sm text-text-secondary">Basic setup and first steps</p>
              </div>
              <div className="p-3 bg-surface-secondary rounded-md">
                <h5 className="font-medium">Advanced Features (12 min)</h5>
                <p className="text-sm text-text-secondary">Unlock the full potential</p>
              </div>
              <div className="p-3 bg-surface-secondary rounded-md">
                <h5 className="font-medium">Troubleshooting (8 min)</h5>
                <p className="text-sm text-text-secondary">Common issues and solutions</p>
              </div>
            </div>
          </div>
        ),
        category: 'tutorials',
      },
      {
        id: 'contact-support',
        question: 'Contact Support',
        answer: (
          <div>
            <p className="mb-4">Need additional help? We're here for you:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-status-success rounded-full"></div>
                <span>Email: support@example.com</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-status-success rounded-full"></div>
                <span>Phone: 1-800-HELP (Mon-Fri 9AM-6PM)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-status-success rounded-full"></div>
                <span>Live Chat: Available 24/7</span>
              </div>
            </div>
          </div>
        ),
        category: 'support',
      },
      {
        id: 'community',
        question: 'Community & Resources',
        answer: (
          <div>
            <p className="mb-4">Join our community and access additional resources:</p>
            <ul className="space-y-2">
              <li>• User Forum - Ask questions and share tips</li>
              <li>• Documentation - Comprehensive guides and API docs</li>
              <li>• Blog - Latest updates and best practices</li>
              <li>• Newsletter - Monthly tips and feature announcements</li>
            </ul>
          </div>
        ),
        category: 'community',
      },
    ],
    defaultOpenIndex: 0,
    allowMultiple: true,
    ariaLabel: 'Help & Support Center',
  },
};

// Single item accordion
export const SingleItem: Story = {
  args: {
    data: [
      {
        question: 'Important Notice',
        answer: 'This is an important announcement that all users should be aware of. Please read carefully.',
        category: 'notice',
      },
    ],
    defaultOpenIndex: 0,
    alwaysOpen: true,
    ariaLabel: 'System Notice',
  },
};

// Accessibility showcase
export const AccessibilityShowcase: Story = {
  args: {
    data: [
      {
        id: 'keyboard-navigation',
        question: 'Keyboard Navigation',
        answer: (
          <div>
            <p className="mb-3">Navigate this accordion using keyboard only:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><kbd className="px-2 py-1 bg-surface-tertiary rounded text-sm">Tab</kbd> - Move between accordion headers</li>
              <li><kbd className="px-2 py-1 bg-surface-tertiary rounded text-sm">Space</kbd> or <kbd className="px-2 py-1 bg-surface-tertiary rounded text-sm">Enter</kbd> - Toggle accordion</li>
              <li><kbd className="px-2 py-1 bg-surface-tertiary rounded text-sm">Shift + Tab</kbd> - Move backwards</li>
            </ul>
          </div>
        ),
        category: 'accessibility',
      },
      {
        id: 'screen-readers',
        question: 'Screen Reader Support',
        answer: 'This accordion announces state changes and provides proper context to screen reader users through ARIA attributes.',
        category: 'accessibility',
      },
      {
        id: 'focus-indicators',
        question: 'Focus Indicators',
        answer: 'Clear visual focus indicators help users understand which element currently has keyboard focus.',
        category: 'accessibility',
      },
    ],
    defaultOpenIndex: 0,
    ariaLabel: 'Accessibility Features Demo',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates accessibility features including keyboard navigation, screen reader support, and focus management.',
      },
    },
  },
};
