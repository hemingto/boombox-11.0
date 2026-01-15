/**
 * @fileoverview Tests for HowItWorksSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { HowItWorksSection } from '@/components/features/landing/HowItWorksSection';

expect.extend(toHaveNoViolations);

// Mock Next.js Link component
jest.mock('next/link', () => {
 return function MockLink({ children, href, ...props }: any) {
  return (
   <a href={href} {...props}>
    {children}
   </a>
  );
 };
});

describe('HowItWorksSection', () => {
 // REQUIRED: Test cleanup
 beforeEach(() => {
  jest.clearAllMocks();
 });

 // REQUIRED: Basic rendering
 describe('Rendering', () => {
  it('renders without crashing', () => {
   render(<HowItWorksSection />);
   expect(screen.getByRole('region', { name: /how it works$/i })).toBeInTheDocument();
  });

  it('renders the default heading', () => {
   render(<HowItWorksSection />);
   expect(screen.getByRole('heading', { level: 1, name: /how it works/i })).toBeInTheDocument();
  });

  it('renders custom heading when provided', () => {
   render(<HowItWorksSection heading="Our Process" />);
   expect(screen.getByRole('heading', { level: 1, name: /our process/i })).toBeInTheDocument();
  });

  it('renders all 4 default steps', () => {
   render(<HowItWorksSection />);
   expect(screen.getByRole('heading', { level: 2, name: /request/i })).toBeInTheDocument();
   expect(screen.getByRole('heading', { level: 2, name: /pack/i })).toBeInTheDocument();
   expect(screen.getByRole('heading', { level: 2, name: /store/i })).toBeInTheDocument();
   expect(screen.getByRole('heading', { level: 2, name: /deliver/i })).toBeInTheDocument();
  });

  it('renders custom steps when provided', () => {
   const customSteps = [
    { title: 'Step A', subtitle: 'Custom 1', description: 'Description 1' },
    { title: 'Step B', subtitle: 'Custom 2', description: 'Description 2' },
   ];
   render(<HowItWorksSection steps={customSteps} />);
   
   expect(screen.getByRole('heading', { level: 2, name: /custom 1/i })).toBeInTheDocument();
   expect(screen.getByRole('heading', { level: 2, name: /custom 2/i })).toBeInTheDocument();
   expect(screen.queryByRole('heading', { level: 2, name: /request/i })).not.toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
   render(<HowItWorksSection />);
   expect(screen.getByRole('button', { name: /scroll left to previous step/i })).toBeInTheDocument();
   expect(screen.getByRole('button', { name: /scroll right to next step/i })).toBeInTheDocument();
  });

  it('renders step badges with proper text', () => {
   render(<HowItWorksSection />);
   expect(screen.getByText('Step 1')).toBeInTheDocument();
   expect(screen.getByText('Step 2')).toBeInTheDocument();
   expect(screen.getByText('Step 3')).toBeInTheDocument();
   expect(screen.getByText('Step 4')).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
   render(<HowItWorksSection />);
   expect(screen.getByText(/book online/i)).toBeInTheDocument();
   expect(screen.getByText(/help you pack your belongings/i)).toBeInTheDocument();
   expect(screen.getByText(/safe and secure storage solution/i)).toBeInTheDocument();
   expect(screen.getByText(/deliver your items/i)).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
   const { container } = render(<HowItWorksSection className="custom-class" />);
   const section = container.querySelector('section');
   expect(section).toHaveClass('custom-class');
  });
 });

 // MANDATORY: Accessibility testing
 describe('Accessibility', () => {
  it('has no accessibility violations', async () => {
   const { container } = render(<HowItWorksSection />);
   const results = await axe(container);
   expect(results).toHaveNoViolations();
  });

  it('uses semantic HTML with section element', () => {
   const { container } = render(<HowItWorksSection />);
   const section = container.querySelector('section');
   expect(section).toBeInTheDocument();
  });

  it('has proper heading hierarchy', () => {
   render(<HowItWorksSection />);
   const h1 = screen.getByRole('heading', { level: 1, name: /how it works/i });
   const h2Elements = screen.getAllByRole('heading', { level: 2 });
   
   expect(h1).toBeInTheDocument();
   expect(h2Elements).toHaveLength(4); // 4 step subtitles
  });

  it('has proper ARIA labelledby relationship', () => {
   const { container } = render(<HowItWorksSection />);
   const section = container.querySelector('section');
   expect(section).toHaveAttribute('aria-labelledby', 'how-it-works-heading');
  });

  it('marks navigation icons as decorative', () => {
   render(<HowItWorksSection />);
   const leftButton = screen.getByRole('button', { name: /scroll left/i });
   const rightButton = screen.getByRole('button', { name: /scroll right/i });
   
   const leftIcon = leftButton.querySelector('svg');
   const rightIcon = rightButton.querySelector('svg');
   
   expect(leftIcon).toHaveAttribute('aria-hidden', 'true');
   expect(rightIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('has descriptive ARIA labels for buttons', () => {
   render(<HowItWorksSection />);
   expect(screen.getByRole('button', { name: /scroll left to previous step/i })).toBeInTheDocument();
   expect(screen.getByRole('button', { name: /scroll right to next step/i })).toBeInTheDocument();
  });

  it('has keyboard-accessible scroll container', () => {
   const { container } = render(<HowItWorksSection />);
   const scrollContainer = container.querySelector('[aria-label*="How it works steps"]');
   expect(scrollContainer).toHaveAttribute('tabindex', '0');
  });

  it('has descriptive aria-label for scroll container', () => {
   const { container } = render(<HowItWorksSection />);
   const scrollContainer = container.querySelector('[aria-label*="How it works steps"]');
   expect(scrollContainer).toHaveAttribute('aria-label', 'How it works steps - use arrow keys or scroll to navigate');
  });

  it('has descriptive accessible names for step links', () => {
   render(<HowItWorksSection />);
   expect(screen.getByRole('link', { name: /learn more about request.*book online/i })).toBeInTheDocument();
   expect(screen.getByRole('link', { name: /learn more about pack.*help you pack/i })).toBeInTheDocument();
  });

  it('has focus indicators on interactive elements', () => {
   render(<HowItWorksSection />);
   const leftButton = screen.getByRole('button', { name: /scroll left/i });
   const link = screen.getByRole('link', { name: /learn more about request/i });
   
   // Buttons have transition for smooth focus states
   
   // Links have focus ring classes
   expect(link).toHaveClass('focus:outline-none');
   expect(link).toHaveClass('focus:ring-2');
   expect(link).toHaveClass('focus:ring-primary');
  });

  it('marks spacer div as decorative', () => {
   const { container } = render(<HowItWorksSection />);
   const spacer = container.querySelector('[aria-hidden="true"].bg-transparent');
   expect(spacer).toBeInTheDocument();
  });
 });

 // REQUIRED: User interaction testing
 describe('User Interactions', () => {
  it('scroll buttons trigger scroll behavior', () => {
   const { container } = render(<HowItWorksSection />);
   const scrollContainer = container.querySelector('[aria-label*="How it works steps"]') as HTMLElement;
   const leftButton = screen.getByRole('button', { name: /scroll left/i });
   const rightButton = screen.getByRole('button', { name: /scroll right/i });
   
   // Mock scrollTo
   scrollContainer.scrollTo = jest.fn();
   
   fireEvent.click(rightButton);
   expect(scrollContainer.scrollTo).toHaveBeenCalled();
   
   fireEvent.click(leftButton);
   expect(scrollContainer.scrollTo).toHaveBeenCalled();
  });

  it('step cards are clickable links', async () => {
   const user = userEvent.setup();
   render(<HowItWorksSection />);
   
   const requestLink = screen.getByRole('link', { name: /learn more about request/i });
   expect(requestLink).toHaveAttribute('href', '/howitworks');
   
   // Link is clickable
   await user.click(requestLink);
   expect(requestLink).toBeInTheDocument();
  });

  it('uses custom link URL when provided', () => {
   render(<HowItWorksSection linkUrl="/custom-page" />);
   const links = screen.getAllByRole('link');
   
   links.forEach(link => {
    expect(link).toHaveAttribute('href', '/custom-page');
   });
  });

  it('buttons have proper type attribute', () => {
   render(<HowItWorksSection />);
   const leftButton = screen.getByRole('button', { name: /scroll left/i });
   const rightButton = screen.getByRole('button', { name: /scroll right/i });
   
   expect(leftButton).toHaveAttribute('type', 'button');
   expect(rightButton).toHaveAttribute('type', 'button');
  });
 });

 // REQUIRED: Design system integration
 describe('Design System Integration', () => {
  it('uses semantic surface colors for card backgrounds', () => {
   const { container } = render(<HowItWorksSection />);
   const card = container.querySelector('[data-step-card]');
   expect(card).toHaveClass('bg-surface-tertiary');
  });

  it('does not use hardcoded slate colors', () => {
   const { container } = render(<HowItWorksSection />);
   const htmlString = container.innerHTML;
   
   // Should not contain bg-slate-* classes
   expect(htmlString).not.toMatch(/bg-slate-100/);
   expect(htmlString).not.toMatch(/bg-slate-200/);
  });

  it('uses semantic surface colors for buttons', () => {
   render(<HowItWorksSection />);
   const leftButton = screen.getByRole('button', { name: /scroll left/i });
   
   expect(leftButton).toHaveClass('bg-surface-tertiary');
   expect(leftButton).toHaveClass('active:bg-surface-disabled');
   expect(leftButton).toHaveClass('hover:bg-surface-disabled');
  });

  it('uses semantic surface color for step badge', () => {
   const { container } = render(<HowItWorksSection />);
   const badge = container.querySelector('.bg-surface-primary.rounded-full');
   expect(badge).toBeInTheDocument();
   expect(badge).toHaveTextContent('Step 1');
  });

  it('applies consistent container padding', () => {
   const { container } = render(<HowItWorksSection />);
   const header = container.querySelector('.lg\\:px-16.px-6');
   expect(header).toBeInTheDocument();
  });

  it('uses scrollbar-hide utility class', () => {
   const { container } = render(<HowItWorksSection />);
   const scrollContainer = container.querySelector('.scrollbar-hide');
   expect(scrollContainer).toBeInTheDocument();
  });
 });

 // REQUIRED: Layout structure
 describe('Layout Structure', () => {
  it('renders header with flex layout', () => {
   const { container } = render(<HowItWorksSection />);
   const header = container.querySelector('.flex.flex-col.sm\\:flex-row');
   expect(header).toBeInTheDocument();
  });

  it('renders navigation buttons in a group', () => {
   render(<HowItWorksSection />);
   const buttonGroup = screen.getByRole('group', { name: /scroll navigation/i });
   expect(buttonGroup).toBeInTheDocument();
  });

  it('renders cards with fixed dimensions', () => {
   const { container } = render(<HowItWorksSection />);
   const card = container.querySelector('[data-step-card]');
   
   expect(card).toHaveClass('w-[297.6px]');
   expect(card).toHaveClass('sm:w-[372px]');
   expect(card).toHaveClass('h-[569.6px]');
   expect(card).toHaveClass('sm:h-[712px]');
  });

  it('renders cards as flex-none to prevent shrinking', () => {
   const { container } = render(<HowItWorksSection />);
   const card = container.querySelector('[data-step-card]');
   expect(card).toHaveClass('flex-none');
  });

  it('applies gap between cards', () => {
   const { container } = render(<HowItWorksSection />);
   const cardContainer = container.querySelector('.flex.gap-4.flex-nowrap');
   expect(cardContainer).toBeInTheDocument();
  });

  it('renders spacer element for scroll ending', () => {
   const { container } = render(<HowItWorksSection />);
   const spacer = container.querySelector('.bg-transparent.lg\\:w-\\[48px\\].w-\\[8px\\]');
   expect(spacer).toBeInTheDocument();
  });
 });

 // REQUIRED: Responsive design
 describe('Responsive Design', () => {
  it('applies responsive margin classes', () => {
   const { container } = render(<HowItWorksSection />);
   const section = container.querySelector('section');
   expect(section).toHaveClass('sm:mb-48', 'mb-24');
  });

  it('applies responsive padding to header', () => {
   const { container } = render(<HowItWorksSection />);
   const header = container.querySelector('.lg\\:px-16.px-6');
   expect(header).toBeInTheDocument();
  });

  it('applies responsive flex direction to header', () => {
   const { container } = render(<HowItWorksSection />);
   const header = container.querySelector('.flex-col.sm\\:flex-row');
   expect(header).toBeInTheDocument();
  });

  it('applies responsive card dimensions', () => {
   const { container } = render(<HowItWorksSection />);
   const card = container.querySelector('[data-step-card]');
   
   expect(card).toHaveClass('w-[297.6px]', 'sm:w-[372px]');
   expect(card).toHaveClass('h-[569.6px]', 'sm:h-[712px]');
  });

  it('applies responsive hover effects only on larger screens', () => {
   const { container } = render(<HowItWorksSection />);
   const card = container.querySelector('[data-step-card]');
   expect(card).toHaveClass('sm:hover:scale-[102%]');
  });
 });

 // REQUIRED: Component behavior
 describe('Component Behavior', () => {
  it('renders correct number of step cards', () => {
   render(<HowItWorksSection />);
   const links = screen.getAllByRole('link');
   expect(links).toHaveLength(4); // 4 default steps
  });

  it('renders custom number of steps', () => {
   const customSteps = [
    { title: 'Step 1', subtitle: 'Custom', description: 'Desc' },
    { title: 'Step 2', subtitle: 'Another', description: 'Desc 2' },
   ];
   render(<HowItWorksSection steps={customSteps} />);
   const links = screen.getAllByRole('link');
   expect(links).toHaveLength(2);
  });

  it('applies hover effects to cards', () => {
   const { container } = render(<HowItWorksSection />);
   const card = container.querySelector('[data-step-card]');
   
   expect(card).toHaveClass('transition-transform');
   expect(card).toHaveClass('duration-300');
   expect(card).toHaveClass('sm:hover:scale-[102%]');
   expect(card).toHaveClass('hover:z-10');
  });

  it('applies rounded corners to cards', () => {
   const { container } = render(<HowItWorksSection />);
   const card = container.querySelector('[data-step-card]');
   expect(card).toHaveClass('rounded-md');
  });

  it('applies cursor pointer to cards', () => {
   const { container } = render(<HowItWorksSection />);
   const card = container.querySelector('[data-step-card]');
   expect(card).toHaveClass('cursor-pointer');
  });
 });

 // REQUIRED: Edge cases
 describe('Edge Cases', () => {
  it('handles empty className prop gracefully', () => {
   render(<HowItWorksSection className="" />);
   expect(screen.getByRole('heading', { level: 1, name: /how it works/i })).toBeInTheDocument();
  });

  it('handles undefined className prop', () => {
   render(<HowItWorksSection className={undefined} />);
   expect(screen.getByRole('heading', { level: 1, name: /how it works/i })).toBeInTheDocument();
  });

  it('handles empty steps array', () => {
   render(<HowItWorksSection steps={[]} />);
   expect(screen.getByRole('heading', { level: 1, name: /how it works/i })).toBeInTheDocument();
   // Should only render spacer, no step links
   expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('handles single step', () => {
   const singleStep = [
    { title: 'Step 1', subtitle: 'Only', description: 'Single step' },
   ];
   render(<HowItWorksSection steps={singleStep} />);
   const links = screen.getAllByRole('link');
   expect(links).toHaveLength(1);
  });

  it('handles very long step descriptions', () => {
   const longDescSteps = [
    {
     title: 'Step 1',
     subtitle: 'Long',
     description: 'A'.repeat(500),
    },
   ];
   render(<HowItWorksSection steps={longDescSteps} />);
   expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
  });

  it('handles special characters in step content', () => {
   const specialSteps = [
    {
     title: 'Step #1',
     subtitle: "Test's & Quotes",
     description: 'Special chars: @#$%^&*()',
    },
   ];
   render(<HowItWorksSection steps={specialSteps} />);
   expect(screen.getByText('Step #1')).toBeInTheDocument();
   expect(screen.getByRole('heading', { level: 2, name: /test's & quotes/i })).toBeInTheDocument();
  });
 });
});

