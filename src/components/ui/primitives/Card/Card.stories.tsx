/**
 * @fileoverview Storybook stories for Card component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/UI/Primitives/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible card component for displaying content with image, title, and description. Supports blog posts, location cards, and general content display.',
      },
    },
  },
  argTypes: {
    imageSrc: {
      control: 'text',
      description: 'URL path to the image',
    },
    imageAlt: {
      control: 'text',
      description: 'Alt text for accessibility',
    },
    location: {
      control: 'text',
      description: 'Primary heading text (typically location)',
    },
    blogtitle: {
      control: 'text',
      description: 'Secondary heading text (typically blog title)',
    },
    description: {
      control: 'text',
      description: 'Description content',
    },
    customerCount: {
      control: 'text',
      description: 'Customer count or numerical data',
    },
    link: {
      control: 'text',
      description: 'Navigation URL',
    },
    author: {
      control: 'text',
      description: 'Author name for blog posts',
    },
    readTime: {
      control: 'text',
      description: 'Read time estimate',
    },
    external: {
      control: 'boolean',
      description: 'Whether to open link in new tab',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

// Default story
export const Default: Story = {
  args: {
    imageSrc: '/img/san-francisco.png',
    imageAlt: 'San Francisco cityscape',
    location: 'San Francisco',
    description: 'Premium storage solutions in the heart of the city',
    customerCount: '1,200+',
    link: '/locations/san-francisco',
  },
};

// Blog post card
export const BlogPost: Story = {
  args: {
    imageSrc: '/placeholder.jpg',
    imageAlt: 'Golden Gate Bridge',
    blogtitle: 'Essential Moving Tips for San Francisco Residents',
    description: 'Navigate the unique challenges of moving in San Francisco with our expert guide',
    author: 'Sarah Johnson',
    readTime: '5 min read',
    link: '/blog/sf-moving-tips',
  },
};

// Location card with customer count
export const LocationCard: Story = {
  args: {
    imageSrc: '/img/berkeley.png',
    imageAlt: 'Berkeley Hills view',
    location: 'Berkeley',
    description: 'Secure storage with easy access',
    customerCount: '850+',
    link: '/locations/berkeley',
  },
};

// Minimal card
export const Minimal: Story = {
  args: {
    imageSrc: '/img/logo.png',
    imageAlt: 'Boombox Storage',
    location: 'Quick Storage',
    link: '/get-quote',
  },
};

// External link card
export const ExternalLink: Story = {
  args: {
    imageSrc: '/placeholder.jpg',
    imageAlt: 'Golden Gate Bridge',
    blogtitle: 'Moving Guide on External Blog',
    description: 'Comprehensive moving resources and tips',
    author: 'Moving Experts',
    readTime: '10 min read',
    link: 'https://example.com/moving-guide',
    external: true,
  },
};

// Long content card (tests text truncation)
export const LongContent: Story = {
  args: {
    imageSrc: '/img/san-francisco.png',
    imageAlt: 'San Francisco skyline',
    location: 'San Francisco Premium Storage Solutions and Services',
    blogtitle: 'The Ultimate Guide to Premium Storage Solutions in San Francisco Bay Area',
    description: 'Discover our comprehensive storage solutions designed specifically for San Francisco residents, featuring climate-controlled units, 24/7 security, and convenient pickup services throughout the entire Bay Area region.',
    customerCount: '2,500+',
    author: 'Storage Team',
    readTime: '15 min read',
    link: '/locations/sf-premium',
  },
};

// All card variants in a grid
export const CardVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      <Card
        imageSrc="/img/san-francisco.png"
        imageAlt="San Francisco cityscape"
        location="San Francisco"
        description="Premium storage solutions"
        customerCount="1,200+"
        link="/locations/san-francisco"
      />
      <Card
        imageSrc="/placeholder.jpg"
        imageAlt="Golden Gate Bridge"
        blogtitle="Moving Tips for SF"
        description="Expert guide for city moves"
        author="Sarah Johnson"
        readTime="5 min read"
        link="/blog/sf-moving-tips"
      />
      <Card
        imageSrc="/img/berkeley.png"
        imageAlt="Berkeley Hills"
        location="Berkeley"
        description="Secure storage access"
        customerCount="850+"
        link="/locations/berkeley"
      />
      <Card
        imageSrc="/img/logo.png"
        imageAlt="Boombox Storage"
        location="Quick Storage"
        link="/get-quote"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Interactive states demo
export const InteractiveStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Hover to see scale effect</h3>
        <Card
          imageSrc="/img/san-francisco.png"
          imageAlt="San Francisco cityscape"
          location="Hover Demo"
          description="Hover over this card to see the scale and background transition"
          link="/demo"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Focus with keyboard navigation</h3>
        <p className="text-sm text-text-secondary mb-4">
          Tab to focus this card and see the focus ring for accessibility
        </p>
        <Card
          imageSrc="/img/berkeley.png"
          imageAlt="Berkeley Hills"
          location="Focus Demo"
          description="This card demonstrates keyboard focus states"
          link="/demo"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
