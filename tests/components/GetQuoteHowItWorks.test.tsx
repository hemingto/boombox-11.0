/**
 * @fileoverview Tests for GetQuoteHowItWorks component
 * Following boombox-11.0 testing standards
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { GetQuoteHowItWorks } from '@/components/features/howitworks/GetQuoteHowItWorks';

expect.extend(toHaveNoViolations);

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return {
    __esModule: true,
    default: MockLink,
  };
});

describe('GetQuoteHowItWorks', () => {
  // Required: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Required: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<GetQuoteHowItWorks />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays the main heading', () => {
      render(<GetQuoteHowItWorks />);
      expect(screen.getByRole('heading', { name: /say goodbye to self storage/i })).toBeInTheDocument();
    });

    it('displays the description text', () => {
      render(<GetQuoteHowItWorks />);
      expect(screen.getByText(/get a quote in as little as 2 minutes/i)).toBeInTheDocument();
    });

    it('renders the Get Quote button/link', () => {
      render(<GetQuoteHowItWorks />);
      expect(screen.getByRole('link', { name: /get a quote for boombox storage/i })).toBeInTheDocument();
    });

    it('renders the optimized image', () => {
      render(<GetQuoteHowItWorks />);
      expect(screen.getByRole('img', { name: /boombox storage service/i })).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<GetQuoteHowItWorks className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // Mandatory: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<GetQuoteHowItWorks />);
      await testAccessibility(renderResult);
    });

    it('has proper semantic HTML structure', () => {
      render(<GetQuoteHowItWorks />);
      
      // Section element
      expect(screen.getByRole('region')).toBeInTheDocument();
      
      // Heading element
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      
      // Link element
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('has proper ARIA labels', () => {
      render(<GetQuoteHowItWorks />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'get-quote-heading');
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Get a quote for Boombox storage');
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Boombox storage service - convenient mobile storage solution');
    });

    it('link has proper href attribute', () => {
      render(<GetQuoteHowItWorks />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/getquote');
    });
  });

  // Required: User interaction testing
  describe('User Interactions', () => {
    it('handles link click', async () => {
      const user = userEvent.setup();
      render(<GetQuoteHowItWorks />);
      
      const link = screen.getByRole('link', { name: /get a quote for boombox storage/i });
      
      // Link should be clickable
      await user.click(link);
      expect(link).toHaveAttribute('href', '/getquote');
    });

    it('link is keyboard accessible', () => {
      render(<GetQuoteHowItWorks />);
      const link = screen.getByRole('link');
      
      link.focus();
      expect(link).toHaveFocus();
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('uses btn-primary class for the CTA button', () => {
      render(<GetQuoteHowItWorks />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('btn-primary');
    });

    it('uses OptimizedImage component with proper attributes', () => {
      render(<GetQuoteHowItWorks />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src');
      expect(image).toHaveAttribute('alt');
    });

    it('uses semantic text colors', () => {
      render(<GetQuoteHowItWorks />);
      const description = screen.getByText(/get a quote in as little as 2 minutes/i);
      expect(description).toHaveClass('text-text-primary');
    });

    it('link has inline-block display class', () => {
      render(<GetQuoteHowItWorks />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('inline-block');
    });
  });

  // Responsive design
  describe('Responsive Design', () => {
    it('applies responsive layout classes', () => {
      const { container } = render(<GetQuoteHowItWorks />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex');
    });

    it('applies responsive padding', () => {
      const { container } = render(<GetQuoteHowItWorks />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies responsive spacing', () => {
      const { container } = render(<GetQuoteHowItWorks />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('sm:mb-48', 'mb-24', 'mt-14');
    });

    it('content column has responsive basis class', () => {
      const { container } = render(<GetQuoteHowItWorks />);
      const contentColumn = container.querySelector('.basis-1\\/2');
      expect(contentColumn).toBeInTheDocument();
    });

    it('description has responsive width', () => {
      render(<GetQuoteHowItWorks />);
      const description = screen.getByText(/get a quote in as little as 2 minutes/i);
      expect(description).toHaveClass('w-4/6');
    });
  });

  // Layout structure
  describe('Layout Structure', () => {
    it('renders two-column layout structure', () => {
      const { container } = render(<GetQuoteHowItWorks />);
      const columns = container.querySelectorAll('.basis-1\\/2');
      expect(columns).toHaveLength(2);
    });

    it('left column contains content elements', () => {
      const { container } = render(<GetQuoteHowItWorks />);
      const leftColumn = container.querySelector('.place-content-center');
      
      expect(leftColumn).toBeInTheDocument();
      expect(leftColumn?.querySelector('h2')).toBeInTheDocument();
      expect(leftColumn?.querySelector('p')).toBeInTheDocument();
      expect(leftColumn?.querySelector('a')).toBeInTheDocument();
    });

    it('right column contains image', () => {
      const { container } = render(<GetQuoteHowItWorks />);
      const rightColumn = container.querySelector('.place-content-end');
      
      expect(rightColumn).toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('image has proper Next.js Image attributes', () => {
      render(<GetQuoteHowItWorks />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('image has rounded corners styling', () => {
      render(<GetQuoteHowItWorks />);
      const image = screen.getByRole('img');
      expect(image).toHaveClass('rounded-md');
    });
  });

  // Content validation
  describe('Content Validation', () => {
    it('heading uses proper heading level (h2)', () => {
      render(<GetQuoteHowItWorks />);
      const heading = screen.getByRole('heading', { name: /say goodbye to self storage/i });
      expect(heading.tagName).toBe('H2');
    });

    it('heading has proper id for ARIA labeling', () => {
      render(<GetQuoteHowItWorks />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('id', 'get-quote-heading');
    });

    it('displays correct call-to-action text', () => {
      render(<GetQuoteHowItWorks />);
      expect(screen.getByText('Get Quote')).toBeInTheDocument();
    });

    it('description provides clear value proposition', () => {
      render(<GetQuoteHowItWorks />);
      const description = screen.getByText(/get a quote in as little as 2 minutes/i);
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('renders correctly without className prop', () => {
      const { container } = render(<GetQuoteHowItWorks />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('renders correctly with empty className', () => {
      const { container } = render(<GetQuoteHowItWorks className="" />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('renders correctly with multiple className values', () => {
      const { container } = render(<GetQuoteHowItWorks className="extra-class another-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('extra-class', 'another-class');
    });
  });
});

