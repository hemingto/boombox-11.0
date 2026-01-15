/**
 * @fileoverview Skeleton component stories for Storybook
 * Skeleton components for content loading states with multiple variants
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import {
 Skeleton,
 SkeletonText,
 SkeletonTitle,
 SkeletonAvatar,
 SkeletonButton,
 SkeletonCard,
 SkeletonTable,
 SkeletonList,
} from './Skeleton';

const meta = {
 title: 'Components/UI/Primitives/Skeleton',
 component: Skeleton,
 parameters: {
  layout: 'centered',
  docs: {
   description: {
    component:
     'Skeleton components for content loading states. Provides various pre-built skeleton variants for common UI patterns.',
   },
  },
 },
 tags: ['autodocs'],
 argTypes: {
  className: {
   control: 'text',
   description: 'Additional CSS classes',
  },
  children: {
   control: 'text',
   description: 'Custom skeleton content',
  },
 },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic skeleton
export const Default: Story = {
 args: {
  className: 'w-48 h-4',
 },
};

// Base skeleton variants
export const BasicText: Story = {
 render: () => <SkeletonText />,
};

export const BasicTitle: Story = {
 render: () => <SkeletonTitle />,
};

export const BasicAvatar: Story = {
 render: () => <SkeletonAvatar />,
};

export const BasicButton: Story = {
 render: () => <SkeletonButton />,
};

// Custom skeleton shapes
export const CustomShapes: Story = {
 render: () => (
  <div className="space-y-4">
   <div className="text-sm font-medium text-gray-700 mb-2">Custom Shapes</div>
   <div className="space-y-2">
    <Skeleton className="w-full h-4" />
    <Skeleton className="w-3/4 h-4" />
    <Skeleton className="w-1/2 h-4" />
    <Skeleton className="w-1/4 h-4" />
   </div>
   <div className="space-y-2">
    <Skeleton className="w-16 h-16 rounded-full" />
    <Skeleton className="w-24 h-6 rounded-full" />
    <Skeleton className="w-32 h-8" />
    <Skeleton className="w-full h-20" />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// Text variants with different widths
export const TextVariants: Story = {
 render: () => (
  <div className="space-y-4 w-96">
   <div className="text-sm font-medium text-gray-700 mb-2">Text Skeletons</div>
   <SkeletonText />
   <SkeletonText className="w-3/4" />
   <SkeletonText className="w-1/2" />
   <SkeletonText className="w-1/4" />
   <SkeletonText className="w-full h-6" />
   <SkeletonText className="w-2/3 h-3" />
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// Title variants
export const TitleVariants: Story = {
 render: () => (
  <div className="space-y-4 w-96">
   <div className="text-sm font-medium text-gray-700 mb-2">Title Skeletons</div>
   <SkeletonTitle />
   <SkeletonTitle className="w-3/4" />
   <SkeletonTitle className="w-1/2" />
   <SkeletonTitle className="h-8" />
   <SkeletonTitle className="h-10 w-2/3" />
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// Avatar variants
export const AvatarVariants: Story = {
 render: () => (
  <div className="space-y-4">
   <div className="text-sm font-medium text-gray-700 mb-2">Avatar Skeletons</div>
   <div className="flex items-center space-x-4">
    <SkeletonAvatar className="w-8 h-8" />
    <SkeletonAvatar />
    <SkeletonAvatar className="w-12 h-12" />
    <SkeletonAvatar className="w-16 h-16" />
    <SkeletonAvatar className="w-20 h-20" />
   </div>
   <div className="flex items-center space-x-4">
    <SkeletonAvatar className="w-10 h-10 rounded-lg" />
    <SkeletonAvatar className="w-12 h-12 rounded-lg" />
    <SkeletonAvatar className="w-16 h-16 rounded-lg" />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// Button variants
export const ButtonVariants: Story = {
 render: () => (
  <div className="space-y-4">
   <div className="text-sm font-medium text-gray-700 mb-2">Button Skeletons</div>
   <div className="flex items-center space-x-4">
    <SkeletonButton className="h-8 w-16" />
    <SkeletonButton />
    <SkeletonButton className="h-12 w-32" />
    <SkeletonButton className="h-10 w-40" />
   </div>
   <div className="flex items-center space-x-4">
    <SkeletonButton className="h-8 w-8 rounded-full" />
    <SkeletonButton className="h-10 w-10 rounded-full" />
    <SkeletonButton className="h-12 w-12 rounded-full" />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// Card skeleton
export const Card: Story = {
 render: () => <SkeletonCard />,
 parameters: {
  layout: 'padded',
 },
};

export const CardVariants: Story = {
 render: () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
   <SkeletonCard lines={2} />
   <SkeletonCard lines={4} />
   <SkeletonCard lines={5} className="p-8" />
   <SkeletonCard lines={3} className="p-4" />
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// Table skeleton
export const Table: Story = {
 render: () => <SkeletonTable />,
 parameters: {
  layout: 'padded',
 },
};

export const TableVariants: Story = {
 render: () => (
  <div className="space-y-8">
   <div>
    <div className="text-sm font-medium text-gray-700 mb-2">Small Table</div>
    <SkeletonTable rows={3} columns={3} />
   </div>
   <div>
    <div className="text-sm font-medium text-gray-700 mb-2">Large Table</div>
    <SkeletonTable rows={8} columns={6} />
   </div>
   <div>
    <div className="text-sm font-medium text-gray-700 mb-2">Wide Table</div>
    <SkeletonTable rows={4} columns={8} />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// List skeleton
export const List: Story = {
 render: () => <SkeletonList />,
 parameters: {
  layout: 'padded',
 },
};

export const ListVariants: Story = {
 render: () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
   <div>
    <div className="text-sm font-medium text-gray-700 mb-2">Short List</div>
    <SkeletonList items={2} />
   </div>
   <div>
    <div className="text-sm font-medium text-gray-700 mb-2">Long List</div>
    <SkeletonList items={6} />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// Complex layout examples
export const BlogPostLayout: Story = {
 render: () => (
  <div className="max-w-2xl mx-auto space-y-6">
   <div className="space-y-4">
    <SkeletonTitle className="w-3/4" />
    <div className="flex items-center space-x-4">
     <SkeletonAvatar />
     <div className="space-y-2">
      <SkeletonText className="w-32" />
      <SkeletonText className="w-24 h-3" />
     </div>
    </div>
   </div>
   
   <Skeleton className="w-full h-48 rounded-lg" />
   
   <div className="space-y-3">
    <SkeletonText />
    <SkeletonText className="w-11/12" />
    <SkeletonText className="w-4/5" />
    <SkeletonText className="w-3/4" />
   </div>
   
   <div className="space-y-3">
    <SkeletonText />
    <SkeletonText className="w-5/6" />
    <SkeletonText className="w-2/3" />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

export const UserProfileLayout: Story = {
 render: () => (
  <div className="max-w-md mx-auto space-y-6">
   {/* Header */}
   <div className="text-center space-y-4">
    <SkeletonAvatar className="w-24 h-24 mx-auto" />
    <div className="space-y-2">
     <SkeletonTitle className="w-48 mx-auto" />
     <SkeletonText className="w-32 mx-auto" />
    </div>
   </div>
   
   {/* Stats */}
   <div className="grid grid-cols-3 gap-4">
    {Array.from({ length: 3 }, (_, i) => (
     <div key={i} className="text-center space-y-2">
      <SkeletonTitle className="w-12 h-8 mx-auto" />
      <SkeletonText className="w-16 mx-auto" />
     </div>
    ))}
   </div>
   
   {/* Bio */}
   <div className="space-y-3">
    <SkeletonTitle className="w-20" />
    <SkeletonText />
    <SkeletonText className="w-4/5" />
    <SkeletonText className="w-3/5" />
   </div>
   
   {/* Actions */}
   <div className="flex space-x-3">
    <SkeletonButton className="flex-1" />
    <SkeletonButton className="w-12 h-10" />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

