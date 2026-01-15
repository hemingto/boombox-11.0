/**
 * @fileoverview NavHeader component tests
 * Tests main navigation functionality, responsive design, accessibility, and child component integration
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { NavHeader } from '@/components/ui/navigation/NavHeader';

// Mock Next.js components
jest.mock('next/link', () => {
 return ({ href, children, className, ...props }: any) => (
  <a href={href} className={className} {...props}>
   {children}
  </a>
 );
});

// Mock child components
jest.mock('@/components/icons/BoomboxLogo', () => ({
 BoomboxLogo: ({ className }: { className?: string }) => (
  <div data-testid="boombox-logo" className={className}>
   Boombox Logo
  </div>
 ),
}));

jest.mock('@/components/ui/navigation/LocationsPopover', () => ({
 LocationsPopover: () => (
  <div data-testid="locations-popover">Locations Popover</div>
 ),
}));

jest.mock('@/components/ui/navigation/PricingPopover', () => ({
 PricingPopover: () => (
  <div data-testid="pricing-popover">Pricing Popover</div>
 ),
}));

jest.mock('@/components/ui/navigation/MenuPopover', () => ({
 MenuPopover: ({ className }: { className?: string }) => (
  <div data-testid="menu-popover" className={className}>
   Menu Popover
  </div>
 ),
}));

jest.mock('@/components/ui/navigation/MobileMenu', () => ({
 MobileMenu: ({ className }: { className?: string }) => (
  <div data-testid="mobile-menu" className={className}>
   Mobile Menu
  </div>
 ),
}));

describe('NavHeader', () => {
 describe('Rendering', () => {
  it('renders all main navigation elements', () => {
   render(<NavHeader />);
   
   expect(screen.getByRole('banner')).toBeInTheDocument();
   expect(screen.getByRole('navigation')).toBeInTheDocument();
   expect(screen.getByTestId('boombox-logo')).toBeInTheDocument();
   expect(screen.getByRole('button', { name: /get a storage quote/i })).toBeInTheDocument();
  });

  it('renders navigation links', () => {
   render(<NavHeader />);
   
   expect(screen.getByRole('link', { name: /boombox home page/i })).toBeInTheDocument();
   expect(screen.getByRole('link', { name: /learn how boombox storage works/i })).toBeInTheDocument();
  });

  it('renders child components', () => {
   render(<NavHeader />);
   
   expect(screen.getByTestId('locations-popover')).toBeInTheDocument();
   expect(screen.getByTestId('pricing-popover')).toBeInTheDocument();
   expect(screen.getByTestId('menu-popover')).toBeInTheDocument();
   expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
  });
 });

 describe('Navigation Structure', () => {
  it('has proper semantic HTML structure', () => {
   render(<NavHeader />);
   
   const header = screen.getByRole('banner');
   expect(header).toBeInTheDocument();
   
   const nav = screen.getByRole('navigation');
   expect(nav).toHaveAttribute('aria-label', 'Main site navigation');
  });

  it('organizes navigation items in lists', () => {
   render(<NavHeader />);
   
   const lists = screen.getAllByRole('list');
   expect(lists).toHaveLength(3); // Logo section, center nav, action buttons
  });

  it('has correct navigation link targets', () => {
   render(<NavHeader />);
   
   const homeLink = screen.getByRole('link', { name: /boombox home page/i });
   expect(homeLink).toHaveAttribute('href', '/');
   
   const howItWorksLink = screen.getByRole('link', { name: /learn how boombox storage works/i });
   expect(howItWorksLink).toHaveAttribute('href', '/howitworks');
   
   const quoteLink = screen.getByRole('button', { name: /get a storage quote/i }).closest('a');
   expect(quoteLink).toHaveAttribute('href', '/getquote');
  });
 });

 describe('Design System Integration', () => {
  it('applies correct design system colors', () => {
   render(<NavHeader />);
   
   const nav = screen.getByRole('navigation');
   expect(nav).toHaveClass('bg-primary');
   
   const logo = screen.getByTestId('boombox-logo');
   expect(logo).toHaveClass('text-text-inverse');
  });

  it('applies design system button styling', () => {
   render(<NavHeader />);
   
   const quoteButton = screen.getByRole('button', { name: /get a storage quote/i });
   expect(quoteButton).toHaveClass(
    'bg-surface-primary',
    'text-text-primary',
    'hover:bg-surface-tertiary',
    'active:bg-surface-disabled'
   );
  });

  it('applies design system hover effects', () => {
   render(<NavHeader />);
   
   const howItWorksContainer = screen.getByRole('link', { name: /learn how boombox storage works/i }).parentElement;
   expect(howItWorksContainer).toHaveClass('hover:bg-primary-hover', 'active:bg-primary-active');
  });
 });

 describe('Responsive Design', () => {
  it('hides desktop navigation on small screens', () => {
   render(<NavHeader />);
   
   const centerNav = screen.getByRole('link', { name: /learn how boombox storage works/i }).closest('ul');
   expect(centerNav).toHaveClass('hidden', 'lg:flex');
  });

  it('shows appropriate menu components for different screen sizes', () => {
   render(<NavHeader />);
   
   const menuPopover = screen.getByTestId('menu-popover');
   expect(menuPopover).toHaveClass('hidden', 'sm:block');
   
   const mobileMenu = screen.getByTestId('mobile-menu');
   expect(mobileMenu).toHaveClass('sm:hidden');
  });

  it('hides quote button on small screens', () => {
   render(<NavHeader />);
   
   const quoteButton = screen.getByRole('button', { name: /get a storage quote/i });
   expect(quoteButton).toHaveClass('hidden', 'sm:block');
  });
 });

 describe('Accessibility', () => {
  it('has proper ARIA landmarks and labels', () => {
   render(<NavHeader />);
   
   expect(screen.getByRole('banner')).toBeInTheDocument();
   expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main site navigation');
  });

  it('has descriptive ARIA labels for all links and buttons', () => {
   render(<NavHeader />);
   
   expect(screen.getByRole('link', { name: /boombox home page/i })).toBeInTheDocument();
   expect(screen.getByRole('link', { name: /learn how boombox storage works/i })).toBeInTheDocument();
   expect(screen.getByRole('button', { name: /get a storage quote/i })).toBeInTheDocument();
  });

  it('has proper focus management', () => {
   render(<NavHeader />);
   
   const homeLink = screen.getByRole('link', { name: /boombox home page/i });
   expect(homeLink).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
   
   const howItWorksLink = screen.getByRole('link', { name: /learn how boombox storage works/i });
   expect(howItWorksLink).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
   
   const quoteButton = screen.getByRole('button', { name: /get a storage quote/i });
   expect(quoteButton).toHaveClass('focus:outline-none', 'focus-visible:ring-2');
  });

  it('uses appropriate focus ring colors for dark background', () => {
   render(<NavHeader />);
   
   const homeLink = screen.getByRole('link', { name: /boombox home page/i });
   expect(homeLink).toHaveClass('focus-visible:ring-text-inverse');
   
   const howItWorksLink = screen.getByRole('link', { name: /learn how boombox storage works/i });
   expect(howItWorksLink).toHaveClass('focus-visible:ring-text-inverse');
  });
 });

 describe('Layout and Positioning', () => {
  it('has correct layout structure', () => {
   render(<NavHeader />);
   
   const nav = screen.getByRole('navigation');
   expect(nav).toHaveClass('h-16', 'w-full', 'flex', 'items-center');
  });

  it('has proper spacing and padding', () => {
   render(<NavHeader />);
   
   const container = screen.getByRole('navigation').firstChild;
   expect(container).toHaveClass('lg:px-16', 'px-6', 'py-3');
  });

  it('organizes sections with proper basis classes', () => {
   render(<NavHeader />);
   
   const logoSection = screen.getByTestId('boombox-logo').closest('ul');
   expect(logoSection).toHaveClass('md:basis-1/3');
   
   const centerNav = screen.getByRole('link', { name: /learn how boombox storage works/i }).closest('ul');
   expect(centerNav).toHaveClass('basis-1/3');
   
   const actionSection = screen.getByRole('button', { name: /get a storage quote/i }).closest('ul');
   expect(actionSection).toHaveClass('md:basis-1/3');
  });
 });

 describe('Typography and Styling', () => {
  it('applies correct text styling', () => {
   render(<NavHeader />);
   
   const howItWorksLink = screen.getByRole('link', { name: /learn how boombox storage works/i });
   expect(howItWorksLink).toHaveClass('text-text-inverse', 'text-nowrap', 'text-sm');
   
   const quoteButton = screen.getByRole('button', { name: /get a storage quote/i });
   expect(quoteButton).toHaveClass('font-semibold', 'text-sm', 'font-inter');
  });

  it('applies transition effects', () => {
   render(<NavHeader />);
   
   const howItWorksContainer = screen.getByRole('link', { name: /learn how boombox storage works/i }).parentElement;
   
   const quoteButton = screen.getByRole('button', { name: /get a storage quote/i });
  });
 });
});
