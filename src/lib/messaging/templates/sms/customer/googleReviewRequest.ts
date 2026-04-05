import { MessageTemplate } from '@/lib/messaging/types';

export const googleReviewRequestSms: MessageTemplate = {
  text: `Hi \${firstName}! Thank you for choosing Boombox. We'd love to hear more about your experience! Would you mind leaving us a quick Google review? It really helps us out: https://g.page/r/CQ8HFuckURpmEBM/review`,
  requiredVariables: ['firstName'],
  channel: 'sms',
  domain: 'customer',
  description: 'Google review request SMS sent 1 day after 4+ star feedback',
};
