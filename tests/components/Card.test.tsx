/**
 * @fileoverview Comprehensive Jest tests for Card component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardProps } from '@/components/ui/primitives/Card';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, fill, ...props }: any) {
    // Handle Next.js Image fill prop by converting to style
    const style = fill ? { width: '100%', height: '100%', objectFit: 'cover' } : {};
    return <img src={src} alt={alt} style={style} {...props} />;
  };
});

describe('Card Component', () => {
  const defaultProps: CardProps = {
    imageSrc: '/test-image.jpg',
    imageAlt: 'Test image',
    location: 'Test Location',
    description: 'Test description',
    link: '/test-link',
  };

  describe('Rendering', () => {
    it('renders with required props', () => {
      render(<Card {...defaultProps} />);
      
      expect(screen.getByText('Test Location')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Test image' })).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/test-link');
    });

    it('renders with all optional props', () => {
      const fullProps: CardProps = {
        ...defaultProps,
        blogtitle: 'Test Blog Title',
        customerCount: '100+',
        author: 'Test Author',
        readTime: '5 min read',
        className: 'custom-class',
        external: true,
        ariaLabel: 'Custom aria label',
      };

      render(<Card {...fullProps} />);
      
      expect(screen.getByText('Test Location')).toBeInTheDocument();
      expect(screen.getByText('Test Blog Title')).toBeInTheDocument();
      expect(screen.getByText('100+')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText('5 min read')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
      expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders minimal card with only required props', () => {
      const minimalProps: CardProps = {
        imageSrc: '/minimal.jpg',
        imageAlt: 'Minimal image',
        link: '/minimal',
      };

      render(<Card {...minimalProps} />);
      
      expect(screen.getByRole('img', { name: 'Minimal image' })).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/minimal');
    });
  });

  describe('Content Display', () => {
    it('displays customer count and description together', () => {
      const props: CardProps = {
        ...defaultProps,
        customerCount: '500+',
        description: 'customers served',
      };

      render(<Card {...props} />);
      
      const customerElement = screen.getByText('500+');
      const descriptionElement = screen.getByText('customers served');
      
      expect(customerElement).toBeInTheDocument();
      expect(descriptionElement).toBeInTheDocument();
      
      // Check they're in the same paragraph
      const paragraph = customerElement.closest('p');
      expect(paragraph).toContainElement(descriptionElement);
    });

    it('displays author and read time with separator', () => {
      const props: CardProps = {
        ...defaultProps,
        author: 'John Doe',
        readTime: '3 min read',
      };

      render(<Card {...props} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('3 min read')).toBeInTheDocument();
      expect(screen.getByText('•')).toBeInTheDocument();
    });

    it('handles only author without read time', () => {
      const props: CardProps = {
        ...defaultProps,
        author: 'Jane Smith',
      };

      render(<Card {...props} />);
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('•')).not.toBeInTheDocument();
    });

    it('handles only read time without author', () => {
      const props: CardProps = {
        ...defaultProps,
        readTime: '7 min read',
      };

      render(<Card {...props} />);
      
      expect(screen.getByText('7 min read')).toBeInTheDocument();
      expect(screen.queryByText('•')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Card {...defaultProps} />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label');
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label');
    });

    it('uses custom aria label when provided', () => {
      const props: CardProps = {
        ...defaultProps,
        ariaLabel: 'Custom accessibility label',
      };

      render(<Card {...props} />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Custom accessibility label');
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Custom accessibility label');
    });

    it('generates fallback aria label from content', () => {
      const props: CardProps = {
        ...defaultProps,
        location: 'San Francisco',
        description: 'Storage solutions',
      };

      render(<Card {...props} />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'San Francisco - Storage solutions');
    });

    it('has proper focus management', () => {
      render(<Card {...defaultProps} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus:outline-none');
      expect(link).toHaveClass('focus-visible:ring-2');
      expect(link).toHaveClass('focus-visible:ring-primary');
    });
  });

  describe('Link Behavior', () => {
    it('handles internal links correctly', () => {
      render(<Card {...defaultProps} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/test-link');
      expect(link).not.toHaveAttribute('target');
      expect(link).not.toHaveAttribute('rel');
    });

    it('handles external links correctly', () => {
      const props: CardProps = {
        ...defaultProps,
        link: 'https://external.com',
        external: true,
      };

      render(<Card {...props} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://external.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies custom className', () => {
      const props: CardProps = {
        ...defaultProps,
        className: 'custom-test-class',
      };

      render(<Card {...props} />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveClass('custom-test-class');
    });

    it('has proper responsive classes', () => {
      render(<Card {...defaultProps} />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveClass('h-40');
      expect(article).toHaveClass('rounded-md');
      expect(article).toHaveClass('transform');
      expect(article).toHaveClass('transition-all');
      expect(article).toHaveClass('duration-300');
    });

    it('has proper image container classes', () => {
      render(<Card {...defaultProps} />);
      
      const imageContainer = screen.getByRole('img').parentElement;
      expect(imageContainer).toHaveClass('w-2/5');
      expect(imageContainer).toHaveClass('h-full');
      expect(imageContainer).toHaveClass('relative');
    });

    it('has proper content container classes', () => {
      render(<Card {...defaultProps} />);
      
      const article = screen.getByRole('article');
      const contentContainer = article.querySelector('.w-3\\/5');
      
      expect(contentContainer).toHaveClass('w-3/5');
      expect(contentContainer).toHaveClass('flex');
      expect(contentContainer).toHaveClass('flex-col');
      expect(contentContainer).toHaveClass('justify-center');
      expect(contentContainer).toHaveClass('p-6');
    });
  });

  describe('User Interactions', () => {
    it('can be clicked', async () => {
      const user = userEvent.setup();
      render(<Card {...defaultProps} />);
      
      const link = screen.getByRole('link');
      await user.click(link);
      
      // Since we're using a mock Link component, we can't test actual navigation
      // but we can verify the click doesn't cause errors
      expect(link).toBeInTheDocument();
    });

    it('can be navigated with keyboard', async () => {
      const user = userEvent.setup();
      render(<Card {...defaultProps} />);
      
      const link = screen.getByRole('link');
      
      // Tab to focus the link
      await user.tab();
      expect(link).toHaveFocus();
      
      // Enter to activate
      await user.keyboard('{Enter}');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty strings gracefully', () => {
      const props: CardProps = {
        imageSrc: '/test.jpg',
        imageAlt: 'Test',
        location: '',
        blogtitle: '',
        description: '',
        customerCount: '',
        author: '',
        readTime: '',
        link: '/test',
      };

      render(<Card {...props} />);
      
      // Should render without crashing
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('handles very long content', () => {
      const props: CardProps = {
        ...defaultProps,
        location: 'This is a very long location name that should be truncated properly',
        blogtitle: 'This is an extremely long blog title that should also be truncated appropriately',
        description: 'This is a very long description that contains lots of text and should be handled gracefully by the component with proper truncation',
        author: 'Very Long Author Name That Might Overflow',
        readTime: '999 min read',
      };

      render(<Card {...props} />);
      
      // Should render without layout issues
      expect(screen.getByRole('article')).toBeInTheDocument();
      
      // Check text truncation classes are applied
      const locationElement = screen.getByText(props.location!);
      expect(locationElement).toHaveClass('truncate');
      
      const blogtitleElement = screen.getByText(props.blogtitle!);
      expect(blogtitleElement).toHaveClass('overflow-hidden');
    });
  });
});