export const DashboardLayout: Story = {
 render: () => (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between">
    <SkeletonTitle className="w-48" />
    <SkeletonButton />
   </div>
   
   {/* Stats Cards */}
   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {Array.from({ length: 4 }, (_, i) => (
     <SkeletonCard key={i} lines={2} className="p-4" />
    ))}
   </div>
   
   {/* Main Content */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Chart Area */}
    <div className="lg:col-span-2">
     <SkeletonCard lines={1} className="p-4 mb-4" />
     <Skeleton className="w-full h-64 rounded-lg" />
    </div>
    
    {/* Sidebar */}
    <div className="space-y-4">
     <SkeletonCard lines={2} />
     <SkeletonList items={4} />
    </div>
   </div>
   
   {/* Table */}
   <div>
    <SkeletonTitle className="w-32 mb-4" />
    <SkeletonTable rows={5} columns={5} />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// Interactive loading simulation
export const LoadingSimulation: Story = {
 render: () => {
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
   const timer = setTimeout(() => setLoading(false), 4000); // Increased time to better see animation
   return () => clearTimeout(timer);
  }, []);
  
  return (
   <div className="space-y-4 w-96">
    <div className="flex items-center justify-between">
     <button
      onClick={() => setLoading(!loading)}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
     >
      {loading ? 'Show Content' : 'Show Loading'}
     </button>
     {loading && (
      <span className="text-sm text-gray-500 italic">
       Watch the shimmer effect →
      </span>
     )}
    </div>
    
    {loading ? (
     <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center space-x-4">
       <SkeletonAvatar />
       <div className="flex-1 space-y-2">
        <SkeletonText className="w-32" />
        <SkeletonText className="w-24 h-3" />
       </div>
      </div>
      <SkeletonTitle className="w-3/4" />
      <div className="space-y-2">
       <SkeletonText />
       <SkeletonText className="w-4/5" />
       <SkeletonText className="w-2/3" />
      </div>
      <div className="flex space-x-2 pt-2">
       <SkeletonButton className="w-20" />
       <SkeletonButton className="w-24" />
      </div>
     </div>
    ) : (
     <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center space-x-4">
       <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
        JD
       </div>
       <div>
        <div className="font-semibold">John Doe</div>
        <div className="text-sm text-gray-500">Software Engineer</div>
       </div>
      </div>
      <h2 className="text-xl font-bold">Welcome to the Dashboard</h2>
      <p className="text-gray-600">
       This is the actual content that would appear after loading.
       The skeleton components help provide a smooth loading experience
       while the real data is being fetched.
      </p>
      <div className="flex space-x-2 pt-2">
       <button className="px-4 py-2 bg-blue-500 text-white rounded text-sm">
        View Profile
       </button>
       <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm">
        Edit Settings
       </button>
      </div>
     </div>
    )}
   </div>
  );
 },
 parameters: {
  layout: 'padded',
 },
};

