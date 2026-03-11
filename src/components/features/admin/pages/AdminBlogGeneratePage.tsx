'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminPageHeader } from '@/components/features/admin/shared';
import { DEFAULT_IMAGE_STYLE } from '@/lib/constants/blogDefaults';

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

const AUTHORS = [
  {
    name: 'Calvin',
    image:
      'https://res.cloudinary.com/daezxeevr/image/upload/v1773181381/author-calvin_dk982x.png',
  },
  {
    name: 'Sophie',
    image:
      'https://res.cloudinary.com/daezxeevr/image/upload/v1773182965/author-sophie_xt1utt.png',
  },
  {
    name: 'Boombox Team',
    image: '/logo.png',
  },
] as const;

export function AdminBlogGeneratePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [topic, setTopic] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState('Calvin');

  // Hero image
  const [imagePrompt, setImagePrompt] = useState('');
  const [imagePromptEdited, setImagePromptEdited] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imageApproved, setImageApproved] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Blog generation
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const parsedKeywords = useMemo(
    () =>
      keywordsText
        .split(/[,\n]/)
        .map(k => k.trim())
        .filter(Boolean),
    [keywordsText]
  );

  // Auto-build image prompt from topic + keywords when not manually edited
  useEffect(() => {
    if (imagePromptEdited) return;
    const parts: string[] = [];
    if (topic.trim())
      parts.push(
        `Generate an image that works as a hero image for a blog titled ${topic.trim()}`
      );
    parts.push(DEFAULT_IMAGE_STYLE);
    setImagePrompt(parts.join('. '));
  }, [topic, imagePromptEdited]);

  useEffect(() => {
    fetch('/api/blog/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  const filteredCategories = useMemo(
    () => categories.filter(c => c.name !== 'Most Recent'),
    [categories]
  );

  const author = AUTHORS.find(a => a.name === selectedAuthor) ?? AUTHORS[0];

  // --- Image handlers ---

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setImageGenerating(true);
    setImageError(null);
    setImageApproved(false);
    setPreviewImageUrl(null);

    try {
      const res = await fetch('/api/blog/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Image generation failed');
      }

      const { url } = await res.json();
      setPreviewImageUrl(url);
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : 'Failed to generate image'
      );
    } finally {
      setImageGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageGenerating(true);
    setImageError(null);
    setImageApproved(false);
    setPreviewImageUrl(null);

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

      const { url } = await res.json();
      setPreviewImageUrl(url);
      setImageApproved(true);
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : 'Failed to upload image'
      );
    } finally {
      setImageGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Blog generation ---

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    if (!previewImageUrl || !imageApproved) {
      setError('Please approve a hero image first');
      return;
    }

    setGenerating(true);
    setError(null);
    setProgress('Generating blog post content...');

    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          keywords: parsedKeywords,
          categoryId,
          authorId: session?.user?.id ? Number(session.user.id) : 1,
          authorName: author.name,
          authorImage: author.image,
          featuredImageUrl: previewImageUrl,
          featuredImageAlt: `Featured image for: ${topic.trim()}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const { post } = await res.json();
      setProgress('Blog post generated successfully! Redirecting to review...');

      setTimeout(() => {
        router.push(`/admin/blog/${post.id}/review`);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate blog post'
      );
      setGenerating(false);
      setProgress('');
    }
  };

  const canGenerate =
    topic.trim().length > 0 && imageApproved && previewImageUrl && !generating;

  return (
    <div>
      <AdminPageHeader title="Generate Blog Post">
        <Link
          href="/admin/blog"
          className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Posts
        </Link>
      </AdminPageHeader>

      <div className="px-4 pb-6 max-w-2xl">
        <div className="space-y-6">
          {/* Topic */}
          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Topic *
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., How to prepare for a long-distance move in the Bay Area"
              disabled={generating}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Be specific about the angle you want. The AI will write a
              1,000–1,500 word post.
            </p>
          </div>

          {/* Keywords */}
          <div>
            <label
              htmlFor="keywords"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Keywords
            </label>
            <textarea
              id="keywords"
              value={keywordsText}
              onChange={e => setKeywordsText(e.target.value)}
              placeholder="Paste keywords separated by commas or new lines, e.g.:&#10;portable storage San Francisco&#10;mobile storage Bay Area&#10;moving tips"
              disabled={generating}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            {parsedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {parsedKeywords.map(kw => (
                  <span
                    key={kw}
                    className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              value={categoryId ?? ''}
              onChange={e =>
                setCategoryId(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              disabled={generating}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="">No category</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Author */}
          <div>
            <label
              htmlFor="author"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Author
            </label>
            <select
              id="author"
              value={selectedAuthor}
              onChange={e => setSelectedAuthor(e.target.value)}
              disabled={generating}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              {AUTHORS.map(a => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hero Image */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Hero Image *</h3>

            {imageApproved && previewImageUrl ? (
              /* Approved state */
              <div className="space-y-3">
                <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={previewImageUrl}
                    alt="Approved hero image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 672px) 100vw, 640px"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-green-700">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Image approved
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageApproved(false);
                      setPreviewImageUrl(null);
                    }}
                    disabled={generating}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              /* Generation / upload state */
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="image-prompt"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Image prompt
                  </label>
                  <textarea
                    id="image-prompt"
                    value={imagePrompt}
                    onChange={e => {
                      setImagePrompt(e.target.value);
                      setImagePromptEdited(true);
                    }}
                    disabled={generating || imageGenerating}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                  />
                  {imagePromptEdited && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePromptEdited(false);
                      }}
                      className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Reset to auto-generated prompt
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={
                      generating || imageGenerating || !imagePrompt.trim()
                    }
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {imageGenerating ? 'Generating...' : 'Generate Preview'}
                  </button>

                  <label className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                    Or upload an image
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={generating || imageGenerating}
                      className="hidden"
                    />
                  </label>
                </div>

                {imageGenerating && (
                  <div className="flex items-center gap-3 text-sm text-indigo-700">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    Generating image preview...
                  </div>
                )}

                {imageError && (
                  <p className="text-sm text-red-600">{imageError}</p>
                )}

                {previewImageUrl && !imageApproved && (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={previewImageUrl}
                        alt="Preview hero image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 672px) 100vw, 640px"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setImageApproved(true)}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImageUrl(null);
                        }}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Progress */}
          {generating && progress && (
            <div className="rounded-md bg-indigo-50 border border-indigo-200 p-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <p className="text-sm text-indigo-700">{progress}</p>
              </div>
              <p className="text-xs text-indigo-500 mt-2">
                This typically takes 15-30 seconds. The AI is writing content.
              </p>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate Blog Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
