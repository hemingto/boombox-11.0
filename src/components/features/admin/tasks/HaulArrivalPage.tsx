'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeftIcon,
  TruckIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
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

interface DamageReport {
  damaged: boolean;
  photos: string[];
}

interface HaulArrivalPageProps {
  taskId: string;
}

export function HaulArrivalPage({ taskId }: HaulArrivalPageProps) {
  const router = useRouter();
  const [job, setJob] = useState<HaulJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [damageReports, setDamageReports] = useState<
    Record<number, DamageReport>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const jobId = taskId.replace('haul-arrival-', '');

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/admin/haul-jobs/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch haul job');
        const data = await res.json();
        setJob(data);
        const reports: Record<number, DamageReport> = {};
        data.units.forEach((u: HaulJobUnit) => {
          reports[u.storageUnitId] = { damaged: false, photos: [] };
        });
        setDamageReports(reports);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading job');
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  const toggleDamage = (storageUnitId: number) => {
    setDamageReports(prev => ({
      ...prev,
      [storageUnitId]: {
        ...prev[storageUnitId],
        damaged: !prev[storageUnitId].damaged,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!job) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const unitDamageReports = Object.entries(damageReports).map(
        ([storageUnitId, report]) => ({
          storageUnitId: parseInt(storageUnitId, 10),
          damaged: report.damaged,
          photos: report.photos,
        })
      );

      const res = await fetch(`/api/admin/haul-jobs/${jobId}/confirm-arrival`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitDamageReports }),
      });

      if (!res.ok) throw new Error('Failed to confirm arrival');
      router.push('/admin/tasks');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Error confirming arrival'
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
              Confirm Arrival & Damage Check
            </h1>
            <p className="text-text-primary mt-1 text-sm">
              Check each unit for damage upon arrival at destination
            </p>
          </div>
        </div>

        <div className="bg-surface-primary">
          <div className="p-6 space-y-6">
            <div className="bg-purple-500 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 rounded-full p-3">
                  <TruckIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white text-lg font-semibold">
                    {job.jobCode}
                  </h4>
                  <p className="text-white/90 text-sm">
                    Arrived at {job.destinationWarehouse.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="font-semibold text-lg mb-6 text-text-primary">
                Damage Assessment for Each Unit
              </h2>

              <div className="space-y-4">
                {job.units.map(unit => (
                  <div
                    key={unit.storageUnitId}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">
                        {unit.storageUnit.storageUnitNumber}
                      </span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              damageReports[unit.storageUnitId]?.damaged ||
                              false
                            }
                            onChange={() => toggleDamage(unit.storageUnitId)}
                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                          />
                          <span className="text-sm text-red-600 font-medium">
                            Damage Reported
                          </span>
                        </label>
                      </div>
                    </div>

                    {damageReports[unit.storageUnitId]?.damaged && (
                      <div className="mt-3 pl-4 border-l-2 border-red-200">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CameraIcon className="h-4 w-4" />
                          <span>
                            Damage photo upload available after confirmation
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-20">
                <Button
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  variant="primary"
                  className="!bg-purple-500 hover:!bg-purple-600 active:!bg-purple-600"
                >
                  Confirm Arrival & Damage Check
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
