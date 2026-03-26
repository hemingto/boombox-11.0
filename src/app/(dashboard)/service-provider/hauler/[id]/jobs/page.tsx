'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface HaulJob {
  id: number;
  jobCode: string;
  type: string;
  status: string;
  scheduledDate: string | null;
  originWarehouse: { name: string; city: string };
  destinationWarehouse: { name: string; city: string };
  units: { storageUnit: { storageUnitNumber: string } }[];
}

export default function HaulerJobsPage() {
  const params = useParams();
  const [jobs, setJobs] = useState<HaulJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch(`/api/hauling-partners/${params.id}/jobs`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-tertiary rounded w-1/3"></div>
          <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        Haul Jobs
      </h1>

      {jobs.length === 0 ? (
        <div className="bg-surface-primary rounded-lg p-8 text-center shadow-custom-shadow">
          <p className="text-text-secondary">No haul jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {job.jobCode}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {job.originWarehouse.name} → {job.destinationWarehouse.name}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    job.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : job.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : job.status === 'SCHEDULED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <div className="text-sm text-text-secondary">
                <p>{job.units.length} unit(s)</p>
                {job.scheduledDate && (
                  <p>
                    Scheduled:{' '}
                    {new Date(job.scheduledDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
