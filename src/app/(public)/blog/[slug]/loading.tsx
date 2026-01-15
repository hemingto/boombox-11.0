/**
 * @fileoverview Loading state for blog post page
 * @source Created for boombox-11.0 server component architecture
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays skeleton UI while blog post is loading
 * - Matches blog post layout structure
 * - Provides visual feedback during server-side data fetching
 * 
 * USAGE:
 * - Automatically shown by Next.js during Suspense boundaries
 * - Maintains consistent layout during data fetch
 * 
 * @refactor New loading state for server component blog pages
 */

import { Skeleton } from '@/components/ui/primitives/Skeleton';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';

export default function BlogPostLoading() {
 return (
  <>
   {/* Hero Section Skeleton */}
   <div className="w-full mt-8 mb-8 lg:px-16 px-6">
    <div className="mb-10">
     {/* Back Navigation */}
     <nav className="mb-8 items-center" aria-label="Breadcrumb">
      <Link 
       href="/blog" 
       className="flex items-center text-text-primary hover:text-primary" 
       passHref
      >
       <ChevronLeftIcon className="w-6 h-6" aria-hidden="true" />
       <span>Blog</span>
      </Link>
     </nav>
     
     {/* Title and Author Skeleton */}
     <div>
      <Skeleton className="h-10 w-3/4 mb-5" />
      <div className="flex items-center space-x-2">
       <Skeleton className="w-8 h-8 rounded-full" />
       <Skeleton className="h-4 w-64" />
      </div>
     </div>
    </div>
    
    {/* Featured Image Skeleton */}
    <Skeleton className="w-full sm:h-[450px] h-[300px] xl:h-[500px] rounded-md" />
   </div>

   {/* Content Section Skeleton */}
   <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 lg:gap-20 lg:px-16 px-6">
    {/* Main Content Area */}
    <main className="sm:basis-9/12">
     <div className="flex-col space-y-6 mb-10">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-1/2 mt-6" />
      <Skeleton className="h-48 w-full rounded-md" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
     </div>
    </main>
    
    {/* Sidebar Skeleton */}
    <aside className="w-full sm:basis-3/12 sm:max-w-[300px] sm:ml-auto">
     <div className="space-y-4">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-40 w-full rounded-md" />
     </div>
    </aside>
   </div>
  </>
 );
}

