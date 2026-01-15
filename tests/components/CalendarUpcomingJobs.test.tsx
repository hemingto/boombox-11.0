/**
 * @fileoverview Tests for CalendarUpcomingJobs component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import CalendarUpcomingJobs from '@/components/features/service-providers/calendar/CalendarUpcomingJobs';
import type { CalendarJobCardProps } from '@/components/features/service-providers/calendar/CalendarJobCard';

expect.extend(toHaveNoViolations);

// Mock CalendarJobCard component (default export)
jest.mock('@/components/features/service-providers/calendar/CalendarJobCard', () => {
 const MockCalendarJobCard = ({ title, customerName }: any) => (
  <div data-testid="mock-calendar-job-card">
   <h3>{title}</h3>
   <p>{customerName}</p>
  </div>
 );
 MockCalendarJobCard.displayName = 'MockCalendarJobCard';
 return {
  __esModule: true,
  CalendarJobCard: MockCalendarJobCard,
  default: MockCalendarJobCard
 };
});

describe('CalendarUpcomingJobs', () => {
 const mockJobs: CalendarJobCardProps[] = [
  {
   title: 'Storage Unit Delivery',
   crewSize: '2 movers required',
   customerId: 'CUST-12345',
   customerName: 'John Doe',
   date: 'Monday, January 15, 2025',
   time: '10:00 AM - 12:00 PM',
   address: '123 Main St, San Francisco, CA 94102',
   description: 'Need help moving 5 storage units.',
  },
  {
   title: 'Container Pickup',
   crewSize: '3 movers required',
   customerId: 'CUST-67890',
   customerName: 'Jane Smith',
   date: 'Tuesday, January 16, 2025',
   time: '2:00 PM - 4:00 PM',
   address: '456 Oak Ave, San Jose, CA 95110',
   description: 'Pick up 3 containers from storage facility.',
  },
 ];

 // REQUIRED: Test cleanup
 beforeEach(() => {
  jest.clearAllMocks();
 });

 // REQUIRED: Basic rendering
 describe('Rendering', () => {
  it('renders without crashing', () => {
   render(<CalendarUpcomingJobs />);
   expect(screen.getByRole('region', { name: /upcoming jobs section/i })).toBeInTheDocument();
  });

  it('displays default heading', () => {
   render(<CalendarUpcomingJobs />);
   expect(screen.getByRole('heading', { name: /upcoming jobs/i })).toBeInTheDocument();
  });

  it('displays custom heading when provided', () => {
   render(<CalendarUpcomingJobs heading="My Custom Jobs" />);
   expect(screen.getByRole('heading', { name: /my custom jobs/i })).toBeInTheDocument();
  });

  it('renders Open Calendar button by default', () => {
   render(<CalendarUpcomingJobs />);
   expect(screen.getByRole('button', { name: /open full calendar view/i })).toBeInTheDocument();
  });

  it('displays custom button text when provided', () => {
   render(<CalendarUpcomingJobs buttonText="View Full Schedule" />);
   // Button's accessible name comes from aria-label, but text should still be visible
   expect(screen.getByText('View Full Schedule')).toBeInTheDocument();
   expect(screen.getByRole('button', { name: /open full calendar view/i })).toBeInTheDocument();
  });

  it('hides Open Calendar button when hideOpenCalendarButton is true', () => {
   render(<CalendarUpcomingJobs hideOpenCalendarButton />);
   expect(screen.queryByRole('button', { name: /open full calendar view/i })).not.toBeInTheDocument();
  });

  it('renders job cards when jobs provided', () => {
   render(<CalendarUpcomingJobs jobs={mockJobs} />);
   const jobCards = screen.getAllByTestId('mock-calendar-job-card');
   expect(jobCards).toHaveLength(2);
  });

  it('displays correct job information in cards', () => {
   render(<CalendarUpcomingJobs jobs={mockJobs} />);
   expect(screen.getByText('Storage Unit Delivery')).toBeInTheDocument();
   expect(screen.getByText('John Doe')).toBeInTheDocument();
   expect(screen.getByText('Container Pickup')).toBeInTheDocument();
   expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
 });

 // MANDATORY: Accessibility testing
 describe('Accessibility', () => {
  it('has no accessibility violations', async () => {
   const renderResult = render(<CalendarUpcomingJobs jobs={mockJobs} />);
   await testAccessibility(renderResult);
  });

  it('has proper ARIA labels', () => {
   render(<CalendarUpcomingJobs jobs={mockJobs} />);
   
   expect(screen.getByRole('region', { name: /upcoming jobs section/i })).toBeInTheDocument();
   expect(screen.getByRole('button', { name: /open full calendar view/i })).toBeInTheDocument();
   expect(screen.getByRole('list', { name: /list of upcoming jobs/i })).toBeInTheDocument();
  });

  it('uses semantic HTML structure', () => {
   render(<CalendarUpcomingJobs jobs={mockJobs} />);
   
   // Check for semantic elements
   expect(screen.getByRole('region')).toBeInTheDocument(); // section
   expect(screen.getByRole('button')).toBeInTheDocument();
   expect(screen.getByRole('heading', { name: /upcoming jobs/i })).toBeInTheDocument();
   expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('maintains accessibility with empty jobs', async () => {
   const renderResult = render(<CalendarUpcomingJobs jobs={[]} />);
   await testAccessibility(renderResult);
  });

  it('has proper list item roles', () => {
   render(<CalendarUpcomingJobs jobs={mockJobs} />);
   const listItems = screen.getAllByRole('listitem');
   expect(listItems).toHaveLength(2);
  });
 });

 // REQUIRED: User interaction testing
 describe('User Interactions', () => {
  it('calls onOpenCalendar when button is clicked', async () => {
   const user = userEvent.setup();
   const mockOnOpenCalendar = jest.fn();
   
   render(<CalendarUpcomingJobs onOpenCalendar={mockOnOpenCalendar} />);
   
   const button = screen.getByRole('button', { name: /open full calendar view/i });
   await user.click(button);
   
   expect(mockOnOpenCalendar).toHaveBeenCalledTimes(1);
  });

  it('does not throw error when button clicked without callback', async () => {
   const user = userEvent.setup();
   
   render(<CalendarUpcomingJobs />);
   
   const button = screen.getByRole('button', { name: /open full calendar view/i });
   await user.click(button);
   
   // Should not throw error
   expect(button).toBeInTheDocument();
  });

  it('button has proper hover styles', () => {
   render(<CalendarUpcomingJobs />);
   const button = screen.getByRole('button', { name: /open full calendar view/i });
   
   expect(button).toHaveClass('hover:bg-primary-hover');
  });

  it('button has proper active styles', () => {
   render(<CalendarUpcomingJobs />);
   const button = screen.getByRole('button', { name: /open full calendar view/i });
   
   expect(button).toHaveClass('active:bg-primary-active');
  });
 });

 // Empty state testing
 describe('Empty State', () => {
  it('displays empty state message when no jobs provided', () => {
   render(<CalendarUpcomingJobs jobs={[]} />);
   
   expect(screen.getByText(/no upcoming jobs at this time/i)).toBeInTheDocument();
   expect(screen.getByText(/check back later for new job assignments/i)).toBeInTheDocument();
  });

  it('displays empty state when jobs array is empty', () => {
   render(<CalendarUpcomingJobs jobs={[]} />);
   
   const emptyState = screen.getByRole('status');
   expect(emptyState).toBeInTheDocument();
   expect(emptyState).toHaveAttribute('aria-live', 'polite');
  });

  it('empty state uses proper semantic colors', () => {
   const { container } = render(<CalendarUpcomingJobs jobs={[]} />);
   
   const emptyState = screen.getByRole('status');
   expect(emptyState).toHaveClass('bg-surface-secondary');
   expect(emptyState).toHaveClass('border-border');
  });

  it('does not display empty state when jobs are provided', () => {
   render(<CalendarUpcomingJobs jobs={mockJobs} />);
   
   expect(screen.queryByText(/no upcoming jobs at this time/i)).not.toBeInTheDocument();
  });
 });

 // Props testing
 describe('Props', () => {
  it('applies custom className', () => {
   const { container } = render(<CalendarUpcomingJobs className="custom-class" />);
   const section = screen.getByRole('region');
   
   expect(section).toHaveClass('custom-class');
  });

  it('renders with all props provided', () => {
   const mockOnOpenCalendar = jest.fn();
   
   render(
    <CalendarUpcomingJobs
     jobs={mockJobs}
     onOpenCalendar={mockOnOpenCalendar}
     heading="Custom Heading"
     buttonText="Custom Button"
     hideOpenCalendarButton={false}
     className="test-class"
    />
   );
   
   expect(screen.getByRole('heading', { name: /custom heading/i })).toBeInTheDocument();
   // Button text changes but aria-label remains the same for accessibility
   expect(screen.getByText('Custom Button')).toBeInTheDocument();
   expect(screen.getByRole('region')).toHaveClass('test-class');
  });

  it('uses default values when optional props not provided', () => {
   render(<CalendarUpcomingJobs />);
   
   expect(screen.getByRole('heading', { name: /upcoming jobs/i })).toBeInTheDocument();
   expect(screen.getByText('Open Calendar')).toBeInTheDocument();
   expect(screen.getByRole('button', { name: /open full calendar view/i })).toBeInTheDocument();
  });
 });

 // Design system integration
 describe('Design System Integration', () => {
  it('uses semantic color classes for button', () => {
   render(<CalendarUpcomingJobs />);
   const button = screen.getByRole('button', { name: /open full calendar view/i });
   
   expect(button).toHaveClass('bg-primary');
   expect(button).toHaveClass('text-text-inverse');
   expect(button).toHaveClass('hover:bg-primary-hover');
   expect(button).toHaveClass('active:bg-primary-active');
  });

  it('uses semantic color for heading', () => {
   render(<CalendarUpcomingJobs />);
   const heading = screen.getByRole('heading', { name: /upcoming jobs/i });
   
   expect(heading).toHaveClass('text-text-primary');
  });

  it('uses consistent spacing classes', () => {
   render(<CalendarUpcomingJobs jobs={mockJobs} />);
   const section = screen.getByRole('region');
   
   expect(section).toHaveClass('lg:px-16');
   expect(section).toHaveClass('px-6');
   expect(section).toHaveClass('max-w-5xl');
  });

  it('applies transition classes for smooth interactions', () => {
   render(<CalendarUpcomingJobs />);
   const button = screen.getByRole('button', { name: /open full calendar view/i });
   
   expect(button).toHaveClass('duration-200');
  });
 });

 // Edge cases
 describe('Edge Cases', () => {
  it('handles single job correctly', () => {
   render(<CalendarUpcomingJobs jobs={[mockJobs[0]]} />);
   const jobCards = screen.getAllByTestId('mock-calendar-job-card');
   
   expect(jobCards).toHaveLength(1);
  });

  it('handles many jobs correctly', () => {
   const manyJobs = Array(10).fill(mockJobs[0]);
   render(<CalendarUpcomingJobs jobs={manyJobs} />);
   const jobCards = screen.getAllByTestId('mock-calendar-job-card');
   
   expect(jobCards).toHaveLength(10);
  });

  it('handles undefined jobs array', () => {
   render(<CalendarUpcomingJobs />);
   
   expect(screen.getByText(/no upcoming jobs at this time/i)).toBeInTheDocument();
  });

  it('handles very long custom heading', () => {
   const longHeading = 'This is a very long custom heading that should still render properly without breaking the layout';
   render(<CalendarUpcomingJobs heading={longHeading} />);
   
   expect(screen.getByRole('heading', { name: new RegExp(longHeading, 'i') })).toBeInTheDocument();
  });

  it('handles very long button text', () => {
   const longButtonText = 'This is a very long button text that should wrap properly';
   render(<CalendarUpcomingJobs buttonText={longButtonText} />);
   
   // Button text should be visible even if long
   expect(screen.getByText(longButtonText)).toBeInTheDocument();
   expect(screen.getByRole('button', { name: /open full calendar view/i })).toBeInTheDocument();
  });
 });

 // Layout testing
 describe('Layout', () => {
  it('uses proper container classes', () => {
   render(<CalendarUpcomingJobs />);
   const section = screen.getByRole('region');
   
   expect(section).toHaveClass('flex');
   expect(section).toHaveClass('flex-col');
   expect(section).toHaveClass('w-full');
   expect(section).toHaveClass('mx-auto');
   expect(section).toHaveClass('mb-10');
  });

  it('applies proper spacing to jobs list', () => {
   const { container } = render(<CalendarUpcomingJobs jobs={mockJobs} />);
   const jobsList = screen.getByRole('list');
   
   expect(jobsList).toHaveClass('space-y-4');
  });

  it('applies proper margin to heading', () => {
   render(<CalendarUpcomingJobs />);
   const heading = screen.getByRole('heading', { name: /upcoming jobs/i });
   
   expect(heading).toHaveClass('mt-16');
   expect(heading).toHaveClass('mb-8');
  });
 });

 // Icon testing
 describe('Icons', () => {
  it('renders icon in button with proper classes', () => {
   const { container } = render(<CalendarUpcomingJobs />);
   const button = screen.getByRole('button', { name: /open full calendar view/i });
   
   // Icon should be present (it's the ArrowTopRightOnSquareIcon)
   const icon = button.querySelector('svg');
   expect(icon).toBeInTheDocument();
   expect(icon).toHaveClass('w-5');
   expect(icon).toHaveClass('h-5');
   expect(icon).toHaveClass('mr-1');
  });

  it('icon has proper aria-hidden attribute', () => {
   const { container } = render(<CalendarUpcomingJobs />);
   const button = screen.getByRole('button', { name: /open full calendar view/i });
   const icon = button.querySelector('svg');
   
   expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
 });
});

