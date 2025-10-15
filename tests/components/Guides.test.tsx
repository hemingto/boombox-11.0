/**
 * @fileoverview Tests for Guides component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Guides from '@/components/features/helpcenter/Guides';

expect.extend(toHaveNoViolations);

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  },
}));

describe('Guides', () => {
  // Mock ResizeObserver
  beforeAll(() => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock window.addEventListener/removeEventListener
    global.addEventListener = jest.fn();
    global.removeEventListener = jest.fn();

    // Mock scrollTo for Element
    Element.prototype.scrollTo = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Guides />);
      expect(screen.getByRole('region', { name: /help guides/i })).toBeInTheDocument();
    });

    it('renders with default title', () => {
      render(<Guides />);
      expect(screen.getByRole('heading', { level: 1, name: 'Guides for getting started' })).toBeInTheDocument();
    });

    it('renders default 4 guide cards', () => {
      render(<Guides />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(4);
    });

    it('renders navigation buttons', () => {
      render(<Guides />);
      expect(screen.getByLabelText('Scroll guides left')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll guides right')).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      render(<Guides title="Custom Guides" />);
      expect(screen.getByRole('heading', { level: 1, name: 'Custom Guides' })).toBeInTheDocument();
    });

    it('renders custom guides when provided', () => {
      const customGuides = [
        { title: 'Guide 1', subtitle: 'Sub 1', description: 'Desc 1', link: '/link1' },
        { title: 'Guide 2', subtitle: 'Sub 2', description: 'Desc 2', link: '/link2' },
      ];
      
      render(<Guides guides={customGuides} />);
      expect(screen.getByText('Guide 1')).toBeInTheDocument();
      expect(screen.getByText('Guide 2')).toBeInTheDocument();
      expect(screen.getByText('Sub 1')).toBeInTheDocument();
      expect(screen.getByText('Sub 2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Guides />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels on navigation buttons', () => {
      render(<Guides />);
      
      const leftButton = screen.getByLabelText('Scroll guides left');
      const rightButton = screen.getByLabelText('Scroll guides right');
      
      expect(leftButton).toBeInTheDocument();
      expect(rightButton).toBeInTheDocument();
    });

    it('has proper landmark regions', () => {
      render(<Guides />);
      
      expect(screen.getByRole('region', { name: /help guides/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /scrollable guides carousel/i })).toBeInTheDocument();
    });

    it('navigation buttons are proper button elements', () => {
      render(<Guides />);
      
      const leftButton = screen.getByLabelText('Scroll guides left');
      const rightButton = screen.getByLabelText('Scroll guides right');
      
      expect(leftButton.tagName).toBe('BUTTON');
      expect(rightButton.tagName).toBe('BUTTON');
    });

    it('has screen reader only text for buttons', () => {
      const { container } = render(<Guides />);
      
      const srOnly = container.querySelectorAll('.sr-only');
      expect(srOnly).toHaveLength(2); // "Previous guides" and "Next guides"
    });

    it('icons have aria-hidden', () => {
      const { container } = render(<Guides />);
      
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });

    it('carousel has tabindex for keyboard focus', () => {
      const { container } = render(<Guides />);
      
      const carousel = screen.getByRole('region', { name: /scrollable guides carousel/i });
      expect(carousel).toHaveAttribute('tabindex', '0');
    });
  });

  describe('User Interactions', () => {
    it('left button is clickable', async () => {
      const user = userEvent.setup();
      render(<Guides />);
      
      const leftButton = screen.getByLabelText('Scroll guides left');
      await user.click(leftButton);
      
      expect(leftButton).toBeInTheDocument();
    });

    it('right button is clickable', async () => {
      const user = userEvent.setup();
      render(<Guides />);
      
      const rightButton = screen.getByLabelText('Scroll guides right');
      await user.click(rightButton);
      
      expect(rightButton).toBeInTheDocument();
    });

    it('guide cards are clickable links', async () => {
      const user = userEvent.setup();
      render(<Guides />);
      
      const firstLink = screen.getAllByRole('link')[0];
      await user.click(firstLink);
      
      expect(firstLink).toBeInTheDocument();
    });

    it('handles keyboard navigation (ArrowLeft)', () => {
      const { container } = render(<Guides />);
      
      const carousel = screen.getByRole('region', { name: /scrollable guides carousel/i });
      fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
      
      // Component should handle the keydown
      expect(carousel).toBeInTheDocument();
    });

    it('handles keyboard navigation (ArrowRight)', () => {
      const { container } = render(<Guides />);
      
      const carousel = screen.getByRole('region', { name: /scrollable guides carousel/i });
      fireEvent.keyDown(carousel, { key: 'ArrowRight' });
      
      // Component should handle the keydown
      expect(carousel).toBeInTheDocument();
    });
  });

  describe('Design System Integration', () => {
    it('uses semantic color classes for buttons', () => {
      render(<Guides />);
      
      const leftButton = screen.getByLabelText('Scroll guides left');
      expect(leftButton).toHaveClass('bg-surface-tertiary');
      expect(leftButton).toHaveClass('active:bg-surface-disabled');
    });

    it('uses semantic color classes for cards', () => {
      const { container } = render(<Guides />);
      
      const cards = container.querySelectorAll('[data-guide-card]');
      cards.forEach(card => {
        expect(card).toHaveClass('bg-surface-tertiary');
      });
    });

    it('applies custom className', () => {
      render(<Guides className="custom-class" />);
      
      const section = screen.getByRole('region', { name: /help guides/i });
      expect(section).toHaveClass('custom-class');
    });

    it('buttons have focus styles', () => {
      render(<Guides />);
      
      const leftButton = screen.getByLabelText('Scroll guides left');
      expect(leftButton).toHaveClass('focus:ring-2', 'focus:ring-primary');
    });
  });

  describe('Component Structure', () => {
    it('renders semantic section element', () => {
      render(<Guides />);
      
      const section = screen.getByRole('region', { name: /help guides/i });
      expect(section.tagName).toBe('SECTION');
    });

    it('guide cards have proper data attributes', () => {
      const { container } = render(<Guides />);
      
      const cards = container.querySelectorAll('[data-guide-card]');
      expect(cards).toHaveLength(4);
    });

    it('has spacer div for scroll padding', () => {
      const { container } = render(<Guides />);
      
      const spacer = container.querySelector('.bg-transparent');
      expect(spacer).toBeInTheDocument();
      expect(spacer).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders h2 for guide subtitles', () => {
      render(<Guides />);
      
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings).toHaveLength(4); // One per guide
    });
  });

  describe('Responsive Behavior', () => {
    it('has responsive spacing classes', () => {
      render(<Guides />);
      
      const section = screen.getByRole('region', { name: /help guides/i });
      expect(section).toHaveClass('sm:mb-48', 'mb-24');
    });

    it('header has responsive layout', () => {
      const { container } = render(<Guides />);
      
      const header = container.querySelector('.flex-col.sm\\:flex-row');
      expect(header).toBeInTheDocument();
    });

    it('has responsive padding', () => {
      const { container } = render(<Guides />);
      
      const paddedContainer = container.querySelector('.lg\\:px-16.px-6');
      expect(paddedContainer).toBeInTheDocument();
    });
  });

  describe('Scrolling Behavior', () => {
    it('initializes ResizeObserver', () => {
      render(<Guides />);
      
      expect(global.ResizeObserver).toHaveBeenCalled();
    });

    it('sets up window resize listener', () => {
      render(<Guides />);
      
      expect(global.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('carousel has overflow-x-auto', () => {
      render(<Guides />);
      
      const carousel = screen.getByRole('region', { name: /scrollable guides carousel/i });
      expect(carousel).toHaveClass('overflow-x-auto');
    });

    it('hides scrollbar with utility classes', () => {
      render(<Guides />);
      
      const carousel = screen.getByRole('region', { name: /scrollable guides carousel/i });
      expect(carousel.className).toContain('scrollbar');
    });
  });
});

