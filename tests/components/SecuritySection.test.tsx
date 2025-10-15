/**
 * @fileoverview Tests for SecuritySection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { SecuritySection } from '@/components/features/landing/SecuritySection';

expect.extend(toHaveNoViolations);

// Mock icon components
jest.mock('@/components/icons/SecurityCameraIcon', () => ({
  SecurityCameraIcon: ({ className }: any) => (
    <svg data-testid="security-camera-icon" className={className}>SecurityCamera</svg>
  ),
}));

jest.mock('@/components/icons/LockIcon', () => ({
  LockIcon: ({ className }: any) => (
    <svg data-testid="lock-icon" className={className}>Lock</svg>
  ),
}));

jest.mock('@/components/icons/StorageUnitIcon', () => ({
  StorageUnitIcon: ({ className }: any) => (
    <svg data-testid="storage-unit-icon" className={className}>StorageUnit</svg>
  ),
}));

jest.mock('@/components/icons/WarehouseIcon', () => ({
  WarehouseIcon: ({ className }: any) => (
    <svg data-testid="warehouse-icon" className={className}>Warehouse</svg>
  ),
}));

describe('SecuritySection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SecuritySection />);
      expect(screen.getByRole('region', { name: /security you can trust/i })).toBeInTheDocument();
    });

    it('renders the default heading', () => {
      render(<SecuritySection />);
      expect(screen.getByRole('heading', { level: 1, name: /security you can trust/i })).toBeInTheDocument();
    });

    it('renders custom heading when provided', () => {
      render(<SecuritySection heading="Why Choose Boombox" />);
      expect(screen.getByRole('heading', { level: 1, name: /why choose boombox/i })).toBeInTheDocument();
    });

    it('renders all 4 default security features', () => {
      render(<SecuritySection />);
      expect(screen.getByRole('heading', { level: 2, name: /24\/7 monitored/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /only you have access/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /sturdy, steel construction/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /secured facility/i })).toBeInTheDocument();
    });

    it('renders all 4 feature icons', () => {
      render(<SecuritySection />);
      expect(screen.getByTestId('security-camera-icon')).toBeInTheDocument();
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      expect(screen.getByTestId('storage-unit-icon')).toBeInTheDocument();
      expect(screen.getByTestId('warehouse-icon')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      render(<SecuritySection />);
      expect(screen.getByText(/24\/7 monitored storage facility/i)).toBeInTheDocument();
      expect(screen.getByText(/once your unit is padlocked/i)).toBeInTheDocument();
      expect(screen.getByText(/each unit is built tough with sturdy, steel construction/i)).toBeInTheDocument();
      expect(screen.getByText(/warehouse is only accessible/i)).toBeInTheDocument();
    });

    it('renders custom features when provided', () => {
      const customFeatures = [
        {
          icon: () => <svg data-testid="custom-icon-1">Custom1</svg>,
          iconClassName: 'w-8',
          title: 'Custom Feature 1',
          description: 'Custom description 1',
        },
        {
          icon: () => <svg data-testid="custom-icon-2">Custom2</svg>,
          iconClassName: 'w-10',
          title: 'Custom Feature 2',
          description: 'Custom description 2',
        },
      ];
      render(<SecuritySection features={customFeatures} />);
      
      expect(screen.getByRole('heading', { level: 2, name: /custom feature 1/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /custom feature 2/i })).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon-2')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<SecuritySection className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SecuritySection />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses semantic HTML with section element', () => {
      const { container } = render(<SecuritySection />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section?.tagName).toBe('SECTION');
    });

    it('uses semantic HTML with article elements for features', () => {
      const { container } = render(<SecuritySection />);
      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(4);
    });

    it('has proper heading hierarchy', () => {
      render(<SecuritySection />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      
      expect(h1).toBeInTheDocument();
      expect(h2Elements).toHaveLength(4);
    });

    it('has proper ARIA labelledby relationship', () => {
      const { container } = render(<SecuritySection />);
      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-labelledby', 'security-section-heading');
    });

    it('marks icon containers as decorative', () => {
      const { container } = render(<SecuritySection />);
      const iconContainers = container.querySelectorAll('[aria-hidden="true"]');
      expect(iconContainers.length).toBeGreaterThanOrEqual(4);
    });

    it('has descriptive text for all features', () => {
      render(<SecuritySection />);
      
      // All features should have h2 titles and paragraph descriptions
      const articles = screen.getAllByRole('article');
      articles.forEach(article => {
        const heading = article.querySelector('h2');
        const description = article.querySelector('p');
        expect(heading).toBeInTheDocument();
        expect(description).toBeInTheDocument();
        expect(heading?.textContent).toBeTruthy();
        expect(description?.textContent).toBeTruthy();
      });
    });
  });

  // REQUIRED: Design system integration
  describe('Design System Integration', () => {
    it('uses semantic border color', () => {
      const { container } = render(<SecuritySection />);
      const featureCard = container.querySelector('article');
      expect(featureCard).toHaveClass('border-border');
    });

    it('does not use hardcoded slate colors', () => {
      const { container } = render(<SecuritySection />);
      const htmlString = container.innerHTML;
      
      // Should not contain border-slate-* classes
      expect(htmlString).not.toMatch(/border-slate-100/);
    });

    it('applies consistent container padding', () => {
      const { container } = render(<SecuritySection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies proper spacing classes', () => {
      const { container } = render(<SecuritySection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('mt-14', 'sm:mb-48', 'mb-24');
    });

    it('uses proper icon sizing classes', () => {
      render(<SecuritySection />);
      expect(screen.getByTestId('security-camera-icon')).toHaveClass('w-14');
      expect(screen.getByTestId('lock-icon')).toHaveClass('w-10');
      expect(screen.getByTestId('storage-unit-icon')).toHaveClass('w-12');
      expect(screen.getByTestId('warehouse-icon')).toHaveClass('w-12');
    });
  });

  // REQUIRED: Layout structure
  describe('Layout Structure', () => {
    it('uses responsive grid layout', () => {
      const { container } = render(<SecuritySection />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    });

    it('applies responsive gap between grid items', () => {
      const { container } = render(<SecuritySection />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-2', 'sm:gap-4');
    });

    it('renders feature cards with proper structure', () => {
      const { container } = render(<SecuritySection />);
      const cards = container.querySelectorAll('article');
      
      cards.forEach(card => {
        expect(card).toHaveClass('rounded-md');
        expect(card).toHaveClass('p-6');
        expect(card).toHaveClass('border');
      });
    });

    it('applies transition and hover effects to cards', () => {
      const { container } = render(<SecuritySection />);
      const card = container.querySelector('article');
      expect(card).toHaveClass('transition-transform');
      expect(card).toHaveClass('duration-300');
      expect(card).toHaveClass('sm:hover:scale-[102%]');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('has fixed height icon containers', () => {
      const { container } = render(<SecuritySection />);
      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('h-12');
    });

    it('applies proper spacing to feature titles', () => {
      const { container } = render(<SecuritySection />);
      const title = container.querySelector('h2');
      expect(title).toHaveClass('py-4');
    });

    it('limits description width', () => {
      const { container } = render(<SecuritySection />);
      const description = container.querySelector('article p');
      expect(description).toHaveClass('max-w-[640px]');
    });
  });

  // REQUIRED: Responsive design
  describe('Responsive Design', () => {
    it('applies responsive section margins', () => {
      const { container } = render(<SecuritySection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('sm:mb-48', 'mb-24');
    });

    it('applies responsive section padding', () => {
      const { container } = render(<SecuritySection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });

    it('applies responsive grid columns', () => {
      const { container } = render(<SecuritySection />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    });

    it('applies responsive grid gap', () => {
      const { container } = render(<SecuritySection />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-2', 'sm:gap-4');
    });

    it('applies responsive hover effects only on larger screens', () => {
      const { container } = render(<SecuritySection />);
      const card = container.querySelector('article');
      expect(card).toHaveClass('sm:hover:scale-[102%]');
    });
  });

  // REQUIRED: Component behavior
  describe('Component Behavior', () => {
    it('renders correct number of feature cards', () => {
      render(<SecuritySection />);
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(4);
    });

    it('renders custom number of features', () => {
      const customFeatures = [
        {
          icon: () => <svg>Icon1</svg>,
          iconClassName: 'w-8',
          title: 'Feature 1',
          description: 'Description 1',
        },
        {
          icon: () => <svg>Icon2</svg>,
          iconClassName: 'w-8',
          title: 'Feature 2',
          description: 'Description 2',
        },
      ];
      render(<SecuritySection features={customFeatures} />);
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
    });

    it('renders features in correct order', () => {
      render(<SecuritySection />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings[0]).toHaveTextContent(/24\/7 monitored/i);
      expect(headings[1]).toHaveTextContent(/only you have access/i);
      expect(headings[2]).toHaveTextContent(/sturdy, steel construction/i);
      expect(headings[3]).toHaveTextContent(/secured facility/i);
    });

    it('applies correct icon classes to each icon', () => {
      const customFeatures = [
        {
          icon: ({ className }: any) => <svg data-testid="custom-sized-icon-1" className={className}>Icon</svg>,
          iconClassName: 'w-20 h-20',
          title: 'Test',
          description: 'Test desc',
        },
      ];
      
      const { container } = render(<SecuritySection features={customFeatures} />);
      const icon = container.querySelector('[data-testid="custom-sized-icon-1"]');
      expect(icon).toHaveClass('w-20', 'h-20');
    });
  });

  // REQUIRED: Edge cases
  describe('Edge Cases', () => {
    it('handles empty className prop gracefully', () => {
      render(<SecuritySection className="" />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('handles undefined className prop', () => {
      render(<SecuritySection className={undefined} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('handles empty features array', () => {
      render(<SecuritySection features={[]} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.queryAllByRole('article')).toHaveLength(0);
    });

    it('handles single feature', () => {
      const singleFeature = [
        {
          icon: () => <svg>Icon</svg>,
          iconClassName: 'w-8',
          title: 'Single Feature',
          description: 'Single description',
        },
      ];
      render(<SecuritySection features={singleFeature} />);
      expect(screen.getAllByRole('article')).toHaveLength(1);
    });

    it('handles very long feature descriptions', () => {
      const longDescFeatures = [
        {
          icon: () => <svg>Icon</svg>,
          iconClassName: 'w-8',
          title: 'Feature',
          description: 'A'.repeat(1000),
        },
      ];
      render(<SecuritySection features={longDescFeatures} />);
      expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument();
    });

    it('handles special characters in feature content', () => {
      const specialFeatures = [
        {
          icon: () => <svg>Icon</svg>,
          iconClassName: 'w-8',
          title: "Feature's & Title",
          description: 'Special chars: @#$%^&*()',
        },
      ];
      render(<SecuritySection features={specialFeatures} />);
      expect(screen.getByText(/feature's & title/i)).toBeInTheDocument();
      expect(screen.getByText(/special chars: @#\$%\^&\*\(\)/i)).toBeInTheDocument();
    });

    it('handles very long heading text', () => {
      const longHeading = 'A'.repeat(100);
      render(<SecuritySection heading={longHeading} />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(longHeading);
    });

    it('handles empty heading', () => {
      render(<SecuritySection heading="" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });
  });
});

