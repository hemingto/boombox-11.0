/**
 * @fileoverview Appointment tracking utilities for customer-facing tracking interface
 * @source boombox-10.0/src/app/api/tracking/verify/route.ts (complex business logic extraction)
 * @refactor Extracted tracking business logic into reusable utilities
 */

import { format, formatDuration } from 'date-fns';

// Types and interfaces
export interface DecodedTrackingToken {
  appointmentId: number;
  taskId: string;
  webhookTime?: string;
  triggerName?: string;
  eta?: string;
  exp: number;
}

export interface StepStatus {
  status: 'pending' | 'in_transit' | 'complete';
  timestamp: string;
  action?: {
    label: string;
    trackingUrl?: string;
    url?: string;
    type?: 'timer';
    startTime?: string;
    endTime?: string;
    timerData?: {
      type: 'timer';
      startTime: string;
      endTime?: string;
    };
    iconName?: string;
  };
}

export interface TrackingTaskIds {
  pickup: string[];
  customer: string[];
  dropoff: string[];
  admin: string[];
}

/**
 * Get ordinal text for unit numbers (second, third, fourth)
 * @source boombox-10.0/src/app/api/tracking/verify/route.ts (getOrdinalNumber)
 */
export function getOrdinalNumber(index: number): string {
  const ordinals = ['second', 'third', 'fourth'];
  return ordinals[index - 1];
}

/**
 * Determine step statuses for a delivery unit based on task states and triggers
 * @source boombox-10.0/src/app/api/tracking/verify/route.ts (determineStepStatuses function)
 */
export function determineStepStatuses(
  pickupTask: any,
  customerTask: any,
  dropoffTask: any,
  adminTask: any,
  decodedToken: DecodedTrackingToken,
  decodedLatest: DecodedTrackingToken,
  taskIds: TrackingTaskIds,
  unitNumber: number,
  unitTasks: any[],
  appointment: any
): StepStatus[] {
  console.log('Status check values:', {
    customerTaskState: customerTask?.state,
    decodedTrigger: decodedToken.triggerName,
    latestTrigger: decodedLatest.triggerName,
    serviceStartTime: appointment.serviceStartTime
  });

  return [
    { // Pickup step
      status: pickupTask?.state === 2 ? 'in_transit' : 
              pickupTask?.state === 3 ? 'complete' : 'pending',
      timestamp: unitTasks.find(t => 
        t.stepNumber === 1 && 
        t.unitNumber === unitNumber && 
        t.webhookTime
      )?.webhookTime ? 
      format(new Date(parseInt(unitTasks.find(t => 
        t.stepNumber === 1 &&
        t.unitNumber === unitNumber
      )!.webhookTime!)), 'h:mma').toLowerCase() : ''
    },
    { //Movers on their way
      status: decodedToken.triggerName === 'taskArrival' || decodedLatest.triggerName === 'taskArrival' ? 'complete' :
              customerTask?.state === 2 ? 'in_transit' :
              customerTask?.state === 3 ? 'complete' : 'pending',
      timestamp: unitTasks.find(t => 
        t.stepNumber === 2 && 
        t.unitNumber === unitNumber && 
        t.webhookTime
      )?.webhookTime ? 
      format(new Date(parseInt(unitTasks.find(t => 
        t.stepNumber === 2 &&
        t.unitNumber === unitNumber
      )!.webhookTime!)), 'h:mma').toLowerCase() : ''
    },
    { // Movers arrived and service time started
      status: customerTask?.state === 3 ? 'complete' :
              decodedToken.triggerName === 'taskArrival' || decodedLatest.triggerName === 'taskArrival' ? 'in_transit' : 'pending',
      timestamp: (() => {
        let finalTimestamp = '';
        // Only set the timestamp for unit number 1
        if (unitNumber === 1 && appointment.serviceStartTime) {
          finalTimestamp = format(new Date(parseInt(appointment.serviceStartTime)), 'h:mma').toLowerCase();
        }
        return finalTimestamp;
      })(),
      action: (() => {
        console.log('Decoded Token Data:', {
          decodedLatest: {
            triggerName: decodedLatest.triggerName,
            webhookTime: decodedLatest.webhookTime,
            appointmentId: decodedLatest.appointmentId,
            taskId: decodedLatest.taskId
          },
          serviceStartTime: appointment.serviceStartTime,
          customerTaskState: customerTask?.state
        });

        const timerData = appointment.serviceStartTime ? {
          type: 'timer' as const,
          startTime: appointment.serviceStartTime,
          endTime: appointment.serviceEndTime
        } : undefined;

        return {
          label: customerTask?.state === 3 ? formatDuration({
            seconds: Math.floor((new Date(appointment.serviceEndTime!).getTime() - 
                      new Date(appointment.serviceStartTime!).getTime()) / 1000)
          }) : '00:00',
          timerData,
          iconName: 'ClockIcon'
        };
      })(),
    },
    { // Completion
      status: dropoffTask?.state === 3 ? 'complete' :
              customerTask?.state === 3 ? 'in_transit' : 'pending',
      timestamp: customerTask?.state === 3 && customerTask?.completionDetails?.time ? 
                format(new Date(customerTask.completionDetails.time), 'h:mma').toLowerCase() : ''
    },
    { // Dropoff
      status: dropoffTask?.state === 3 ? 'complete' :
              dropoffTask?.state === 2 ? 'in_transit' : 'pending',
      timestamp: dropoffTask?.completionDetails?.time ? 
                 format(new Date(dropoffTask.completionDetails.time), 'h:mma').toLowerCase() : ''
    }
  ];
}

