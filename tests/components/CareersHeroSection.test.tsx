/**
 * @fileoverview Tests for CareersHeroSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { CareersHeroSection } from '@/components/features/careers/CareersHeroSection';

expect.extend(toHaveNoViolations);

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage(props: any) {
    return (
      <img
        data-testid="optimized-image"
        src={props.src}
        alt={props.alt}
        className={props.className}
      />
    );
  }
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  BriefcaseIcon: function MockBriefcaseIcon(props: any) {
    return <svg data-testid="briefcase-icon" {...props} />;
  }
}));

describe('CareersHeroSection', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CareersHeroSection />);
      expect(screen.getByRole('heading', { level: 1, name: /careers/i })).toBeInTheDocument();
    });

    it('renders all main elements', () => {
      render(<CareersHeroSection />);
      
      // Check header elements
      expect(screen.getByTestId('briefcase-icon')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /careers/i })).toBeInTheDocument();
      
      // Check content elements
      expect(screen.getByRole('heading', { level: 2, name: /join the boombox team/i })).toBeInTheDocument();
      expect(screen.getByText(/we are always looking for talented people/i)).toBeInTheDocument();
      
      // Check CTA button
      expect(screen.getByRole('button', { name: /view openings/i })).toBeInTheDocument();
      
      // Check hero image
      expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
      const customProps = {
        heroImageSrc: '/custom-hero.jpg',
        heroImageAlt: 'Custom hero image',
        jobListingsUrl: 'https://custom-jobs.com'
      };
      
      render(<CareersHeroSection {...customProps} />);
      
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', customProps.heroImageSrc);
      expect(image).toHaveAttribute('alt', customProps.heroImageAlt);
      
      const link = screen.getByRole('link', { name: /view job openings/i });
      expect(link).toHaveAttribute('href', customProps.jobListingsUrl);
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<CareersHeroSection />);
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with custom props', async () => {
      const renderResult = render(
        <CareersHeroSection 
          heroImageSrc="/test-hero.jpg"
          heroImageAlt="Test hero image"
          jobListingsUrl="https://test-jobs.com"
        />
      );
      await testAccessibility(renderResult);
    });

    it('has proper semantic HTML structure', () => {
      render(<CareersHeroSection />);
      
      // Check semantic elements - find section by its aria-labelledby attribute
      const section = document.querySelector('section[aria-labelledby="careers-heading"]');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'careers-heading');
      
      const header = section.querySelector('header');
      expect(header).toBeInTheDocument();
      
      // Check heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveAttribute('id', 'careers-heading');
      
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
    });

    it('has proper ARIA labels for interactive elements', () => {
      render(<CareersHeroSection />);
      
      const link = screen.getByRole('link', { name: /view job openings/i });
      expect(link).toHaveAttribute('aria-label');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('has proper icon accessibility', () => {
      render(<CareersHeroSection />);
      
      const icon = screen.getByTestId('briefcase-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('handles CTA button click correctly', async () => {
      const user = userEvent.setup();
      
      render(<CareersHeroSection />);
      const button = screen.getByRole('button', { name: /view openings/i });
      
      await user.click(button);
      // Button should be clickable without errors
      expect(button).toBeInTheDocument();
    });

    it('opens external link in new tab', () => {
      render(<CareersHeroSection />);
      
      const link = screen.getByRole('link', { name: /view job openings/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  // REQUIRED: Design system integration
  describe('Design System Integration', () => {
    it('uses design system color classes', () => {
      render(<CareersHeroSection />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveClass('text-text-primary');
      
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveClass('text-text-primary');
      
      const paragraph = screen.getByText(/we are always looking for talented people/i);
      expect(paragraph).toHaveClass('text-text-secondary');
    });

    it('uses btn-primary utility class', () => {
      render(<CareersHeroSection />);
      
      const button = screen.getByRole('button', { name: /view openings/i });
      expect(button).toHaveClass('btn-primary');
    });

    it('maintains responsive design patterns', () => {
      render(<CareersHeroSection />);
      
      const section = document.querySelector('section[aria-labelledby="careers-heading"]');
      expect(section).toHaveClass('sm:mb-48', 'mb-24');
      
      const contentDiv = section.querySelector('.md\\:flex');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  // REQUIRED: Component props testing
  describe('Component Props', () => {
    it('handles all optional props correctly', () => {
      const props = {
        heroImageSrc: '/test-image.jpg',
        heroImageAlt: 'Test image alt text',
        jobListingsUrl: 'https://example.com/jobs',
        className: 'custom-class'
      };
      
      render(<CareersHeroSection {...props} />);
      
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', props.heroImageSrc);
      expect(image).toHaveAttribute('alt', props.heroImageAlt);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', props.jobListingsUrl);
    });

    it('uses default values when props are not provided', () => {
      render(<CareersHeroSection />);
      
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/img/palo-alto.png');
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://www.indeed.com/cmp/Boombox-Storage');
    });
  });
});
