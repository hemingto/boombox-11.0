/**
 * @fileoverview Global 404 page with retro pixel art theme.
 * Renders under root layout (not public layout), so navbar is embedded directly.
 */

import Link from 'next/link';
import { MinimalNavbar } from '@/components/ui/navigation/MinimalNavbar';
import { PixelBoombox } from '@/components/features/not-found/PixelBoombox';
import { BlockWall } from '@/components/features/not-found/BlockWall';

const quickLinks = [
  { name: 'Homepage', href: '/' },
  { name: 'Get Quote', href: '/get-quote' },
  { name: 'How It Works', href: '/howitworks' },
  { name: 'Storage Prices', href: '/storage-unit-prices' },
  { name: 'Locations', href: '/locations' },
  { name: 'Blog', href: '/blog' },
  { name: 'Help Center', href: '/help-center' },
  { name: 'Packing Supplies', href: '/packing-supplies' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <MinimalNavbar theme="dark" showGetQuoteButton={true} />

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative">
        <h1 className="font-pixel text-6xl sm:text-8xl text-text-inverse mb-4 tracking-wider">
          404
        </h1>

        <p className="font-pixel text-sm sm:text-lg text-text-inverse mb-12 tracking-wide">
          Page Not Found!
        </p>

        <nav aria-label="Quick links" className="mb-16 max-w-xl">
          <div className="flex flex-wrap justify-center gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-zinc-800 text-text-inverse text-sm py-2 px-4 rounded-full hover:bg-zinc-700 active:bg-zinc-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-24 left-8 sm:left-16">
          <PixelBoombox />
        </div>
      </div>

      <BlockWall />
    </div>
  );
}
