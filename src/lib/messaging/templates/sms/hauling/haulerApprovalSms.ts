import { MessageTemplate } from '@/lib/messaging/types';

export const haulerApprovalSms: MessageTemplate = {
  text: `Congratulations! Your Boombox hauling partner account for \${companyName} is now active. You can now start accepting haul jobs. Log in to your dashboard to get started!`,
  requiredVariables: ['companyName'],
  optionalVariables: [],
  channel: 'sms',
  domain: 'auth',
  description: 'SMS sent to hauling partners when their account is approved',
};
