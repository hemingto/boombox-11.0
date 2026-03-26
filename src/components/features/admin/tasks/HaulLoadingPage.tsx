'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/primitives/Button';

interface HaulJobUnit {
  id: number;
  storageUnitId: number;
  loadConfirmed: boolean;
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

interface HaulLoadingPageProps {
  taskId: string;
}

export function HaulLoadingPage({ taskId }: HaulLoadingPageProps) {
  const router = useRouter();
  const [job, setJob] = useState<HaulJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unitChecks, setUnitChecks] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const jobId = taskId.replace('haul-loading-', '');

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/admin/haul-jobs/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch haul job');
        const data = await res.json();
        setJob(data);
        const checks: Record<number, boolean> = {};
        data.units.forEach((u: HaulJobUnit) => {
          checks[u.storageUnitId] = u.loadConfirmed;
        });
        setUnitChecks(checks);
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
      const unitConfirmations = Object.entries(unitChecks).map(
        ([storageUnitId, loaded]) => ({
          storageUnitId: parseInt(storageUnitId, 10),
          loaded,
        })
      );

      const res = await fetch(`/api/admin/haul-jobs/${jobId}/confirm-loading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitConfirmations }),
      });

      if (!res.ok) throw new Error('Failed to confirm loading');
      router.push('/admin/tasks');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Error confirming loading'
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

  const allChecked = Object.values(unitChecks).every(v => v);

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
              Confirm Loading
            </h1>
            <p className="text-text-primary mt-1 text-sm">
              Verify each unit has been loaded onto the trailer
            </p>
          </div>
        </div>

        <div className="bg-surface-primary">
          <div className="p-6 space-y-6">
            <div className="bg-indigo-500 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 rounded-full p-3">
                  <TruckIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white text-lg font-semibold">
                    {job.jobCode}
                  </h4>
                  <p className="text-white/90 text-sm">
                    {job.originWarehouse.name} → {job.destinationWarehouse.name}
                  </p>
                  {job.haulingPartner && (
                    <p className="text-white/80 text-xs mt-1">
                      Partner: {job.haulingPartner.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="font-semibold text-lg mb-6 text-text-primary">
                Check off units loaded onto trailer
              </h2>

              <div className="space-y-3">
                {job.units.map(unit => (
                  <label
                    key={unit.storageUnitId}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={unitChecks[unit.storageUnitId] || false}
                      onChange={e =>
                        setUnitChecks(prev => ({
                          ...prev,
                          [unit.storageUnitId]: e.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {unit.storageUnit.storageUnitNumber}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end mt-20">
                <Button
                  onClick={handleSubmit}
                  disabled={!allChecked}
                  loading={isSubmitting}
                  variant="primary"
                  className="!bg-indigo-500 hover:!bg-indigo-600 active:!bg-indigo-600 disabled:!bg-indigo-500"
                >
                  Confirm All Units Loaded
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
