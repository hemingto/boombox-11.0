/**
 * @fileoverview LoadingOverlay component stories for Storybook
 * Full-screen loading overlay component with spinner and customizable message
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { LoadingOverlay } from './LoadingOverlay';

const meta = {
 title: 'Components/UI/Primitives/LoadingOverlay',
 component: LoadingOverlay,
 parameters: {
  layout: 'fullscreen',
  docs: {
   description: {
    component:
     'A full-screen loading overlay component with spinner and customizable message. Perfect for blocking user interaction during async operations.',
   },
  },
  // Ensure Storybook preview area has proper styling for overlay
  backgrounds: {
   default: 'light',
  },
 },
 tags: ['autodocs'],
 argTypes: {
  visible: {
   control: 'boolean',
   description: 'Whether the overlay is visible',
  },
  message: {
   control: 'text',
   description: 'Loading message to display',
  },
  spinnerSize: {
   control: 'select',
   options: ['md', 'lg', 'xl'],
   description: 'Size of the spinner',
  },
  className: {
   control: 'text',
   description: 'Additional CSS classes for overlay',
  },
  contentClassName: {
   control: 'text',
   description: 'Additional CSS classes for content container',
  },
 },
 args: {
  visible: true,
  message: 'Loading...',
  spinnerSize: 'xl',
 },
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simple test story to debug background color
export const BackgroundTest: Story = {
 args: {
  visible: true,
  message: 'Testing background visibility',
  spinnerSize: 'xl',
 },
 render: (args) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8 text-center">Background Color Test</h1>
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
     <h2 className="text-xl font-semibold mb-4">Test Content</h2>
     <p className="text-gray-600 mb-4">
      This story tests if the LoadingOverlay background color is visible.
      You should see a dark semi-transparent overlay covering this content.
     </p>
     <div className="grid grid-cols-3 gap-4">
      <div className="bg-red-100 p-4 rounded">Red Box</div>
      <div className="bg-green-100 p-4 rounded">Green Box</div>
      <div className="bg-blue-100 p-4 rounded">Blue Box</div>
     </div>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

// Default story
export const Default: Story = {
 args: {
  visible: true,
  message: 'Loading...',
  spinnerSize: 'xl',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Sample Content</h1>
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
     <h2 className="text-xl font-semibold mb-4">Content Area</h2>
     <p className="text-gray-600 mb-4">
      This is some sample content that would be blocked while loading.
      The overlay appears on top of this content.
     </p>
     <button className="px-6 py-3 bg-blue-500 text-white rounded-lg">
      Sample Button
     </button>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

// Different spinner sizes
export const MediumSpinner: Story = {
 args: {
  visible: true,
  message: 'Processing your request...',
  spinnerSize: 'md',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Medium Spinner Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows a medium-sized spinner overlay.
     </p>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

export const LargeSpinner: Story = {
 args: {
  visible: true,
  message: 'Please wait while we load your data...',
  spinnerSize: 'lg',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Large Spinner Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows a large-sized spinner overlay.
     </p>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

export const ExtraLargeSpinner: Story = {
 args: {
  visible: true,
  message: 'This may take a few moments...',
  spinnerSize: 'xl',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Extra Large Spinner Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows an extra-large spinner overlay.
     </p>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

// Different messages
export const ShortMessage: Story = {
 args: {
  visible: true,
  message: 'Saving...',
  spinnerSize: 'lg',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Short Message Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows a loading overlay with a short message.
     </p>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

export const LongMessage: Story = {
 args: {
  visible: true,
  message: 'Please wait while we process your payment and update your account information. This may take up to 30 seconds.',
  spinnerSize: 'xl',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Long Message Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows a loading overlay with a longer, more detailed message.
     </p>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

export const NoMessage: Story = {
 args: {
  visible: true,
  message: undefined,
  spinnerSize: 'xl',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">No Message Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows a loading overlay with no message prop (shows default "Loading...").
     </p>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

export const EmptyMessage: Story = {
 args: {
  visible: true,
  message: '',
  spinnerSize: 'lg',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Empty Message Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows a loading overlay with an empty message (no text displayed).
     </p>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

// Hidden state
export const Hidden: Story = {
 args: {
  visible: false,
  message: 'This should not be visible',
  spinnerSize: 'xl',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Hidden Overlay Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows the page content without an overlay when visible=false.
      The overlay should not be displayed.
     </p>
     <button className="px-4 py-2 bg-blue-500 text-white rounded-lg mt-4">
      You can interact with this content
     </button>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

// Custom styling
export const CustomStyling: Story = {
 args: {
  visible: true,
  message: 'Custom styled overlay',
  spinnerSize: 'lg',
  className: 'bg-blue-900 bg-opacity-75',
  contentClassName: 'p-8 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Custom Styling Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows a loading overlay with custom styling including blue background
      and frosted glass effect for the content area.
     </p>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

export const DifferentBackground: Story = {
 args: {
  visible: true,
  message: 'Alternative background color',
  spinnerSize: 'xl',
  className: 'bg-red-950 bg-opacity-60',
 },
 render: (args) => (
  <div className="min-h-screen bg-gray-100 p-8">
   <div className="max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Different Background Example</h1>
    <div className="bg-white rounded-lg shadow-md p-6">
     <p className="text-gray-600">
      This shows a loading overlay with a custom red background color
      instead of the default dark background.
     </p>
    </div>
   </div>
   <LoadingOverlay {...args} />
  </div>
 ),
};

// Interactive demo with mock content
export const InteractiveDemo: Story = {
 render: () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startLoading = () => {
   setLoading(true);
   setProgress(0);
   
   // Simulate loading progress
   const interval = setInterval(() => {
    setProgress(prev => {
     if (prev >= 100) {
      clearInterval(interval);
      setLoading(false);
      return 0;
     }
     return prev + 10;
    });
   }, 300);
  };

  return (
   <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-2xl mx-auto">
     <h1 className="text-3xl font-bold mb-8">Loading Overlay Demo</h1>
     
     <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Sample Content</h2>
      <p className="text-gray-600 mb-4">
       This is some sample content that would be blocked while loading.
       Click the button below to see the loading overlay in action.
      </p>
      
      <button
       onClick={startLoading}
       disabled={loading}
       className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
       {loading ? 'Loading...' : 'Start Loading Process'}
      </button>
     </div>

     <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Features</h3>
      <ul className="space-y-2 text-gray-600">
       <li>• Full-screen overlay blocks user interaction</li>
       <li>• Customizable spinner sizes and messages</li>
       <li>• Accessible with proper ARIA attributes</li>
       <li>• Smooth animations and transitions</li>
       <li>• Easy to integrate with any async operation</li>
      </ul>
     </div>
    </div>

    <LoadingOverlay
     visible={loading}
     message={`Loading progress: ${progress}%`}
     spinnerSize="xl"
    />
   </div>
  );
 },
};

// Form submission simulation
export const FormSubmission: Story = {
 render: () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
   e.preventDefault();
   setSubmitting(true);
   
   // Simulate form submission
   setTimeout(() => {
    setSubmitting(false);
    alert('Form submitted successfully!');
   }, 3000);
  };

  return (
   <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-md mx-auto">
     <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Contact Form</h2>
      
      <div className="space-y-4">
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
         Name
        </label>
        <input
         type="text"
         required
         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
         placeholder="Your name"
        />
       </div>
       
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
         Email
        </label>
        <input
         type="email"
         required
         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
         placeholder="your.email@example.com"
        />
       </div>
       
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
         Message
        </label>
        <textarea
         required
         rows={4}
         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
         placeholder="Your message here..."
        />
       </div>
      </div>
      
      <button
       type="submit"
       disabled={submitting}
       className="w-full mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
       {submitting ? 'Submitting...' : 'Send Message'}
      </button>
     </form>
    </div>

    <LoadingOverlay
     visible={submitting}
     message="Submitting your message..."
     spinnerSize="lg"
    />
   </div>
  );
 },
};

// File upload simulation
export const FileUpload: Story = {
 render: () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const simulateUpload = () => {
   setUploading(true);
   setUploadProgress(0);
   
   const interval = setInterval(() => {
    setUploadProgress(prev => {
     if (prev >= 100) {
      clearInterval(interval);
      setTimeout(() => {
       setUploading(false);
       setUploadProgress(0);
      }, 500);
      return 100;
     }
     return prev + Math.random() * 15;
    });
   }, 200);
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
    <div className="max-w-lg mx-auto">
     <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-center mb-6">File Upload</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
       <div className="mb-4">
        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
       </div>
       <p className="text-gray-600 mb-4">
        Drag and drop your files here, or click to select
       </p>
       <button
        onClick={simulateUpload}
        disabled={uploading}
        className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
       >
        {uploading ? 'Uploading...' : 'Select Files'}
       </button>
      </div>
     </div>
    </div>

    <LoadingOverlay
     visible={uploading}
     message={uploadProgress < 100 ? `Uploading files... ${Math.round(uploadProgress)}%` : 'Upload complete!'}
     spinnerSize="xl"
    />
   </div>
  );
 },
};

// Data fetching simulation
export const DataFetching: Story = {
 render: () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = () => {
   setLoading(true);
   setData([]);
   
   // Simulate API call
   setTimeout(() => {
    setData([
     { id: 1, name: 'John Doe', email: 'john@example.com' },
     { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
     { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    ]);
    setLoading(false);
   }, 2500);
  };

  return (
   <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-4xl mx-auto">
     <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">User Directory</h1>
      <button
       onClick={fetchData}
       disabled={loading}
       className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
       {loading ? 'Loading...' : 'Refresh Data'}
      </button>
     </div>

     <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {data.length > 0 ? (
       <table className="w-full">
        <thead className="bg-gray-50">
         <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           Email
          </th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
         {data.map((user) => (
          <tr key={user.id}>
           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {user.name}
           </td>
           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {user.email}
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      ) : (
       <div className="p-8 text-center text-gray-500">
        No data available. Click "Refresh Data" to load users.
       </div>
      )}
     </div>
    </div>

    <LoadingOverlay
     visible={loading}
     message="Fetching user data from server..."
     spinnerSize="lg"
    />
   </div>
  );
 },
};

// All sizes comparison
export const AllSizes: Story = {
 render: () => {
  const [activeSize, setActiveSize] = useState<'md' | 'lg' | 'xl' | null>(null);

  const sizes = [
   { key: 'md' as const, label: 'Medium', description: 'Compact spinner for subtle loading' },
   { key: 'lg' as const, label: 'Large', description: 'Standard spinner for most use cases' },
   { key: 'xl' as const, label: 'Extra Large', description: 'Prominent spinner for important operations' },
  ];

  return (
   <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-2xl mx-auto">
     <h2 className="text-2xl font-bold text-center mb-8">Spinner Size Comparison</h2>
     
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sizes.map(({ key, label, description }) => (
       <div key={key} className="bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">{label}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <button
         onClick={() => setActiveSize(key)}
         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
         Show {label}
        </button>
       </div>
      ))}
     </div>

     <div className="mt-8 text-center">
      <button
       onClick={() => setActiveSize(null)}
       className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
       Hide Overlay
      </button>
     </div>
    </div>

    <LoadingOverlay
     visible={activeSize !== null}
     message={activeSize ? `${activeSize.toUpperCase()} Spinner Example` : ''}
     spinnerSize={activeSize || 'lg'}
    />
   </div>
  );
 },
};

// Accessibility showcase
export const AccessibilityShowcase: Story = {
 render: () => {
  const [loading, setLoading] = useState(false);

  return (
   <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-2xl mx-auto">
     <h2 className="text-2xl font-bold mb-6">Accessibility Features</h2>
     
     <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Loading Overlay Accessibility</h3>
      <ul className="space-y-2 text-gray-600 mb-6">
       <li>• <strong>Screen Reader Support:</strong> Spinner has proper ARIA labels</li>
       <li>• <strong>Focus Management:</strong> Prevents interaction with background content</li>
       <li>• <strong>High Contrast:</strong> White spinner on dark semi-transparent background</li>
       <li>• <strong>Keyboard Navigation:</strong> Blocks tab navigation to background elements</li>
       <li>• <strong>Loading State:</strong> Clear visual and textual indication of loading</li>
      </ul>
      
      <button
       onClick={() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 3000);
       }}
       disabled={loading}
       className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
       aria-describedby="loading-description"
      >
       {loading ? 'Processing...' : 'Test Accessibility'}
      </button>
      
      <p id="loading-description" className="text-sm text-gray-500 mt-2">
       Click to show accessible loading overlay for 3 seconds
      </p>
     </div>
    </div>

    <LoadingOverlay
     visible={loading}
     message="Processing your request with full accessibility support..."
     spinnerSize="lg"
    />
   </div>
  );
 },
};
