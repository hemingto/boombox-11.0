/**
 * @fileoverview Tests for TermsText component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TermsText } from '@/components/features/terms/TermsText';

expect.extend(toHaveNoViolations);

describe('TermsText', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<TermsText />);
      expect(
        screen.getByText(/Welcome to Boomboxstorage\.com/i)
      ).toBeInTheDocument();
    });

    it('displays the introduction paragraph', () => {
      render(<TermsText />);
      expect(
        screen.getByText(/Welcome to Boomboxstorage\.com, the website/i)
      ).toBeInTheDocument();
    });

    it('displays the arbitration warning', () => {
      render(<TermsText />);
      expect(
        screen.getByText(
          /PLEASE READ THIS AGREEMENT CAREFULLY TO ENSURE THAT YOU UNDERSTAND EACH PROVISION/i
        )
      ).toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TermsText />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses proper heading hierarchy', () => {
      render(<TermsText />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings.length).toBeGreaterThan(0);
    });

    it('has semantic heading structure for major sections', () => {
      render(<TermsText />);
      expect(
        screen.getByRole('heading', { name: /USER OF OUR SITE/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /THE STORAGE SERVICE/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /^GENERAL$/i })
      ).toBeInTheDocument();
    });
  });

  // REQUIRED: Content Sections
  describe('Content Sections', () => {
    describe('User of Our Site Section', () => {
      it('displays the Eligibility subsection', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /Eligibility/i })
        ).toBeInTheDocument();
      });

      it('displays age requirement information', () => {
        render(<TermsText />);
        expect(
          screen.getByText(/You must be at least 18 years old/i)
        ).toBeInTheDocument();
      });

      it('displays Boombox Site subsection', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Boombox Site$/i })
        ).toBeInTheDocument();
      });

      it('displays Boombox Accounts subsection', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /Boombox Accounts/i })
        ).toBeInTheDocument();
      });

      it('displays Site Rules subsection', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Site Rules$/i })
        ).toBeInTheDocument();
      });
    });

    describe('Storage Service Section', () => {
      it('displays the Storage Service heading', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /THE STORAGE SERVICE/i })
        ).toBeInTheDocument();
      });

      it('displays Stored Items subsection', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Stored Items$/i })
        ).toBeInTheDocument();
      });

      it('displays Payment subsection', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Payment$/i })
        ).toBeInTheDocument();
      });
    });

    describe('Legal Sections', () => {
      it('displays Our Proprietary Rights section', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /Our Proprietary Rights/i })
        ).toBeInTheDocument();
      });

      it('displays Privacy section', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Privacy$/i })
        ).toBeInTheDocument();
      });

      it('displays Security section', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Security$/i })
        ).toBeInTheDocument();
      });

      it('displays Third Party Links section', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /Third Party Links/i })
        ).toBeInTheDocument();
      });

      it('displays Indemnity section', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Indemnity$/i })
        ).toBeInTheDocument();
      });

      it('displays No Warranty section', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /No Warranty/i })
        ).toBeInTheDocument();
      });

      it('displays Arbitration section', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Arbitration$/i })
        ).toBeInTheDocument();
      });
    });

    describe('General Section', () => {
      it('displays the GENERAL heading', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^GENERAL$/i })
        ).toBeInTheDocument();
      });

      it('displays Liability subsection', () => {
        render(<TermsText />);
        const liabilityHeadings = screen.getAllByRole('heading', {
          name: /^Liability$/i,
        });
        expect(liabilityHeadings.length).toBeGreaterThan(0);
      });

      it('displays Assignment subsection', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Assignment$/i })
        ).toBeInTheDocument();
      });

      it('displays Force Majeure subsection', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /Force Majeure/i })
        ).toBeInTheDocument();
      });

      it('displays Contact subsection', () => {
        render(<TermsText />);
        expect(
          screen.getByRole('heading', { name: /^Contact$/i })
        ).toBeInTheDocument();
      });
    });
  });

  // REQUIRED: Contact Information
  describe('Contact Information', () => {
    it('displays help email address', () => {
      render(<TermsText />);
      const emailMatches = screen.getAllByText(/help@boomboxstorage\.com/i);
      expect(emailMatches.length).toBeGreaterThan(0);
    });

    it('displays phone number', () => {
      render(<TermsText />);
      const phoneMatches = screen.getAllByText(/\(415\) 322-3135/i);
      expect(phoneMatches.length).toBeGreaterThan(0);
    });

    it('displays last modified date', () => {
      render(<TermsText />);
      expect(
        screen.getByText(/This Agreement was last modified on 1\/7\/2017/i)
      ).toBeInTheDocument();
    });
  });

  // REQUIRED: Design System Integration
  describe('Design System', () => {
    it('applies spacing classes to paragraphs', () => {
      const { container } = render(<TermsText />);
      const paragraphsWithSpacing = container.querySelectorAll('.mb-4');
      expect(paragraphsWithSpacing.length).toBeGreaterThan(0);
    });

    it('applies spacing to h2 headings', () => {
      const { container } = render(<TermsText />);
      const headingsWithMargin = container.querySelectorAll('.mb-6');
      expect(headingsWithMargin.length).toBeGreaterThan(0);
    });

    it('applies font-bold to major section headings', () => {
      const { container } = render(<TermsText />);
      const boldHeadings = container.querySelectorAll('.font-bold');
      expect(boldHeadings.length).toBeGreaterThan(0);
    });

    it('maintains consistent vertical spacing', () => {
      const { container } = render(<TermsText />);
      const topMargins = container.querySelectorAll('.mt-6, .mt-10');
      expect(topMargins.length).toBeGreaterThan(0);
    });
  });

  // REQUIRED: Layout and Structure
  describe('Layout', () => {
    it('has full width container', () => {
      const { container } = render(<TermsText />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('maintains proper DOM structure', () => {
      const { container } = render(<TermsText />);
      const outerDiv = container.firstChild;
      expect(outerDiv).toHaveClass('w-full');

      const innerDiv = container.querySelector('.w-full > div');
      expect(innerDiv).toBeInTheDocument();
    });
  });

  // REQUIRED: Content Verification
  describe('Critical Content', () => {
    it('displays definitions section', () => {
      render(<TermsText />);
      expect(
        screen.getByText(/DEFINITIONS In this agreement/i)
      ).toBeInTheDocument();
    });

    it('displays prohibited items warning', () => {
      render(<TermsText />);
      expect(screen.getByText(/Prohibited Stored Items/i)).toBeInTheDocument();
    });

    it('displays JAMS arbitration information', () => {
      render(<TermsText />);
      expect(screen.getByText(/JAMS, Inc\./i)).toBeInTheDocument();
    });

    it('displays California governing law', () => {
      render(<TermsText />);
      expect(
        screen.getByText(/State of California/i)
      ).toBeInTheDocument();
    });
  });

  // REQUIRED: Component Props
  describe('Component Interface', () => {
    it('renders correctly without any props', () => {
      const { container } = render(<TermsText />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

