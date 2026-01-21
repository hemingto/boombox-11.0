/**
 * @fileoverview Storybook stories for ElapsedTimer component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ElapsedTimer } from './ElapsedTimer';

const meta: Meta<typeof ElapsedTimer> = {
  title: 'Components/UI/Primitives/ElapsedTimer',
  component: ElapsedTimer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The ElapsedTimer component displays elapsed time between two timestamps in MM:SS format.

**Key Features:**
- Live timer mode (updates every second when no end time provided)
- Static duration mode (shows fixed duration when end time provided)
- Accessibility features with ARIA labels and semantic HTML
- Design system compliant styling

**Use Cases:**
- Job duration tracking
- Appointment timers
- Task elapsed time
- Performance metrics display
        `,
      },
    },
  },
  argTypes: {
    startTime: {
      control: 'text',
      description: 'Start time as Unix timestamp (milliseconds) or ISO string',
    },
    endTime: {
      control: 'text',
      description: 'Optional end time. If provided, shows static duration instead of live timer',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to get timestamps as strings
const now = Date.now();
const fiveMinutesAgo = String(now - (5 * 60 * 1000));
const tenMinutesAgo = String(now - (10 * 60 * 1000));
const oneHourAgo = String(now - (60 * 60 * 1000));

/**
 * Live timer that counts up from 5 minutes ago
 */
export const LiveTimer: Story = {
  args: {
    startTime: fiveMinutesAgo,
  },
  parameters: {
    docs: {
      description: {
        story: 'A live timer that updates every second, showing elapsed time since the start timestamp.',
      },
    },
  },
};

/**
 * Static duration showing completed time span
 */
export const StaticDuration: Story = {
  args: {
    startTime: tenMinutesAgo,
    endTime: fiveMinutesAgo,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a fixed duration between start and end times. Timer does not update.',
      },
    },
  },
};

/**
 * Long duration timer (over an hour)
 */
export const LongDuration: Story = {
  args: {
    startTime: oneHourAgo,
  },
  parameters: {
    docs: {
      description: {
        story: 'Timer showing elapsed time over an hour, demonstrating how minutes increment.',
      },
    },
  },
};

/**
 * Zero duration (start equals end)
 */
export const ZeroDuration: Story = {
  args: {
    startTime: String(now),
    endTime: String(now),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows "00:00" when start and end times are the same.',
      },
    },
  },
};

/**
 * Error handling - invalid timestamp
 */
export const InvalidTimestamp: Story = {
  args: {
    startTime: 'invalid-timestamp',
  },
  parameters: {
    docs: {
      description: {
        story: 'Gracefully handles invalid timestamps by showing "00:00".',
      },
    },
  },
};

/**
 * Multiple timers demonstration
 */
export const MultipleTimers: Story = {
  args: {
    startTime: fiveMinutesAgo,
  },
  render: () => (
    <div className="space-y-4 p-4">
      <div className="flex items-center space-x-4">
        <span className="text-text-secondary min-w-32">Live Timer:</span>
        <ElapsedTimer startTime={fiveMinutesAgo} />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-text-secondary min-w-32">Completed Job:</span>
        <ElapsedTimer startTime={tenMinutesAgo} endTime={fiveMinutesAgo} />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-text-secondary min-w-32">Long Duration:</span>
        <ElapsedTimer startTime={oneHourAgo} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple timer instances demonstrating different configurations.',
      },
    },
  },
};
