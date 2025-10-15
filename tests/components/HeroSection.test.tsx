/**
 * @fileoverview Tests for HeroSection component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { HeroSection } from '@/components/features/landing/HeroSection';

expect.extend(toHaveNoViolations);

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock OptimizedImage component
jest.mock('@/components/ui/primitives/OptimizedImage/OptimizedImage', () => ({
  HeroImage: function MockHeroImage({ src, alt, fallbackSrc, aspectRatio, containerClassName, className, ...props }: any) {
    return (
      <div className={containerClassName} data-testid="hero-image-container">
        <img 
          src={src} 
          alt={alt} 
          data-testid="hero-image"
          data-fallback={fallbackSrc}
          data-aspect-ratio={aspectRatio}
          className={className}
          {...props}
        />
      </div>
    );
  },
}));

// Mock icon components
jest.mock('@/components/icons/ExtraItemsIcon', () => ({
  ExtraitemsIcon: ({ className }: any) => (
    <svg data-testid="extra-items-icon" className={className}>ExtraItems</svg>
  ),
}));

jest.mock('@/components/icons/StudioIcon', () => ({
  StudioIcon: ({ className }: any) => (
    <svg data-testid="studio-icon" className={className}>Studio</svg>
  ),
}));

jest.mock('@/components/icons/OneBedroomIcon', () => ({
  OnebedroomIcon: ({ className }: any) => (
    <svg data-testid="one-bedroom-icon" className={className}>OneBedroom</svg>
  ),
}));

jest.mock('@/components/icons/TwoBedroomIcon', () => ({
  TwobedroomIcon: ({ className }: any) => (
    <svg data-testid="two-bedroom-icon" className={className}>TwoBedroom</svg>
  ),
}));

jest.mock('@/components/icons/FullHomeIcon', () => ({
  FullhomeIcon: ({ className }: any) => (
    <svg data-testid="full-home-icon" className={className}>FullHome</svg>
  ),
}));

// Mock MapPinIcon
jest.mock('@heroicons/react/20/solid', () => ({
  MapPinIcon: ({ className, ...props }: any) => (
    <svg data-testid="map-pin-icon" className={className} {...props}>MapPin</svg>
  ),
}));

describe('HeroSection', () => {
  const defaultProps = {
    title: 'Store your stuff with Boombox',
    buttontext: 'Get a quote',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HeroSection {...defaultProps} />);
      expect(screen.getByRole('region', { name: /get a storage quote/i })).toBeInTheDocument();
    });

    it('renders the title', () => {
      render(<HeroSection {...defaultProps} />);
      expect(screen.getByRole('heading', { name: defaultProps.title })).toBeInTheDocument();
    });

    it('renders all 5 storage options', () => {
      render(<HeroSection {...defaultProps} />);
      expect(screen.getByRole('radio', { name: /extra items - 1 storage unit/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /studio - 1 storage unit/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /1 bed apt\. - 2 storage units/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /2 bed apt\. - 3 storage units/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /full home - 4 storage units/i })).toBeInTheDocument();
    });

    it('renders the zip code input', () => {
      render(<HeroSection {...defaultProps} />);
      expect(screen.getByLabelText(/enter your 5-digit zip code/i)).toBeInTheDocument();
    });

    it('renders the CTA button', () => {
      render(<HeroSection {...defaultProps} />);
      expect(screen.getByRole('button', { name: new RegExp(defaultProps.buttontext, 'i') })).toBeInTheDocument();
    });

    it('renders the hero image', () => {
      render(<HeroSection {...defaultProps} />);
      expect(screen.getByTestId('hero-image')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<HeroSection {...defaultProps} className="custom-class" />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<HeroSection {...defaultProps} />);
      await testAccessibility(renderResult);
    });

    it('uses semantic HTML with section element', () => {
      render(<HeroSection {...defaultProps} />);
      const section = screen.getByRole('region', { name: /get a storage quote/i });
      expect(section.tagName).toBe('SECTION');
    });

    it('has proper heading hierarchy with h1', () => {
      render(<HeroSection {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('uses fieldset for radio group', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      const fieldset = container.querySelector('fieldset');
      expect(fieldset).toBeInTheDocument();
      expect(fieldset?.querySelector('legend')).toHaveTextContent(/how much are you storing/i);
    });

    it('has proper ARIA labels for radio buttons', () => {
      render(<HeroSection {...defaultProps} />);
      const extraItemsRadio = screen.getByLabelText(/extra items - 1 storage unit/i);
      expect(extraItemsRadio).toHaveAttribute('type', 'radio');
    });

    it('has proper label for zip code input', () => {
      render(<HeroSection {...defaultProps} />);
      const input = screen.getByLabelText(/enter your 5-digit zip code/i);
      expect(input).toHaveAttribute('id', 'zip-code-input');
    });

    it('has descriptive ARIA label on button', () => {
      render(<HeroSection {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('Get a storage quote');
    });

    it('marks MapPinIcon as decorative', () => {
      render(<HeroSection {...defaultProps} />);
      const icon = screen.getByTestId('map-pin-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('has screen reader hint for zip code input', () => {
      render(<HeroSection {...defaultProps} />);
      const hint = screen.getByText(/enter a 5-digit zip code to check availability/i);
      expect(hint).toHaveClass('sr-only');
    });
  });

  // REQUIRED: Storage option selection
  describe('Storage Option Selection', () => {
    it('defaults to Extra Items selection', () => {
      render(<HeroSection {...defaultProps} />);
      const extraItemsRadio = screen.getByRole('radio', { name: /extra items - 1 storage unit/i });
      expect(extraItemsRadio).toBeChecked();
    });

    it('allows selecting Studio option', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const studioRadio = screen.getByLabelText(/studio/i);
      await user.click(studioRadio);
      
      expect(studioRadio).toBeChecked();
    });

    it('allows selecting 1 Bed Apt option', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const oneBedroomRadio = screen.getByLabelText(/1 bed apt/i);
      await user.click(oneBedroomRadio);
      
      expect(oneBedroomRadio).toBeChecked();
    });

    it('allows selecting 2 Bed Apt option', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const twoBedroomRadio = screen.getByLabelText(/2 bed apt/i);
      await user.click(twoBedroomRadio);
      
      expect(twoBedroomRadio).toBeChecked();
    });

    it('allows selecting Full Home option', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const fullHomeRadio = screen.getByLabelText(/full home/i);
      await user.click(fullHomeRadio);
      
      expect(fullHomeRadio).toBeChecked();
    });

    it('only one radio option can be selected at a time', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const studioRadio = screen.getByLabelText(/studio/i);
      const fullHomeRadio = screen.getByLabelText(/full home/i);
      
      await user.click(studioRadio);
      expect(studioRadio).toBeChecked();
      expect(fullHomeRadio).not.toBeChecked();
      
      await user.click(fullHomeRadio);
      expect(fullHomeRadio).toBeChecked();
      expect(studioRadio).not.toBeChecked();
    });
  });

  // REQUIRED: Zip code input handling
  describe('Zip Code Input', () => {
    it('allows entering zip code', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter your 5-digit zip code/i);
      await user.type(input, '94102');
      
      expect(input).toHaveValue('94102');
    });

    it('limits input to 5 characters', () => {
      render(<HeroSection {...defaultProps} />);
      const input = screen.getByLabelText(/enter your 5-digit zip code/i) as HTMLInputElement;
      
      expect(input).toHaveAttribute('maxLength', '5');
    });

    it('has pattern validation for digits', () => {
      render(<HeroSection {...defaultProps} />);
      const input = screen.getByLabelText(/enter your 5-digit zip code/i);
      
      expect(input).toHaveAttribute('pattern', '\\d{5}');
    });

    it('shows focus state on MapPin icon when input is focused', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter your 5-digit zip code/i);
      const icon = screen.getByTestId('map-pin-icon');
      
      expect(icon).toHaveClass('text-text-secondary');
      
      await user.click(input);
      expect(icon).toHaveClass('text-text-primary');
    });

    it('shows active state on MapPin icon when input has value', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter your 5-digit zip code/i);
      const icon = screen.getByTestId('map-pin-icon');
      
      await user.type(input, '9');
      expect(icon).toHaveClass('text-text-primary');
    });
  });

  // REQUIRED: Navigation and button behavior
  describe('Navigation Behavior', () => {
    it('navigates with correct query params when button clicked', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote?storageUnitCount=1');
    });

    it('includes zip code in query params when valid 5-digit code entered', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter your 5-digit zip code/i);
      const button = screen.getByRole('button');
      
      await user.type(input, '94102');
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote?storageUnitCount=1&zipCode=94102');
    });

    it('excludes invalid zip code from query params', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter your 5-digit zip code/i);
      const button = screen.getByRole('button');
      
      await user.type(input, '941'); // Only 3 digits
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote?storageUnitCount=1');
    });

    it('navigates with correct storage unit count for Studio (1 unit)', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const studioRadio = screen.getByLabelText(/studio/i);
      await user.click(studioRadio);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote?storageUnitCount=1');
    });

    it('navigates with correct storage unit count for 1 Bed Apt (2 units)', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const oneBedroomRadio = screen.getByLabelText(/1 bed apt/i);
      await user.click(oneBedroomRadio);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote?storageUnitCount=2');
    });

    it('navigates with correct storage unit count for 2 Bed Apt (3 units)', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const twoBedroomRadio = screen.getByLabelText(/2 bed apt/i);
      await user.click(twoBedroomRadio);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote?storageUnitCount=3');
    });

    it('navigates with correct storage unit count for Full Home (4 units)', async () => {
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const fullHomeRadio = screen.getByLabelText(/full home/i);
      await user.click(fullHomeRadio);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/getquote?storageUnitCount=4');
    });

    it('handles Enter key press in zip code input', async () => {
      render(<HeroSection {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter your 5-digit zip code/i);
      fireEvent.change(input, { target: { value: '94102' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/getquote?storageUnitCount=1&zipCode=94102');
      });
    });
  });

  // REQUIRED: Design system integration
  describe('Design System Integration', () => {
    it('uses semantic surface color tokens', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      
      // Selected radio button
      const selectedButton = container.querySelector('.bg-surface-tertiary');
      expect(selectedButton).toBeInTheDocument();
    });

    it('does not use hardcoded slate colors', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      const section = container.querySelector('section');
      
      expect(section?.innerHTML).not.toContain('bg-slate-100');
      expect(section?.innerHTML).not.toContain('bg-slate-200');
    });

    it('uses semantic text color tokens', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      
      const selectedLabel = container.querySelector('.text-text-primary');
      expect(selectedLabel).toBeInTheDocument();
      
      const unselectedLabel = container.querySelector('.text-text-secondary');
      expect(unselectedLabel).toBeInTheDocument();
    });

    it('uses btn-primary utility class for CTA button', () => {
      render(<HeroSection {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary');
    });

    it('does not use hardcoded zinc colors on button', () => {
      render(<HeroSection {...defaultProps} />);
      const button = screen.getByRole('button');
      
      expect(button).not.toHaveClass('bg-zinc-950');
      expect(button).not.toHaveClass('hover:bg-zinc-800');
      expect(button).not.toHaveClass('active:bg-zinc-700');
    });

    it('uses consistent container padding patterns', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      const section = container.querySelector('section');
      
      expect(section).toHaveClass('lg:px-16');
      expect(section).toHaveClass('px-6');
    });
  });

  // REQUIRED: Image optimization
  describe('Image Optimization', () => {
    it('uses HeroImage component', () => {
      render(<HeroSection {...defaultProps} />);
      expect(screen.getByTestId('hero-image')).toBeInTheDocument();
      expect(screen.getByTestId('hero-image-container')).toBeInTheDocument();
    });

    it('uses default placeholder image', () => {
      render(<HeroSection {...defaultProps} />);
      const image = screen.getByTestId('hero-image');
      expect(image).toHaveAttribute('src', '/placeholder.jpg');
    });

    it('uses custom image src when provided', () => {
      render(<HeroSection {...defaultProps} imageSrc="/custom-hero.jpg" />);
      const image = screen.getByTestId('hero-image');
      expect(image).toHaveAttribute('src', '/custom-hero.jpg');
    });

    it('has fallback image configured', () => {
      render(<HeroSection {...defaultProps} />);
      const image = screen.getByTestId('hero-image');
      expect(image).toHaveAttribute('data-fallback', '/placeholder.jpg');
    });

    it('uses custom fallback when provided', () => {
      render(<HeroSection {...defaultProps} fallbackSrc="/fallback.jpg" />);
      const image = screen.getByTestId('hero-image');
      expect(image).toHaveAttribute('data-fallback', '/fallback.jpg');
    });

    it('has square aspect ratio configured', () => {
      render(<HeroSection {...defaultProps} />);
      const image = screen.getByTestId('hero-image');
      expect(image).toHaveAttribute('data-aspect-ratio', 'square');
    });

    it('has descriptive alt text', () => {
      render(<HeroSection {...defaultProps} />);
      const image = screen.getByAltText(/san francisco bay area mobile storage service/i);
      expect(image).toBeInTheDocument();
    });

    it('uses custom alt text when provided', () => {
      render(<HeroSection {...defaultProps} imageAlt="Custom hero image" />);
      const image = screen.getByAltText('Custom hero image');
      expect(image).toBeInTheDocument();
    });

    it('applies container and image classes', () => {
      render(<HeroSection {...defaultProps} />);
      const container = screen.getByTestId('hero-image-container');
      const image = screen.getByTestId('hero-image');
      
      expect(container).toHaveClass('w-full', 'max-w-xl', 'rounded-md');
      expect(image).toHaveClass('rounded-md', 'object-cover');
    });
  });

  // REQUIRED: Layout structure
  describe('Layout Structure', () => {
    it('renders two-column layout', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      const columns = container.querySelectorAll('.basis-1\\/2');
      expect(columns).toHaveLength(2);
    });

    it('left column contains form elements', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      const leftColumn = container.querySelector('.basis-1\\/2');
      
      expect(leftColumn?.querySelector('h1')).toBeInTheDocument();
      expect(leftColumn?.querySelector('fieldset')).toBeInTheDocument();
      expect(leftColumn?.querySelector('input')).toBeInTheDocument();
      expect(leftColumn?.querySelector('button')).toBeInTheDocument();
    });

    it('right column contains image', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      const columns = container.querySelectorAll('.basis-1\\/2');
      const rightColumn = columns[1];
      
      expect(rightColumn?.querySelector('[data-testid="hero-image"]')).toBeInTheDocument();
    });
  });

  // REQUIRED: Edge cases
  describe('Edge Cases', () => {
    it('handles empty className prop gracefully', () => {
      const { container } = render(<HeroSection {...defaultProps} className="" />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('renders correctly when className is undefined', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('handles very long title text', () => {
      const longTitle = 'A'.repeat(200);
      render(<HeroSection {...defaultProps} title={longTitle} />);
      expect(screen.getByRole('heading')).toHaveTextContent(longTitle);
    });

    it('handles special characters in title', () => {
      render(<HeroSection title="Store & Save 50%!" buttontext="Get a quote" />);
      expect(screen.getByRole('heading', { name: /store & save 50%!/i })).toBeInTheDocument();
    });

    it('clears router mock between tests', async () => {
      mockPush.mockClear();
      const user = userEvent.setup();
      render(<HeroSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });
});

