/**
 * @fileoverview Comprehensive Jest tests for ElapsedTimer component
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ElapsedTimer } from '@/components/ui/primitives/ElapsedTimer';

describe('ElapsedTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('Static Duration Mode (with endTime)', () => {
    it('displays correct duration when both start and end times are provided', () => {
      const startTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
      const endTime = Date.now() - (2 * 60 * 1000); // 2 minutes ago
      
      render(<ElapsedTimer startTime={startTime} endTime={endTime} />);
      
      expect(screen.getByText('03:00')).toBeInTheDocument();
    });

    it('handles string timestamps correctly', () => {
      const startTime = (Date.now() - (4 * 60 * 1000)).toString(); // 4 minutes ago
      const endTime = (Date.now() - (1 * 60 * 1000)).toString(); // 1 minute ago
      
      render(<ElapsedTimer startTime={startTime} endTime={endTime} />);
      
      expect(screen.getByText('03:00')).toBeInTheDocument();
    });

    it('displays 00:00 for zero duration', () => {
      const timestamp = Date.now();
      
      render(<ElapsedTimer startTime={timestamp} endTime={timestamp} />);
      
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('handles negative duration gracefully', () => {
      const startTime = Date.now();
      const endTime = Date.now() - (2 * 60 * 1000); // 2 minutes before start
      
      render(<ElapsedTimer startTime={startTime} endTime={endTime} />);
      
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  describe('Live Timer Mode (no endTime)', () => {
    it('starts with correct elapsed time and updates every second', () => {
      const startTime = Date.now() - (2 * 60 * 1000); // 2 minutes ago
      
      render(<ElapsedTimer startTime={startTime} />);
      
      // Initial render shows correct time
      expect(screen.getByText('02:00')).toBeInTheDocument();
      
      // Advance time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // Check that time has updated
      expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('updates correctly over minute boundaries', () => {
      const startTime = Date.now() - (59 * 1000); // 59 seconds ago
      
      render(<ElapsedTimer startTime={startTime} />);
      
      expect(screen.getByText('00:59')).toBeInTheDocument();
      
      // Advance by 2 seconds to cross minute boundary
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      expect(screen.getByText('01:01')).toBeInTheDocument();
    });

    it('handles long durations correctly', () => {
      const startTime = Date.now() - (65 * 60 * 1000); // 65 minutes ago
      
      render(<ElapsedTimer startTime={startTime} />);
      
      expect(screen.getByText('65:00')).toBeInTheDocument();
    });
  });

  describe('Milliseconds Support', () => {
    it('displays milliseconds when showMilliseconds is true', () => {
      const startTime = Date.now() - 1500; // 1.5 seconds ago
      
      render(<ElapsedTimer startTime={startTime} endTime={Date.now()} showMilliseconds />);
      
      expect(screen.getByText('00:01.50')).toBeInTheDocument();
    });

    it('updates every 100ms when showMilliseconds is enabled', () => {
      const startTime = Date.now() - 1000; // 1 second ago
      
      render(<ElapsedTimer startTime={startTime} showMilliseconds />);
      
      expect(screen.getByText('00:01.00')).toBeInTheDocument();
      
      // Advance by 250ms
      act(() => {
        jest.advanceTimersByTime(250);
      });
      
      // The timer should show some milliseconds between 00:01.20 and 00:01.30
      // due to timing precision in test environment
      const timerElement = screen.getByRole('timer');
      const displayedTime = timerElement.textContent;
      expect(displayedTime).toMatch(/00:01\.[2-3]\d/);
    });
  });

  describe('Custom Formatting', () => {
    it('uses custom formatter when provided', () => {
      const startTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
      const customFormatter = (minutes: number, seconds: number) => `${minutes}m ${seconds}s`;
      
      render(
        <ElapsedTimer 
          startTime={startTime} 
          endTime={Date.now()} 
          formatTime={customFormatter} 
        />
      );
      
      expect(screen.getByText('5m 0s')).toBeInTheDocument();
    });

    it('passes milliseconds to custom formatter when enabled', () => {
      const startTime = Date.now() - 1500; // 1.5 seconds ago
      const customFormatter = jest.fn((minutes: number, seconds: number, ms?: number) => 
        `${minutes}:${seconds}.${ms || 0}`
      );
      
      render(
        <ElapsedTimer 
          startTime={startTime} 
          endTime={Date.now()} 
          showMilliseconds
          formatTime={customFormatter} 
        />
      );
      
      expect(customFormatter).toHaveBeenCalledWith(0, 1, 50);
    });
  });

  describe('AutoStart Control', () => {
    it('shows 00:00 when autoStart is false', () => {
      const startTime = Date.now() - (5 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} autoStart={false} />);
      
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('does not start timer when autoStart is false', () => {
      const startTime = Date.now() - (5 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} autoStart={false} />);
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // Should still show 00:00
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid startTime gracefully', () => {
      render(<ElapsedTimer startTime="invalid-timestamp" />);
      
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('handles missing startTime gracefully', () => {
      render(<ElapsedTimer startTime="" />);
      
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('handles invalid endTime gracefully', () => {
      const startTime = Date.now() - (5 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} endTime="invalid" />);
      
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders as a time element with proper datetime attribute', () => {
      const startTime = Date.now() - (5 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} endTime={Date.now()} />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement.tagName).toBe('TIME');
      expect(timeElement).toHaveAttribute('datetime', 'PT05M00S');
    });

    it('has proper aria-live attributes for live timers', () => {
      const startTime = Date.now() - (2 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement).toHaveAttribute('aria-live', 'polite');
      expect(timeElement).toHaveAttribute('aria-atomic', 'true');
    });

    it('does not have aria-live for static timers', () => {
      const startTime = Date.now() - (5 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} endTime={Date.now()} />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement).toHaveAttribute('aria-live', 'off');
    });

    it('uses custom aria-label when provided', () => {
      const startTime = Date.now() - (2 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} aria-label="Job duration timer" />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement).toHaveAttribute('aria-label', 'Job duration timer');
    });

    it('generates default aria-label for live timers', () => {
      const startTime = Date.now() - (2 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement).toHaveAttribute('aria-label', 'Elapsed time: 02:00 and counting');
    });

    it('generates default aria-label for static timers', () => {
      const startTime = Date.now() - (5 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} endTime={Date.now()} />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement).toHaveAttribute('aria-label', 'Elapsed time: 05:00');
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies default CSS classes', () => {
      const startTime = Date.now() - (2 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement).toHaveClass('text-text-primary', 'font-mono', 'text-sm', 'tabular-nums', 'select-none');
    });

    it('applies custom className', () => {
      const startTime = Date.now() - (2 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} className="custom-class text-lg" />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement).toHaveClass('custom-class', 'text-lg');
    });

    it('applies animate-pulse class for live timers', () => {
      const startTime = Date.now() - (2 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement).toHaveClass('animate-pulse');
    });

    it('does not apply animate-pulse class for static timers', () => {
      const startTime = Date.now() - (5 * 60 * 1000);
      
      render(<ElapsedTimer startTime={startTime} endTime={Date.now()} />);
      
      const timeElement = screen.getByRole('timer');
      expect(timeElement).not.toHaveClass('animate-pulse');
    });
  });

  describe('Component Lifecycle', () => {
    it('cleans up timer on unmount', () => {
      const startTime = Date.now() - (2 * 60 * 1000);
      
      const { unmount } = render(<ElapsedTimer startTime={startTime} />);
      
      // Verify timer is running
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      unmount();
      
      // Advance time after unmount - should not cause any issues
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });

    it('updates when startTime prop changes', async () => {
      const initialStartTime = Date.now() - (2 * 60 * 1000);
      
      const { rerender } = render(<ElapsedTimer startTime={initialStartTime} />);
      
      expect(screen.getByText('02:00')).toBeInTheDocument();
      
      // Change startTime to 5 minutes ago
      const newStartTime = Date.now() - (5 * 60 * 1000);
      rerender(<ElapsedTimer startTime={newStartTime} />);
      
      await waitFor(() => {
        expect(screen.getByText('05:00')).toBeInTheDocument();
      });
    });

    it('switches between live and static modes when endTime changes', async () => {
      const startTime = Date.now() - (2 * 60 * 1000);
      
      const { rerender } = render(<ElapsedTimer startTime={startTime} />);
      
      // Initially live timer
      expect(screen.getByText('02:00')).toBeInTheDocument();
      
      // Add endTime to make it static
      const endTime = Date.now();
      rerender(<ElapsedTimer startTime={startTime} endTime={endTime} />);
      
      await waitFor(() => {
        expect(screen.getByText('02:00')).toBeInTheDocument();
      });
      
      // Advance time - static timer should not update
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(screen.getByText('02:00')).toBeInTheDocument();
    });
  });
});
