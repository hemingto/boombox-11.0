import { MessageTemplate } from '@/lib/messaging/types';

export const haulerDriverInviteSms: MessageTemplate = {
  text: `You've been invited to join \${companyName} as a hauling driver on Boombox. Sign up here: \${signupUrl}`,
  requiredVariables: ['companyName', 'signupUrl'],
  optionalVariables: [],
  channel: 'sms',
  domain: 'auth',
  description: 'SMS sent to drivers invited to join a hauling partner',
};
