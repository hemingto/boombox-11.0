/**
 * @fileoverview Recent blog posts component with database integration
 * @source boombox-10.0/src/app/components/blog-post/recentblogposts.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Fetches recent blog posts from database via API
 * - Displays top 3 most recent published posts
 * - Responsive layout with image thumbnails and metadata
 * - Replaces static data with dynamic database queries
 * 
 * API ROUTES UPDATED:
 * - Uses: /api/blog/posts (new database-driven endpoint)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic colors (text-text-primary, text-text-secondary)
 * - Applied consistent spacing and typography
 * - Maintains responsive design patterns
 * 
 * @refactor Migrated from static data to database-driven approach with API integration
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/primitives/Skeleton';
import { LegacyBlogPost } from '@/types/content.types';

interface RecentBlogPostsProps {
 /** Additional CSS classes for styling */
 className?: string;
 /** Maximum number of posts to display */
 limit?: number;
}

export function RecentBlogPosts({ 
 className = '', 
 limit = 3 
}: RecentBlogPostsProps) {
 const [posts, setPosts] = useState<LegacyBlogPost[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  async function fetchRecentPosts() {
   try {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/blog/posts?limit=${limit}&page=1`);
    
    if (!response.ok) {
     throw new Error(`Failed to fetch posts: ${response.status}`);
    }
    
    const data = await response.json();
    setPosts(data.posts || []);
   } catch (err) {
    console.error('Error fetching recent blog posts:', err);
    setError('Failed to load recent posts');
   } finally {
    setLoading(false);
   }
  }

  fetchRecentPosts();
 }, [limit]);

 if (loading) {
  return (
   <div className={`flex-col ${className}`}>
    <h2 className="mb-6 text-text-primary">Recent Blogs</h2>
    {Array.from({ length: limit }).map((_, index) => (
     <div key={index} className="flex flex-row sm:flex-col mb-6 sm:mb-10">
      <div className="w-32 h-24 sm:w-full flex-none sm:flex-1 mb-4 mr-4 sm:mr-0">
       <Skeleton className="w-full h-full rounded-md" />
      </div>
      <div className="flex flex-col flex-grow space-y-2">
       <Skeleton className="h-4 w-3/4" />
       <Skeleton className="h-3 w-1/2" />
      </div>
     </div>
    ))}
   </div>
  );
 }

 if (error) {
  return (
   <div className={`flex-col ${className}`}>
    <h2 className="mb-6 text-text-primary">Recent Blogs</h2>
    <div className="text-status-error text-sm" role="alert">
     {error}
    </div>
   </div>
  );
 }

 if (posts.length === 0) {
  return (
   <div className={`flex-col ${className}`}>
    <h2 className="mb-6 text-text-primary">Recent Blogs</h2>
    <div className="text-text-primary text-sm">
     No recent blog posts available.
    </div>
   </div>
  );
 }

 return (
  <div className={`flex-col ${className}`}>
   <h2 className="mb-6 text-text-primary">Recent Blogs</h2>
   {posts.map((blog, index) => (
    <article 
     key={blog.link || index} 
     className="flex flex-row sm:flex-col mb-6 sm:mb-10"
    >
     {/* Image Link */}
     <div className="w-32 h-24 sm:w-full flex-none sm:flex-1 mb-4 mr-4 sm:mr-0">
      <Link href={blog.link || '#'} aria-label={`Read article: ${blog.blogTitle}`}>
       <div className="relative w-full h-full rounded-md overflow-hidden">
         <Image
           src={blog.thumbnail}
           alt={blog.blogTitle}
           fill
           className="rounded-md object-cover"
           priority={index === 0}
           sizes="(max-width: 640px) 128px, 375px"
         />
       </div>
      </Link>
     </div>
     
     {/* Text Content */}
     <div className="flex flex-col flex-grow">
      <Link href={blog.link || '#'}>
       <h3 className="mb-2 text-text-primary hover:text-primary">
        {blog.blogTitle}
       </h3>
      </Link>
      <p className="text-xs md:text-sm text-text-primary">
       by {blog.author} | {blog.readTime}
      </p>
     </div>
    </article>
   ))}
  </div>
 );
}
