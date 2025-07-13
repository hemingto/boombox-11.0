/**
 * @fileoverview Onfleet API integration types
 * @source boombox-10.0/src/types/onfleet.d.ts
 * @source boombox-10.0/src/app/types/types.ts (OnfleetTaskCreationParams)
 * @refactor Enhanced with additional Onfleet API types and better organization
 */

// ===== ONFLEET API TYPES =====

export interface OnfleetWorker {
  id: string;
  name: string;
  phone: string;
  teams: string[];
  vehicle: {
    type: string;
    description: string;
    licensePlate?: string;
    color?: string;
  };
  capacity?: number;
  displayName?: string;
}

export interface OnfleetTask {
  id: string;
  shortId: string;
  trackingURL: string;
  worker?: string;
  merchant: {
    id: string;
    name: string;
  };
  executor: {
    id: string;
    name: string;
  };
  destination: {
    id: string;
    location: [number, number]; // [longitude, latitude]
    address: {
      apartment?: string;
      state: string;
      postalCode: string;
      number: string;
      street: string;
      city: string;
      country: string;
    };
  };
  recipients: Array<{
    id: string;
    name: string;
    phone: string;
    notes?: string;
  }>;
  state: OnfleetTaskState;
  completeAfter: number;
  completeBefore: number;
  pickupTask: boolean;
  autoAssign: {
    mode: 'distance' | 'load' | 'team';
    team?: string;
    maxAssignTime?: number;
  };
  metadata: Array<{
    name: string;
    type: 'boolean' | 'number' | 'string' | 'object' | 'array';
    value: unknown;
    visibility: 'api' | 'dashboard' | 'worker';
  }>;
  notes?: string;
  trackingViewed: boolean;
  estimatedCompletionTime?: number;
  estimatedArrivalTime?: number;
}

export type OnfleetTaskState =
  | 0 // Unassigned
  | 1 // Assigned
  | 2 // Active
  | 3 // Completed
  | 4; // Failed

export interface OnfleetTeam {
  id: string;
  name: string;
  workers: string[];
  managers: string[];
  hub: string;
  enableSelfAssignment: boolean;
}

export interface OnfleetWebhookEvent {
  taskId: string;
  adminId?: string;
  data: {
    task: OnfleetTask;
    worker?: OnfleetWorker;
  };
  actionContext?: {
    type: string;
    id: string;
  };
  triggerId: number;
  triggerName: string;
  workerId?: string;
  time: number;
}

// ===== WEBHOOK EVENT TYPES =====

export type OnfleetWebhookTrigger =
  | 0 // Task Started
  | 1 // Task ETA
  | 2 // Task Arrival
  | 3 // Task Completed
  | 4 // Task Failed
  | 5 // Worker Duty
  | 6 // Task Created
  | 7 // Task Updated
  | 8 // Task Deleted
  | 9 // Task Assigned
  | 10 // Task Unassigned
  | 11 // Recipient Response SMS
  | 12 // Recipient Response App
  | 13 // Task Comment
  | 14 // Task ETA Delayed
  | 15 // Task ETA Arrived
  | 16 // Auto Dispatch Started
  | 17 // Auto Dispatch Completed
  | 18 // Auto Dispatch Failed
  | 19; // Batch Job Completed

// ===== BOOMBOX-SPECIFIC ONFLEET TYPES =====

export interface OnfleetTaskCreationParams {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  zipCode: string;
  appointmentDateTime: string;
  planType: string;
  selectedInsurance: string;
  storageUnitCount: number;
  appointmentId: string;
}

export interface OnfleetTaskMetadata {
  orderId?: string;
  orderType?: 'storage' | 'packing-supply' | 'access' | 'return';
  customerId?: string;
  appointmentId?: string;
  storageUnitNumbers?: string[];
  specialInstructions?: string;
  customerNotes?: string;
  internalNotes?: string;
}

export interface OnfleetDeliveryWindow {
  start: number; // Unix timestamp
  end: number; // Unix timestamp
}

export interface OnfleetLocation {
  longitude: number;
  latitude: number;
  address: {
    apartment?: string;
    state: string;
    postalCode: string;
    number: string;
    street: string;
    city: string;
    country: string;
  };
}

// ===== API REQUEST/RESPONSE TYPES =====

export interface CreateOnfleetTaskRequest {
  destination: OnfleetLocation;
  recipients: Array<{
    name: string;
    phone: string;
    notes?: string;
  }>;
  completeAfter?: number;
  completeBefore?: number;
  pickupTask?: boolean;
  autoAssign?: {
    mode: 'distance' | 'load' | 'team';
    team?: string;
    maxAssignTime?: number;
  };
  metadata?: OnfleetTaskMetadata[];
  notes?: string;
}

export interface CreateOnfleetWorkerRequest {
  name: string;
  phone: string;
  teams: string[];
  vehicle?: {
    type: 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'BICYCLE';
    description: string;
    licensePlate?: string;
    color?: string;
  };
  capacity?: number;
  displayName?: string;
}

export interface OnfleetApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

// ===== ENHANCED ONFLEET TYPES FOR BOOMBOX =====

export interface OnfleetTaskWithBoomboxData extends OnfleetTask {
  boomboxMetadata: {
    appointmentId: number;
    customerId: number;
    orderType: 'storage' | 'packing-supply' | 'access' | 'return';
    storageUnitNumbers?: string[];
    estimatedDuration?: number; // minutes
    customerNotes?: string;
    internalNotes?: string;
  };
}

export interface OnfleetRouteOptimization {
  routes: Array<{
    workerId: string;
    tasks: string[];
    estimatedDuration: number; // seconds
    estimatedDistance: number; // meters
    optimizationScore: number;
  }>;
  unassignedTasks: string[];
  totalOptimizationTime: number;
}

// ===== ONFLEET ERROR TYPES =====

export interface OnfleetError {
  message: {
    error: number;
    message: string;
    cause: string;
    request: string;
  };
}

export type OnfleetErrorCode =
  | 1000 // Invalid API key
  | 1001 // Invalid request
  | 1002 // Invalid parameters
  | 1003 // Throttled
  | 1004 // Missing required parameter
  | 1005 // Invalid parameter value
  | 1100 // Resource not found
  | 1101 // Resource already exists
  | 1102 // Resource conflict
  | 2000 // Internal server error
  | 2001; // Service unavailable

// ===== TYPE GUARDS =====

export function isOnfleetTask(obj: unknown): obj is OnfleetTask {
  return (
    obj !== null && typeof obj === 'object' && 'id' in obj && 'shortId' in obj
  );
}

export function isOnfleetWorker(obj: unknown): obj is OnfleetWorker {
  return (
    obj !== null && typeof obj === 'object' && 'id' in obj && 'name' in obj
  );
}

export function isOnfleetWebhookEvent(
  obj: unknown
): obj is OnfleetWebhookEvent {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'taskId' in obj &&
    'triggerId' in obj
  );
}