// Shimmer Animation Demo
export const ShimmerAnimation: Story = {
 render: () => (
  <div className="space-y-6">
   <div className="text-center">
    <h3 className="text-lg font-semibold mb-2">Shimmer Animation Effect</h3>
    <p className="text-gray-600 mb-6">Watch the smooth shimmer animation across all skeleton elements</p>
   </div>
   
   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Different sizes demo */}
    <div className="space-y-4">
     <h4 className="font-medium text-gray-700">Various Sizes</h4>
     <SkeletonText className="w-full" />
     <SkeletonText className="w-3/4" />
     <SkeletonText className="w-1/2" />
     <SkeletonText className="w-1/4" />
     <SkeletonTitle className="w-2/3 mt-4" />
     <div className="flex items-center space-x-4 mt-4">
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
       <SkeletonText className="w-3/4" />
       <SkeletonText className="w-1/2" />
      </div>
     </div>
    </div>
    
    {/* Card demo */}
    <div className="space-y-4">
     <h4 className="font-medium text-gray-700">Card Layout</h4>
     <SkeletonCard lines={4} />
    </div>
   </div>
   
   {/* Button row */}
   <div className="flex space-x-4 justify-center">
    <SkeletonButton className="w-20" />
    <SkeletonButton className="w-32" />
    <SkeletonButton className="w-24" />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};

// All variants showcase
export const AllVariants: Story = {
 render: () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
   <div className="space-y-2">
    <h3 className="font-semibold text-gray-800">Basic Elements</h3>
    <SkeletonText />
    <SkeletonTitle />
    <SkeletonAvatar />
    <SkeletonButton />
   </div>
   
   <div className="space-y-2">
    <h3 className="font-semibold text-gray-800">Cards</h3>
    <SkeletonCard lines={3} />
   </div>
   
   <div className="space-y-2">
    <h3 className="font-semibold text-gray-800">Lists</h3>
    <SkeletonList items={3} />
   </div>
   
   <div className="lg:col-span-3 space-y-2">
    <h3 className="font-semibold text-gray-800">Tables</h3>
    <SkeletonTable rows={3} columns={4} />
   </div>
  </div>
 ),
 parameters: {
  layout: 'padded',
 },
};
