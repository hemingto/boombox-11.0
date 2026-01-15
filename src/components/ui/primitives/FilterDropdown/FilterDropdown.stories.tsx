/**
 * @fileoverview Storybook stories for FilterDropdown component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FilterDropdown } from './FilterDropdown';
import type { FilterOption } from './FilterDropdown';

const meta: Meta<typeof FilterDropdown> = {
  title: 'UI/Primitives/FilterDropdown',
  component: FilterDropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A lightweight, accessible dropdown component for filtering content with keyboard navigation and click-outside detection.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the dropdown',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the dropdown is disabled',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no option is selected',
    },
    ariaLabel: {
      control: 'text',
      description: 'ARIA label for accessibility',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilterDropdown>;

// Sample filter options
const videoFilterOptions: FilterOption[] = [
  { value: 'all', label: 'All Videos' },
  { value: 'packing', label: 'Packing' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'assembly', label: 'Assembly' },
];

const statusFilterOptions: FilterOption[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityFilterOptions: FilterOption[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// Interactive wrapper component for stories
const FilterDropdownWrapper = (args: any) => {
  const [selectedValue, setSelectedValue] = useState(args.value || 'all');

  return (
    <div className="w-full min-h-[300px] flex items-start justify-center p-8">
      <FilterDropdown
        {...args}
        value={selectedValue}
        onChange={setSelectedValue}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <FilterDropdownWrapper {...args} />,
  args: {
    options: videoFilterOptions,
    value: 'all',
    placeholder: 'Filter by',
    ariaLabel: 'Filter videos by category',
  },
};

export const WithStatus: Story = {
  render: (args) => <FilterDropdownWrapper {...args} />,
  args: {
    options: statusFilterOptions,
    value: 'active',
    placeholder: 'Filter by status',
    ariaLabel: 'Filter by status',
  },
};

export const WithPriority: Story = {
  render: (args) => <FilterDropdownWrapper {...args} />,
  args: {
    options: priorityFilterOptions,
    value: 'all',
    placeholder: 'Filter by priority',
    ariaLabel: 'Filter by priority',
  },
};

export const SmallSize: Story = {
  render: (args) => <FilterDropdownWrapper {...args} />,
  args: {
    options: videoFilterOptions,
    value: 'all',
    size: 'sm',
    placeholder: 'Filter',
    ariaLabel: 'Filter options',
  },
};

export const MediumSize: Story = {
  render: (args) => <FilterDropdownWrapper {...args} />,
  args: {
    options: videoFilterOptions,
    value: 'all',
    size: 'md',
    placeholder: 'Filter by',
    ariaLabel: 'Filter options',
  },
};

export const LargeSize: Story = {
  render: (args) => <FilterDropdownWrapper {...args} />,
  args: {
    options: videoFilterOptions,
    value: 'all',
    size: 'lg',
    placeholder: 'Filter by category',
    ariaLabel: 'Filter options',
  },
};

export const Disabled: Story = {
  render: (args) => <FilterDropdownWrapper {...args} />,
  args: {
    options: videoFilterOptions,
    value: 'packing',
    disabled: true,
    ariaLabel: 'Filter options (disabled)',
  },
};

export const CustomPlaceholder: Story = {
  render: (args) => <FilterDropdownWrapper {...args} />,
  args: {
    options: statusFilterOptions,
    value: 'all',
    placeholder: 'Choose a status...',
    ariaLabel: 'Filter by status',
  },
};

export const ManyOptions: Story = {
  render: (args) => <FilterDropdownWrapper {...args} />,
  args: {
    options: [
      { value: 'all', label: 'All Categories' },
      { value: 'electronics', label: 'Electronics' },
      { value: 'furniture', label: 'Furniture' },
      { value: 'clothing', label: 'Clothing' },
      { value: 'books', label: 'Books' },
      { value: 'toys', label: 'Toys' },
      { value: 'sports', label: 'Sports' },
      { value: 'garden', label: 'Garden' },
      { value: 'automotive', label: 'Automotive' },
      { value: 'home', label: 'Home & Kitchen' },
    ],
    value: 'all',
    ariaLabel: 'Filter by category',
  },
};

export const MultipleDropdowns: Story = {
  render: () => {
    const [category, setCategory] = useState('all');
    const [status, setStatus] = useState('all');
    const [priority, setPriority] = useState('all');

    return (
      <div className="w-full min-h-[300px] flex flex-col items-start gap-4 p-8">
        <div className="flex flex-wrap gap-3">
          <FilterDropdown
            options={videoFilterOptions}
            value={category}
            onChange={setCategory}
            placeholder="Category"
            ariaLabel="Filter by category"
          />
          <FilterDropdown
            options={statusFilterOptions}
            value={status}
            onChange={setStatus}
            placeholder="Status"
            ariaLabel="Filter by status"
          />
          <FilterDropdown
            options={priorityFilterOptions}
            value={priority}
            onChange={setPriority}
            placeholder="Priority"
            ariaLabel="Filter by priority"
          />
        </div>
        <div className="mt-4 p-4 bg-surface-secondary rounded-md">
          <p className="text-sm text-text-secondary">
            Selected filters:
          </p>
          <ul className="text-sm text-text-primary mt-2 space-y-1">
            <li>Category: {videoFilterOptions.find(o => o.value === category)?.label}</li>
            <li>Status: {statusFilterOptions.find(o => o.value === status)?.label}</li>
            <li>Priority: {priorityFilterOptions.find(o => o.value === priority)?.label}</li>
          </ul>
        </div>
      </div>
    );
  },
};

