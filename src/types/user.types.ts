/**
 * @fileoverview User domain types
 * @source boombox-11.0/prisma/schema.prisma (User model)
 * @refactor Enhanced user types with role-based interfaces
 */

// ===== CORE USER TYPES =====

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  verifiedPhoneNumber: boolean;
  stripeCustomerId?: string | null;
}

export type UserRole =
  | 'customer'
  | 'driver'
  | 'mover'
  | 'admin'
  | 'super_admin';

export interface UserWithRole extends User {
  role: UserRole;
}

// ===== USER CREATION TYPES =====

export interface CreateUserRequest {
  email: string;
  phone: string;
  address: string;
  password: string;
  agreedToTerms: boolean;
  role?: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

// ===== USER RESPONSE TYPES =====

export interface UserResponse extends Omit<User, 'stripeCustomerId'> {
  fullName: string;
  initials: string;
  memberSince: Date;
}

export interface UserProfile extends UserResponse {
  preferences: UserPreferences;
  statistics: UserStatistics;
}

// ===== USER PREFERENCES =====

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  communication: {
    preferredMethod: 'email' | 'phone' | 'text';
    language: string;
    timezone: string;
  };
  privacy: {
    shareDataForImprovement: boolean;
    marketingEmails: boolean;
  };
}

// ===== USER STATISTICS =====

export interface UserStatistics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalSpent: number;
  averageRating?: number;
  memberSince: Date;
  lastActivity: Date;
}

// ===== TYPE GUARDS =====

export function isValidUserRole(role: string): role is UserRole {
  const validRoles: UserRole[] = [
    'customer',
    'driver',
    'mover',
    'admin',
    'super_admin',
  ];
  return validRoles.includes(role as UserRole);
}
