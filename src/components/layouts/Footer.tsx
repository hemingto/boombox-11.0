/**
 * @fileoverview Footer component with company links and contact information
 * @source boombox-10.0/src/app/components/reusablecomponents/footer.tsx
 * @refactor Enhanced with TypeScript interfaces and design system integration
 */

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/primitives/Button';

// These will be imported from the icons directory during Phase 5
// For now, using placeholder types
type IconComponent = React.ComponentType<{ className?: string }>;

export interface FooterProps {
  /**
   * Show/hide the Get Quote button
   */
  showGetQuoteButton?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Logo component (will be imported from icons)
   */
  logo?: IconComponent;

  /**
   * Social media icons (will be imported from icons)
   */
  socialIcons?: {
    facebook?: IconComponent;
    twitter?: IconComponent;
    instagram?: IconComponent;
    google?: IconComponent;
  };
}

// Placeholder for BoomboxLogo - will be imported during Phase 5
const BoomboxLogoPlaceholder: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn('bg-current rounded opacity-20', className)}
    style={{ width: '100%', height: '80px' }}
  >
    <span className="sr-only">Boombox Storage</span>
  </div>
);

// Placeholder for social icons - will be imported during Phase 5
const SocialIconPlaceholder: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn('bg-current rounded-full opacity-50', className)}
    style={{ width: '24px', height: '24px' }}
  >
    <span className="sr-only">Social Media</span>
  </div>
);

const Footer: React.FC<FooterProps> = ({
  showGetQuoteButton = true,
  className,
  logo: LogoComponent = BoomboxLogoPlaceholder,
  socialIcons = {},
}) => {
  // Company links section
  const companyLinks = [
    { name: 'Storage Unit Prices', href: '/storage-unit-prices' },
    { name: 'Packing Supplies', href: '/packing-supplies' },
    { name: 'Locations', href: '/locations' },
    { name: 'How it Works', href: '/howitworks' },
    { name: 'Storage Guidelines', href: '/storage-guidelines' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
  ];

  // Support links section
  const supportLinks = [
    { name: 'Help Center', href: '/help-center' },
    { name: 'Terms', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Site Map', href: '/sitemap' },
  ];

  // Social media components with fallbacks
  const {
    facebook: FacebookIcon = SocialIconPlaceholder,
    twitter: TwitterIcon = SocialIconPlaceholder,
    instagram: InstagramIcon = SocialIconPlaceholder,
    google: GoogleIcon = SocialIconPlaceholder,
  } = socialIcons;

  return (
    <footer className={cn('bg-zinc-950 pt-24', className)}>
      <div className="max-w-7xl mx-auto lg:px-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Section */}
          <div className="pb-8 md:pb-0 md:border-0 border-b border-zinc-800">
            <h2 className="text-white mb-4">Company</h2>
            <ul className="space-y-4">
              {companyLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white hover:text-slate-200 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Section */}
          <div className="pb-8 md:pb-0 md:border-0 border-b border-zinc-800">
            <h2 className="text-white mb-4">Support</h2>
            <ul className="space-y-4">
              {supportLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white hover:text-slate-200 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us Section */}
          <div className="md:justify-items-end md:text-right">
            <h2 className="text-white mb-4">Contact Us</h2>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:415-322-3135"
                  className="text-sm text-white hover:text-slate-200 transition-colors"
                >
                  415-322-3135
                </a>
              </li>
              <li>
                <a
                  href="mailto:help@boomboxstorage.com"
                  className="text-sm text-white hover:text-slate-200 transition-colors"
                >
                  help@boomboxstorage.com
                </a>
              </li>
              <li>
                <div className="flex gap-4 md:justify-end">
                  <FacebookIcon className="text-white w-6 h-6 hover:text-slate-200 transition-colors cursor-pointer" />
                  <TwitterIcon className="text-white w-6 h-6 hover:text-slate-200 transition-colors cursor-pointer" />
                  <InstagramIcon className="text-white w-6 h-6 hover:text-slate-200 transition-colors cursor-pointer" />
                  <GoogleIcon className="text-white w-6 h-6 hover:text-slate-200 transition-colors cursor-pointer" />
                </div>
              </li>
              {showGetQuoteButton && (
                <li>
                  <div className="pt-4 flex md:justify-end">
                    <Link href="/getquote">
                      <Button
                        variant="secondary"
                        size="md"
                        className="font-inter"
                      >
                        Get Quote
                      </Button>
                    </Link>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Logo at bottom */}
      <div className="mt-24">
        <LogoComponent className="text-zinc-800 w-full" />
      </div>
    </footer>
  );
};

export { Footer };
