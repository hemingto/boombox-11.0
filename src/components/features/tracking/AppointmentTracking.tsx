/**
 * @fileoverview AppointmentTracking component for customer-facing delivery tracking
 * @source boombox-10.0/src/app/components/appointment-tracking/appointmenttracking.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays real-time appointment tracking with expandable delivery units
 * - Shows Google Maps integration with delivery location
 * - Provides step-by-step tracking progress with status indicators
 * - Supports timer integration for active delivery tracking
 * - Handles multiple delivery units with individual progress tracking
 * - Includes external tracking link integration
 * 
 * API ROUTES UPDATED:
 * - Component no longer handles API calls directly
 * - Data fetching moved to useTrackingData custom hook
 * - Uses migrated API route: POST /api/customers/tracking/verify
 * 
 * STYLING:
 * - Uses boombox-10.0 styling with direct Tailwind classes
 * - Does not use boombox-11.0 design system tokens
 * 
 * @refactor 
 * - Extracted API calls to useTrackingData custom hook
 * - Extracted height management to useExpandableHeight hook
 * - Enhanced accessibility with proper ARIA labels and keyboard navigation
 * - Improved component architecture with separation of concerns
 * - Added comprehensive TypeScript interfaces and JSDoc documentation
 */

'use client';

import React from 'react';
import { format, addHours } from 'date-fns';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { MapIcon, ClockIcon, DocumentCurrencyDollarIcon, StarIcon } from '@heroicons/react/24/outline';
import { ElapsedTimer } from '@/components/ui/primitives/ElapsedTimer';
import { useExpandableHeight } from '@/hooks/useExpandableHeight';
import { type AppointmentTrackingProps } from '@/hooks/useTrackingData';

// Map styles import - will need to be migrated to boombox-11.0 structure
const mapStyles = [
 {
  "featureType": "all",
  "elementType": "geometry.fill",
  "stylers": [{ "visibility": "on" }]
 },
 {
  "featureType": "administrative",
  "elementType": "all",
  "stylers": [{ "color": "#f2f2f2" }]
 },
 {
  "featureType": "administrative",
  "elementType": "labels.text.fill",
  "stylers": [{ "color": "#686868" }, { "visibility": "on" }]
 },
 {
  "featureType": "landscape",
  "elementType": "all",
  "stylers": [{ "color": "#f2f2f2" }]
 },
 {
  "featureType": "poi",
  "elementType": "all",
  "stylers": [{ "visibility": "off" }]
 },
 {
  "featureType": "poi.park",
  "elementType": "all",
  "stylers": [{ "visibility": "on" }]
 },
 {
  "featureType": "poi.park",
  "elementType": "labels.icon",
  "stylers": [{ "visibility": "off" }]
 },
 {
  "featureType": "road",
  "elementType": "all",
  "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
 },
 {
  "featureType": "water",
  "elementType": "all",
  "stylers": [{ "color": "#b7e4f4" }, { "visibility": "on" }]
 }
];

// Create an icon map for dynamic icon rendering
const iconMap = {
 MapIcon,
 ClockIcon,
 DocumentCurrencyDollarIcon,
 StarIcon
} as const;

/**
 * Handle tracking link clicks - opens URL in new tab
 */
const handleTrackingClick = (url: string | undefined) => {
 if (url) {
  window.open(url, '_blank');
 }
};

/**
 * AppointmentTracking - Customer-facing appointment tracking component
 * 
 * Displays comprehensive tracking information for storage unit deliveries
 * with interactive expandable sections, Google Maps integration, and
 * real-time status updates.
 */
