'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/features/admin/shared';

interface LocationPage {
  id: string;
  slug: string;
  city: string;
  state: string;
  zipCode: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationResult {
  locations: LocationPage[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

export function AdminLocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/locations?${params}`);
      if (!res.ok) throw new Error('Failed to fetch locations');

      const data: PaginationResult = await res.json();
      setLocations(data.locations);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location page?')) return;
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchLocations();
    } catch {
      alert('Failed to delete location page');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchLocations();
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Location Pages">
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="DRAFT">Drafts</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <input
          type="text"
          placeholder="Search cities..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-48"
        />
      </AdminPageHeader>

      <div className="px-4 pb-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchLocations}
              className="text-sm text-red-600 underline mt-1"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-md animate-pulse"
              />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No location pages found</p>
            <p className="mt-1 text-sm">
              Run the seed script to populate location pages for all served
              cities.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zip Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map(loc => (
                    <tr key={loc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {loc.city}, {loc.state}
                        </div>
                        <div className="text-xs text-gray-500">
                          /locations/{loc.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[loc.status]}`}
                        >
                          {loc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {loc.zipCode ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(loc.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() =>
                            router.push(`/admin/locations/${loc.id}`)
                          }
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>
                        {loc.status === 'DRAFT' && (
                          <button
                            onClick={() =>
                              handleStatusChange(loc.id, 'PUBLISHED')
                            }
                            className="text-sm text-green-600 hover:text-green-800"
                          >
                            Publish
                          </button>
                        )}
                        {loc.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleStatusChange(loc.id, 'DRAFT')}
                            className="text-sm text-yellow-600 hover:text-yellow-800"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(loc.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {locations.length} of {totalCount} locations
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
