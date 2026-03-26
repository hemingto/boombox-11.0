'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, CubeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/primitives/Button';

interface HaulJobUnit {
  id: number;
  storageUnitId: number;
  storageUnit: { id: number; storageUnitNumber: string; status: string };
}

interface HaulJobDetail {
  id: number;
  jobCode: string;
  type: string;
  status: string;
  originWarehouse: { name: string; city: string };
  destinationWarehouse: { name: string; city: string };
  haulingPartner: { name: string } | null;
  units: HaulJobUnit[];
}

interface HaulUnloadingPageProps {
  taskId: string;
}

export function HaulUnloadingPage({ taskId }: HaulUnloadingPageProps) {
  const router = useRouter();
  const [job, setJob] = useState<HaulJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unitLocations, setUnitLocations] = useState<Record<number, string>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const jobId = taskId.replace('haul-unloading-', '');

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/admin/haul-jobs/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch haul job');
        const data = await res.json();
        setJob(data);
        const locs: Record<number, string> = {};
        data.units.forEach((u: HaulJobUnit) => {
          locs[u.storageUnitId] = '';
        });
        setUnitLocations(locs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading job');
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  const handleSubmit = async () => {
    if (!job) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const locations = Object.entries(unitLocations).map(
        ([storageUnitId, warehouseLocation]) => ({
          storageUnitId: parseInt(storageUnitId, 10),
          warehouseLocation,
        })
      );

      const res = await fetch(
        `/api/admin/haul-jobs/${jobId}/confirm-unloading`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unitLocations: locations }),
        }
      );

      if (!res.ok) throw new Error('Failed to confirm unloading');
      router.push('/admin/tasks');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Error confirming unloading'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-tertiary rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
              <div className="h-4 bg-surface-tertiary rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-status-error">{error || 'Job not found'}</p>
        </div>
      </div>
    );
  }

  const allLocationsFilled = Object.values(unitLocations).every(
    loc => loc.trim().length > 0
  );

  return (
    <div className="mt-4 mb-20">
      <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-text-primary hover:text-text-secondary"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Confirm Unloading & Place Units
            </h1>
            <p className="text-text-primary mt-1 text-sm">
              Assign a warehouse location to each unloaded unit
            </p>
          </div>
        </div>

        <div className="bg-surface-primary">
          <div className="p-6 space-y-6">
            <div className="bg-emerald-500 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 rounded-full p-3">
                  <CubeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white text-lg font-semibold">
                    {job.jobCode}
                  </h4>
                  <p className="text-white/90 text-sm">
                    Place units at {job.destinationWarehouse.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="font-semibold text-lg mb-6 text-text-primary">
                Set location for each unit at {job.destinationWarehouse.name}
              </h2>

              <div className="space-y-4">
                {job.units.map(unit => (
                  <div
                    key={unit.storageUnitId}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <label className="block">
                      <span className="text-sm font-medium text-text-primary">
                        {unit.storageUnit.storageUnitNumber}
                      </span>
                      <input
                        type="text"
                        value={unitLocations[unit.storageUnitId] || ''}
                        onChange={e =>
                          setUnitLocations(prev => ({
                            ...prev,
                            [unit.storageUnitId]: e.target.value,
                          }))
                        }
                        placeholder="e.g. Aisle 3, Shelf B"
                        className="input-field mt-1"
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-20">
                <Button
                  onClick={handleSubmit}
                  disabled={!allLocationsFilled}
                  loading={isSubmitting}
                  variant="primary"
                  className="!bg-emerald-500 hover:!bg-emerald-600 active:!bg-emerald-600 disabled:!bg-emerald-500"
                >
                  Confirm Unloading & Set Locations
                </Button>
              </div>

              {submitError && (
                <div className="mt-4 p-4 bg-status-bg-error border border-border-error rounded-md">
                  <p className="text-sm text-status-error">{submitError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
