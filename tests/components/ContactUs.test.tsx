/**
 * @fileoverview Tests for ContactUs component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import ContactUs from '@/components/features/helpcenter/ContactUs';

expect.extend(toHaveNoViolations);

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ 
    src, 
    alt, 
    fill,
    sizes,
    style,
    priority
  }: { 
    src: string; 
    alt: string; 
    fill?: boolean;
    sizes?: string;
    style?: React.CSSProperties;
    priority?: boolean;
  }) {
    return (
      <img 
        src={src} 
        alt={alt} 
        data-testid="contact-image"
        data-fill={fill}
        data-sizes={sizes}
        data-priority={priority}
        style={style}
      />
    );
  },
}));

describe('ContactUs', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ContactUs />);
      expect(screen.getByRole('region', { name: /contact information/i })).toBeInTheDocument();
    });

    it('renders with default title', () => {
      render(<ContactUs />);
      expect(screen.getByRole('heading', { level: 2, name: 'Need to get in touch?' })).toBeInTheDocument();
    });

    it('renders with default subtitle', () => {
      render(<ContactUs />);
      expect(screen.getByText('No problem! Contact our support team')).toBeInTheDocument();
    });

    it('renders default phone number', () => {
      render(<ContactUs />);
      expect(screen.getByText('415-322-3135')).toBeInTheDocument();
    });

    it('renders default email address', () => {
      render(<ContactUs />);
      expect(screen.getByText('help@boomboxstorage.com')).toBeInTheDocument();
    });

    it('renders contact image by default', () => {
      render(<ContactUs />);
      const image = screen.getByTestId('contact-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/img/berkeley.png');
      expect(image).toHaveAttribute('alt', 'Contact Us customer service representative');
    });

    it('renders custom title when provided', () => {
      render(<ContactUs title="Contact Our Team" />);
      expect(screen.getByRole('heading', { level: 2, name: 'Contact Our Team' })).toBeInTheDocument();
    });

    it('renders custom subtitle when provided', () => {
      render(<ContactUs subtitle="We're here 24/7" />);
      expect(screen.getByText("We're here 24/7")).toBeInTheDocument();
    });

    it('renders custom phone number when provided', () => {
      render(<ContactUs phone="555-123-4567" />);
      expect(screen.getByText('555-123-4567')).toBeInTheDocument();
    });

    it('renders custom email when provided', () => {
      render(<ContactUs email="support@example.com" />);
      expect(screen.getByText('support@example.com')).toBeInTheDocument();
    });

    it('hides image when showImage is false', () => {
      render(<ContactUs showImage={false} />);
      expect(screen.queryByTestId('contact-image')).not.toBeInTheDocument();
    });

    it('renders custom image source when provided', () => {
      render(<ContactUs imageSrc="/custom-image.jpg" />);
      const image = screen.getByTestId('contact-image');
      expect(image).toHaveAttribute('src', '/custom-image.jpg');
    });

    it('renders custom image alt text when provided', () => {
      render(<ContactUs imageAlt="Custom alt text" />);
      const image = screen.getByTestId('contact-image');
      expect(image).toHaveAttribute('alt', 'Custom alt text');
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ContactUs />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility with custom props', async () => {
      const { container } = render(
        <ContactUs 
          title="Custom Title"
          subtitle="Custom Subtitle"
          phone="555-1234"
          email="test@example.com"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility without image', async () => {
      const { container } = render(<ContactUs showImage={false} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper semantic HTML structure', () => {
      render(<ContactUs />);
      
      // Section landmark
      expect(screen.getByRole('region', { name: /contact information/i })).toBeInTheDocument();
      
      // Heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('uses semantic address element', () => {
      const { container } = render(<ContactUs />);
      const address = container.querySelector('address');
      expect(address).toBeInTheDocument();
    });

    it('has proper ARIA attributes on icons', () => {
      const { container } = render(<ContactUs />);
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons).toHaveLength(2); // Phone and Email icons
    });

    it('has descriptive aria-labels on contact links', () => {
      render(<ContactUs phone="415-322-3135" email="help@boomboxstorage.com" />);
      
      expect(screen.getByLabelText('Call us at 415-322-3135')).toBeInTheDocument();
      expect(screen.getByLabelText('Email us at help@boomboxstorage.com')).toBeInTheDocument();
    });

    it('has descriptive landmark label', () => {
      render(<ContactUs />);
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-label', 'Contact information');
    });

    it('phone link has proper href format', () => {
      render(<ContactUs phone="415-322-3135" />);
      const phoneLink = screen.getByLabelText('Call us at 415-322-3135');
      expect(phoneLink).toHaveAttribute('href', 'tel:4153223135');
    });

    it('email link has proper mailto href', () => {
      render(<ContactUs email="help@boomboxstorage.com" />);
      const emailLink = screen.getByLabelText('Email us at help@boomboxstorage.com');
      expect(emailLink).toHaveAttribute('href', 'mailto:help@boomboxstorage.com');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('phone link is clickable', async () => {
      const user = userEvent.setup();
      render(<ContactUs />);
      
      const phoneLink = screen.getByLabelText(/call us at/i);
      expect(phoneLink.tagName).toBe('A');
      
      await user.click(phoneLink);
      // Link should remain in document after click
      expect(phoneLink).toBeInTheDocument();
    });

    it('email link is clickable', async () => {
      const user = userEvent.setup();
      render(<ContactUs />);
      
      const emailLink = screen.getByLabelText(/email us at/i);
      expect(emailLink.tagName).toBe('A');
      
      await user.click(emailLink);
      // Link should remain in document after click
      expect(emailLink).toBeInTheDocument();
    });

    it('links have hover styles', () => {
      render(<ContactUs />);
      
      const phoneLink = screen.getByLabelText(/call us at/i);
      const emailLink = screen.getByLabelText(/email us at/i);
      
      expect(phoneLink).toHaveClass('hover:text-primary');
      expect(emailLink).toHaveClass('hover:text-primary');
    });

    it('links have focus styles', () => {
      render(<ContactUs />);
      
      const phoneLink = screen.getByLabelText(/call us at/i);
      const emailLink = screen.getByLabelText(/email us at/i);
      
      expect(phoneLink).toHaveClass('focus:ring-2', 'focus:ring-primary');
      expect(emailLink).toHaveClass('focus:ring-2', 'focus:ring-primary');
    });
  });

  // Design system compliance
  describe('Design System Integration', () => {
    it('uses semantic color classes for background', () => {
      render(<ContactUs />);
      const section = screen.getByRole('region');
      expect(section).toHaveClass('bg-surface-tertiary'); // Not bg-slate-100
    });

    it('uses semantic color classes for icons', () => {
      const { container } = render(<ContactUs />);
      const icons = container.querySelectorAll('svg.text-primary');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('uses semantic color classes for subtitle', () => {
      render(<ContactUs />);
      const subtitle = screen.getByText('No problem! Contact our support team');
      expect(subtitle).toHaveClass('text-text-secondary');
    });

    it('uses semantic color classes for links', () => {
      render(<ContactUs />);
      const phoneLink = screen.getByLabelText(/call us at/i);
      expect(phoneLink).toHaveClass('text-text-primary');
    });

    it('applies custom className', () => {
      render(<ContactUs className="custom-class" />);
      const section = screen.getByRole('region');
      expect(section).toHaveClass('custom-class');
    });
  });

  // Image optimization
  describe('Image Optimization', () => {
    it('uses Next.js Image component with fill prop', () => {
      render(<ContactUs />);
      const image = screen.getByTestId('contact-image');
      expect(image).toHaveAttribute('data-fill', 'true');
    });

    it('has responsive sizes attribute', () => {
      render(<ContactUs />);
      const image = screen.getByTestId('contact-image');
      expect(image).toHaveAttribute('data-sizes', '(max-width: 640px) 100vw, 40vw');
    });

    it('uses priority loading for above-fold image', () => {
      render(<ContactUs />);
      const image = screen.getByTestId('contact-image');
      expect(image).toHaveAttribute('data-priority', 'true');
    });

    it('has proper object-fit style', () => {
      render(<ContactUs />);
      const image = screen.getByTestId('contact-image');
      expect(image).toHaveStyle({ objectFit: 'cover' });
    });
  });

  // Component structure
  describe('Component Structure', () => {
    it('renders semantic section element', () => {
      render(<ContactUs />);
      const section = screen.getByRole('region');
      expect(section.tagName).toBe('SECTION');
    });

    it('has proper content hierarchy', () => {
      const { container } = render(<ContactUs />);
      
      const section = screen.getByRole('region');
      const heading = screen.getByRole('heading', { level: 2 });
      const address = container.querySelector('address');
      
      // Heading and address should be inside section
      expect(section.contains(heading)).toBe(true);
      expect(section.contains(address!)).toBe(true);
    });

    it('adjusts layout when image is hidden', () => {
      const { container } = render(<ContactUs showImage={false} />);
      
      // Image wrapper should not be present
      const imageWrapper = container.querySelector('.relative.sm\\:w-2\\/5');
      expect(imageWrapper).not.toBeInTheDocument();
      
      // Content should take full width when image is hidden
      const contentDiv = container.querySelector('.flex.flex-col.items-center.justify-center');
      expect(contentDiv).toBeInTheDocument();
    });

    it('has responsive flex direction', () => {
      const { container } = render(<ContactUs />);
      const cardDiv = container.querySelector('.flex-col.sm\\:flex-row');
      expect(cardDiv).toBeInTheDocument();
    });

    it('icons have flex-shrink-0 to prevent squashing', () => {
      const { container } = render(<ContactUs />);
      const icons = container.querySelectorAll('svg.flex-shrink-0');
      expect(icons).toHaveLength(2);
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles empty string title', () => {
      render(<ContactUs title="" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('');
    });

    it('handles empty string subtitle', () => {
      render(<ContactUs subtitle="" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('handles phone number with special characters', () => {
      render(<ContactUs phone="(415) 322-3135" />);
      const phoneLink = screen.getByLabelText(/call us at/i);
      expect(phoneLink).toHaveAttribute('href', 'tel:4153223135'); // Stripped of non-digits
    });

    it('handles international phone format', () => {
      render(<ContactUs phone="+1-415-322-3135" />);
      const phoneLink = screen.getByLabelText(/call us at/i);
      expect(phoneLink).toHaveAttribute('href', 'tel:14153223135');
    });

    it('handles very long email address', () => {
      const longEmail = 'verylongemailaddress@verylongdomainname.com';
      render(<ContactUs email={longEmail} />);
      expect(screen.getByText(longEmail)).toBeInTheDocument();
    });

    it('handles all props together', () => {
      render(
        <ContactUs 
          title="Custom Title"
          subtitle="Custom Subtitle"
          phone="555-1234"
          email="test@example.com"
          imageSrc="/custom.jpg"
          imageAlt="Custom alt"
          className="custom-class"
          showImage={true}
        />
      );

      expect(screen.getByRole('heading', { name: 'Custom Title' })).toBeInTheDocument();
      expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
      expect(screen.getByText('555-1234')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByTestId('contact-image')).toHaveAttribute('src', '/custom.jpg');
    });
  });

  // Responsive behavior
  describe('Responsive Behavior', () => {
    it('has responsive spacing classes', () => {
      render(<ContactUs />);
      const section = screen.getByRole('region');
      expect(section).toHaveClass('py-12');
    });

    it('has responsive card dimensions', () => {
      const { container } = render(<ContactUs />);
      const card = container.querySelector('.sm\\:min-h-\\[300px\\]');
      expect(card).toBeInTheDocument();
    });

    it('image has responsive width classes', () => {
      const { container } = render(<ContactUs />);
      const imageWrapper = container.querySelector('.sm\\:w-2\\/5.w-full');
      expect(imageWrapper).toBeInTheDocument();
    });

    it('content has responsive padding', () => {
      const { container } = render(<ContactUs />);
      const content = container.querySelector('.p-8.sm\\:p-6');
      expect(content).toBeInTheDocument();
    });
  });
});

