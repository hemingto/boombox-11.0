/**
 * @fileoverview Interactive 3D storage calculator section
 * Combines ItemSelector, BoomboxVisualizer, and CalculatorSummary
 *
 * LAYOUT:
 * Desktop: Sidebar (ItemSelector) | Main (Visualizer + Summary)
 * Mobile: Tabs between ItemSelector and Visualizer, Summary always visible
 *
 * FEATURES:
 * - 3D visualization of items in Boombox containers
 * - Real-time bin-packing calculation
 * - Responsive layout for all screen sizes
 * - Premium, Boombox-branded design
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ItemSelector } from './ItemSelector';
import { CalculatorSummary } from './CalculatorSummary';
import { cn } from '@/lib/utils';
import { Box, List } from 'lucide-react';

// Dynamically import the 3D visualizer to avoid SSR issues with Three.js
const BoomboxVisualizer = dynamic(
  () => import('./BoomboxVisualizer').then(mod => mod.BoomboxVisualizer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-zinc-100 rounded-lg flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <span>Loading 3D visualizer...</span>
        </div>
      </div>
    ),
  }
);

// ==================== TYPES ====================

type MobileView = 'items' | 'visualizer';

// ==================== COMPONENT ====================

export function StorageCalculatorSection() {
  const [mobileView, setMobileView] = useState<MobileView>('items');

  return (
    <section
      className="lg:px-16 px-6 sm:mb-48 mb-24"
      aria-label="Interactive storage calculator"
    >
      {/* Mobile View Toggle */}
      <div className="lg:hidden flex mb-4 bg-surface-tertiary rounded-lg p-1">
        <button
          onClick={() => setMobileView('items')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors',
            mobileView === 'items'
              ? 'bg-white text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <List className="w-4 h-4" />
          Items
        </button>
        <button
          onClick={() => setMobileView('visualizer')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors',
            mobileView === 'visualizer'
              ? 'bg-white text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Box className="w-4 h-4" />
          3D View
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-[350px_1fr] gap-6">
        {/* Left Sidebar - Item Selector */}
        <div
          className={cn(
            'lg:block',
            mobileView === 'items' ? 'block' : 'hidden'
          )}
        >
          <ItemSelector className="lg:sticky lg:top-24" />
        </div>

        {/* Right Side - Visualizer and Summary */}
        <div
          className={cn(
            'flex flex-col gap-6',
            mobileView === 'visualizer' ? 'block' : 'hidden lg:flex'
          )}
        >
          {/* 3D Visualizer */}
          <div className="bg-gradient-to-b from-zinc-100 to-zinc-200 rounded-lg overflow-hidden aspect-[4/3] lg:aspect-[16/10]">
            <BoomboxVisualizer className="w-full h-full" />
          </div>

          {/* Summary Panel */}
          <CalculatorSummary />
        </div>
      </div>

      {/* Mobile Summary - Always visible on mobile when viewing items */}
      <div
        className={cn(
          'lg:hidden mt-6',
          mobileView === 'items' ? 'block' : 'hidden'
        )}
      >
        <CalculatorSummary />
      </div>
    </section>
  );
}

export default StorageCalculatorSection;
