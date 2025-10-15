/**
 * @fileoverview Tests for TermsPageContent component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TermsPageContent } from '@/components/features/terms/TermsPageContent';

expect.extend(toHaveNoViolations);

// Mock child components to focus on layout testing
jest.mock('@/components/features/terms/TermsText', () => ({
  TermsText: function MockTermsText() {
    return <div data-testid="terms-text">Terms Text Content</div>;
  },
}));

jest.mock('@/components/features/terms/TermsContactInfo', () => ({
  TermsContactInfo: function MockTermsContactInfo() {
    return <div data-testid="terms-contact-info">Contact Info Content</div>;
  },
}));

describe('TermsPageContent', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<TermsPageContent />);
      expect(screen.getByTestId('terms-text')).toBeInTheDocument();
      expect(screen.getByTestId('terms-contact-info')).toBeInTheDocument();
    });

    it('renders TermsText component', () => {
      render(<TermsPageContent />);
      const termsText = screen.getByTestId('terms-text');
      expect(termsText).toBeInTheDocument();
      expect(termsText).toHaveTextContent('Terms Text Content');
    });

    it('renders TermsContactInfo component', () => {
      render(<TermsPageContent />);
      const contactInfo = screen.getByTestId('terms-contact-info');
      expect(contactInfo).toBeInTheDocument();
      expect(contactInfo).toHaveTextContent('Contact Info Content');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TermsPageContent />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains semantic HTML structure', () => {
      const { container } = render(<TermsPageContent />);
      // Should have div containers with proper structure
      expect(container.querySelector('.flex')).toBeInTheDocument();
    });
  });

  // REQUIRED: Layout and Structure
  describe('Layout', () => {
    it('has responsive flex layout', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.querySelector('.flex');
      expect(mainContainer).toHaveClass('flex-col');
      expect(mainContainer).toHaveClass('sm:flex-row');
    });

    it('applies responsive horizontal padding', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('px-6');
      expect(mainContainer).toHaveClass('lg:px-16');
    });

    it('applies responsive gap spacing', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('gap-8');
      expect(mainContainer).toHaveClass('sm:gap-12');
      expect(mainContainer).toHaveClass('lg:gap-20');
      expect(mainContainer).toHaveClass('xl:gap-24');
    });

    it('has proper basis ratio for terms text (2/3)', () => {
      const { container } = render(<TermsPageContent />);
      const termsTextContainer = container.querySelector('.sm\\:basis-2\\/3');
      expect(termsTextContainer).toBeInTheDocument();
    });

    it('has proper basis ratio for contact info (1/3)', () => {
      const { container } = render(<TermsPageContent />);
      const contactInfoContainer = container.querySelector('.sm\\:basis-1\\/3');
      expect(contactInfoContainer).toBeInTheDocument();
    });

    it('applies ml-auto to contact info for alignment', () => {
      const { container } = render(<TermsPageContent />);
      const contactInfoContainer = container.querySelector('.sm\\:ml-auto');
      expect(contactInfoContainer).toBeInTheDocument();
    });
  });

  // REQUIRED: Responsive Behavior
  describe('Responsive Behavior', () => {
    it('stacks vertically on mobile (flex-col)', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.querySelector('.flex-col');
      expect(mainContainer).toBeInTheDocument();
    });

    it('displays horizontally on tablet/desktop (sm:flex-row)', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.querySelector('.sm\\:flex-row');
      expect(mainContainer).toBeInTheDocument();
    });

    it('applies mobile padding (px-6)', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.querySelector('.px-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('applies desktop padding (lg:px-16)', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.querySelector('.lg\\:px-16');
      expect(mainContainer).toBeInTheDocument();
    });

    it('has full width for contact info on mobile', () => {
      const { container } = render(<TermsPageContent />);
      const contactInfoWrapper = screen
        .getByTestId('terms-contact-info')
        .closest('.w-full');
      expect(contactInfoWrapper).toBeInTheDocument();
    });
  });

  // REQUIRED: Component Composition
  describe('Component Composition', () => {
    it('maintains proper parent-child relationship', () => {
      const { container } = render(<TermsPageContent />);
      const termsText = screen.getByTestId('terms-text');
      const contactInfo = screen.getByTestId('terms-contact-info');

      // Both components should be children of the main container
      const mainContainer = container.firstChild;
      expect(mainContainer).toContainElement(termsText);
      expect(mainContainer).toContainElement(contactInfo);
    });

    it('renders terms text before contact info in DOM order', () => {
      const { container } = render(<TermsPageContent />);
      const children = Array.from(container.firstChild?.childNodes || []);

      const termsTextWrapper = children[0];
      const contactInfoWrapper = children[1];

      expect(termsTextWrapper?.textContent).toContain('Terms Text Content');
      expect(contactInfoWrapper?.textContent).toContain(
        'Contact Info Content'
      );
    });

    it('wraps TermsText in basis-2/3 container', () => {
      render(<TermsPageContent />);
      const termsText = screen.getByTestId('terms-text');
      const wrapper = termsText.closest('.sm\\:basis-2\\/3');
      expect(wrapper).toBeInTheDocument();
    });

    it('wraps TermsContactInfo in basis-1/3 container', () => {
      render(<TermsPageContent />);
      const contactInfo = screen.getByTestId('terms-contact-info');
      const wrapper = contactInfo.closest('.sm\\:basis-1\\/3');
      expect(wrapper).toBeInTheDocument();
    });
  });

  // REQUIRED: Design System Integration
  describe('Design System', () => {
    it('uses consistent spacing scale', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.firstChild;

      // Verify spacing follows Tailwind scale: 8, 12, 20, 24
      expect(mainContainer).toHaveClass('gap-8');
      expect(mainContainer).toHaveClass('sm:gap-12');
      expect(mainContainer).toHaveClass('lg:gap-20');
      expect(mainContainer).toHaveClass('xl:gap-24');
    });

    it('uses consistent padding scale', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.firstChild;

      // Verify padding follows site standards: 6, 16
      expect(mainContainer).toHaveClass('px-6');
      expect(mainContainer).toHaveClass('lg:px-16');
    });

    it('follows mobile-first responsive design', () => {
      const { container } = render(<TermsPageContent />);
      const mainContainer = container.firstChild;

      // Base classes (mobile)
      expect(mainContainer).toHaveClass('flex-col');
      expect(mainContainer).toHaveClass('gap-8');

      // Breakpoint classes (progressive enhancement)
      expect(mainContainer).toHaveClass('sm:flex-row');
      expect(mainContainer).toHaveClass('lg:gap-20');
    });
  });

  // REQUIRED: Component Props
  describe('Component Interface', () => {
    it('renders correctly without any props', () => {
      const { container } = render(<TermsPageContent />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

