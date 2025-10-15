/**
 * @fileoverview Storybook stories for CheckboxCard component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CheckboxCard } from './CheckboxCard';

const meta: Meta<typeof CheckboxCard> = {
  title: 'Components/UI/Primitives/CheckboxCard',
  component: CheckboxCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A selectable card component with checkbox-style indicator. Perfect for plan selection, options, and multi-step forms where users need to choose from multiple options.',
      },
    },
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the checkbox card',
    },
    title: {
      control: 'text',
      description: 'Primary title text displayed at the top',
    },
    titleDescription: {
      control: 'text',
      description: 'Subtitle or description for the title',
    },
    description: {
      control: 'text',
      description: 'Additional description text',
    },
    plan: {
      control: 'text',
      description: 'Plan or option name/pricing',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the card is currently selected',
    },
    hasError: {
      control: 'boolean',
      description: 'Whether the card is in an error state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the card is disabled',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when selection state changes',
    },
    onClearError: {
      action: 'errorCleared',
      description: 'Callback to clear error state',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    ariaLabel: {
      control: 'text',
      description: 'Custom ARIA label for accessibility',
    },
    testId: {
      control: 'text',
      description: 'Test ID for testing purposes',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CheckboxCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story
export const Default: Story = {
  args: {
    id: 'basic-plan',
    title: 'Basic Plan',
    titleDescription: 'Perfect for small moves',
    description: 'Includes 2 movers and basic equipment',
    plan: '$299/month',
    checked: false,
    hasError: false,
    disabled: false,
  },
};

// Checked state
export const Checked: Story = {
  args: {
    id: 'premium-plan',
    title: 'Premium Plan',
    titleDescription: 'Best value for most customers',
    description: 'Includes 3 movers, premium equipment, and insurance',
    plan: '$499/month',
    checked: true,
    hasError: false,
    disabled: false,
  },
};

// Error state
export const WithError: Story = {
  args: {
    id: 'enterprise-plan',
    title: 'Enterprise Plan',
    titleDescription: 'For large commercial moves',
    description: 'Custom team size and specialized equipment',
    plan: '$999/month',
    checked: false,
    hasError: true,
    disabled: false,
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    id: 'unavailable-plan',
    title: 'Premium Plus Plan',
    titleDescription: 'Currently unavailable in your area',
    description: 'Premium service with white-glove treatment',
    plan: '$799/month',
    checked: false,
    hasError: false,
    disabled: true,
  },
};

// Interactive example with state management
export const Interactive: Story = {
  render: () => {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [errorPlan, setErrorPlan] = useState<string | null>(null);

    const plans = [
      {
        id: 'basic',
        title: 'Basic Plan',
        titleDescription: 'Perfect for studio & 1-bedroom moves',
        description: 'Includes 2 movers and basic equipment',
        plan: '$299',
      },
      {
        id: 'standard',
        title: 'Standard Plan',
        titleDescription: 'Great for 2-3 bedroom homes',
        description: 'Includes 3 movers and standard equipment',
        plan: '$449',
      },
      {
        id: 'premium',
        title: 'Premium Plan',
        titleDescription: 'Best for 4+ bedroom homes',
        description: 'Includes 4 movers, premium equipment, and insurance',
        plan: '$649',
      },
    ];

    const handlePlanSelect = (planId: string) => {
      setSelectedPlan(planId);
      setErrorPlan(null); // Clear any errors when making a selection
    };

    const handleSetError = (planId: string) => {
      setErrorPlan(planId);
    };

    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Choose Your Moving Plan</h3>
          <p className="text-text-secondary text-sm">
            Select the plan that best fits your needs. You can change this later.
          </p>
        </div>

        {plans.map((plan) => (
          <CheckboxCard
            key={plan.id}
            id={plan.id}
            title={plan.title}
            titleDescription={plan.titleDescription}
            description={plan.description}
            plan={plan.plan}
            checked={selectedPlan === plan.id}
            hasError={errorPlan === plan.id}
            onChange={() => handlePlanSelect(plan.id)}
            onClearError={() => setErrorPlan(null)}
            testId={`plan-${plan.id}`}
          />
        ))}

        <div className="mt-6 p-4 bg-surface-tertiary rounded-md">
          <h4 className="font-medium mb-2">Story Controls</h4>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Selected Plan:</strong> {selectedPlan || 'None'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPlan(null)}
                className="btn-secondary text-xs px-3 py-1"
              >
                Clear Selection
              </button>
              <button
                onClick={() => handleSetError('standard')}
                className="btn-destructive text-xs px-3 py-1"
              >
                Set Error on Standard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example showing multiple CheckboxCards with state management, error handling, and selection logic.',
      },
    },
  },
};

// Accessibility showcase
export const AccessibilityFeatures: Story = {
  render: () => {
    const [selected, setSelected] = useState(false);

    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Accessibility Features</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Keyboard navigation with Tab, Space, and Enter</li>
            <li>• Screen reader support with ARIA labels and roles</li>
            <li>• Focus indicators and proper focus management</li>
            <li>• Semantic HTML structure with proper roles</li>
            <li>• Status announcements for dynamic changes</li>
          </ul>
        </div>

        <CheckboxCard
          id="accessibility-demo"
          title="Accessibility Demo Plan"
          titleDescription="Try keyboard navigation and screen readers"
          description="Press Tab to focus, Space or Enter to select"
          plan="$399/month"
          checked={selected}
          onChange={() => setSelected(!selected)}
          ariaLabel="Accessibility demonstration plan. Features keyboard navigation and screen reader support."
          testId="accessibility-demo"
        />

        <div className="mt-4 p-3 bg-surface-tertiary rounded text-sm">
          <p>
            <strong>Keyboard Instructions:</strong> Use Tab to focus the card, then press Space or Enter to toggle selection.
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the accessibility features including keyboard navigation, ARIA labels, and screen reader support.',
      },
    },
  },
};

// Long content example
export const LongContent: Story = {
  args: {
    id: 'long-content-plan',
    title: 'Enterprise Premium Plus Plan with Extended Features',
    titleDescription: 'Comprehensive solution for large-scale commercial and residential moves with additional premium services',
    description: 'Includes unlimited movers, specialized equipment, insurance coverage, storage solutions, and 24/7 customer support',
    plan: '$1,299/month + $150 setup fee',
    checked: false,
    hasError: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with longer text content to test text overflow and layout behavior.',
      },
    },
  },
};

// Multiple states grid
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CheckboxCard
        id="state-default"
        title="Default State"
        titleDescription="Unselected, no errors"
        description="Normal interactive state"
        plan="$299/month"
        checked={false}
        hasError={false}
        disabled={false}
        onChange={() => {}}
      />
      <CheckboxCard
        id="state-checked"
        title="Checked State"
        titleDescription="Selected state"
        description="User has selected this option"
        plan="$399/month"
        checked={true}
        hasError={false}
        disabled={false}
        onChange={() => {}}
      />
      <CheckboxCard
        id="state-error"
        title="Error State"
        titleDescription="Something went wrong"
        description="Validation error or system issue"
        plan="$499/month"
        checked={false}
        hasError={true}
        disabled={false}
        onChange={() => {}}
      />
      <CheckboxCard
        id="state-disabled"
        title="Disabled State"
        titleDescription="Not available for selection"
        description="Option is currently unavailable"
        plan="$599/month"
        checked={false}
        hasError={false}
        disabled={true}
        onChange={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid showing all possible states of the CheckboxCard component.',
      },
    },
  },
};
