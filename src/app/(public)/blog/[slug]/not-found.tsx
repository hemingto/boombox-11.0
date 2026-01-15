/**
 * @fileoverview Not found page for invalid blog post slugs
 * @refactor Standard Next.js not-found page for dynamic routes
 */

import Link from 'next/link';
import { HelpCenterSection } from '@/components/features/landing';
import { Button } from '@/components/ui/primitives';

export default function BlogPostNotFound() {
  return (
    <>
      <div className="page-container py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Blog Post Not Found
          </h1>
          <p className="text-lg text-text-primary mb-8">
            Sorry, we couldn't find the blog post you're looking for.
          </p>
          <Link href="/blog">
            <Button variant="primary" size="md">
              Back to Blog
            </Button>
          </Link>
        </div>
        
        
      </div>
      
      <div className="mt-16">
        <HelpCenterSection />
      </div>
    </>
  );
}

