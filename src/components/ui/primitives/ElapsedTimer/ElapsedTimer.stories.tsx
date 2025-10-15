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
- Millisecond precision support
- Custom time formatting
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
    className: {
      control: 'text',
      description: 'Additional CSS classes for styling',
    },
    showMilliseconds: {
      control: 'boolean',
      description: 'Show milliseconds precision (updates every 100ms)',
    },
    autoStart: {
      control: 'boolean',
      description: 'Whether to auto-start the timer',
    },
    'aria-label': {
      control: 'text',
      description: 'Custom aria label for accessibility',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to get timestamps
const now = Date.now();
const fiveMinutesAgo = now - (5 * 60 * 1000);
const tenMinutesAgo = now - (10 * 60 * 1000);
const oneHourAgo = now - (60 * 60 * 1000);

/**
 * Live timer that counts up from 5 minutes ago
 */
export const LiveTimer: Story = {
  args: {
    startTime: fiveMinutesAgo,
    autoStart: true,
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
    autoStart: true,
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
 * Timer with millisecond precision
 */
export const WithMilliseconds: Story = {
  args: {
    startTime: now - 30000, // 30 seconds ago
    showMilliseconds: true,
    autoStart: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Live timer with millisecond precision, updating every 100ms.',
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
    autoStart: true,
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
 * Timer with custom styling
 */
export const CustomStyling: Story = {
  args: {
    startTime: fiveMinutesAgo,
    className: 'text-2xl font-bold text-status-success bg-status-bg-success px-4 py-2 rounded-lg',
    autoStart: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Timer with custom styling using design system colors and larger text.',
      },
    },
  },
};

/**
 * Timer with custom formatting
 */
export const CustomFormat: Story = {
  args: {
    startTime: fiveMinutesAgo,
    formatTime: (minutes: number, seconds: number) => 
      `${minutes}m ${seconds}s`,
    autoStart: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Timer with custom formatting function showing "5m 30s" style format.',
      },
    },
  },
};

/**
 * Paused/Stopped timer
 */
export const Stopped: Story = {
  args: {
    startTime: fiveMinutesAgo,
    autoStart: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Timer that is stopped/paused, showing "00:00" when autoStart is false.',
      },
    },
  },
};

/**
 * Timer with custom aria label
 */
export const WithAriaLabel: Story = {
  args: {
    startTime: fiveMinutesAgo,
    'aria-label': 'Job duration timer',
    autoStart: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Timer with custom accessibility label for screen readers.',
      },
    },
  },
};

/**
 * Zero duration (start equals end)
 */
export const ZeroDuration: Story = {
  args: {
    startTime: now,
    endTime: now,
    autoStart: true,
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
    autoStart: true,
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
  render: () => (
    <div className="space-y-4 p-4">
      <div className="flex items-center space-x-4">
        <span className="text-text-secondary min-w-32">Live Timer:</span>
        <ElapsedTimer 
          startTime={fiveMinutesAgo} 
          className="font-mono text-lg"
        />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-text-secondary min-w-32">Completed Job:</span>
        <ElapsedTimer 
          startTime={tenMinutesAgo} 
          endTime={fiveMinutesAgo}
          className="font-mono text-lg text-status-success"
        />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-text-secondary min-w-32">With Milliseconds:</span>
        <ElapsedTimer 
          startTime={now - 45000}
          showMilliseconds
          className="font-mono text-lg text-status-info"
        />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-text-secondary min-w-32">Custom Format:</span>
        <ElapsedTimer 
          startTime={oneHourAgo}
          formatTime={(m, s) => `${m} min ${s} sec`}
          className="font-mono text-lg text-status-warning"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple timer instances demonstrating different configurations and styling.',
      },
    },
  },
};
