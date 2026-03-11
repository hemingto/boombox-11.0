'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/features/admin/shared';

interface LocationPageData {
  id: string;
  slug: string;
  city: string;
  state: string;
  zipCode: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  aboutImageUrl: string | null;
  aboutImageAlt: string | null;
  aboutContent: string;
  aboutContentTwo: string | null;
  stats: { value: string; label: string }[] | null;
  nearbyLocationSlugs: string[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
}

interface AdminLocationEditPageProps {
  locationId: string;
}

export function AdminLocationEditPage({
  locationId,
}: AdminLocationEditPageProps) {
  const router = useRouter();
  const [location, setLocation] = useState<LocationPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    city: '',
    state: 'CA',
    slug: '',
    zipCode: '',
    heroImageUrl: '',
    heroImageAlt: '',
    aboutImageUrl: '',
    aboutImageAlt: '',
    aboutContent: '',
    aboutContentTwo: '',
    statsJson: '[]',
    nearbySlugsJson: '[]',
    metaTitle: '',
    metaDescription: '',
    ogImageUrl: '',
  });

  useEffect(() => {
    async function fetchLocation() {
      try {
        const res = await fetch(`/api/admin/locations/${locationId}`);
        if (!res.ok) throw new Error('Failed to fetch location');
        const data: LocationPageData = await res.json();
        setLocation(data);
        setFormData({
          city: data.city,
          state: data.state,
          slug: data.slug,
          zipCode: data.zipCode || '',
          heroImageUrl: data.heroImageUrl || '',
          heroImageAlt: data.heroImageAlt || '',
          aboutImageUrl: data.aboutImageUrl || '',
          aboutImageAlt: data.aboutImageAlt || '',
          aboutContent: data.aboutContent,
          aboutContentTwo: data.aboutContentTwo || '',
          statsJson: JSON.stringify(data.stats || [], null, 2),
          nearbySlugsJson: JSON.stringify(
            data.nearbyLocationSlugs || [],
            null,
            2
          ),
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          ogImageUrl: data.ogImageUrl || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchLocation();
  }, [locationId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    let stats;
    let nearbyLocationSlugs;
    try {
      stats = JSON.parse(formData.statsJson);
      nearbyLocationSlugs = JSON.parse(formData.nearbySlugsJson);
    } catch {
      setError('Invalid JSON in stats or nearby slugs');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: formData.city,
          state: formData.state,
          slug: formData.slug,
          zipCode: formData.zipCode || null,
          heroImageUrl: formData.heroImageUrl || null,
          heroImageAlt: formData.heroImageAlt || null,
          aboutImageUrl: formData.aboutImageUrl || null,
          aboutImageAlt: formData.aboutImageAlt || null,
          aboutContent: formData.aboutContent,
          aboutContentTwo: formData.aboutContentTwo || null,
          stats,
          nearbyLocationSlugs,
          metaTitle: formData.metaTitle || null,
          metaDescription: formData.metaDescription || null,
          ogImageUrl: formData.ogImageUrl || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save');
      }

      setSuccessMsg('Location page saved successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const res = await fetch(`/api/admin/locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      setLocation(updated);
      setSuccessMsg(`Status changed to ${status}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to update status');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="Edit Location">
          <span />
        </AdminPageHeader>
        <div className="px-4 py-8">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div>
        <AdminPageHeader title="Location Not Found">
          <span />
        </AdminPageHeader>
        <div className="px-4 py-8 text-center text-gray-500">
          <p>This location page could not be found.</p>
          <button
            onClick={() => router.push('/admin/locations')}
            className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm"
          >
            Back to Locations
          </button>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div>
      <AdminPageHeader title={`Edit: ${location.city}`}>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            location.status === 'PUBLISHED'
              ? 'bg-green-100 text-green-800'
              : location.status === 'ARCHIVED'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {location.status}
        </span>
        {location.status === 'DRAFT' && (
          <button
            onClick={() => handleStatusChange('PUBLISHED')}
            className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
          >
            Publish
          </button>
        )}
        {location.status === 'PUBLISHED' && (
          <button
            onClick={() => handleStatusChange('DRAFT')}
            className="rounded-md bg-yellow-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-yellow-500 transition-colors"
          >
            Unpublish
          </button>
        )}
        <button
          onClick={() => router.push('/admin/locations')}
          className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
      </AdminPageHeader>

      <div className="px-4 pb-8 max-w-4xl">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="rounded-md bg-green-50 p-4 mb-4">
            <p className="text-sm text-green-700">{successMsg}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Info */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Info
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => updateField('city', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => updateField('state', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => updateField('slug', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Zip Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={e => updateField('zipCode', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Hero Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Hero Image
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Image URL</label>
                <input
                  type="text"
                  value={formData.heroImageUrl}
                  onChange={e => updateField('heroImageUrl', e.target.value)}
                  placeholder="/locations/san-francisco.png"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Image Alt Text</label>
                <input
                  type="text"
                  value={formData.heroImageAlt}
                  onChange={e => updateField('heroImageAlt', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* About Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              About Content
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>About Image URL</label>
                <input
                  type="text"
                  value={formData.aboutImageUrl}
                  onChange={e => updateField('aboutImageUrl', e.target.value)}
                  placeholder="/locations/san-francisco-about.png"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>About Image Alt Text</label>
                <input
                  type="text"
                  value={formData.aboutImageAlt}
                  onChange={e => updateField('aboutImageAlt', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                SEO Paragraph (displayed as &ldquo;Storage in {'{'}City{'}'}
                &rdquo;)
              </label>
              <textarea
                value={formData.aboutContent}
                onChange={e => updateField('aboutContent', e.target.value)}
                rows={5}
                className={inputClass}
              />
            </div>
            <div className="mt-4">
              <label className={labelClass}>
                Second About Paragraph (displayed right-justified below image)
              </label>
              <textarea
                value={formData.aboutContentTwo}
                onChange={e => updateField('aboutContentTwo', e.target.value)}
                rows={5}
                className={inputClass}
              />
            </div>
            <div className="mt-4">
              <label className={labelClass}>
                Stats (JSON array of {'{'}value, label{'}'})
              </label>
              <textarea
                value={formData.statsJson}
                onChange={e => updateField('statsJson', e.target.value)}
                rows={6}
                className={`${inputClass} font-mono text-xs`}
                placeholder='[{"value": "1,214+", "label": "Boomboxes stored"}]'
              />
            </div>
          </section>

          {/* Nearby Locations */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Nearby Locations
            </h2>
            <div>
              <label className={labelClass}>
                Nearby Slugs (JSON array of strings)
              </label>
              <textarea
                value={formData.nearbySlugsJson}
                onChange={e => updateField('nearbySlugsJson', e.target.value)}
                rows={3}
                className={`${inputClass} font-mono text-xs`}
                placeholder='["oakland", "berkeley", "san-jose"]'
              />
            </div>
          </section>

          {/* SEO */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              SEO Overrides
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Meta Title</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={e => updateField('metaTitle', e.target.value)}
                  placeholder="Auto-generated if blank"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Meta Description</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={e => updateField('metaDescription', e.target.value)}
                  rows={3}
                  placeholder="Auto-generated if blank"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>OG Image URL</label>
                <input
                  type="text"
                  value={formData.ogImageUrl}
                  onChange={e => updateField('ogImageUrl', e.target.value)}
                  placeholder="Defaults to hero image if blank"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
