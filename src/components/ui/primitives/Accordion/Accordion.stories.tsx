/**
 * @fileoverview Accordion component stories for Storybook
 * Individual accordion component with design system compliance and accessibility features
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Accordion } from './Accordion';

const meta = {
  title: 'Components/UI/Primitives/Accordion',
  component: Accordion,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Individual accordion item component that displays collapsible content with smooth animations. Supports custom content, images, and categories with proper accessibility and keyboard navigation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    question: {
      control: 'text',
      description: 'The question/title text displayed in the accordion header',
    },
    answer: {
      control: 'text',
      description: 'The answer/content displayed when accordion is expanded',
    },
    category: {
      control: 'text',
      description: 'Category for the accordion item (used for grouping/styling)',
    },
    image: {
      control: 'text',
      description: 'Optional image URL to display within the accordion content',
    },
    isOpen: {
      control: 'boolean',
      description: 'Whether the accordion is currently open/expanded',
    },
    id: {
      control: 'text',
      description: 'Unique identifier for accessibility (aria-controls, aria-labelledby)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the accordion container',
    },
    contentClassName: {
      control: 'text',
      description: 'Additional CSS classes for the accordion content',
    },
  },
  args: {
    question: 'What is your return policy?',
    answer: 'You can return items within 30 days of purchase for a full refund.',
    category: 'policy',
    isOpen: false,
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper component for stories
const AccordionWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(args.isOpen || false);

  return (
    <div className="max-w-2xl">
      <Accordion
        {...args}
        isOpen={isOpen}
        toggleAccordion={() => setIsOpen(!isOpen)}
      />
    </div>
  );
};

// Basic accordion story
export const Default: Story = {
  render: AccordionWrapper,
};

// Accordion with longer content
export const LongContent: Story = {
  args: {
    question: 'How does shipping work?',
    answer: 'We offer free shipping on orders over $50. Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days. We ship to all 50 states and provide tracking information once your order has been processed. International shipping is available to select countries with additional fees and longer delivery times.',
    category: 'shipping',
  },
  render: AccordionWrapper,
};

// Accordion with JSX content
export const RichContent: Story = {
  args: {
    question: 'What payment methods do you accept?',
    answer: (
      <div>
        <p className="mb-4">We accept the following payment methods:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Credit cards (Visa, MasterCard, American Express)</li>
          <li>PayPal</li>
          <li>Apple Pay</li>
          <li>Google Pay</li>
          <li>Bank transfers for large orders</li>
        </ul>
        <p className="mt-4 text-sm text-text-tertiary">
          All payments are processed securely through our encrypted payment system.
        </p>
      </div>
    ),
    category: 'payment',
  },
  render: AccordionWrapper,
};

// Accordion with image
export const WithImage: Story = {
  args: {
    question: 'How do I assemble the product?',
    answer: 'Follow the step-by-step instructions included in your package. The process typically takes 15-30 minutes and requires basic tools.',
    category: 'assembly',
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&h=400&fit=crop',
  },
  render: AccordionWrapper,
};

// Initially open accordion
export const InitiallyOpen: Story = {
  args: {
    question: 'Do you offer warranties?',
    answer: 'Yes, all our products come with a 1-year manufacturer warranty that covers defects in materials and workmanship.',
    category: 'warranty',
    isOpen: true,
  },
  render: AccordionWrapper,
};

// FAQ style accordion
export const FAQ: Story = {
  args: {
    question: 'Can I cancel my order?',
    answer: 'You can cancel your order within 24 hours of placement for a full refund. After 24 hours, cancellation may not be possible if the order has already been processed.',
    category: 'faq',
  },
  render: AccordionWrapper,
};

// Help documentation style
export const HelpDoc: Story = {
  args: {
    question: 'How to reset your password',
    answer: (
      <div>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the login page</li>
          <li>Click "Forgot Password?"</li>
          <li>Enter your email address</li>
          <li>Check your email for reset instructions</li>
          <li>Follow the link in the email</li>
          <li>Create a new password</li>
        </ol>
        <div className="mt-4 p-3 bg-status-bg-info text-status-text-info rounded-md">
          <strong>Tip:</strong> Use a password manager to create and store secure passwords.
        </div>
      </div>
    ),
    category: 'help',
  },
  render: AccordionWrapper,
};

// Custom styling example
export const CustomStyling: Story = {
  args: {
    question: 'Custom styled accordion',
    answer: 'This accordion has custom styling applied through className props.',
    category: 'custom',
    className: 'bg-status-bg-success border-status-success',
    contentClassName: 'bg-status-bg-success',
  },
  render: AccordionWrapper,
};

// Accessibility demonstration
export const AccessibilityDemo: Story = {
  args: {
    question: 'Accessibility Features',
    answer: (
      <div>
        <p className="mb-4">This accordion includes comprehensive accessibility features:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>ARIA attributes:</strong> Proper aria-expanded, aria-controls, and aria-labelledby</li>
          <li><strong>Keyboard navigation:</strong> Space and Enter key support</li>
          <li><strong>Focus management:</strong> Visible focus indicators</li>
          <li><strong>Screen reader support:</strong> Semantic HTML and roles</li>
          <li><strong>Color contrast:</strong> WCAG 2.1 AA compliant colors</li>
        </ul>
        <p className="mt-4 text-sm text-text-tertiary">
          Try using Tab, Space, and Enter keys to navigate and interact with this accordion.
        </p>
      </div>
    ),
    category: 'accessibility',
    id: 'accessibility-demo',
  },
  render: AccordionWrapper,
};

// Multiple accordion items to show how they work together
export const MultipleAccordions: Story = {
  render: () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const accordions = [
      {
        question: 'What is included in the package?',
        answer: 'The package includes the main product, accessories, user manual, and warranty information.',
        category: 'product',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 3-5 business days. Express delivery is available for 1-2 day shipping.',
        category: 'shipping',
      },
      {
        question: 'Is there a satisfaction guarantee?',
        answer: 'Yes, we offer a 30-day satisfaction guarantee. If you\'re not happy, return it for a full refund.',
        category: 'guarantee',
      },
    ];

    return (
      <div className="max-w-2xl space-y-0">
        {accordions.map((accordion, index) => (
          <Accordion
            key={index}
            question={accordion.question}
            answer={accordion.answer}
            category={accordion.category}
            isOpen={openIndex === index}
            toggleAccordion={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing multiple accordion items working together with single-select behavior.',
      },
    },
  },
};
