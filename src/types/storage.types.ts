/**
 * @fileoverview Storage domain types
 * @source boombox-10.0/src/app/types/types.ts
 * @source boombox-11.0/prisma/schema.prisma (StorageUnit, StorageUnitUsage models)
 * @refactor Enhanced with additional storage management types
 */

// Forward declaration for types that will be defined in other files
interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  appointmentType: string;
}

// ===== CORE STORAGE TYPES =====

export interface StorageUnit {
  id: number;
  storageUnitNumber: string;
  mainImage: string | null;
  barcode?: string | null;
  status: StorageUnitStatus;
  lastUpdated: Date;
  cleaningPhotos?: string[];
  lastCleanedAt?: Date | null;
  warehouseLocation?: string;
  warehouseName?: string;
}

export interface StorageUnitUsage {
  id: number;
  usageStartDate: string;
  usageEndDate?: string | null;
  returnDate?: string | null;
  description?: string | null;
  mainImage?: string | null;
  storageUnit: StorageUnit;
  appointment?: Appointment;
  uploadedImages: string[];
  location: string | null;
  onfleetPhoto?: string | null;
  padlockCombo?: string;
  warehouseLocation?: string;
  warehouseName?: string;
}

export interface FormattedStorageUnit {
  id: string;
  imageSrc: string;
  title: string;
  pickUpDate: string;
  lastAccessedDate: string;
  description: string;
  location?: string | null;
  /** Pending access storage appointment for this unit, if any */
  pendingAppointment?: {
    id: number;
    date: string;
    status: string;
  } | null;
}

export interface RequestedStorageUnit {
  id: number;
  storageUnitNumber: string;
}

// ===== STORAGE STATUS TYPES =====

export type StorageUnitStatus =
  | 'Empty' // Available for new customers
  | 'Occupied' // Currently in use by customer
  | 'Pending Cleaning' // Needs cleaning before next use
  | 'Cleaning' // Currently being cleaned
  | 'Maintenance' // Under maintenance/repair
  | 'Damaged' // Damaged and needs repair
  | 'Reserved' // Reserved for specific customer
  | 'Transit'; // In transit to/from customer

export type AccessRequestStatus =
  | 'Pending' // Request submitted, awaiting scheduling
  | 'Scheduled' // Appointment scheduled
  | 'In Progress' // Access currently happening
  | 'Completed' // Access completed successfully
  | 'Cancelled' // Request cancelled
  | 'Failed'; // Access attempt failed

// ===== STORAGE ACCESS TYPES =====

export interface StorageAccessRequest {
  id: number;
  userId: number;
  storageUnitId: number;
  requestedDate: Date;
  appointmentId?: number;
  accessReason:
    | 'retrieve_items'
    | 'add_items'
    | 'inspect_items'
    | 'end_storage';
  status: AccessRequestStatus;
  notes?: string;
  estimatedDuration?: number; // minutes
  accessPhotos?: string[];
  completedAt?: Date;
}

export interface StorageAccessAppointment {
  id: number;
  accessRequestId: number;
  scheduledDate: Date;
  scheduledTime: string;
  driverId?: number;
  onfleetTaskId?: string;
  instructions?: string;
  customerNotes?: string;
  internalNotes?: string;
}

// ===== STORAGE CLEANING TYPES =====

export interface StorageUnitCleaning {
  id: number;
  storageUnitId: number;
  cleanedBy: string;
  cleaningDate: Date;
  cleaningType: 'standard' | 'deep' | 'sanitization' | 'damage_repair';
  beforePhotos: string[];
  afterPhotos: string[];
  notes?: string;
  timeSpent?: number; // minutes
  suppliesUsed?: string[];
  qualityScore?: number; // 1-10
}

export interface CleaningTask {
  id: number;
  storageUnitId: number;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: Date;
  estimatedDuration?: number; // minutes
  cleaningType: 'standard' | 'deep' | 'sanitization' | 'damage_repair';
  instructions?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

// ===== STORAGE DAMAGE TYPES =====

export interface StorageUnitDamageReport {
  id: number;
  storageUnitId: number;
  appointmentId?: number;
  reportedBy: 'customer' | 'driver' | 'admin' | 'cleaning_staff';
  reportDate: Date;
  damageType:
    | 'water'
    | 'structural'
    | 'pest'
    | 'theft'
    | 'vandalism'
    | 'wear'
    | 'other';
  severity: 'minor' | 'moderate' | 'major' | 'severe';
  description: string;
  damagePhotos: string[];
  estimatedRepairCost?: number;
  repairStatus: 'pending' | 'in_progress' | 'completed' | 'not_repairable';
  repairNotes?: string;
  insuranceClaim?: boolean;
}

// ===== STORAGE INVENTORY TYPES =====

export interface StorageInventoryItem {
  id: number;
  storageUnitUsageId: number;
  itemName: string;
  itemDescription?: string;
  quantity: number;
  estimatedValue?: number;
  category?: string;
  photos?: string[];
  addedDate: Date;
  removedDate?: Date;
  notes?: string;
}

export interface StorageInventorySnapshot {
  storageUnitUsageId: number;
  snapshotDate: Date;
  items: StorageInventoryItem[];
  totalItems: number;
  totalEstimatedValue: number;
  photos: string[];
  notes?: string;
}

// ===== WAREHOUSE MANAGEMENT TYPES =====

export interface WarehouseLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number;
  currentOccupancy: number;
  manager?: string;
  phoneNumber?: string;
  operatingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
}

