/**
 * @fileoverview Tests for HowItWorksStepSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { HowItWorksStepSection } from '@/components/features/howitworks/HowItWorksStepSection';
import type { Step } from '@/components/features/howitworks/HowItWorksStepSection';

expect.extend(toHaveNoViolations);

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage/OptimizedImage', () => ({
  OptimizedImage: function MockOptimizedImage(props: any) {
    return (
      <img
        data-testid="optimized-image"
        src={props.src}
        alt={props.alt}
        className={props.className}
        loading={props.loading}
      />
    );
  },
}));

describe('HowItWorksStepSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HowItWorksStepSection />);
      expect(screen.getByRole('region', { name: /how boombox works process/i })).toBeInTheDocument();
    });

    it('renders 4 default steps', () => {
      render(<HowItWorksStepSection />);
      const steps = screen.getAllByRole('listitem');
      expect(steps).toHaveLength(4);
    });

    it('renders all step titles', () => {
      render(<HowItWorksStepSection />);
      expect(screen.getByRole('heading', { name: 'Request' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Pack' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Store' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Deliver' })).toBeInTheDocument();
    });

    it('renders all step numbers', () => {
      render(<HowItWorksStepSection />);
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      expect(screen.getByText('Step 4')).toBeInTheDocument();
    });

    it('renders custom steps when provided', () => {
      const customSteps: Step[] = [
        {
          stepNumber: 1,
          title: 'Custom Step',
          description: 'Custom description',
          image: '/custom.jpg',
          imageAlt: 'Custom alt text',
        },
      ];
      
      render(<HowItWorksStepSection steps={customSteps} />);
      expect(screen.getByRole('heading', { name: 'Custom Step' })).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<HowItWorksStepSection className="custom-steps" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-steps');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<HowItWorksStepSection />);
      await testAccessibility(renderResult);
    });

    it('uses semantic list structure', () => {
      const { container } = render(<HowItWorksStepSection />);
      const list = container.querySelector('ol');
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass('list-none');
    });

    it('has proper heading hierarchy for step titles', () => {
      render(<HowItWorksStepSection />);
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading.tagName).toBe('H2');
      });
    });

    it('has proper ARIA label for section', () => {
      const { container } = render(<HowItWorksStepSection />);
      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-label', 'How Boombox works process');
    });

    it('has ARIA labels for step badges', () => {
      render(<HowItWorksStepSection />);
      // Step badges have proper ARIA labels for screen readers
      expect(screen.getByLabelText('Step 1 of 4')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 2 of 4')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 3 of 4')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 4 of 4')).toBeInTheDocument();
    });

    it('marks timeline decorative elements with aria-hidden', () => {
      const { container } = render(<HowItWorksStepSection />);
      const timelineDecorative = container.querySelectorAll('[aria-hidden="true"]');
      // Timeline lines (2) + step dots (4) = 6 decorative elements
      expect(timelineDecorative.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('OptimizedImage Integration (CRITICAL)', () => {
    it('renders OptimizedImage for each step', () => {
      render(<HowItWorksStepSection />);
      const images = screen.getAllByTestId('optimized-image');
      expect(images).toHaveLength(4); // One for each step
    });

    it('uses correct image source for steps', () => {
      render(<HowItWorksStepSection />);
      const images = screen.getAllByTestId('optimized-image');
      images.forEach(image => {
        expect(image).toHaveAttribute('src', '/placeholder.jpg');
      });
    });

    it('provides descriptive alt text for each step image', () => {
      render(<HowItWorksStepSection />);
      expect(screen.getByAltText(/customer booking boombox storage online/i)).toBeInTheDocument();
      expect(screen.getByAltText(/packing belongings into boombox storage unit/i)).toBeInTheDocument();
      expect(screen.getByAltText(/boombox driver transporting storage unit/i)).toBeInTheDocument();
      expect(screen.getByAltText(/boombox storage unit being delivered back/i)).toBeInTheDocument();
    });

    it('configures lazy loading for images', () => {
      render(<HowItWorksStepSection />);
      const images = screen.getAllByTestId('optimized-image');
      images.forEach(image => {
        expect(image).toHaveAttribute('loading', 'lazy');
      });
    });

    it('applies correct image styling classes', () => {
      render(<HowItWorksStepSection />);
      const images = screen.getAllByTestId('optimized-image');
      images.forEach(image => {
        expect(image).toHaveClass('object-cover', 'rounded-md');
      });
    });
  });

  describe('Design System Compliance', () => {
    it('uses semantic color tokens for timeline', () => {
      const { container } = render(<HowItWorksStepSection />);
      const verticalLine = container.querySelector('.bg-surface-tertiary');
      expect(verticalLine).toBeInTheDocument();
    });

    it('uses semantic color tokens for step dots', () => {
      const { container } = render(<HowItWorksStepSection />);
      const dots = container.querySelectorAll('.bg-primary');
      expect(dots.length).toBeGreaterThanOrEqual(4); // At least one for each step
    });

    it('uses semantic color tokens for step badges', () => {
      const { container } = render(<HowItWorksStepSection />);
      const badges = container.querySelectorAll('.bg-surface-tertiary');
      expect(badges.length).toBeGreaterThanOrEqual(4); // Badges + timeline lines
    });

    it('uses semantic color tokens for text', () => {
      render(<HowItWorksStepSection />);
      const heading = screen.getByRole('heading', { name: 'Request' });
      expect(heading).toHaveClass('text-text-primary');
    });

    it('applies consistent spacing patterns', () => {
      const { container } = render(<HowItWorksStepSection />);
      const section = container.querySelector('section');
      
      expect(section).toHaveClass('mt-10');
      expect(section).toHaveClass('mb-24', 'sm:mb-48');
      expect(section).toHaveClass('lg:px-16', 'px-6');
    });
  });

  describe('Layout & Responsive Design', () => {
    it('applies responsive layout classes', () => {
      const { container } = render(<HowItWorksStepSection />);
      const section = container.querySelector('section');
      
      expect(section).toHaveClass('md:flex');
      expect(section).toHaveClass('lg:px-16');
      expect(section).toHaveClass('px-6');
    });

    it('has proper spacing between steps', () => {
      const { container } = render(<HowItWorksStepSection />);
      const list = container.querySelector('ol');
      expect(list).toHaveClass('space-y-24');
    });

    it('applies responsive step content layout', () => {
      const { container } = render(<HowItWorksStepSection />);
      const stepContent = container.querySelectorAll('.flex.flex-col.sm\\:flex-row');
      expect(stepContent.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Timeline Visualization', () => {
    it('renders vertical timeline line', () => {
      const { container } = render(<HowItWorksStepSection />);
      const verticalLine = container.querySelector('.absolute.left-\\[7px\\].top-0.bottom-0');
      expect(verticalLine).toBeInTheDocument();
    });

    it('renders horizontal timeline end cap', () => {
      const { container } = render(<HowItWorksStepSection />);
      const horizontalLine = container.querySelector('.absolute.left-0.bottom-0.w-4');
      expect(horizontalLine).toBeInTheDocument();
    });

    it('renders step dots with correct styling', () => {
      const { container } = render(<HowItWorksStepSection />);
      const dots = container.querySelectorAll('.w-4.h-4.rounded-full');
      expect(dots).toHaveLength(4);
    });
  });

  describe('Step Content', () => {
    it('displays correct step descriptions', () => {
      render(<HowItWorksStepSection />);
      expect(screen.getByText(/book online/i)).toBeInTheDocument();
      expect(screen.getByText(/save money by packing/i)).toBeInTheDocument();
      expect(screen.getByText(/transport your storage unit/i)).toBeInTheDocument();
      expect(screen.getByText(/need to access your storage unit/i)).toBeInTheDocument();
    });

    it('displays step badges with correct format', () => {
      render(<HowItWorksStepSection />);
      const badge1 = screen.getByLabelText('Step 1 of 4');
      const badge2 = screen.getByLabelText('Step 2 of 4');
      const badge3 = screen.getByLabelText('Step 3 of 4');
      const badge4 = screen.getByLabelText('Step 4 of 4');
      
      expect(badge1).toBeInTheDocument();
      expect(badge2).toBeInTheDocument();
      expect(badge3).toBeInTheDocument();
      expect(badge4).toBeInTheDocument();
    });

    it('uses paragraph elements for descriptions', () => {
      const { container } = render(<HowItWorksStepSection />);
      const descriptions = container.querySelectorAll('p.text-text-secondary');
      expect(descriptions.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Props & Configuration', () => {
    it('handles empty steps array gracefully', () => {
      render(<HowItWorksStepSection steps={[]} />);
      const steps = screen.queryAllByRole('listitem');
      expect(steps).toHaveLength(0);
    });

    it('handles custom image sources', () => {
      const customSteps: Step[] = [
        {
          stepNumber: 1,
          title: 'Test',
          description: 'Test description',
          image: '/custom-image.jpg',
          imageAlt: 'Custom image alt',
        },
      ];
      
      render(<HowItWorksStepSection steps={customSteps} />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/custom-image.jpg');
      expect(image).toHaveAttribute('alt', 'Custom image alt');
    });

    it('falls back to placeholder when no image provided', () => {
      const customSteps: Step[] = [
        {
          stepNumber: 1,
          title: 'Test',
          description: 'Test description',
        },
      ];
      
      render(<HowItWorksStepSection steps={customSteps} />);
      const image = screen.getByTestId('optimized-image');
      expect(image).toHaveAttribute('src', '/placeholder.jpg');
    });
  });
});

