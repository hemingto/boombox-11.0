'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/features/admin/shared';
import { BlogContent } from '@/components/features/content/BlogContent';

interface ContentBlock {
  id: number;
  type: string;
  content: string;
  metadata?: Record<string, any>;
  order: number;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  generatedByAI: boolean;
  aiPrompt: string | null;
  publishedAt: string | null;
  readTime: number | null;
  viewCount: number;
  createdAt: string;
  category: { id: number; name: string; slug: string } | null;
  contentBlocks: ContentBlock[];
}

type Tab = 'preview' | 'edit-meta' | 'edit-blocks';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

export function AdminBlogReviewPage({ postId }: { postId: number }) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('preview');

  // Editable fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingBlockContent, setEditingBlockContent] = useState('');

  // Inline image insertion
  const [insertAtOrder, setInsertAtOrder] = useState<number | null>(null);
  const [insertImagePrompt, setInsertImagePrompt] = useState('');
  const [insertImageGenerating, setInsertImageGenerating] = useState(false);
  const [insertImageError, setInsertImageError] = useState<string | null>(null);
  const insertFileRef = useRef<HTMLInputElement>(null);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      const data: BlogPost = await res.json();
      setPost(data);
      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt ?? '');
      setMetaTitle(data.metaTitle ?? '');
      setMetaDescription(data.metaDescription ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleUpdateStatus = async (
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      setPost(updated);
    } catch {
      alert('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          metaTitle,
          metaDescription,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const updated = await res.json();
      setPost(updated);
      setActiveTab('preview');
    } catch {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBlock = async (blockId: number) => {
    if (!post) return;
    setSaving(true);
    try {
      const updatedBlocks = post.contentBlocks.map(b =>
        b.id === blockId ? { ...b, content: editingBlockContent } : b
      );
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentBlocks: updatedBlocks.map(b => ({
            type: b.type,
            content: b.content,
            metadata: b.metadata,
            order: b.order,
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed to save block');
      const updated = await res.json();
      setPost(updated);
      setEditingBlockId(null);
    } catch {
      alert('Failed to save block');
    } finally {
      setSaving(false);
    }
  };

  const insertImageBlock = async (imageUrl: string, alt: string) => {
    if (!post || insertAtOrder === null) return;
    setSaving(true);
    try {
      const updatedBlocks = post.contentBlocks.map(b => ({
        type: b.type,
        content: b.content,
        metadata: b.metadata,
        order: b.order >= insertAtOrder ? b.order + 1 : b.order,
      }));
      updatedBlocks.push({
        type: 'IMAGE',
        content: imageUrl,
        metadata: { alt },
        order: insertAtOrder,
      });
      updatedBlocks.sort((a, b) => a.order - b.order);

      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentBlocks: updatedBlocks }),
      });
      if (!res.ok) throw new Error('Failed to insert image');
      const updated = await res.json();
      setPost(updated);
      setInsertAtOrder(null);
      setInsertImagePrompt('');
      setInsertImageError(null);
    } catch {
      alert('Failed to insert image block');
    } finally {
      setSaving(false);
    }
  };

  const handleInsertImageGenerate = async () => {
    if (!insertImagePrompt.trim()) return;
    setInsertImageGenerating(true);
    setInsertImageError(null);
    try {
      const res = await fetch('/api/blog/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: insertImagePrompt.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Image generation failed');
      }
      const { url, alt } = await res.json();
      await insertImageBlock(url, alt);
    } catch (err) {
      setInsertImageError(
        err instanceof Error ? err.message : 'Failed to generate image'
      );
    } finally {
      setInsertImageGenerating(false);
    }
  };

  const handleInsertImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInsertImageGenerating(true);
    setInsertImageError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/blog/generate-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      const { url, alt } = await res.json();
      await insertImageBlock(url, alt);
    } catch (err) {
      setInsertImageError(
        err instanceof Error ? err.message : 'Failed to upload image'
      );
    } finally {
      setInsertImageGenerating(false);
      if (insertFileRef.current) insertFileRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this post?'))
      return;
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/admin/blog');
    } catch {
      alert('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4 max-w-3xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-50 p-6 max-w-lg">
          <p className="text-sm text-red-700">{error || 'Post not found'}</p>
          <Link
            href="/admin/blog"
            className="text-sm text-red-600 underline mt-2 inline-block"
          >
            Back to posts
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'edit-meta', label: 'Edit Meta' },
    { id: 'edit-blocks', label: 'Edit Content' },
  ];

  return (
    <div>
      <AdminPageHeader title="Review Post">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[post.status]}`}
          >
            {post.status}
          </span>
          {post.generatedByAI && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
              AI Generated
            </span>
          )}
        </div>
        <Link
          href="/admin/blog"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
      </AdminPageHeader>

      {/* Status Actions */}
      <div className="px-4 mb-4 flex items-center gap-3">
        {post.status === 'DRAFT' && (
          <button
            onClick={() => handleUpdateStatus('PUBLISHED')}
            disabled={saving}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
          >
            Publish
          </button>
        )}
        {post.status === 'PUBLISHED' && (
          <button
            onClick={() => handleUpdateStatus('DRAFT')}
            disabled={saving}
            className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-500 disabled:opacity-50"
          >
            Unpublish
          </button>
        )}
        {post.status !== 'ARCHIVED' && (
          <button
            onClick={() => handleUpdateStatus('ARCHIVED')}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Archive
          </button>
        )}
        {post.status === 'ARCHIVED' && (
          <button
            onClick={() => handleUpdateStatus('DRAFT')}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Restore to Draft
          </button>
        )}
        <button
          onClick={handleDelete}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>

        {post.aiPrompt && (
          <span
            className="ml-auto text-xs text-gray-400 max-w-md truncate"
            title={post.aiPrompt}
          >
            Prompt: {post.aiPrompt}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="px-4 pb-8">
        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="max-w-3xl">
            {post.featuredImage && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <Image
                  src={post.featuredImage}
                  alt={post.featuredImageAlt ?? post.title}
                  width={1792}
                  height={1024}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              {post.category && <span>{post.category.name}</span>}
              {post.readTime && <span>{post.readTime} min read</span>}
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>

            {post.excerpt && (
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            <BlogContent contentBlocks={post.contentBlocks} />

            {/* SEO Preview */}
            <div className="mt-10 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-3">
                Search Engine Preview
              </h3>
              <div className="text-blue-700 text-lg font-medium hover:underline cursor-pointer">
                {post.metaTitle || post.title}
              </div>
              <div className="text-green-700 text-sm">
                boomboxmoving.com/blog/{post.slug}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {post.metaDescription ||
                  post.excerpt ||
                  'No description available'}
              </div>
            </div>
          </div>
        )}

        {/* Edit Meta Tab */}
        {activeTab === 'edit-meta' && (
          <div className="max-w-2xl space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title{' '}
                <span className="text-gray-400">({metaTitle.length}/60)</span>
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description{' '}
                <span className="text-gray-400">
                  ({metaDescription.length}/160)
                </span>
              </label>
              <textarea
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleSaveMeta}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Edit Content Blocks Tab */}
        {activeTab === 'edit-blocks' && (
          <div className="max-w-3xl space-y-2">
            {post.contentBlocks.map((block, idx) => (
              <div key={block.id}>
                {/* Add Image button above each block */}
                <div className="flex justify-center py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setInsertAtOrder(block.order);
                      setInsertImagePrompt('');
                      setInsertImageError(null);
                    }}
                    className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    + Add Image
                  </button>
                </div>

                {/* Insertion panel */}
                {insertAtOrder === block.order && (
                  <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 mb-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-indigo-800">
                        Insert image here
                      </span>
                      <button
                        type="button"
                        onClick={() => setInsertAtOrder(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                    <textarea
                      value={insertImagePrompt}
                      onChange={e => setInsertImagePrompt(e.target.value)}
                      placeholder="Describe the image you want to generate..."
                      rows={2}
                      disabled={insertImageGenerating}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleInsertImageGenerate}
                        disabled={
                          insertImageGenerating || !insertImagePrompt.trim()
                        }
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {insertImageGenerating ? 'Generating...' : 'Generate'}
                      </button>
                      <label className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                        Upload
                        <input
                          ref={insertFileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleInsertImageUpload}
                          disabled={insertImageGenerating}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {insertImageError && (
                      <p className="text-xs text-red-600">{insertImageError}</p>
                    )}
                  </div>
                )}

                {/* Block card */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {block.type}
                      {block.metadata?.level
                        ? ` (H${block.metadata.level})`
                        : ''}
                    </span>
                    <span className="text-xs text-gray-400">
                      Block {block.order}
                    </span>
                  </div>

                  {block.type === 'IMAGE' ? (
                    <div className="relative w-full aspect-video rounded overflow-hidden bg-gray-100">
                      <Image
                        src={block.content}
                        alt={block.metadata?.alt || 'Content image'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 640px"
                      />
                    </div>
                  ) : editingBlockId === block.id ? (
                    <div>
                      <textarea
                        value={editingBlockContent}
                        onChange={e => setEditingBlockContent(e.target.value)}
                        rows={block.type === 'PARAGRAPH' ? 6 : 3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveBlock(block.id)}
                          disabled={saving}
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Block'}
                        </button>
                        <button
                          onClick={() => setEditingBlockId(null)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingBlockId(block.id);
                        setEditingBlockContent(block.content);
                      }}
                      className="cursor-pointer text-sm text-gray-700 whitespace-pre-wrap hover:bg-gray-50 rounded p-2 -m-2"
                    >
                      {block.content.length > 300
                        ? `${block.content.slice(0, 300)}...`
                        : block.content}
                    </div>
                  )}
                </div>

                {/* Add Image button after last block */}
                {idx === post.contentBlocks.length - 1 && (
                  <>
                    <div className="flex justify-center py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setInsertAtOrder(block.order + 1);
                          setInsertImagePrompt('');
                          setInsertImageError(null);
                        }}
                        className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        + Add Image
                      </button>
                    </div>
                    {insertAtOrder === block.order + 1 && (
                      <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-indigo-800">
                            Insert image at end
                          </span>
                          <button
                            type="button"
                            onClick={() => setInsertAtOrder(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                        <textarea
                          value={insertImagePrompt}
                          onChange={e => setInsertImagePrompt(e.target.value)}
                          placeholder="Describe the image you want to generate..."
                          rows={2}
                          disabled={insertImageGenerating}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                        />
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleInsertImageGenerate}
                            disabled={
                              insertImageGenerating || !insertImagePrompt.trim()
                            }
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                          >
                            {insertImageGenerating
                              ? 'Generating...'
                              : 'Generate'}
                          </button>
                          <label className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleInsertImageUpload}
                              disabled={insertImageGenerating}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {insertImageError && (
                          <p className="text-xs text-red-600">
                            {insertImageError}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
