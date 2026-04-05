import { MessageTemplate } from '@/lib/messaging/types';

export const googleReviewRequestEmail: MessageTemplate = {
  channel: 'email',
  domain: 'customer',
  subject: 'How was your Boombox experience?',
  text: `Hi \${firstName},

Thank you for choosing Boombox! We're glad you had a great experience with us.

If you have a moment, we'd really appreciate it if you could leave us a quick Google review. Your feedback helps other customers find us and lets our team know we're doing a great job!

Leave a review here: https://g.page/r/CQ8HFuckURpmEBM/review

Thank you so much for your support!

Sincerely,
The Boombox Team`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hi \${firstName}!</h2>
      <p>Thank you for choosing Boombox! We're glad you had a great experience with us.</p>
      <p>If you have a moment, we'd really appreciate it if you could leave us a quick Google review. Your feedback helps other customers find us and lets our team know we're doing a great job!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://g.page/r/CQ8HFuckURpmEBM/review"
           style="background-color: #4285F4; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
          Leave a Google Review
        </a>
      </div>
      <p>Thank you so much for your support!</p>
      <p>Sincerely,<br>The Boombox Team</p>
    </div>
  `,
  requiredVariables: ['firstName'],
  description: 'Google review request email sent 1 day after 4+ star feedback',
};
