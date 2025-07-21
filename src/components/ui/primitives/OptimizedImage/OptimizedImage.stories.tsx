/**
 * @fileoverview OptimizedImage component stories for Storybook
 * Performance-optimized image component with Next.js Image integration
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { OptimizedImage } from './OptimizedImage';

const meta = {
  title: 'Components/UI/OptimizedImage',
  component: OptimizedImage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Performance-optimized image component with Next.js Image integration, fallback support, loading skeletons, and aspect ratio control. Designed to replace bg-slate placeholder divs for better SEO and performance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alternative text for accessibility',
    },
    aspectRatio: {
      control: 'select',
      options: ['square', 'video', 'portrait', 'landscape', 'wide'],
      description: 'Aspect ratio for consistent sizing',
    },
    fallbackSrc: {
      control: 'text',
      description: 'Fallback image URL if main image fails',
    },
    showSkeleton: {
      control: 'boolean',
      description: 'Show loading skeleton while image loads',
    },
    loading: {
      control: 'select',
      options: ['lazy', 'eager'],
      description: 'Loading strategy',
    },
    quality: {
      control: { type: 'range', min: 1, max: 100, step: 1 },
      description: 'Image quality (1-100)',
    },
  },
} satisfies Meta<typeof OptimizedImage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    src: '/img/logo.png',
    alt: 'Boombox Logo',
    width: 200,
    height: 200,
    aspectRatio: 'square',
  },
};

// Square aspect ratio
export const Square: Story = {
  args: {
    src: '/img/logo.png',
    alt: 'Square image',
    width: 200,
    height: 200,
    aspectRatio: 'square',
  },
};

// Video aspect ratio (16:9)
export const Video: Story = {
  args: {
    src: '/img/golden-gate.png',
    alt: 'Video aspect ratio',
    width: 320,
    height: 180,
    aspectRatio: 'video',
  },
};

// With skeleton loading
export const WithSkeleton: Story = {
  args: {
    src: '/img/logo.png',
    alt: 'With skeleton loading',
    width: 200,
    height: 200,
    showSkeleton: true,
    aspectRatio: 'square',
  },
};

// Without skeleton loading
export const WithoutSkeleton: Story = {
  args: {
    src: '/img/logo.png',
    alt: 'Without skeleton loading',
    width: 200,
    height: 200,
    showSkeleton: false,
    aspectRatio: 'square',
  },
};

// Error handling with fallback
export const WithFallback: Story = {
  args: {
    src: '/img/nonexistent-image.jpg',
    fallbackSrc: '/img/logo.png',
    alt: 'Image with fallback',
    width: 200,
    height: 200,
    aspectRatio: 'square',
  },
};

// High quality image
export const HighQuality: Story = {
  args: {
    src: '/img/golden-gate.png',
    alt: 'High quality image',
    width: 400,
    height: 300,
    quality: 95,
    aspectRatio: 'landscape',
  },
};

// Priority loading (for hero images)
export const PriorityLoading: Story = {
  args: {
    src: '/img/golden-gate.png',
    alt: 'Priority loading image',
    width: 800,
    height: 400,
    loading: 'eager',
    priority: true,
    aspectRatio: 'wide',
  },
};