export interface StorageUnitAllocation {
  storageUnitId: number;
  warehouseLocationId: string;
  section?: string;
  row?: string;
  position?: string;
  allocatedDate: Date;
  deallocatedDate?: Date;
  notes?: string;
}

// ===== STORAGE ANALYTICS TYPES =====

export interface StorageUtilizationMetrics {
  warehouseLocationId: string;
  date: string; // YYYY-MM-DD
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  utilizationRate: number; // percentage
  averageOccupancyDuration: number; // days
  newOccupancies: number;
  endedOccupancies: number;
  pendingCleaningUnits: number;
}

export interface StorageRevenueMetrics {
  period: string; // YYYY-MM or YYYY-MM-DD
  totalRevenue: number;
  monthlyStorageRevenue: number;
  accessFeeRevenue: number;
  insuranceRevenue: number;
  averageRevenuePerUnit: number;
  totalActiveUnits: number;
  churnRate: number; // percentage
}

// ===== API REQUEST/RESPONSE TYPES =====

export interface CreateStorageAccessRequest {
  storageUnitId: number;
  requestedDate: Date;
  accessReason:
    | 'retrieve_items'
    | 'add_items'
    | 'inspect_items'
    | 'end_storage';
  notes?: string;
  estimatedDuration?: number;
}

export interface UpdateStorageUnitRequest {
  status?: StorageUnitStatus;
  mainImage?: string;
  description?: string;
  warehouseLocation?: string;
  cleaningPhotos?: string[];
  notes?: string;
}

export interface StorageUnitSearchFilters {
  status?: StorageUnitStatus[];
  warehouseLocation?: string;
  customerId?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasActiveDamageReports?: boolean;
  needsCleaning?: boolean;
}

export interface StorageUnitSearchResult {
  units: StorageUnit[];
  totalCount: number;
  filters: StorageUnitSearchFilters;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ===== ENHANCED TYPES FOR RESPONSES =====

export interface StorageUnitWithDetails
  extends Omit<StorageUnit, 'warehouseLocation'> {
  currentUsage?: StorageUnitUsage;
  usageHistory: StorageUnitUsage[];
  cleaningHistory: StorageUnitCleaning[];
  damageReports: StorageUnitDamageReport[];
  warehouseLocation?: WarehouseLocation;
  warehouseLocationName?: string; // Original string field
  nextScheduledCleaning?: Date;
  lastAccessDate?: Date;
}

export interface StorageAccessRequestWithDetails extends StorageAccessRequest {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  storageUnit: StorageUnit;
  appointment?: StorageAccessAppointment;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

// ===== TYPE GUARDS =====

export function isValidStorageUnitStatus(
  status: string
): status is StorageUnitStatus {
  const validStatuses: StorageUnitStatus[] = [
    'Empty',
    'Occupied',
    'Pending Cleaning',
    'Cleaning',
    'Maintenance',
    'Damaged',
    'Reserved',
    'Transit',
  ];
  return validStatuses.includes(status as StorageUnitStatus);
}

export function isValidAccessRequestStatus(
  status: string
): status is AccessRequestStatus {
  const validStatuses: AccessRequestStatus[] = [
    'Pending',
    'Scheduled',
    'In Progress',
    'Completed',
    'Cancelled',
    'Failed',
  ];
  return validStatuses.includes(status as AccessRequestStatus);
}

export function isAccessReason(
  reason: string
): reason is 'retrieve_items' | 'add_items' | 'inspect_items' | 'end_storage' {
  return [
    'retrieve_items',
    'add_items',
    'inspect_items',
    'end_storage',
  ].includes(reason);
}

// ===== UTILITY TYPES =====

export interface StorageUnitCapacity {
  length: number; // feet
  width: number; // feet
  height: number; // feet
  volume: number; // cubic feet
  maxWeight: number; // pounds
}

export interface StorageUnitDimensions {
  external: StorageUnitCapacity;
  internal: StorageUnitCapacity;
  doorway: {
    width: number;
    height: number;
  };
}
