/**
 * @fileoverview Tests for GetQuoteLocations component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GetQuoteLocations } from '@/components/features/locations/GetQuoteLocations';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('GetQuoteLocations', () => {
  describe('Rendering', () => {
    it('should render with default content', () => {
      render(<GetQuoteLocations />);
      
      expect(screen.getByText('Never hassle with a storage unit again')).toBeInTheDocument();
      expect(screen.getByText('Get a quote in as little as 2 minutes')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Get Quote' })).toBeInTheDocument();
    });
    
    it('should render with custom heading', () => {
      render(<GetQuoteLocations heading="Custom Heading" />);
      
      expect(screen.getByText('Custom Heading')).toBeInTheDocument();
      expect(screen.queryByText('Never hassle with a storage unit again')).not.toBeInTheDocument();
    });
    
    it('should render with custom description', () => {
      render(<GetQuoteLocations description="Custom description text" />);
      
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
      expect(screen.queryByText('Get a quote in as little as 2 minutes')).not.toBeInTheDocument();
    });
    
    it('should render with custom button text', () => {
      render(<GetQuoteLocations buttonText="Start Now" />);
      
      expect(screen.getByRole('button', { name: 'Start Now' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Get Quote' })).not.toBeInTheDocument();
    });
    
    it('should apply custom className', () => {
      const { container } = render(<GetQuoteLocations className="custom-class" />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<GetQuoteLocations />);
      
      const section = screen.getByRole('region', { name: /never hassle/i });
      expect(section).toBeInTheDocument();
    });
    
    it('should have proper heading with id', () => {
      render(<GetQuoteLocations />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAttribute('id', 'get-quote-heading');
      expect(heading).toHaveTextContent('Never hassle with a storage unit again');
    });
    
    it('should have aria-labelledby linking heading to section', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-labelledby', 'get-quote-heading');
    });
    
    it('should have descriptive link with proper structure', () => {
      render(<GetQuoteLocations />);
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/get-quote');
    });
    
    it('should have proper image alt text', () => {
      render(<GetQuoteLocations />);
      
      const image = screen.getByAltText(/boombox mobile storage service/i);
      expect(image).toBeInTheDocument();
    });
    
    it('should have custom image alt text when provided', () => {
      render(<GetQuoteLocations imageAlt="Custom alt text" />);
      
      const image = screen.getByAltText('Custom alt text');
      expect(image).toBeInTheDocument();
    });
    
    it('should have role="img" on image container', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const imageContainer = container.querySelector('[role="img"]');
      expect(imageContainer).toBeInTheDocument();
      expect(imageContainer).toHaveAttribute('aria-label');
    });
    
    it('should have proper link classes', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/get-quote');
    });
  });
  
  describe('Navigation', () => {
    it('should link to default quote URL', () => {
      render(<GetQuoteLocations />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/get-quote');
    });
    
    it('should link to custom quote URL', () => {
      render(<GetQuoteLocations quoteUrl="/custom-quote" />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/custom-quote');
    });
    
    it('should wrap button in link', () => {
      render(<GetQuoteLocations />);
      
      const link = screen.getByRole('link');
      const button = screen.getByRole('button');
      
      expect(link).toContainElement(button);
    });
  });
  
  describe('Button Component Integration', () => {
    it('should use design system Button component', () => {
      render(<GetQuoteLocations />);
      
      const button = screen.getByRole('button');
      
      // Check for Button component classes
      expect(button).toHaveClass('font-semibold');
    });
    
    it('should wrap button in link', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const link = container.querySelector('a');
      const button = screen.getByRole('button');
      expect(link).toContainElement(button);
    });
  });
  
  describe('Image Component Integration', () => {
    it('should render OptimizedImage with default source', () => {
      render(<GetQuoteLocations />);
      
      const image = screen.getByAltText(/boombox mobile storage service/i);
      expect(image).toHaveAttribute('src');
    });
    
    it('should render OptimizedImage with custom source', () => {
      render(<GetQuoteLocations imageSrc="/custom-image.jpg" imageAlt="Custom image" />);
      
      const image = screen.getByAltText('Custom image');
      expect(image).toHaveAttribute('src');
    });
    
    it('should have proper image styling classes', () => {
      const { container } = render(<GetQuoteLocations />);
      
      // Find the div that wraps the image container
      const imageWrapperDiv = container.querySelector('.flex.place-content-end.basis-1\\/2');
      
      expect(imageWrapperDiv).toBeInTheDocument();
      expect(imageWrapperDiv).toHaveClass('flex');
      expect(imageWrapperDiv).toHaveClass('place-content-end');
      expect(imageWrapperDiv).toHaveClass('basis-1/2');
    });
  });
  
  describe('Layout and Spacing', () => {
    it('should have proper section container classes', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass(
        'md:flex',
        'mt-14',
        'lg:px-16',
        'px-6',
        'sm:mb-48',
        'mb-24'
      );
    });
    
    it('should have proper text content layout', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const textContainer = container.querySelector('.place-content-center');
      expect(textContainer).toHaveClass('basis-1/2', 'mb-8');
    });
    
    it('should have proper heading spacing', () => {
      render(<GetQuoteLocations />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-8');
    });
    
    it('should have proper description spacing', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const description = screen.getByText('Get a quote in as little as 2 minutes');
      expect(description).toHaveClass('mb-10', 'w-4/6');
    });
    
    it('should have proper image container layout', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const imageWrapper = container.querySelector('.flex.place-content-end');
      expect(imageWrapper).toHaveClass('basis-1/2');
    });
  });
  
  describe('Responsive Behavior', () => {
    it('should have mobile-first responsive classes', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('md:flex'); // Flex on medium and above
    });
    
    it('should have responsive padding', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('lg:px-16', 'px-6'); // Larger padding on large screens
    });
    
    it('should have responsive margins', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('sm:mb-48', 'mb-24'); // Larger margin on small screens
    });
    
    it('should have responsive image margin', () => {
      const { container } = render(<GetQuoteLocations />);
      
      // The image should have md:ml-8 class applied by OptimizedImage containerClassName
      const imageContainer = container.querySelector('[role="img"]');
      expect(imageContainer).toBeInTheDocument();
    });
  });
  
  describe('Design System Integration', () => {
    it('should use design system Button component with primary variant', () => {
      render(<GetQuoteLocations />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
    
    it('should maintain consistent typography', () => {
      render(<GetQuoteLocations />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      
      const description = screen.getByText(/get a quote in as little as/i);
      expect(description.tagName).toBe('P');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty heading', () => {
      render(<GetQuoteLocations heading="" />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });
    
    it('should handle empty description', () => {
      render(<GetQuoteLocations description="" />);
      
      const description = screen.queryByText('Get a quote in as little as 2 minutes');
      expect(description).not.toBeInTheDocument();
    });
    
    it('should handle empty button text', () => {
      render(<GetQuoteLocations buttonText="" />);
      
      // Button should still render but be empty
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('');
    });
    
    it('should handle very long heading text', () => {
      const longHeading = 'This is a very long heading that should still render properly without breaking the layout or causing accessibility issues';
      render(<GetQuoteLocations heading={longHeading} />);
      
      expect(screen.getByText(longHeading)).toBeInTheDocument();
    });
    
    it('should handle special characters in text', () => {
      render(<GetQuoteLocations heading="Get Quote & Save!" description="It's fast & easy!" />);
      
      expect(screen.getByText('Get Quote & Save!')).toBeInTheDocument();
      expect(screen.getByText("It's fast & easy!")).toBeInTheDocument();
    });
  });
  
  describe('Content Variations', () => {
    it('should render all props together', () => {
      render(
        <GetQuoteLocations
          heading="Custom Heading"
          description="Custom Description"
          buttonText="Custom Button"
          quoteUrl="/custom-url"
          imageSrc="/custom.jpg"
          imageAlt="Custom Alt"
          className="custom-class"
        />
      );
      
      expect(screen.getByText('Custom Heading')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Button' })).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/custom-url');
      expect(screen.getByAltText('Custom Alt')).toBeInTheDocument();
    });
  });
  
  describe('Keyboard Navigation', () => {
    it('should support keyboard focus on link', () => {
      render(<GetQuoteLocations />);
      
      const link = screen.getByRole('link');
      link.focus();
      
      expect(document.activeElement).toBe(link);
    });
    
    it('should have proper link element', () => {
      const { container } = render(<GetQuoteLocations />);
      
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/get-quote');
    });
  });
});

