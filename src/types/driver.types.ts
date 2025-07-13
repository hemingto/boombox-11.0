/**
 * @fileoverview Driver domain types
 * @source boombox-11.0/prisma/schema.prisma (Driver model)
 * @refactor Driver management and availability types
 */

// Placeholder for driver types - to be implemented in future phases
export interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export type DriverStatus = 'active' | 'inactive' | 'suspended';
