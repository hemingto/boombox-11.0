import { MessageTemplate } from '@/lib/messaging/types';

export const haulJobCompletedSms: MessageTemplate = {
  text: `Haul job \${jobCode} has been completed. \${unitCount} units delivered from \${originCity} to \${destinationCity}. Thank you!`,
  requiredVariables: ['jobCode', 'unitCount', 'originCity', 'destinationCity'],
  optionalVariables: [],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to hauling partners when a haul job is completed',
};
