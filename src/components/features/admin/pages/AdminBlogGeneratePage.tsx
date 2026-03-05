'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/features/admin/shared';

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

const TONES = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Authoritative and business-focused',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Friendly and conversational',
  },
  {
    value: 'educational',
    label: 'Educational',
    description: 'Informative and instructional',
  },
] as const;

export function AdminBlogGeneratePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'educational'>(
    'professional'
  );
  const [keywordsInput, setKeywordsInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    fetch('/api/blog/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  const addKeyword = () => {
    const trimmed = keywordsInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(prev => [...prev, trimmed]);
      setKeywordsInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setGenerating(true);
    setError(null);
    setProgress('Generating blog post content and featured image...');

    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          tone,
          keywords,
          categoryId,
          authorId: session?.user?.id ? Number(session.user.id) : 1,
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
              placeholder="e.g., Benefits of enclosed auto transport for classic cars"
              disabled={generating}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Be specific about the angle you want. The AI will write a
              1000-1500 word post.
            </p>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <div className="grid grid-cols-3 gap-3">
              {TONES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  disabled={generating}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    tone === t.value
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'border-gray-300 hover:border-gray-400'
                  } disabled:opacity-50`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {t.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label
              htmlFor="keywords"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Keywords
            </label>
            <div className="flex gap-2">
              <input
                id="keywords"
                type="text"
                value={keywordsInput}
                onChange={e => setKeywordsInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a keyword and press Enter"
                disabled={generating}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={addKeyword}
                disabled={generating || !keywordsInput.trim()}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map(kw => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      disabled={generating}
                      className="hover:text-indigo-600"
                    >
                      &times;
                    </button>
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
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
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
                This typically takes 15-30 seconds. The AI is writing content
                and generating a featured image.
              </p>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate Blog Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
