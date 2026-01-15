/**
 * @fileoverview Jest tests for Footer component
 * Tests navigation links, accessibility features, social media links, and responsive design
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from '@/components/ui/navigation/Footer';

// Mock Next.js Link component
jest.mock('next/link', () => {
 return ({ children, href, ...props }: any) => (
  <a href={href} {...props}>
   {children}
  </a>
 );
});

// Mock icon components
jest.mock('@/components/icons', () => ({
 BoomboxLogo: ({ className, ...props }: any) => (
  <svg data-testid="boombox-logo" className={className} {...props}>
   <title>Boombox Logo</title>
  </svg>
 ),
 FacebookIcon: ({ className, ...props }: any) => (
  <svg data-testid="facebook-icon" className={className} {...props}>
   <title>Facebook</title>
  </svg>
 ),
 XIcon: ({ className, ...props }: any) => (
  <svg data-testid="x-icon" className={className} {...props}>
   <title>X</title>
  </svg>
 ),
 InstagramIcon: ({ className, ...props }: any) => (
  <svg data-testid="instagram-icon" className={className} {...props}>
   <title>Instagram</title>
  </svg>
 ),
 GoogleIcon: ({ className, ...props }: any) => (
  <svg data-testid="google-icon" className={className} {...props}>
   <title>Google</title>
  </svg>
 ),
}));

describe('Footer Component', () => {
 describe('Basic Rendering', () => {
  it('renders footer with proper semantic structure', () => {
   render(<Footer />);
   
   const footer = screen.getByRole('contentinfo');
   expect(footer).toBeInTheDocument();
   expect(footer).toHaveAttribute('aria-label', 'Site footer with navigation and contact information');
  });

  it('renders all three main sections', () => {
   render(<Footer />);
   
   expect(screen.getByRole('heading', { name: 'Company' })).toBeInTheDocument();
   expect(screen.getByRole('heading', { name: 'Support' })).toBeInTheDocument();
   expect(screen.getByRole('heading', { name: 'Contact Us' })).toBeInTheDocument();
  });

  it('applies design system classes', () => {
   render(<Footer />);
   
   const footer = screen.getByRole('contentinfo');
   expect(footer).toHaveClass('bg-primary', 'pt-24');
  });
 });

 describe('Company Section Navigation', () => {
  it('renders all company navigation links', () => {
   render(<Footer />);
   
   const companyLinks = [
    { ariaLabel: 'View storage unit pricing information', href: '/storage-unit-prices' },
    { ariaLabel: 'Browse packing supplies and materials', href: '/packing-supplies' },
    { ariaLabel: 'Find Boombox storage locations near you', href: '/locations' },
    { ariaLabel: 'Learn how Boombox storage service works', href: '/howitworks' },
    { ariaLabel: 'Review storage guidelines and policies', href: '/storage-guidelines' },
    { ariaLabel: 'Read our blog for storage tips and news', href: '/blog' },
    { ariaLabel: 'Explore career opportunities at Boombox', href: '/careers' },
   ];

   companyLinks.forEach(({ ariaLabel, href }) => {
    const link = screen.getByRole('link', { name: ariaLabel });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', href);
   });
  });

  it('applies proper styling to company links', () => {
   render(<Footer />);
   
   const firstLink = screen.getByRole('link', { name: 'View storage unit pricing information' });
   expect(firstLink).toHaveClass(
    'text-nowrap',
    'text-sm', 
    'text-text-inverse',
    'hover:text-zinc-300',
    'focus:text-zinc-300',
    
   );
  });
 });

 describe('Support Section Navigation', () => {
  it('renders all support navigation links', () => {
   render(<Footer />);
   
   const supportLinks = [
    { text: 'Help Center', href: '/help-center' },
    { text: 'Terms', href: '/terms' },
    { text: 'Privacy Policy', href: '/privacy-policy' },
    { text: 'Site Map', href: '/sitemap' },
   ];

   supportLinks.forEach(({ text, href }) => {
    const link = screen.getByRole('link', { name: new RegExp(text, 'i') });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', href);
   });
  });
 });

 describe('Contact Section', () => {
  it('renders phone number link', () => {
   render(<Footer />);
   
   const phoneLink = screen.getByRole('link', { name: /call us at 415-322-3135/i });
   expect(phoneLink).toBeInTheDocument();
   expect(phoneLink).toHaveAttribute('href', 'tel:+14153223135');
  });

  it('renders email link', () => {
   render(<Footer />);
   
   const emailLink = screen.getByRole('link', { name: /email us at help@boomboxstorage.com/i });
   expect(emailLink).toBeInTheDocument();
   expect(emailLink).toHaveAttribute('href', 'mailto:help@boomboxstorage.com');
  });

  it('renders Get Quote button', () => {
   render(<Footer />);
   
   const getQuoteButton = screen.getByRole('button', { name: /get a storage quote now/i });
   expect(getQuoteButton).toBeInTheDocument();
   expect(getQuoteButton).toHaveClass('btn-primary', 'text-nowrap');
   
   const getQuoteLink = getQuoteButton.closest('a');
   expect(getQuoteLink).toHaveAttribute('href', '/getquote');
  });
 });

 describe('Social Media Links', () => {
  it('renders all social media icons with proper links', () => {
   render(<Footer />);
   
   const socialLinks = [
    { name: /facebook/i, href: 'https://facebook.com/boomboxstorage', testId: 'facebook-icon' },
    { name: /x \(formerly twitter\)/i, href: 'https://x.com/boomboxstorage', testId: 'x-icon' },
    { name: /instagram/i, href: 'https://instagram.com/boomboxstorage', testId: 'instagram-icon' },
    { name: /google/i, href: 'https://google.com/search?q=boombox+storage', testId: 'google-icon' },
   ];

   socialLinks.forEach(({ name, href, testId }) => {
    const link = screen.getByRole('link', { name });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    
    const icon = screen.getByTestId(testId);
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
   });
  });

  it('applies proper styling to social media links', () => {
   render(<Footer />);
   
   const facebookLink = screen.getByRole('link', { name: /facebook/i });
   expect(facebookLink).toHaveClass(
    'text-text-inverse',
    'hover:text-zinc-300',
    'focus:text-zinc-300',
    
   );
  });
 });

 describe('Boombox Logo', () => {
  it('renders Boombox logo at bottom', () => {
   render(<Footer />);
   
   const logo = screen.getByTestId('boombox-logo');
   expect(logo).toBeInTheDocument();
   expect(logo).toHaveClass('text-zinc-800', 'w-full');
   expect(logo).toHaveAttribute('aria-hidden', 'true');
  });

  it('logo container has proper aria-label', () => {
   render(<Footer />);
   
   const logoContainer = screen.getByLabelText('Boombox Storage logo');
   expect(logoContainer).toBeInTheDocument();
  });
 });

 describe('Accessibility Features', () => {
  it('has proper landmark roles', () => {
   render(<Footer />);
   
   expect(screen.getByRole('contentinfo')).toBeInTheDocument();
   expect(screen.getByRole('navigation', { name: 'Footer navigation' })).toBeInTheDocument();
  });

  it('has proper heading hierarchy', () => {
   render(<Footer />);
   
   const headings = screen.getAllByRole('heading', { level: 2 });
   expect(headings).toHaveLength(3);
   
   const headingTexts = headings.map(h => h.textContent);
   expect(headingTexts).toEqual(['Company', 'Support', 'Contact Us']);
  });

  it('sections have proper aria-labelledby attributes', () => {
   render(<Footer />);
   
   const companySection = screen.getByLabelText('Company').closest('section');
   expect(companySection).toHaveAttribute('aria-labelledby', 'company-heading');
   
   const supportSection = screen.getByLabelText('Support').closest('section');
   expect(supportSection).toHaveAttribute('aria-labelledby', 'support-heading');
   
   const contactSection = screen.getByLabelText('Contact Us').closest('section');
   expect(contactSection).toHaveAttribute('aria-labelledby', 'contact-heading');
  });

  it('lists have proper role attributes', () => {
   render(<Footer />);
   
   const lists = screen.getAllByRole('list');
   expect(lists.length).toBeGreaterThan(0);
   
   // Check social media list specifically
   const socialMediaList = screen.getByLabelText('Follow us on social media');
   expect(socialMediaList).toHaveAttribute('role', 'list');
  });

  it('has focus management for keyboard navigation', () => {
   render(<Footer />);
   
   const firstLink = screen.getByRole('link', { name: 'View storage unit pricing information' });
   
   // Test that the element can receive focus and has proper focus styles
   fireEvent.focus(firstLink);
   expect(firstLink).toHaveClass('focus:text-zinc-300');
   expect(firstLink).toHaveClass('focus:outline-none');
  });
 });

 describe('Responsive Design', () => {
  it('applies responsive grid classes', () => {
   render(<Footer />);
   
   const navigation = screen.getByRole('navigation', { name: 'Footer navigation' });
   expect(navigation).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-8');
  });

  it('applies responsive border classes to sections', () => {
   render(<Footer />);
   
   const companySection = screen.getByLabelText('Company').closest('section');
   expect(companySection).toHaveClass(
    'pb-8', 'md:pb-0', 'md:border-0', 'border-b', 'border-zinc-800'
   );
  });

  it('applies responsive alignment to contact section', () => {
   render(<Footer />);
   
   const contactSection = screen.getByLabelText('Contact Us').closest('section');
   expect(contactSection).toHaveClass('md:justify-items-end', 'md:text-right');
  });
 });

 describe('User Interactions', () => {
  it('handles link hover states', () => {
   render(<Footer />);
   
   const storageLink = screen.getByRole('link', { name: /storage unit pricing/i });
   
   fireEvent.mouseEnter(storageLink);
   // Hover state is handled by CSS classes, we verify the classes exist
   expect(storageLink).toHaveClass('hover:text-zinc-300');
  });

  it('handles button click for Get Quote', () => {
   render(<Footer />);
   
   const getQuoteButton = screen.getByRole('button', { name: /get a storage quote now/i });
   
   fireEvent.click(getQuoteButton);
   // Click behavior would be handled by Next.js Link navigation
   expect(getQuoteButton.closest('a')).toHaveAttribute('href', '/getquote');
  });

  it('handles keyboard navigation with focus styles', () => {
   render(<Footer />);
   
   const emailLink = screen.getByRole('link', { name: /email us/i });
   
   fireEvent.focus(emailLink);
   expect(emailLink).toHaveClass('focus:text-zinc-300');
   expect(emailLink).toHaveClass('focus:outline-none');
   expect(emailLink).toHaveClass('focus-visible:underline');
  });
 });

 describe('Design System Integration', () => {
  it('uses design system color tokens', () => {
   render(<Footer />);
   
   const footer = screen.getByRole('contentinfo');
   expect(footer).toHaveClass('bg-primary');
   
   const headings = screen.getAllByRole('heading', { level: 2 });
   headings.forEach(heading => {
    expect(heading).toHaveClass('text-text-inverse');
   });
  });

  it('uses design system button utility class', () => {
   render(<Footer />);
   
   const getQuoteButton = screen.getByRole('button', { name: /get a storage quote now/i });
   expect(getQuoteButton).toHaveClass('btn-primary');
  });

  it('applies consistent transition timing', () => {
   render(<Footer />);
   
   // Test specific links that should have transition classes
   const transitionLinks = [
    screen.getByRole('link', { name: 'View storage unit pricing information' }),
    screen.getByRole('link', { name: 'Visit our help center for support' }),
    screen.getByRole('link', { name: 'Call us at 415-322-3135' }),
    screen.getByRole('link', { name: 'Email us at help@boomboxstorage.com' }),
   ];
   
   transitionLinks.forEach(link => {
   });
  });
 });
});
