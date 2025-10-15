/**
 * @fileoverview Tests for StorageGuidelinesList component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { StorageGuidelinesList } from '@/components/features/storage-guidelines/StorageGuidelinesList';
import { storageGuidelines } from '@/data/storageGuidelines';

expect.extend(toHaveNoViolations);

describe('StorageGuidelinesList', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<StorageGuidelinesList />);
      expect(screen.getByRole('heading', { level: 2, name: /Storage terms are a minimum of 2 months/i })).toBeInTheDocument();
    });

    it('renders all storage guidelines', () => {
      render(<StorageGuidelinesList />);
      
      // Should render all guidelines from data
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(storageGuidelines.length);
    });

    it('renders guideline titles correctly', () => {
      render(<StorageGuidelinesList />);
      
      storageGuidelines.forEach((guideline) => {
        const heading = screen.getByRole('heading', { level: 2, name: guideline.title });
        expect(heading).toBeInTheDocument();
      });
    });

    it('renders number badges for each guideline', () => {
      render(<StorageGuidelinesList />);
      
      storageGuidelines.forEach((guideline) => {
        const badge = screen.getByLabelText(`Guideline ${guideline.number}`);
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent(String(guideline.number));
      });
    });

    it('renders Help Center link in guideline 2', () => {
      render(<StorageGuidelinesList />);
      
      const helpCenterLink = screen.getByRole('link', { name: /help center/i });
      expect(helpCenterLink).toBeInTheDocument();
      expect(helpCenterLink).toHaveAttribute('href', '/help-center');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<StorageGuidelinesList />);
      await testAccessibility(renderResult);
    });

    it('uses semantic HTML with article elements', () => {
      render(<StorageGuidelinesList />);
      
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBeGreaterThan(0);
    });

    it('has proper heading hierarchy', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      // All guideline titles should be h2
      const h2Headings = container.querySelectorAll('h2');
      expect(h2Headings.length).toBe(storageGuidelines.length);
    });

    it('articles have proper aria-labelledby', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const articles = container.querySelectorAll('article');
      articles.forEach((article, index) => {
        const guidelineNumber = index + 1;
        expect(article).toHaveAttribute('aria-labelledby', `guideline-${guidelineNumber}-title`);
      });
    });

    it('headings have proper id attributes', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const headings = container.querySelectorAll('h2');
      headings.forEach((heading, index) => {
        const guidelineNumber = index + 1;
        expect(heading).toHaveAttribute('id', `guideline-${guidelineNumber}-title`);
      });
    });

    it('number badges have descriptive aria-labels', () => {
      render(<StorageGuidelinesList />);
      
      storageGuidelines.forEach((guideline) => {
        const badge = screen.getByLabelText(`Guideline ${guideline.number}`);
        expect(badge).toHaveAttribute('aria-label', `Guideline ${guideline.number}`);
      });
    });

    it('Help Center link is accessible', () => {
      render(<StorageGuidelinesList />);
      
      const link = screen.getByRole('link', { name: /help center/i });
      expect(link).toHaveClass('underline');
      expect(link).toHaveAttribute('href', '/help-center');
    });
  });

  // Design System Integration
  describe('Design System Compliance', () => {
    it('applies responsive padding classes to container', () => {
      const { container } = render(<StorageGuidelinesList />);
      const outerDiv = container.firstChild as HTMLElement;
      
      expect(outerDiv).toHaveClass('lg:px-16');
      expect(outerDiv).toHaveClass('px-6');
    });

    it('uses semantic border colors for guideline cards', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('border-border');
      });
    });

    it('uses semantic primary color for number badges', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const badges = container.querySelectorAll('[aria-label^="Guideline"]');
      badges.forEach((badge) => {
        expect(badge).toHaveClass('border-primary');
        expect(badge).toHaveClass('text-primary');
      });
    });

    it('applies consistent spacing between guidelines', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('mb-8');
      });
    });
  });

  // Card Styling
  describe('Card Styling', () => {
    it('applies correct styling to guideline cards', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('flex');
        expect(article).toHaveClass('p-6');
        expect(article).toHaveClass('border');
        expect(article).toHaveClass('rounded-md');
        expect(article).toHaveClass('items-start');
      });
    });

    it('applies correct styling to number badges', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const badges = container.querySelectorAll('[aria-label^="Guideline"]');
      badges.forEach((badge) => {
        expect(badge).toHaveClass('flex');
        expect(badge).toHaveClass('items-center');
        expect(badge).toHaveClass('justify-center');
        expect(badge).toHaveClass('w-8');
        expect(badge).toHaveClass('h-8');
        expect(badge).toHaveClass('rounded-full');
        expect(badge).toHaveClass('border-2');
        expect(badge).toHaveClass('font-semibold');
      });
    });

    it('applies margin to headings', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const headings = container.querySelectorAll('h2');
      headings.forEach((heading) => {
        expect(heading).toHaveClass('mb-5');
      });
    });
  });

  // Data Integration
  describe('Data Integration', () => {
    it('renders data from imported storageGuidelines', () => {
      render(<StorageGuidelinesList />);
      
      // Verify first guideline from data
      const firstGuideline = storageGuidelines[0];
      expect(screen.getByRole('heading', { level: 2, name: firstGuideline.title })).toBeInTheDocument();
    });

    it('renders all guideline numbers sequentially', () => {
      render(<StorageGuidelinesList />);
      
      storageGuidelines.forEach((guideline) => {
        const badge = screen.getByLabelText(`Guideline ${guideline.number}`);
        expect(badge).toHaveTextContent(String(guideline.number));
      });
    });

    it('renders correct number of guidelines', () => {
      render(<StorageGuidelinesList />);
      
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(6); // Based on data
    });
  });

  // Component Structure
  describe('Component Structure', () => {
    it('uses flexbox layout for each guideline card', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const articles = container.querySelectorAll('article');
      articles.forEach((article) => {
        expect(article).toHaveClass('flex');
      });
    });

    it('number badges are flex-shrink-0', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const badges = container.querySelectorAll('[aria-label^="Guideline"]');
      badges.forEach((badge) => {
        expect(badge).toHaveClass('flex-shrink-0');
      });
    });

    it('badges have proper spacing from content', () => {
      const { container } = render(<StorageGuidelinesList />);
      
      const badges = container.querySelectorAll('[aria-label^="Guideline"]');
      badges.forEach((badge) => {
        expect(badge).toHaveClass('mr-4');
        expect(badge).toHaveClass('mt-0.5');
      });
    });
  });

  // Content Verification
  describe('Content', () => {
    it('renders first guideline correctly', () => {
      render(<StorageGuidelinesList />);
      
      expect(screen.getByRole('heading', { name: /Storage terms are a minimum of 2 months/i })).toBeInTheDocument();
      expect(screen.getByText(/All storage terms are a minimum of two months/i)).toBeInTheDocument();
    });

    it('renders last guideline correctly', () => {
      render(<StorageGuidelinesList />);
      
      expect(screen.getByRole('heading', { name: /Your Boombox Driver is not allowed to help load/i })).toBeInTheDocument();
      expect(screen.getByText(/Boombox drivers are not insured or licensed/i)).toBeInTheDocument();
    });

    it('includes special handling for guideline 2 with link', () => {
      render(<StorageGuidelinesList />);
      
      // Guideline 2 should have Help Center link
      const guideline2 = screen.getByRole('article', { 
        name: 'All items must fit into your Boombox storage container' 
      });
      expect(guideline2).toBeInTheDocument();
      
      const helpCenterLink = screen.getByRole('link', { name: /help center/i });
      expect(helpCenterLink).toBeInTheDocument();
    });
  });

  // Snapshot Testing
  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = render(<StorageGuidelinesList />);
      expect(container).toMatchSnapshot();
    });
  });
});

