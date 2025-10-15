/**
 * @fileoverview Tests for BestPracticesContent component
 * Following boombox-11.0 testing standards
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { BestPracticesContent } from '@/components/features/service-providers/best-practices/BestPracticesContent';

expect.extend(toHaveNoViolations);

// Mock the child components
jest.mock(
  '@/components/features/service-providers/best-practices/DriverTips',
  () => ({
    DriverTips: function MockDriverTips({ userType }: { userType: string }) {
      return (
        <div data-testid="mock-driver-tips">
          Mock DriverTips - {userType}
        </div>
      );
    },
  })
);

jest.mock(
  '@/components/features/service-providers/best-practices/BestPracticesVideoGallery',
  () => ({
    BestPracticesVideoGallery: function MockBestPracticesVideoGallery() {
      return <div data-testid="mock-video-gallery">Mock Video Gallery</div>;
    },
  })
);

describe('BestPracticesContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<BestPracticesContent />);
      expect(screen.getByTestId('mock-driver-tips')).toBeInTheDocument();
      expect(screen.getByTestId('mock-video-gallery')).toBeInTheDocument();
    });

    it('renders DriverTips component with driver userType', () => {
      render(<BestPracticesContent />);
      const driverTips = screen.getByTestId('mock-driver-tips');
      expect(driverTips).toHaveTextContent('driver');
    });

    it('renders BestPracticesVideoGallery component', () => {
      render(<BestPracticesContent />);
      expect(screen.getByTestId('mock-video-gallery')).toBeInTheDocument();
    });

    it('renders section heading for videos', () => {
      render(<BestPracticesContent />);
      expect(
        screen.getByRole('heading', { name: /youtube training videos/i })
      ).toBeInTheDocument();
    });

    it('renders descriptive text for video section', () => {
      render(<BestPracticesContent />);
      expect(
        screen.getByText(
          /Watch the following videos to learn how to properly pack and transport/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<BestPracticesContent />);
      await testAccessibility(renderResult);
    });

    it('uses proper heading hierarchy', () => {
      render(<BestPracticesContent />);
      const heading = screen.getByRole('heading', {
        name: /youtube training videos/i,
      });
      expect(heading.tagName).toBe('H2');
    });

    it('has semantic HTML structure', () => {
      const { container } = render(<BestPracticesContent />);
      const mainDiv = container.querySelector('.flex.flex-col');
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe('Layout & Styling', () => {
    it('applies responsive container classes', () => {
      const { container } = render(<BestPracticesContent />);
      const mainContainer = container.querySelector('.flex.flex-col');
      expect(mainContainer).toHaveClass('lg:px-16');
      expect(mainContainer).toHaveClass('px-6');
      expect(mainContainer).toHaveClass('max-w-5xl');
      expect(mainContainer).toHaveClass('w-full');
      expect(mainContainer).toHaveClass('mx-auto');
    });

    it('applies proper spacing between sections', () => {
      render(<BestPracticesContent />);
      const heading = screen.getByRole('heading', {
        name: /youtube training videos/i,
      });
      expect(heading).toHaveClass('mt-10');
      expect(heading).toHaveClass('mb-4');
    });

    it('applies design system text colors', () => {
      render(<BestPracticesContent />);
      const heading = screen.getByRole('heading', {
        name: /youtube training videos/i,
      });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('maintains consistent text styling', () => {
      const { container } = render(<BestPracticesContent />);
      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('text-text-primary');
      expect(paragraph).toHaveClass('mb-12');
    });
  });

  describe('Component Composition', () => {
    it('renders components in correct order', () => {
      const { container } = render(<BestPracticesContent />);
      const mainDiv = container.querySelector('.flex.flex-col');
      const children = mainDiv?.children;
      
      expect(children).toBeDefined();
      if (children) {
        // First: DriverTips
        expect(children[0]).toContainElement(
          screen.getByTestId('mock-driver-tips')
        );
        // Then: Heading and description
        // Last: Video Gallery
        expect(container).toContainElement(
          screen.getByTestId('mock-video-gallery')
        );
      }
    });

    it('maintains proper spacing in layout', () => {
      const { container } = render(<BestPracticesContent />);
      const mainContainer = container.querySelector('.flex.flex-col');
      expect(mainContainer).toHaveClass('mb-10');
    });
  });

  describe('Content', () => {
    it('provides helpful instructions for users', () => {
      render(<BestPracticesContent />);
      const description = screen.getByText(
        /Watch the following videos to learn how to properly pack and transport your customer's items./i
      );
      expect(description).toBeInTheDocument();
    });

    it('uses proper apostrophe in description text', () => {
      render(<BestPracticesContent />);
      // The component uses &apos; for proper HTML entity
      expect(
        screen.getByText(/customer's items/i)
      ).toBeInTheDocument();
    });

    it('has descriptive section heading', () => {
      render(<BestPracticesContent />);
      expect(
        screen.getByRole('heading', { name: /youtube training videos/i })
      ).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies mobile-first padding', () => {
      const { container } = render(<BestPracticesContent />);
      const mainContainer = container.querySelector('.flex.flex-col');
      expect(mainContainer).toHaveClass('px-6');
    });

    it('applies large screen padding', () => {
      const { container } = render(<BestPracticesContent />);
      const mainContainer = container.querySelector('.flex.flex-col');
      expect(mainContainer).toHaveClass('lg:px-16');
    });

    it('constrains maximum width for readability', () => {
      const { container } = render(<BestPracticesContent />);
      const mainContainer = container.querySelector('.flex.flex-col');
      expect(mainContainer).toHaveClass('max-w-5xl');
    });

    it('centers content horizontally', () => {
      const { container } = render(<BestPracticesContent />);
      const mainContainer = container.querySelector('.flex.flex-col');
      expect(mainContainer).toHaveClass('mx-auto');
    });
  });
});