/**
 * Generate step titles based on appointment type and unit index
 * @source boombox-10.0/src/app/api/tracking/verify/route.ts (getStepTitle function)
 */
export function getStepTitle(
  stepIndex: number, 
  unitIndex: number, 
  appointment: any, 
  partnerName: string
): string {
  const appointmentType = appointment.appointmentType;
  const isFirstUnit = unitIndex === 0;
  const ordinalText = isFirstUnit ? '' : getOrdinalNumber(unitIndex);
  
  switch (stepIndex) {
    case 0: // Pickup step
      if (appointmentType === 'End Storage Term') {
        return `${isFirstUnit ? partnerName : 'Boombox Driver'} is picking up your Boombox`;
      } else if (appointmentType === 'Storage Unit Access') {
        return `${isFirstUnit ? partnerName : 'Boombox Driver'} is picking up your Boombox`;
      } else if (appointmentType === 'Initial Pickup' || appointmentType === 'Additional Storage') {
        return `${isFirstUnit ? partnerName : 'Boombox Driver'} is picking up your Boombox`;
      } else {
        return `${isFirstUnit ? partnerName : 'Boombox Driver'} is picking up your Boombox`;
      }
    
    case 1: // On their way
      return `${isFirstUnit ? partnerName : 'Boombox Driver'} is on their way!`;
    
    case 2: // Arrived
      if (appointmentType === 'End Storage Term') {
        return isFirstUnit 
          ? `${partnerName} has arrived and is ready to begin unloading your Boombox`
          : `Boombox Driver has arrived to unload your ${ordinalText} Boombox`;
      } else if (appointmentType === 'Storage Unit Access') {
        return isFirstUnit 
          ? `${partnerName} has arrived and will begin your storage access appointment`
          : `Boombox Driver has arrived for your ${ordinalText} Boombox access`;
      } else if (appointmentType === 'Initial Pickup') {
        return isFirstUnit 
          ? `${partnerName} has arrived and their service time has started`
          : `Boombox Driver has arrived with your ${ordinalText} Boombox`;
      } else if (appointmentType === 'Additional Storage') {
        return isFirstUnit 
          ? `${partnerName} has arrived and will begin loading your additional Boombox`
          : `Boombox Driver has arrived with your ${ordinalText} additional Boombox`;
      } else {
        return isFirstUnit 
          ? `${partnerName} has arrived and their service time has started`
          : `Boombox Driver has arrived with your ${ordinalText} Boombox`;
      }
    
    case 3: // Completion
      if (appointmentType === 'End Storage Term') {
        return isFirstUnit 
          ? `${partnerName} has finished unloading your Boombox`
          : `Your ${ordinalText} Boombox has finished being unloaded`;
      } else if (appointmentType === 'Storage Unit Access') {
        return isFirstUnit 
          ? `${partnerName} has finished with your storage access appointment`
          : `Your ${ordinalText} Boombox storage access is complete`;
      } else if (appointmentType === 'Initial Pickup') {
        return isFirstUnit 
          ? `${partnerName} has finished loading your Boombox`
          : `Your ${ordinalText} Boombox has finished being loaded`;
      } else if (appointmentType === 'Additional Storage') {
        return isFirstUnit 
          ? `${partnerName} has finished loading your additional Boombox`
          : `Your ${ordinalText} additional Boombox has finished being loaded`;
      } else {
        return isFirstUnit 
          ? `${partnerName} has finished loading your Boombox`
          : `Your ${ordinalText} Boombox has finished being loaded`;
      }
    
    case 4: // Dropoff
      if (appointmentType === 'End Storage Term') {
        if (isFirstUnit) {
          return `Thanks for using Boombox! Your storage term has ended`;
        }
      } else if (appointmentType === 'Storage Unit Access') {
        return `${isFirstUnit ? partnerName : 'Boombox Driver'} has returned your Boombox to our storage facility`;
      } else if (appointmentType === 'Initial Pickup') {
        return `${isFirstUnit ? partnerName : 'Boombox Driver'} has dropped off your Boombox at our storage facility`;
      } else if (appointmentType === 'Additional Storage') {
        return `${isFirstUnit ? partnerName : 'Boombox Driver'} has dropped off your additional Boombox at our storage facility`;
      } else {
        return `${isFirstUnit ? partnerName : 'Boombox Driver'} has dropped off your Boombox at our storage facility`;
      }
    
    default:
      return '';
  }
}