/**
 * @fileoverview Enhanced Prisma database types
 * @source boombox-11.0/prisma/schema.prisma
 * @refactor Enhanced Prisma types with input/output variants
 */

// Prisma generated types (will be available after prisma generate)
// export type {
//   User,
//   Appointment,
//   StorageUnit,
//   StorageUnitUsage,
//   PackingSupplyOrder,
//   Driver,
//   MovingPartner,
//   Notification,
//   Admin,
//   Prisma
// } from '@prisma/client'

// Temporary placeholder types until Prisma is generated
export interface PrismaUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface PrismaAppointment {
  id: number;
  appointmentType: string;
  address: string;
  date: Date;
  time: Date;
  status: string;
}

// ===== INPUT/OUTPUT VARIANTS =====

// User variants
export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  verifiedPhoneNumber?: boolean;
  stripeCustomerId?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  verifiedPhoneNumber?: boolean;
}

// Appointment variants
export interface CreateAppointmentInput {
  userId: number;
  appointmentType: string;
  address: string;
  zipcode: string;
  date: Date;
  time: Date;
  quotedPrice: number;
  status: string;
}

// Storage Unit variants
export interface CreateStorageUnitInput {
  storageUnitNumber: string;
  status: string;
  barcode?: string;
}

// ===== ENHANCED RELATIONSHIP TYPES =====

export interface UserWithAppointments {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  appointments: PrismaAppointment[];
}

export interface AppointmentWithUser {
  id: number;
  appointmentType: string;
  address: string;
  date: Date;
  time: Date;
  status: string;
  user: PrismaUser;
}

// ===== DATABASE OPERATION TYPES =====

export interface DatabaseTransaction {
  id: string;
  operations: string[];
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface QueryOptions {
  include?: Record<string, boolean>;
  select?: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;
  where?: Record<string, unknown>;
}
