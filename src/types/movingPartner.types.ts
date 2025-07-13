/**
 * @fileoverview Moving Partner domain types
 * @source boombox-11.0/prisma/schema.prisma (MovingPartner model)
 * @refactor Moving partner management types
 */

// Placeholder for moving partner types - to be implemented in future phases
export interface MovingPartner {
  id: number;
  name: string;
  email?: string;
  phoneNumber?: string;
}

export type MovingPartnerStatus = 'active' | 'inactive';