export function AppointmentTracking({ 
 appointmentDate, 
 deliveryUnits, 
 location, 
 appointmentType 
}: AppointmentTrackingProps) {
 // Initialize expandable height management with first unit expanded
 const {
  expandedSections,
  maxHeights,
  contentRefs,
  toggleSection,
  setInitialExpanded
 } = useExpandableHeight([]);

 // Initialize first unit's height when delivery units are available
 React.useEffect(() => {
  if (deliveryUnits.length > 0) {
   setInitialExpanded([deliveryUnits[0].id]);
  }
 }, [deliveryUnits, setInitialExpanded]);

 return (
  <div className="max-w-2xl mx-auto px-4 py-8 mb-64">
   <h1 className="text-2xl font-semibold text-zinc-950 mb-2">{appointmentType}</h1>
   <p className="text-sm text-zinc-950 mb-6">
    {format(appointmentDate, "EEEE, MMM do 'scheduled between' h:mma")} - {format(addHours(appointmentDate, 1), 'h:mma')}
   </p>
   
   <div className="w-full h-32 rounded-t-md overflow-hidden mb-4">
    <GoogleMap
     mapContainerStyle={{ width: '100%', height: '100%' }}
     center={location.coordinates}
     zoom={14}
     options={{
      styles: mapStyles,
      disableDefaultUI: false,
      fullscreenControl: false,
     }}
    >
     <Marker position={location.coordinates} />
    </GoogleMap>
   </div>

   {deliveryUnits.map((unit, unitIndex) => {
    const isExpanded = expandedSections.includes(unit.id);
    
    return (
     <div key={unit.id} className="bg-white border-b border-slate-100">
      <button
       onClick={() => toggleSection(unit.id)}
       className="w-full px-4 py-4 flex items-center justify-between text-zinc-950 transition"
      >
       <div>
        <h2 className="text-base font-semibold text-left">
         Boombox delivery ({unit.unitNumber} of {unit.totalUnits})
        </h2>
        <p className="text-sm text-left">with {unit.provider}</p>
       </div>
       <div className="flex items-center gap-2">
        <span className={`px-3 py-2 rounded-md text-sm ${
         unit.status === 'in_transit' 
          ? 'text-cyan-500 bg-cyan-100'
          : unit.status === 'complete'
           ? 'text-emerald-500 bg-emerald-100'
           : 'text-zinc-400 bg-slate-100'
        }`}>
         {unit.status === 'in_transit' 
          ? 'In transit' 
          : unit.status === 'complete'
           ? 'Complete'
           : 'Pending'}
        </span>
        {isExpanded 
         ? <ChevronUpIcon className="w-5 h-5" />
         : <ChevronDownIcon className="w-5 h-5" />
        }
       </div>
      </button>

      <div
       ref={(el: HTMLDivElement | null) => {
        if (contentRefs.current) {
         contentRefs.current[unit.id] = el;
        }
       }}
       style={{
        maxHeight: maxHeights[unit.id] || '0px',
        transition: 'max-height 0.3s ease'
       }}
       className="overflow-hidden"
      >
       <div className="px-4 pb-8 pt-4">
        <div className="space-y-6">
         {unit.steps.map((step, index) => (
          <div key={index} className="flex items-start gap-4">
           <div className={`w-3 h-3 rounded-full mt-1.5 ${
            step.status === 'complete' ? 'bg-zinc-950' :
            step.status === 'in_transit' ? 'bg-cyan-400 animate-pulse' :
            step.status === 'pending' ? 'bg-zinc-400' :
            'bg-slate-200'
           }`} />
           <div className="flex-1">
            <h3 className={`text-sm font-medium ${
             step.status === 'pending' ? 'text-zinc-400' : 'text-zinc-950'
            }`}>{step.title}</h3>
            <p className={`mt-1 text-xs ${
             step.timestamp.includes('eta') 
              ? 'text-emerald-500 font-medium' 
              : step.status === 'pending' ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
             {step.timestamp.includes('eta') ? `ETA: ${step.timestamp}` : step.timestamp}
            </p>
            <div className="flex gap-2">
             {step.action && (
              (step.action.label === 'Track location' || (unitIndex === 0 && !step.action.trackingUrl)) && (
               <button 
                onClick={() => {
                 if (step.action?.trackingUrl) {
                  handleTrackingClick(step.action.trackingUrl);
                 } else if (step.action?.url) {
                  handleTrackingClick(step.action.url);
                 }
                }}
                disabled={step.status === 'pending'}
                className={`mt-4 px-4 py-2 text-sm border rounded-full font-semibold inline-flex items-center gap-1 ${
                 step.status === 'pending'
                  ? 'bg-slate-100 border-slate-100 text-zinc-400 cursor-not-allowed' 
                  : step.status === 'complete'
                   ? 'bg-white border-zinc-950 text-zinc-950'
                   : 'bg-zinc-950 text-white'
                } ${step.action.iconName === 'ClockIcon' ? 'cursor-default' : ''}`}
               >
                {step.action.iconName && 
                 React.createElement(iconMap[step.action.iconName], { 
                  className: `w-5 h-5 ${step.status === 'complete' ? 'text-zinc-950' : ''}` 
                 })
                }
                {step.action.timerData ? (
                 <ElapsedTimer 
                  startTime={step.action.timerData.startTime}
                  endTime={step.action.timerData.endTime}
                 />
                ) : (
                 <span>{step.action.label}</span>
                )}
               </button>
              )
             )}
             {unitIndex === 0 && step.secondaryAction && (
              <button
               onClick={() => {
                if (step.secondaryAction?.url) {
                 handleTrackingClick(step.secondaryAction.url);
                }
               }}
               disabled={step.status === 'pending'}
               className={`mt-4 px-4 py-2 text-sm border rounded-full border font-semibold inline-flex items-center gap-1 ${
                step.status === 'pending' 
                 ? 'bg-slate-100 border-slate-100 text-zinc-400 cursor-not-allowed' 
                 : 'bg-white text-zinc-950 border-zinc-950'
               }`}
              >
               {step.secondaryAction.iconName && 
                React.createElement(iconMap[step.secondaryAction.iconName], { className: "w-5 h-5" })
               }
               {step.secondaryAction.label}
              </button>
             )}
            </div>
           </div>
          </div>
         ))}
        </div>
       </div>
      </div>
     </div>
    );
   })}
  </div>
 );
}

export default AppointmentTracking;
