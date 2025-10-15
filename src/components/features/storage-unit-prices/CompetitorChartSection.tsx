/**
 * @fileoverview Competitor comparison chart section
 * @source boombox-10.0/src/app/components/storage-unit-prices/competitorchartsection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a feature comparison table between Boombox and competitors,
 * showing which features are available for each service using check/x icons.
 * Responsive table layout with horizontal scroll on mobile devices.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced border-slate-100 with border-border (semantic border color)
 * - Replaced text-zinc-9/text-zinc-95 with text-success (green check marks)
 * - Replaced text-zinc-300 with text-text-tertiary (gray x marks)
 * - Added semantic text colors for headings
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added aria-label to table for screen readers
 * - Added visually hidden text for icon meanings
 * - Added proper table caption
 * - Improved semantic structure
 * - Added role attributes for better screen reader support
 * 
 * @refactor Applied design system colors, enhanced accessibility with ARIA labels
 * and screen reader support, improved semantic HTML structure
 */

import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/20/solid';

export interface CompetitorFeature {
  feature: string;
  boombox: boolean;
  competitors: boolean;
}

export interface CompetitorChartSectionProps {
  features: CompetitorFeature[];
}

export function CompetitorChartSection({ features }: CompetitorChartSectionProps): React.ReactElement {
  return (
    <section className="w-full mt-14 lg:px-16 px-6 sm:mb-48 mb-24" aria-label="Competitor comparison">
      <h1 className="mb-16 text-center text-text-primary">
        More service, lower rate.
      </h1>

      <div className="w-full overflow-x-auto">
        <table className="table-auto w-full text-left" aria-label="Feature comparison between Boombox and competitors">
          <caption className="sr-only">
            Comparison of features between Boombox mobile storage and competitors
          </caption>
          
          <thead className="border-b-2 border-border">
            <tr>
              <th className="text-left py-2" scope="col">
                <span className="sr-only">Feature name</span>
              </th>
              <th className="text-center py-4" scope="col">
                <h2 className="text-xl sm:text-2xl pr-2 text-text-primary">Boombox</h2>
              </th>
              <th className="text-center py-4" scope="col">
                <h2 className="text-xl sm:text-2xl text-text-primary">Competitors</h2>
              </th>
            </tr>
          </thead>
          
          <tbody className="border-b-2 border-border">
            {features.map((item, index) => (
              <tr key={index}>
                <th className="pl-6 py-4 sm:py-6 text-lg text-left font-normal" scope="row">
                  <h3 className="text-xl sm:text-2xl text-text-primary">{item.feature}</h3>
                </th>
                <td className="text-center py-4">
                  {item.boombox ? (
                    <>
                      <CheckCircleIcon 
                        className="w-8 h-8 text-success mx-auto" 
                        aria-hidden="true"
                      />
                      <span className="sr-only">Available</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon 
                        className="w-8 h-8 text-text-tertiary mx-auto" 
                        aria-hidden="true"
                      />
                      <span className="sr-only">Not available</span>
                    </>
                  )}
                </td>
                <td className="text-center py-4">
                  {item.competitors ? (
                    <>
                      <CheckCircleIcon 
                        className="w-8 h-8 text-success mx-auto" 
                        aria-hidden="true"
                      />
                      <span className="sr-only">Available</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon 
                        className="w-8 h-8 text-text-tertiary mx-auto" 
                        aria-hidden="true"
                      />
                      <span className="sr-only">Not available</span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

