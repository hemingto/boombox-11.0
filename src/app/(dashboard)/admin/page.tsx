/**
 * @fileoverview Main admin dashboard - overview of operations and tasks
 * @source boombox-10.0/src/app/admin/page.tsx
 * @refactor Migrated to (dashboard)/admin route group with proper data fetching
 */

'use client';

import { useState, useEffect } from 'react';
import { TruckIcon, UserGroupIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const timeFilters = ['Full Day', 'Morning', 'Afternoon'];
const jobStatuses = [
  { name: 'Scheduled', count: 0 },
  { name: 'In Transit', count: 0 },
  { name: 'Loading Complete', count: 0 },
  { name: 'Admin Check', count: 0 },
  { name: 'Complete', count: 0 },
];

const approvalItems = [
  { 
    id: 1,
    name: 'Drivers', 
    count: 0, 
    icon: IdentificationIcon,
    href: '/admin/drivers'
  },
  { 
    id: 2,
    name: 'Movers', 
    count: 0, 
    icon: UserGroupIcon,
    href: '/admin/movers'
  },
  { 
    id: 3,
    name: 'Vehicles', 
    count: 0, 
    icon: TruckIcon,
    href: '/admin/vehicles'
  },
];

const taskStats = [
  { name: 'Unassigned Jobs', value: 0, color: 'cyan', key: 'unassignedJobs' },
  { name: 'Negative Feedback', value: 0, color: 'emerald', key: 'negativeFeedback' },
  { name: 'Awaiting Cleaning', value: 0, color: 'fuchsia', key: 'awaitingCleaning' },
  { name: 'Admin Check', value: 0, color: 'purple', key: 'adminCheck' },
  { name: 'Storage Unit Needed', value: 0, color: 'orange', key: 'storageUnitNeeded' },
];

export default function AdminDashboard() {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Full Day');
  const [jobsToday, setJobsToday] = useState(jobStatuses);
  const [awaitingApprovals, setAwaitingApprovals] = useState(approvalItems);
  const [taskCounts, setTaskCounts] = useState(taskStats);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        
        // Update jobs today counts
        setJobsToday(prev => prev.map(status => ({
          ...status,
          count: data.jobsToday[status.name] || 0
        })));

        // Update awaiting approvals counts
        setAwaitingApprovals(prev => prev.map(item => ({
          ...item,
          count: data.awaitingApprovals[item.name.toLowerCase()] || 0
        })));

        // Update task counts
        setTaskCounts(prev => prev.map(stat => ({
          ...stat,
          value: data.taskCounts[stat.key] || 0
        })));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        {/* Loading skeleton */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="mt-2 h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-5"></div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-700 rounded-xl px-4 py-6 h-24 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 p-4">
            {/* Header */}
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-sm text-gray-700">Overview of today&apos;s operations and pending tasks</p>
              </div>
            </div>

            {/* Jobs Today */}
            <div className="bg-gray-900 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-white">Jobs Today</h3>
                  <div className="flex space-x-2">
                    {timeFilters.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedTimeFilter(filter)}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          selectedTimeFilter === filter
                            ? 'bg-indigo-500 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-2 bg-white/5 sm:grid-cols-2 lg:grid-cols-5">
                  {jobsToday.map((status) => (
                    <div
                      key={status.name}
                      className="bg-gray-700 rounded-xl px-4 py-6 sm:px-6 lg:px-8"
                    >
                      <p className="text-sm/6 font-medium text-gray-200">{status.name}</p>
                      <p className="mt-2 flex items-baseline gap-x-2">
                        <span className="text-4xl font-semibold tracking-tight text-white">{status.count}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-gray-900 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-white">Tasks</h3>
                  <button
                    onClick={() => router.push('/admin/tasks')}
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    View all tasks
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-5">
                  {taskCounts.map((stat) => (
                    <div key={stat.name} className="bg-gray-900 px-4 py-6 sm:px-6 lg:px-8">
                      <p className="text-sm/6 font-medium text-gray-400">{stat.name}</p>
                      <p className="mt-2 flex items-baseline gap-x-2">
                        <span className="text-4xl font-semibold tracking-tight text-white">{stat.value}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Approvals */}
            <div className="bg-indigo-950 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-white">Awaiting Approval</h3>
                <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {awaitingApprovals.map((item) => (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-lg shadow-md bg-slate-100 px-4 pb-12 pt-5 sm:px-6 sm:pt-6"
                    >
                      <dt>
                        <div className="absolute rounded-md bg-indigo-500 p-3">
                          <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                      </dt>
                      <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                        <p className="text-2xl font-semibold text-gray-900">{item.count}</p>
                        <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                          <div className="text-sm">
                            <Link href={item.href} className="font-medium text-indigo-600 hover:text-indigo-500">
                              View all<span className="sr-only"> {item.name} stats</span>
                            </Link>
                          </div>
                        </div>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

