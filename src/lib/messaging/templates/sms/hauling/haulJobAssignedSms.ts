import { MessageTemplate } from '@/lib/messaging/types';

export const haulJobAssignedSms: MessageTemplate = {
  text: `New haul job assigned: \${jobCode}. Route: \${originCity} → \${destinationCity}. \${unitCount} units. Scheduled: \${scheduledDate}. Check your dashboard for details.`,
  requiredVariables: ['jobCode', 'originCity', 'destinationCity', 'unitCount'],
  optionalVariables: ['scheduledDate'],
  channel: 'sms',
  domain: 'booking',
  description:
    'SMS sent to hauling partners when a new haul job is assigned to them',
};
