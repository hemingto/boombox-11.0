/**
 * @fileoverview TextArea component stories for Storybook
 * TextArea component with design system integration, multiple variants, and accessibility features
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { TextArea } from './TextArea';

const meta = {
  title: 'Components/UI/Primitives/TextArea',
  component: TextArea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible textarea component with design system integration. Supports multiple sizes, variants, validation states, and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Visual style variant of the textarea',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the textarea field',
    },
    label: {
      control: 'text',
      description: 'Label for the textarea field',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display below textarea',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the textarea takes full width',
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
      description: 'Resize behavior of the textarea',
    },
    rows: {
      control: 'number',
      description: 'Number of visible text lines',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    required: false,
    fullWidth: false,
    disabled: false,
    resize: 'vertical',
    rows: 4,
  },
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter your description here...',
  },
};

// Size variants
export const Small: Story = {
  args: {
    label: 'Small TextArea',
    size: 'sm',
    placeholder: 'Small size textarea...',
    rows: 3,
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium TextArea',
    size: 'md',
    placeholder: 'Medium size textarea...',
    rows: 4,
  },
};

export const Large: Story = {
  args: {
    label: 'Large TextArea',
    size: 'lg',
    placeholder: 'Large size textarea...',
    rows: 5,
  },
};

// With label and helper text
export const WithHelperText: Story = {
  args: {
    label: 'Comments',
    helperText: 'Please provide any additional comments or feedback',
    placeholder: 'Type your comments here...',
    rows: 4,
  },
};

// Required field
export const Required: Story = {
  args: {
    label: 'Required Field',
    required: true,
    helperText: 'This field is required',
    placeholder: 'This field cannot be empty...',
  },
};

// Error state
export const WithError: Story = {
  args: {
    label: 'Message',
    error: 'Message must be at least 10 characters long',
    value: 'Too short',
    placeholder: 'Enter your message...',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: 'Disabled TextArea',
    disabled: true,
    value: 'This content cannot be edited',
    helperText: 'This field is currently disabled',
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    label: 'Full Width TextArea',
    fullWidth: true,
    placeholder: 'This textarea takes the full width of its container...',
    rows: 5,
  },
  parameters: {
    layout: 'padded',
  },
};

// Resize variants
export const NoResize: Story = {
  args: {
    label: 'No Resize',
    resize: 'none',
    placeholder: 'This textarea cannot be resized',
    helperText: 'resize="none"',
  },
};

export const VerticalResize: Story = {
  args: {
    label: 'Vertical Resize',
    resize: 'vertical',
    placeholder: 'This textarea can be resized vertically only',
    helperText: 'resize="vertical" (default)',
  },
};

export const HorizontalResize: Story = {
  args: {
    label: 'Horizontal Resize',
    resize: 'horizontal',
    placeholder: 'This textarea can be resized horizontally only',
    helperText: 'resize="horizontal"',
  },
};

export const BothResize: Story = {
  args: {
    label: 'Both Directions',
    resize: 'both',
    placeholder: 'This textarea can be resized in both directions',
    helperText: 'resize="both"',
  },
};

// Different row counts
export const RowVariants: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <TextArea
        label="2 Rows"
        rows={2}
        placeholder="Short textarea with 2 rows"
      />
      <TextArea
        label="4 Rows"
        rows={4}
        placeholder="Standard textarea with 4 rows (default)"
      />
      <TextArea
        label="8 Rows"
        rows={8}
        placeholder="Tall textarea with 8 rows"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Controlled component
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      
      // Validation logic
      if (newValue.length < 10 && newValue.length > 0) {
        setError('Message must be at least 10 characters long');
      } else if (newValue.length > 500) {
        setError('Message cannot exceed 500 characters');
      } else {
        setError('');
      }
    };

    const handleClear = () => {
      setValue('');
      setError('');
    };

    return (
      <div className="space-y-4 w-96">
        <TextArea
          label="Controlled TextArea"
          value={value}
          onChange={handleChange}
          error={error}
          placeholder="Start typing to see validation..."
          onClearError={() => setError('')}
          rows={5}
        />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {value.length}/500 characters
          </div>
          <button
            onClick={handleClear}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        
        {value && (
          <div className="p-3 bg-gray-50 rounded text-sm">
            <strong>Preview:</strong>
            <p className="mt-1 whitespace-pre-wrap">{value}</p>
          </div>
        )}
      </div>
    );
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <TextArea
        label="Small Size"
        size="sm"
        placeholder="Small textarea..."
        rows={3}
      />
      <TextArea
        label="Medium Size"
        size="md"
        placeholder="Medium textarea..."
        rows={4}
      />
      <TextArea
        label="Large Size"
        size="lg"
        placeholder="Large textarea..."
        rows={5}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// All states showcase
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
      <TextArea
        label="Default State"
        placeholder="Normal textarea field"
        helperText="This is a normal textarea field"
      />
      <TextArea
        label="Required Field"
        required
        placeholder="This field is required"
        helperText="This field is required"
      />
      <TextArea
        label="Error State"
        error="This field has an error"
        value="Invalid content"
        placeholder="Error state textarea"
      />
      <TextArea
        label="Disabled State"
        disabled
        value="This content cannot be edited"
        helperText="This field is currently disabled"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Form example
export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      feedback: '',
      notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Clear error when field is filled
      if (value && errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};
      
      if (!formData.title) newErrors.title = 'Title is required';
      if (!formData.description) newErrors.description = 'Description is required';
      if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
      
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        alert('Form submitted successfully!');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6 w-96">
        <TextArea
          label="Title"
          required
          value={formData.title}
          onChange={handleChange('title')}
          error={errors.title}
          placeholder="Enter a brief title..."
          rows={2}
          resize="none"
        />
        
        <TextArea
          label="Description"
          required
          value={formData.description}
          onChange={handleChange('description')}
          error={errors.description}
          placeholder="Provide a detailed description..."
          helperText="Minimum 20 characters required"
          rows={5}
        />
        
        <TextArea
          label="Additional Feedback"
          value={formData.feedback}
          onChange={handleChange('feedback')}
          placeholder="Any additional feedback (optional)..."
          rows={4}
          size="sm"
        />
        
        <TextArea
          label="Internal Notes"
          value={formData.notes}
          onChange={handleChange('notes')}
          placeholder="Internal notes (optional)..."
          helperText="These notes are for internal use only"
          rows={3}
          resize="none"
        />
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit Form
        </button>
      </form>
    );
  },
  parameters: {
    layout: 'padded',
  },
};

// Character counter example
export const WithCharacterCounter: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const maxLength = 280;
    const isOverLimit = value.length > maxLength;

    return (
      <div className="w-96">
        <TextArea
          label="Tweet Composer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What's happening?"
          error={isOverLimit ? `Message exceeds ${maxLength} character limit` : ''}
          rows={4}
          resize="none"
        />
        <div className={`text-right text-sm mt-1 ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
          {value.length}/{maxLength}
        </div>
      </div>
    );
  },
};

// Auto-expanding example (simulated)
export const AutoExpanding: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [rows, setRows] = useState(3);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      
      // Simple auto-expand logic based on line breaks
      const lineCount = newValue.split('\n').length;
      const newRows = Math.max(3, Math.min(10, lineCount + 1));
      setRows(newRows);
    };

    return (
      <div className="w-96">
        <TextArea
          label="Auto-Expanding TextArea"
          value={value}
          onChange={handleChange}
          placeholder="Start typing... This textarea will expand as you add new lines (simulated)"
          helperText="Minimum 3 rows, maximum 10 rows"
          rows={rows}
          resize="none"
        />
        <div className="text-xs text-gray-500 mt-1">
          Current rows: {rows}
        </div>
      </div>
    );
  },
};

// Rich text simulation
export const RichTextSimulation: Story = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-96">
        <TextArea
          label="Rich Text Content"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter markdown-style content..."
          helperText="Supports **bold**, *italic*, and [links](url)"
          rows={8}
          className="font-mono"
        />
        
        {value && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Preview:</h4>
            <div className="text-sm whitespace-pre-wrap">
              {value.split('\n').map((line, i) => (
                <div key={i}>
                  {line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
                  }
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
};

// Edge cases
export const EdgeCases: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <TextArea
        label="Very Long Text"
        defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        rows={6}
        helperText="Testing with very long pre-filled text"
      />
      
      <TextArea
        label="Single Row"
        rows={1}
        placeholder="Single row textarea"
        helperText="Testing with minimal height"
      />
      
      <TextArea
        label="Many Rows"
        rows={12}
        placeholder="Textarea with many rows"
        helperText="Testing with maximum practical height"
      />
      
      <TextArea
        label="Special Characters"
        defaultValue="Testing with special chars: @#$%^&*()_+{}|:<>?[];',./"
        rows={3}
        helperText="Testing with special characters"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
