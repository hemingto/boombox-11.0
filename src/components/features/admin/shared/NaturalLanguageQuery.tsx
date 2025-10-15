/**
 * @fileoverview Natural language database query component for admin AI queries
 * @source boombox-10.0/src/app/components/admin/NaturalLanguageQuery.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - AI-powered natural language to SQL query conversion
 * - Example query suggestions for common admin tasks
 * - SQL query preview with expandable view
 * - Results table display with dynamic columns
 * - Error and empty state handling
 * 
 * API ROUTES USED:
 * - POST /api/ai/query-ai - Submit natural language query and get SQL results
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded gray colors with semantic surface/text tokens
 * - Replaced zinc colors with primary tokens
 * - Replaced red colors with status-error tokens
 * - Replaced yellow colors with status-warning tokens
 * - Uses border tokens for input ring styles
 * - Consistent hover states with design system colors
 * 
 * ACCESSIBILITY:
 * - ARIA labels for search button
 * - Keyboard navigation (Enter to submit)
 * - Proper semantic HTML (table headers, form elements)
 * - Focus states with visible indicators
 * 
 * @refactor Migrated from boombox-10.0 with design system integration
 */

'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, EllipsisHorizontalIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { ListBulletIcon, CalendarIcon, UserGroupIcon, BuildingStorefrontIcon, TruckIcon } from '@heroicons/react/24/outline';

interface QueryResult {
  sql: string;
  results: any[];
}

interface ExampleQuery {
  icon: React.ElementType;
  label: string;
  query: string;
}

const exampleQueries: ExampleQuery[] = [
  {
    icon: ListBulletIcon,
    label: 'Appointments',
    query: 'Show me all appointments scheduled for today'
  },
  {
    icon: CalendarIcon,
    label: 'Cancellations',
    query: 'List all cancelled appointments from the last week'
  },
  {
    icon: UserGroupIcon,
    label: 'Storage Usage',
    query: 'Show me all active storage unit usage with customer details'
  },
  {
    icon: BuildingStorefrontIcon,
    label: 'Feedback',
    query: 'Show all positive feedback for moving partners'
  },
  {
    icon: TruckIcon,
    label: 'Moving Partners',
    query: 'List the moving partners with their average feedback ratings'
  }
];

export function NaturalLanguageQuery() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isSqlExpanded, setIsSqlExpanded] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/query-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute query');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="relative rounded-2xl shadow-sm max-w-3xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Submit data request here"
            aria-label="Natural language database query"
            className="block w-full rounded-2xl border-0 py-4 pl-4 pr-12 text-text-primary ring-1 ring-inset ring-border placeholder:text-text-tertiary focus:ring-2 focus:ring-inset focus:ring-border-focus sm:text-sm sm:leading-6 bg-surface-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !query.trim()}
              aria-label={loading ? 'Processing query' : 'Submit query'}
              className={`p-2 rounded-full text-text-inverse bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${loading ? 'animate-pulse' : ''}`}
            >
              {loading ? (
                <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Example Queries */}
      <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
        {exampleQueries.map((eq, index) => (
          <button
            key={index}
            onClick={() => handleExampleClick(eq.query)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-tertiary hover:bg-surface-secondary text-sm text-text-primary transition-colors"
          >
            <eq.icon className="h-5 w-5" />
            <span>{eq.label}</span>
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-status-bg-error p-4 max-w-3xl mx-auto">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-status-error">Error</h3>
              <div className="mt-2 text-sm text-status-error">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          {/* SQL Query Display */}
          <div className="rounded-md bg-surface-tertiary p-4">
            <button
              onClick={() => setIsSqlExpanded(!isSqlExpanded)}
              className="flex items-center justify-between w-full"
              aria-expanded={isSqlExpanded}
              aria-label="Toggle SQL query view"
            >
              <h3 className="text-sm font-medium text-text-primary">Generated SQL</h3>
              <ChevronDownIcon 
                className={`h-5 w-5 text-text-secondary transition-transform ${isSqlExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {isSqlExpanded && (
              <pre className="mt-2 text-sm text-text-secondary overflow-x-auto">
                {result.sql}
              </pre>
            )}
          </div>

          {/* Results Table */}
          {result.results.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-tertiary">
                  <tr>
                    {Object.keys(result.results[0]).map((key) => (
                      <th
                        key={key}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-text-primary sm:pl-6"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface-primary">
                  {result.results.map((row, index) => (
                    <tr key={index} className="hover:bg-surface-tertiary transition-colors">
                      {Object.values(row).map((value, i) => (
                        <td
                          key={i}
                          className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-text-primary sm:pl-6"
                        >
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md bg-status-bg-warning p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-status-warning">No Results</h3>
                  <div className="mt-2 text-sm text-status-warning">
                    The query returned no results.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

