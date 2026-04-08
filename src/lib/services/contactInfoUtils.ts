/**
 * @fileoverview Utility functions and types for contact information service
 * @note These utilities are in a separate file from the service to avoid
 * Next.js Server Actions restrictions (non-async exports in 'use server' files)
 */

/**
 * Contact information interface
 */
export interface ContactInfo {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phoneNumber: string | null;
  verifiedPhoneNumber: boolean | null;
  userId: string;
  userType: 'driver' | 'mover' | 'hauler';
  services?: string[];
  description?: string;
  hourlyRate?: number;
  website?: string;
  usdotNumber?: string;
  californiaMcpNumber?: string;
  pricePerBoombox?: number;
}

/**
 * Moving partner status interface
 */
export interface MovingPartnerStatus {
  isLinkedToMovingPartner: boolean;
  movingPartner: {
    id: number;
    name: string;
  } | null;
  isLinkedToHaulingPartner: boolean;
  haulingPartner: {
    id: number;
    name: string;
  } | null;
}

/**
 * Build activation message based on missing requirements
 */
export function buildActivationMessage(
  contactInfo: ContactInfo | null,
  userType: 'driver' | 'mover' | 'hauler'
): string {
  if (userType === 'driver') {
    return 'To activate your driver account please make sure to verify your phone number';
  }

  if (userType === 'hauler') {
    const requirements: string[] = [];
    if (!contactInfo?.verifiedPhoneNumber) {
      requirements.push('verify your phone number');
    }
    if (!contactInfo?.usdotNumber) {
      requirements.push('add your USDOT number');
    }
    if (!contactInfo?.californiaMcpNumber) {
      requirements.push('add your California MCP number');
    }
    if (requirements.length === 0) return '';
    if (requirements.length === 1) {
      return `To activate your hauler account please make sure to ${requirements[0]}`;
    }
    const lastRequirement = requirements.pop();
    return `To activate your hauler account please make sure to ${requirements.join(', ')} and ${lastRequirement}`;
  }

  const requirements = ['verify your phone number'];

  if (!contactInfo?.description) {
    requirements.push('add a company description');
  }
  if (!contactInfo?.hourlyRate) {
    requirements.push('add an hourly rate');
  }

  if (requirements.length === 1) {
    return `To activate your mover account please make sure to ${requirements[0]}`;
  }

  const lastRequirement = requirements.pop();
  return `To activate your mover account please make sure to ${requirements.join(', ')} and ${lastRequirement}`;
}
