/**
 * @fileoverview Select component stories for Storybook
 * Select component with design system integration, multiple variants, and accessibility features
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Select } from './Select';
import { 
  ShieldCheckIcon, 
  ShieldExclamationIcon, 
  UserIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  HeartIcon,
  GlobeAltIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const meta = {
  title: 'Components/UI/Primitives/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible select component with design system integration. Supports multiple sizes, variants, accessibility features, and rich content including icons, descriptions, and pricing. Features three display modes: simple (default), compact (icons + labels), and rich (full content layout).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Visual style variant of the select',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the select field',
    },
    label: {
      control: 'text',
      description: 'Label for the select field',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display below select',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the select takes full width',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    displayMode: {
      control: 'select',
      options: ['simple', 'rich', 'compact'],
      description: 'Display mode for different option layouts',
    },
  },
  args: {
    required: false,
    fullWidth: false,
    disabled: false,
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample options for stories
const sampleOptions = [
  { value: '', label: 'Select an option', disabled: true },
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4 (Disabled)', disabled: true },
  { value: 'option5', label: 'Option 5' },
];

const stateOptions = [
  { value: '', label: 'Select a state', disabled: true },
  { value: 'ca', label: 'California' },
  { value: 'ny', label: 'New York' },
  { value: 'tx', label: 'Texas' },
  { value: 'fl', label: 'Florida' },
  { value: 'wa', label: 'Washington' },
];

// Rich content options for insurance
const insuranceOptions = [
  { 
    value: '', 
    label: 'Select your insurance coverage', 
    disabled: true 
  },
  {
    value: 'basic',
    label: 'Basic Protection',
    description: 'Coverage up to $1,000 for your belongings',
    price: '$5.99',
    icon: ShieldCheckIcon,
  },
  {
    value: 'standard',
    label: 'Standard Protection',
    description: 'Coverage up to $5,000 for your belongings',
    price: '$12.99',
    icon: ShieldExclamationIcon,
  },
  {
    value: 'premium',
    label: 'Premium Protection',
    description: 'Coverage up to $25,000 for your belongings',
    price: '$24.99',
    icon: ShieldCheckIcon,
  },
];

// Account type options with icons
const accountTypeOptions = [
  { value: '', label: 'Select account type', disabled: true },
  {
    value: 'personal',
    label: 'Personal Account',
    description: 'For individual use',
    icon: UserIcon,
  },
  {
    value: 'business',
    label: 'Business Account',
    description: 'For companies and organizations',
    icon: BuildingOfficeIcon,
  },
  {
    value: 'education',
    label: 'Education Account',
    description: 'For schools and students',
    icon: AcademicCapIcon,
  },
  {
    value: 'nonprofit',
    label: 'Non-profit Account',
    description: 'For charitable organizations',
    icon: HeartIcon,
  },
];

// Currency options for compact display
const currencyOptions = [
  { value: '', label: 'Select currency', disabled: true },
  {
    value: 'usd',
    label: 'US Dollar',
    icon: CurrencyDollarIcon,
  },
  {
    value: 'eur',
    label: 'Euro',
    icon: GlobeAltIcon,
  },
  {
    value: 'gbp',
    label: 'British Pound',
    icon: GlobeAltIcon,
  },
  {
    value: 'jpy',
    label: 'Japanese Yen',
    icon: GlobeAltIcon,
  },
];

// Default story
export const Default: Story = {
  args: {
    label: 'Choose an option',
    placeholder: 'Select an option',
    options: sampleOptions,
  },
};

// Size variants
export const Small: Story = {
  args: {
    label: 'Small Select',
    size: 'sm',
    options: sampleOptions,
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium Select',
    size: 'md',
    options: sampleOptions,
  },
};

export const Large: Story = {
  args: {
    label: 'Large Select',
    size: 'lg',
    options: sampleOptions,
  },
};

// With label and helper text
export const WithHelperText: Story = {
  args: {
    label: 'State',
    helperText: 'Choose the state where you are located',
    options: stateOptions,
  },
};

// Required field
export const Required: Story = {
  args: {
    label: 'Required Field',
    required: true,
    helperText: 'This field is required',
    options: sampleOptions,
  },
};

// Error state
export const WithError: Story = {
  args: {
    label: 'State',
    error: 'Please select a valid state',
    value: '',
    options: stateOptions,
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    disabled: true,
    value: 'option2',
    options: sampleOptions,
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    label: 'Full Width Select',
    fullWidth: true,
    options: sampleOptions,
  },
  parameters: {
    layout: 'padded',
  },
};

// Without options prop (using children) - Note: Custom dropdown only supports options prop
export const WithChildren: Story = {
  render: () => (
    <Select 
      label="Select with Grouped Options" 
      placeholder="Choose an option"
      options={[
        { value: '', label: 'Choose an option', disabled: true },
        { value: 'child1', label: 'Child Option 1' },
        { value: 'child2', label: 'Child Option 2' },
        { value: 'child3', label: 'Child Option 3' },
        { value: 'group1-1', label: 'Group 1 - Option 1' },
        { value: 'group1-2', label: 'Group 1 - Option 2' },
        { value: 'group2-1', label: 'Group 2 - Option 1' },
        { value: 'group2-2', label: 'Group 2 - Option 2' },
      ]}
    />
  ),
};

// Controlled component
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    const handleChange = (newValue: string) => {
      setValue(newValue);
      
      // Clear error when a valid option is selected
      if (newValue && error) {
        setError('');
      }
    };

    const handleValidation = () => {
      if (!value) {
        setError('Please select an option');
      } else {
        setError('');
        alert(`Selected: ${value}`);
      }
    };

    return (
      <div className="space-y-4">
        <Select
          label="Controlled Select"
          value={value}
          onChange={handleChange}
          error={error}
          options={sampleOptions}
          onClearError={() => setError('')}
        />
        <div className="flex gap-2">
          <button
            onClick={handleValidation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Validate
          </button>
          <button
            onClick={() => setValue('')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
        {value && (
          <p className="text-sm text-gray-600">
            Current value: <strong>{value}</strong>
          </p>
        )}
      </div>
    );
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Select
        label="Small Size"
        size="sm"
        options={sampleOptions}
        value="option1"
      />
      <Select
        label="Medium Size"
        size="md"
        options={sampleOptions}
        value="option2"
      />
      <Select
        label="Large Size"
        size="lg"
        options={sampleOptions}
        value="option3"
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
      <Select
        label="Default State"
        options={sampleOptions}
        helperText="This is a normal select field"
      />
      <Select
        label="Required Field"
        options={sampleOptions}
        required
        helperText="This field is required"
      />
      <Select
        label="Error State"
        options={sampleOptions}
        error="Please select a valid option"
        value=""
      />
      <Select
        label="Disabled State (with value)"
        options={sampleOptions}
        disabled
        value="option2"
        helperText="This select is disabled with a selected value"
      />
      <Select
        label="Disabled State (empty)"
        options={sampleOptions}
        disabled
        placeholder="Cannot select options"
        helperText="This select is disabled with no selection"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Complex form example
export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      country: '',
      state: '',
      category: '',
      priority: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string) => (value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Clear error when field is filled
      if (value && errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};
      
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.category) newErrors.category = 'Category is required';
      if (!formData.priority) newErrors.priority = 'Priority is required';
      
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        alert('Form submitted successfully!');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6 w-96">
        <Select
          label="Country"
          required
          value={formData.country}
          onChange={handleChange('country')}
          error={errors.country}
          options={[
            { value: '', label: 'Select a country', disabled: true },
            { value: 'us', label: 'United States' },
            { value: 'ca', label: 'Canada' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'au', label: 'Australia' },
          ]}
        />
        
        <Select
          label="State/Province"
          required
          value={formData.state}
          onChange={handleChange('state')}
          error={errors.state}
          options={stateOptions}
          disabled={!formData.country}
          helperText={!formData.country ? 'Select a country first' : undefined}
        />
        
        <Select
          label="Category"
          required
          value={formData.category}
          onChange={handleChange('category')}
          error={errors.category}
          options={[
            { value: '', label: 'Select a category', disabled: true },
            { value: 'business', label: 'Business' },
            { value: 'personal', label: 'Personal' },
            { value: 'education', label: 'Education' },
            { value: 'nonprofit', label: 'Non-profit' },
          ]}
        />
        
        <Select
          label="Priority Level"
          required
          value={formData.priority}
          onChange={handleChange('priority')}
          error={errors.priority}
          size="sm"
          options={[
            { value: '', label: 'Select priority', disabled: true },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
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

// Rich content display mode
export const RichContent: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <Select
        label="Insurance Coverage"
        displayMode="rich"
        options={insuranceOptions}
        helperText="Choose your protection level"
      />
      
      <Select
        label="Account Type"
        displayMode="rich"
        options={accountTypeOptions}
        helperText="Select the type of account you need"
        value="business"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Compact display mode
export const CompactContent: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Select
        label="Currency"
        displayMode="compact"
        options={currencyOptions}
        helperText="Select your preferred currency"
      />
      
      <Select
        label="Account Type (Compact)"
        displayMode="compact"
        options={accountTypeOptions}
        helperText="Icons with labels in compact format"
        value="personal"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// All display modes comparison
export const DisplayModes: Story = {
  render: () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Simple Mode (Default)</h3>
        <Select
          label="Account Type"
          displayMode="simple"
          options={accountTypeOptions.map(opt => ({
            value: opt.value,
            label: opt.label,
            disabled: opt.disabled
          }))}
          value="business"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Compact Mode</h3>
        <Select
          label="Account Type"
          displayMode="compact"
          options={accountTypeOptions}
          value="business"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Rich Mode</h3>
        <Select
          label="Account Type"
          displayMode="rich"
          options={accountTypeOptions}
          value="business"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Custom render props example
export const CustomRender: Story = {
  render: () => {
    const customRenderOption = (option: any) => (
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center space-x-3">
          {option.icon && <option.icon className="w-5 h-5 text-blue-500" />}
          <div>
            <div className="font-medium text-blue-900">{option.label}</div>
            {option.description && (
              <div className="text-xs text-blue-600">{option.description}</div>
            )}
          </div>
        </div>
        {option.price && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
            {option.price}
          </span>
        )}
      </div>
    );

    const customRenderSelected = (option: any) => (
      <div className="flex items-center space-x-2">
        {option.icon && <option.icon className="w-4 h-4 text-blue-500" />}
        <span className="font-medium text-blue-900">{option.label}</span>
        {option.price && (
          <span className="text-blue-600 text-sm">({option.price})</span>
        )}
      </div>
    );

    return (
      <div className="w-96">
        <Select
          label="Custom Styled Insurance"
          options={insuranceOptions}
          renderOption={customRenderOption}
          renderSelected={customRenderSelected}
          helperText="Custom styling with render props"
        />
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};

// Rich content controlled example
export const RichControlled: Story = {
  render: () => {
    const [selectedInsurance, setSelectedInsurance] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');

    return (
      <div className="space-y-6 w-96">
        <Select
          label="Insurance Coverage"
          displayMode="rich"
          options={insuranceOptions}
          value={selectedInsurance}
          onChange={setSelectedInsurance}
          helperText={`Selected: ${selectedInsurance || 'None'}`}
        />
        
        <Select
          label="Account Type"
          displayMode="compact"
          options={accountTypeOptions}
          value={selectedAccount}
          onChange={setSelectedAccount}
          helperText={`Selected: ${selectedAccount || 'None'}`}
        />
        
        <div className="p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Current Selection:</h4>
          <p className="text-sm">Insurance: {selectedInsurance || 'None'}</p>
          <p className="text-sm">Account: {selectedAccount || 'None'}</p>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};

// Edge cases
export const EdgeCases: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Select
        label="No Options"
        options={[]}
        helperText="This select has no options"
      />
      
      <Select
        label="Single Option"
        options={[{ value: 'only', label: 'Only Option' }]}
        helperText="This select has only one option"
      />
      
      <Select
        label="Very Long Options"
        options={[
          { value: '', label: 'Select an option', disabled: true },
          { value: 'short', label: 'Short' },
          { value: 'long', label: 'This is a very long option text that might overflow the select width and should be handled gracefully' },
          { value: 'medium', label: 'Medium length option' },
        ]}
        helperText="Testing with very long option text"
      />
      
      <Select
        label="Many Options"
        options={Array.from({ length: 20 }, (_, i) => ({
          value: `option${i + 1}`,
          label: `Option ${i + 1}`,
        }))}
        helperText="This select has many options"
        size="sm"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
