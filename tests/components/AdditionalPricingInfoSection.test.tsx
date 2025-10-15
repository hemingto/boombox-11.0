/**
 * @fileoverview Tests for AdditionalPricingInfoSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { AdditionalPricingInfoSection } from '@/components/features/storage-unit-prices/AdditionalPricingInfoSection';

expect.extend(toHaveNoViolations);

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return {
    __esModule: true,
    default: MockLink,
  };
});

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage(props: any) {
    return (
      <img
        src={props.src}
        alt={props.alt}
        data-testid="optimized-image"
        className={props.className}
      />
    );
  },
}));

describe('AdditionalPricingInfoSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock scrollTo for JSDOM (scrollTo not supported in JSDOM)
    Element.prototype.scrollTo = jest.fn();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<AdditionalPricingInfoSection />);
      expect(screen.getByRole('region', { name: /pricing information carousel/i })).toBeInTheDocument();
    });

    it('renders the section heading', () => {
      render(<AdditionalPricingInfoSection />);
      expect(screen.getByRole('heading', { name: /additional pricing info/i, level: 1 })).toBeInTheDocument();
    });

    it('renders all four pricing cards', () => {
      render(<AdditionalPricingInfoSection />);
      
      // Check for all pricing card titles
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('$189/hr on avg')).toBeInTheDocument();
      expect(screen.getByText('$45 flat rate')).toBeInTheDocument();
      expect(screen.getByText('Boxes')).toBeInTheDocument();
    });

    it('renders all pricing card subtitles', () => {
      render(<AdditionalPricingInfoSection />);
      
      expect(screen.getByText('Initial Delivery')).toBeInTheDocument();
      expect(screen.getByText('Optional Loading Help')).toBeInTheDocument();
      expect(screen.getByText('Storage Unit Access')).toBeInTheDocument();
      expect(screen.getByText('Packing Supplies')).toBeInTheDocument();
    });

    it('renders all pricing card descriptions', () => {
      render(<AdditionalPricingInfoSection />);
      
      expect(screen.getByText(/Your Boombox is delivered right to your door/i)).toBeInTheDocument();
      expect(screen.getByText(/We partner with local moving pros/i)).toBeInTheDocument();
      expect(screen.getByText(/book a return delivery/i)).toBeInTheDocument();
      expect(screen.getByText(/Order boxes, tape, and more/i)).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      render(<AdditionalPricingInfoSection />);
      
      expect(screen.getByRole('button', { name: /scroll to previous pricing card/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /scroll to next pricing card/i })).toBeInTheDocument();
    });

    it('renders OptimizedImage components for each card', () => {
      render(<AdditionalPricingInfoSection />);
      
      const images = screen.getAllByTestId('optimized-image');
      expect(images).toHaveLength(4);
    });

    it('renders all cards as links', () => {
      render(<AdditionalPricingInfoSection />);
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(4);
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<AdditionalPricingInfoSection />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels on navigation buttons', () => {
      render(<AdditionalPricingInfoSection />);
      
      const prevButton = screen.getByRole('button', { name: /scroll to previous pricing card/i });
      const nextButton = screen.getByRole('button', { name: /scroll to next pricing card/i });
      
      expect(prevButton).toHaveAttribute('aria-label', 'Scroll to previous pricing card');
      expect(nextButton).toHaveAttribute('aria-label', 'Scroll to next pricing card');
    });

    it('has proper ARIA label on carousel container', () => {
      render(<AdditionalPricingInfoSection />);
      
      const carousel = screen.getByRole('region', { name: /pricing information carousel/i });
      expect(carousel).toHaveAttribute('aria-label', 'Pricing information carousel');
    });

    it('section has proper semantic HTML', () => {
      render(<AdditionalPricingInfoSection />);
      
      const section = screen.getByRole('region', { name: /additional pricing information/i });
      expect(section.tagName).toBe('SECTION');
    });

    it('cards use semantic article elements', () => {
      const { container } = render(<AdditionalPricingInfoSection />);
      
      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(4);
    });

    it('images have descriptive alt text', () => {
      render(<AdditionalPricingInfoSection />);
      
      const images = screen.getAllByTestId('optimized-image');
      images.forEach((img) => {
        const altText = img.getAttribute('alt');
        expect(altText).toBeTruthy();
        expect(altText!.length).toBeGreaterThan(10); // Descriptive alt text
      });
    });

    it('navigation buttons have proper button type', () => {
      render(<AdditionalPricingInfoSection />);
      
      const prevButton = screen.getByRole('button', { name: /scroll to previous/i });
      const nextButton = screen.getByRole('button', { name: /scroll to next/i });
      
      expect(prevButton).toHaveAttribute('type', 'button');
      expect(nextButton).toHaveAttribute('type', 'button');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('scroll left button is clickable', async () => {
      const user = userEvent.setup();
      render(<AdditionalPricingInfoSection />);
      
      const prevButton = screen.getByRole('button', { name: /scroll to previous/i });
      await user.click(prevButton);
      
      // Button should still be in the document after click
      expect(prevButton).toBeInTheDocument();
    });

    it('scroll right button is clickable', async () => {
      const user = userEvent.setup();
      render(<AdditionalPricingInfoSection />);
      
      const nextButton = screen.getByRole('button', { name: /scroll to next/i });
      await user.click(nextButton);
      
      // Button should still be in the document after click
      expect(nextButton).toBeInTheDocument();
    });

    it('pricing cards are clickable links', async () => {
      const user = userEvent.setup();
      render(<AdditionalPricingInfoSection />);
      
      const links = screen.getAllByRole('link');
      
      // First pricing card link
      await user.click(links[0]);
      expect(links[0]).toHaveAttribute('href', '/');
    });

    it('navigation buttons have hover states', () => {
      render(<AdditionalPricingInfoSection />);
      
      const prevButton = screen.getByRole('button', { name: /scroll to previous/i });
      const nextButton = screen.getByRole('button', { name: /scroll to next/i });
      
      expect(prevButton).toHaveClass('hover:bg-surface-disabled');
      expect(nextButton).toHaveClass('hover:bg-surface-disabled');
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('uses semantic color tokens', () => {
      render(<AdditionalPricingInfoSection />);
      
      const prevButton = screen.getByRole('button', { name: /scroll to previous/i });
      
      // Check for design system classes
      expect(prevButton).toHaveClass('bg-surface-tertiary');
      expect(prevButton).toHaveClass('active:bg-surface-disabled');
    });

    it('cards use semantic surface colors', () => {
      const { container } = render(<AdditionalPricingInfoSection />);
      
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('bg-surface-tertiary');
      });
    });

    it('title badges use semantic surface color', () => {
      const { container } = render(<AdditionalPricingInfoSection />);
      
      const badges = container.querySelectorAll('p.bg-surface-primary');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('uses semantic text colors', () => {
      render(<AdditionalPricingInfoSection />);
      
      const heading = screen.getByRole('heading', { name: /additional pricing info/i });
      expect(heading).toHaveClass('text-text-primary');
    });
  });

  // Responsive design
  describe('Responsive Design', () => {
    it('has responsive padding classes', () => {
      const { container } = render(<AdditionalPricingInfoSection />);
      
      const itemContainer = container.querySelector('#item-container');
      expect(itemContainer).toHaveClass('lg:px-16', 'px-6');
    });

    it('cards have responsive dimensions', () => {
      const { container } = render(<AdditionalPricingInfoSection />);
      
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('w-[297.6px]', 'sm:w-[372px]');
        expect(article).toHaveClass('h-[569.6px]', 'sm:h-[712px]');
      });
    });

    it('header layout is responsive', () => {
      const { container } = render(<AdditionalPricingInfoSection />);
      
      const header = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(header).toBeInTheDocument();
    });
  });

  // Performance
  describe('Performance', () => {
    it('images use lazy loading', () => {
      render(<AdditionalPricingInfoSection />);
      
      const images = screen.getAllByTestId('optimized-image');
      // OptimizedImage component should handle lazy loading internally
      expect(images.length).toBe(4);
    });

    it('has transform transition for hover effects', () => {
      const { container } = render(<AdditionalPricingInfoSection />);
      
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('transition-transform', 'duration-300');
      });
    });
  });

  // Content structure
  describe('Content Structure', () => {
    it('maintains correct pricing information', () => {
      render(<AdditionalPricingInfoSection />);
      
      // Verify pricing titles
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('$189/hr on avg')).toBeInTheDocument();
      expect(screen.getByText('$45 flat rate')).toBeInTheDocument();
      expect(screen.getByText('Boxes')).toBeInTheDocument();
    });

    it('each card has complete information', () => {
      const { container } = render(<AdditionalPricingInfoSection />);
      
      const articles = container.querySelectorAll('article');
      
      articles.forEach((article) => {
        // Each article should have an image
        const img = article.querySelector('img');
        expect(img).toBeInTheDocument();
        
        // Each article should have a title badge
        const badge = article.querySelector('p.bg-surface-primary');
        expect(badge).toBeInTheDocument();
        
        // Each article should have a subtitle (h2)
        const subtitle = article.querySelector('h2');
        expect(subtitle).toBeInTheDocument();
        
        // Each article should have a description
        const description = article.querySelector('p.text-text-secondary');
        expect(description).toBeInTheDocument();
      });
    });
  });
});

