/**
 * @fileoverview Admin tasks list page - displays all pending administrative tasks
 * @source boombox-10.0/src/app/admin/tasks/page.tsx
 * @refactor Migrated to (dashboard)/admin with improved task routing
 * @routing-improvement Task links now go directly to proper routes (no client-side redirects)
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface MovingPartner {
  name: string;
  email: string;
  phoneNumber: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  details: string;
  action: string;
  actionUrl?: string;
  color: 'cyan' | 'rose' | 'amber' | 'purple' | 'orange' | 'emerald' | 'sky' | 'indigo' | 'darkAmber';
  movingPartner?: MovingPartner;
  jobCode?: string;
  calledMovingPartner?: boolean;
  storageUnitNumber?: string;
}

const filterOptions = [
  { value: 'Unassigned Driver', label: 'Unassigned Driver' },
  { value: 'Pending Cleaning', label: 'Pending Cleaning' },
  { value: 'Storage Unit Return', label: 'Storage Unit Return' },
  { value: 'Assign Storage Unit', label: 'Assign Storage Unit' },
  { value: 'Assign Requested Unit', label: 'Assign Requested Unit' },
  { value: 'Prep Units for Delivery', label: 'Prep Units for Delivery' },
  { value: 'Prep Packing Supply Order', label: 'Prep Packing Supply Order' },
  { value: 'Negative Feedback', label: 'Negative Feedback' },
  { value: 'Negative Packing Supply Feedback', label: 'Negative Packing Supply Feedback' },
  { value: 'Update Location', label: 'Update Location' },
];

const colorClasses = {
  cyan: 'bg-cyan-600 hover:bg-cyan-500 focus-visible:outline-cyan-500 border-cyan-500',
  rose: 'bg-rose-600 hover:bg-rose-500 focus-visible:outline-rose-500 border-rose-500',
  amber: 'bg-amber-600 hover:bg-amber-500 focus-visible:outline-amber-500 border-amber-500',
  purple: 'bg-purple-600 hover:bg-purple-500 focus-visible:outline-purple-500 border-purple-500',
  orange: 'bg-orange-600 hover:bg-orange-500 focus-visible:outline-orange-500 border-orange-500',
  emerald: 'bg-emerald-600 hover:bg-emerald-500 focus-visible:outline-emerald-500 border-emerald-500',
  sky: 'bg-sky-600 hover:bg-sky-500 focus-visible:outline-sky-500 border-sky-500',
  indigo: 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-500 border-indigo-500',
  darkAmber: 'bg-amber-900 hover:bg-amber-800 focus-visible:outline-amber-800 border-amber-800'
};

/**
 * CRITICAL PERFORMANCE IMPROVEMENT: Generate task URL directly based on task ID prefix
 * Eliminates client-side redirects and string parsing from boombox-10.0
 * @param taskId The task identifier (e.g., "storage-123", "feedback-456")
 * @returns Direct route to task page
 */
function getTaskUrl(taskId: string): string {
  if (taskId.startsWith('storage-return-')) {
    return `/admin/tasks/storage-return/${taskId}`;
  }
  if (taskId.startsWith('storage-')) {
    return `/admin/tasks/storage/${taskId}`;
  }
  if (taskId.startsWith('unassigned-')) {
    return `/admin/tasks/unassigned-driver/${taskId}`;
  }
  if (taskId.startsWith('feedback-') || taskId.startsWith('packing-supply-feedback-')) {
    return `/admin/tasks/feedback/${taskId}`;
  }
  if (taskId.startsWith('cleaning-')) {
    return `/admin/tasks/cleaning/${taskId}`;
  }
  if (taskId.startsWith('access-')) {
    return `/admin/tasks/access/${taskId}`;
  }
  if (taskId.startsWith('update-location-')) {
    return `/admin/tasks/update-location/${taskId}`;
  }
  if (taskId.startsWith('prep-delivery-')) {
    return `/admin/tasks/prep-delivery/${taskId}`;
  }
  if (taskId.startsWith('prep-packing-')) {
    return `/admin/tasks/prep-packing/${taskId}`;
  }
  if (taskId.startsWith('requested-unit-')) {
    return `/admin/tasks/requested-unit/${taskId}`;
  }
  
  // Fallback to tasks list
  return '/admin/tasks';
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>(
    filterOptions.reduce((acc, option) => ({ ...acc, [option.value]: true }), {})
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data.tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const activeFilters = Object.entries(selectedFilters)
      .filter(([_, isSelected]) => isSelected)
      .map(([value]) => value);

    if (activeFilters.length === 0) {
      return tasks;
    }
    return tasks.filter(task => activeFilters.includes(task.title));
  }, [tasks, selectedFilters]);

  const toggleFilter = (value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [value]: !prev[value]
    }));
  };

  const toggleAllFilters = () => {
    const allSelected = Object.values(selectedFilters).every(v => v);
    const newState = filterOptions.reduce(
      (acc, option) => ({ ...acc, [option.value]: !allSelected }),
      {}
    );
    setSelectedFilters(newState);
  };

  const selectedCount = Object.values(selectedFilters).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="mt-2 h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-white shadow sm:rounded-lg p-6 border-l-8 border-gray-200">
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="mt-2 h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
              <p className="mt-2 text-sm text-gray-700">
                A list of all pending administrative tasks
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Filter ({selectedCount}/{filterOptions.length})
                <ChevronDownIcon className="-mr-0.5 h-5 w-5" aria-hidden="true" />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="p-4">
                    <div className="mb-3">
                      <button
                        onClick={toggleAllFilters}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        {Object.values(selectedFilters).every(v => v) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filterOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters[option.value]}
                            onChange={() => toggleFilter(option.value)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-sm text-gray-500">
                  {tasks.length === 0 
                    ? 'There are no pending tasks at the moment.'
                    : 'No tasks match the selected filters.'}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white shadow sm:rounded-lg border-l-8 ${colorClasses[task.color].split(' ').find(c => c.includes('border-'))}`}
                >
                  <div className="flex items-center justify-between pl-6 p-4 rounded-lg">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                      {task.details && (
                        <p className="mt-2 text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: task.details }} />
                      )}
                    </div>
                    <Link
                      href={getTaskUrl(task.id)}
                      className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${colorClasses[task.color].split(' ').slice(0, 3).join(' ')}`}
                    >
                      {task.action}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

