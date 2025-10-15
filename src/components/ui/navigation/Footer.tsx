/**
 * @fileoverview Footer component for site-wide navigation and contact information
 * @source boombox-10.0/src/app/components/reusablecomponents/footer.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides site-wide footer with organized navigation links across three sections:
 * - Company: Business-related pages (pricing, supplies, locations, etc.)
 * - Support: Help and legal pages (help center, terms, privacy policy)
 * - Contact Us: Contact information, social media links, and primary CTA button
 * 
 * API ROUTES UPDATED:
 * - None (footer contains only navigation links and contact info)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc-950 with bg-primary design token
 * - Replaced hardcoded zinc-800 with border-zinc-800 using design system zinc palette
 * - Applied btn-primary utility class for Get Quote button
 * - Used semantic color tokens for consistent text hierarchy
 * 
 * ACCESSIBILITY UPDATES:
 * - Added comprehensive aria-labels for all interactive elements
 * - Proper semantic HTML structure with nav and section elements
 * - Added role="contentinfo" for footer landmark
 * - Keyboard navigation support for all links and buttons
 * - Added aria-labelledby for footer sections
 * - Proper heading hierarchy and screen reader announcements
 * 
 * @refactor Converted to design system colors, added accessibility features, improved semantic structure
 * Moved to src/components/ui/navigation/ as it's a reusable UI navigation component
 */

import { BoomboxLogo, FacebookIcon, XIcon, InstagramIcon, GoogleIcon } from '@/components/icons';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer 
      className="bg-primary pt-24" 
      role="contentinfo"
      aria-label="Site footer with navigation and contact information"
    >
      <div className="max-w-7xl mx-auto lg:px-16 px-6">
        <nav 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          aria-label="Footer navigation"
        >
          {/* Company Section */}
          <section 
            className="pb-8 md:pb-0 md:border-0 border-b border-zinc-800"
            aria-labelledby="company-heading"
          >
            <h2 
              id="company-heading"
              className="text-text-inverse font-semibold text-lg mb-4"
            >
              Company
            </h2>
            <ul className="mt-4 space-y-4" role="list">
              <li>
                <Link 
                  href="/storage-unit-prices"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="View storage unit pricing information"
                >
                  Storage Unit Prices
                </Link>
              </li>
              <li>
                <Link 
                  href="/packing-supplies"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Browse packing supplies and materials"
                >
                  Packing Supplies
                </Link>
              </li>
              <li>
                <Link 
                  href="/locations"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Find Boombox storage locations near you"
                >
                  Locations
                </Link>
              </li>
              <li>
                <Link 
                  href="/howitworks"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Learn how Boombox storage service works"
                >
                  How it Works
                </Link>
              </li>
              <li>
                <Link 
                  href="/storage-guidelines"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Review storage guidelines and policies"
                >
                  Storage Guidelines
                </Link>
              </li>
              <li>
                <Link 
                  href="/blog"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Read our blog for storage tips and news"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link 
                  href="/careers"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Explore career opportunities at Boombox"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </section>

          {/* Support Section */}
          <section 
            className="pb-8 md:pb-0 md:border-0 border-b border-zinc-800"
            aria-labelledby="support-heading"
          >
            <h2 
              id="support-heading"
              className="text-text-inverse font-semibold text-lg mb-4"
            >
              Support
            </h2>
            <ul className="mt-4 space-y-4" role="list">
              <li>
                <Link 
                  href="/help-center"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Visit our help center for support"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Read our terms of service"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy-policy"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Review our privacy policy"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/sitemap"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Browse our site map"
                >
                  Site Map
                </Link>
              </li>
            </ul>
          </section>

          {/* Contact Us Section */}
          <section 
            className="md:justify-items-end md:text-right"
            aria-labelledby="contact-heading"
          >
            <h2 
              id="contact-heading"
              className="text-text-inverse font-semibold text-lg mb-4"
            >
              Contact Us
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <a 
                  href="tel:+14153223135"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Call us at 415-322-3135"
                >
                  415-322-3135
                </a>
              </div>
              <div>
                <a 
                  href="mailto:help@boomboxstorage.com"
                  className="text-nowrap text-sm text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:underline"
                  aria-label="Email us at help@boomboxstorage.com"
                >
                  help@boomboxstorage.com
                </a>
              </div>
              
              {/* Social Media Links */}
              <div>
                <div 
                  className="flex gap-4 md:justify-end"
                  role="list"
                  aria-label="Follow us on social media"
                >
                  <a 
                    href="https://facebook.com/boomboxstorage" 
                    className="text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded"
                    aria-label="Follow us on Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FacebookIcon className="w-6 h-6" aria-hidden="true" />
                  </a>
                  <a 
                    href="https://x.com/boomboxstorage" 
                    className="text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded"
                    aria-label="Follow us on X (formerly Twitter)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <XIcon className="w-6 h-6" aria-hidden="true" />
                  </a>
                  <a 
                    href="https://instagram.com/boomboxstorage" 
                    className="text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded"
                    aria-label="Follow us on Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InstagramIcon className="w-6 h-6" aria-hidden="true" />
                  </a>
                  <a 
                    href="https://google.com/search?q=boombox+storage" 
                    className="text-text-inverse hover:text-zinc-300 focus:text-zinc-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded"
                    aria-label="Find us on Google"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GoogleIcon className="w-6 h-6" aria-hidden="true" />
                  </a>
                </div>
              </div>
              
              {/* Call-to-Action Button */}
              <div>
                <div className="pt-4 flex md:justify-end">
                  <Link href="/getquote">
                    <button 
                      className="btn-primary text-nowrap"
                      aria-label="Get a storage quote now"
                    >
                      Get Quote
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </nav>
      </div>
      
      {/* Boombox Logo */}
      <div 
        className="mt-24"
        aria-label="Boombox Storage logo"
      >
        <BoomboxLogo 
          className="text-zinc-800 w-full" 
          aria-hidden="true"
        />
      </div>
      
    </footer>
  );
};
