/**
 * @fileoverview Error boundary for blog post page
 * @source Created for boombox-11.0 server component architecture
 * 
 * COMPONENT FUNCTIONALITY:
 * - Handles errors during blog post loading/rendering
 * - Provides graceful error display to users
 * - Includes retry mechanism
 * - Maintains consistent layout during errors
 * 
 * USAGE:
 * - Automatically catches errors in blog post pages
 * - Shows user-friendly error message
 * - Provides option to retry or navigate back
 * 
 * @refactor New error boundary for server component blog pages
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/primitives/Button';

interface BlogPostErrorProps {
 error: Error & { digest?: string };
 reset: () => void;
}

export default function BlogPostError({ error, reset }: BlogPostErrorProps) {
 useEffect(() => {
  // Log error to error reporting service
  console.error('Blog post error:', error);
 }, [error]);

 return (
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
    
    {/* Error Display */}
    <div className="max-w-2xl mx-auto text-center py-12">
     <div 
      className="bg-status-bg-error border border-border-error rounded-lg p-8 mb-6"
      role="alert"
     >
      <h1 className="text-2xl font-semibold text-status-error mb-4">
       Oops! Something went wrong
      </h1>
      <p className="text-text-secondary mb-6">
       We encountered an error while loading this blog post. This could be due to a temporary issue or the post may no longer exist.
      </p>
      
      {/* Error Details (only in development) */}
      {process.env.NODE_ENV === 'development' && (
       <details className="text-left mb-6 bg-surface-tertiary p-4 rounded">
        <summary className="cursor-pointer font-medium text-text-primary mb-2">
         Error Details (Development Only)
        </summary>
        <pre className="text-xs text-status-error overflow-x-auto whitespace-pre-wrap">
         {error.message}
        </pre>
        {error.digest && (
         <p className="text-xs text-text-secondary mt-2">
          Error ID: {error.digest}
         </p>
        )}
       </details>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
       <Button
        onClick={reset}
        variant="primary"
       >
        Try Again
       </Button>
       <Button
        onClick={() => window.location.href = '/blog'}
        variant="secondary"
       >
        Back to Blog
       </Button>
      </div>
     </div>
     
     {/* Helpful Suggestions */}
     <div className="text-text-secondary text-sm">
      <p className="mb-2">You can also:</p>
      <ul className="space-y-1">
       <li>
        <Link href="/blog" className="text-primary hover:underline">
         Browse all blog posts
        </Link>
       </li>
       <li>
        <Link href="/help-center" className="text-primary hover:underline">
         Visit our help center
        </Link>
       </li>
       <li>
        <Link href="/" className="text-primary hover:underline">
         Return to homepage
        </Link>
       </li>
      </ul>
     </div>
    </div>
   </div>
  </div>
 );
}

