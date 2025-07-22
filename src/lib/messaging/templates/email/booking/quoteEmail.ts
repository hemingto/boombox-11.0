/**
 * @fileoverview Quote email template for customer price quotes
 * @source boombox-10.0/src/app/api/send-quote-email/route.ts (generateQuoteEmailHTML function)
 * @refactor Extracted inline email HTML generation into centralized template system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const quoteEmail: MessageTemplate = {
  channel: 'email',
  domain: 'booking',
  subject: 'Your Boombox Storage Quote',
  text: `Your Boombox Storage Quote

Thank you for choosing Boombox Storage!

Service Details:
- Address: \${address}
- Date & Time: \${formattedDate} \${scheduledTimeSlot}

Price Details:
\${storageUnitText}
\${accessStorageText}
- \${selectedPlanName}: \${loadingHelpPrice}
\${insuranceText}
- Total: $\${totalPrice}
- Due Today: $0

What's Next?
Ready to get started? Visit ${process.env.NEXT_PUBLIC_APP_URL || 'https://boomboxstorage.com'}/getquote to book your appointment.

- Free pickup and delivery
- Climate-controlled storage
- 24/7 customer support
- Fully insured and secure

Thank you for choosing Boombox Storage!
Questions? Contact us at hello@boomboxstorage.com
© \${currentYear} Boombox Storage. All rights reserved.`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Boombox Storage Quote</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 30px 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px 20px; }
            .quote-section { background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .quote-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .quote-item:last-child { border-bottom: none; }
            .total { font-weight: bold; font-size: 18px; padding-top: 10px; border-top: 2px solid #1a1a1a; }
            .button { background-color: #1a1a1a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Your Boombox Storage Quote</h1>
                <p>Thank you for choosing Boombox Storage!</p>
            </div>
            
            <div class="content">
                <div class="quote-section">
                    <h2>Service Details</h2>
                    <div class="quote-item">
                        <span><strong>Address:</strong></span>
                        <span>\${address}</span>
                    </div>
                    <div class="quote-item">
                        <span><strong>Date & Time:</strong></span>
                        <span>\${formattedDate} \${scheduledTimeSlotText}</span>
                    </div>
                </div>

                <div class="quote-section">
                    <h2>Price Details</h2>
                    \${storageUnitHtml}
                    \${accessStorageHtml}
                    <div class="quote-item">
                        <span>\${selectedPlanName}</span>
                        <span>\${loadingHelpPrice}</span>
                    </div>
                    \${insuranceHtml}
                    <div class="quote-item total">
                        <span>Total</span>
                        <span>$\${totalPrice}</span>
                    </div>
                    <div class="quote-item">
                        <span>Due Today</span>
                        <span>$0</span>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="\${bookingUrl}" class="button">
                        Book Your Appointment
                    </a>
                </div>

                <div class="quote-section">
                    <h3>What's Next?</h3>
                    <p>Ready to get started? Click the button above to schedule your appointment, or contact us if you have any questions.</p>
                    <ul>
                        <li>Free pickup and delivery</li>
                        <li>Climate-controlled storage</li>
                        <li>24/7 customer support</li>
                        <li>Fully insured and secure</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for choosing Boombox Storage!</p>
                <p>Questions? Contact us at <a href="mailto:hello@boomboxstorage.com">hello@boomboxstorage.com</a></p>
                <p>© \${currentYear} Boombox Storage. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,
  requiredVariables: [
    'address',
    'formattedDate',
    'scheduledTimeSlotText',
    'selectedPlanName',
    'loadingHelpPrice',
    'totalPrice',
    'currentYear',
    'bookingUrl',
    'storageUnitHtml',
    'accessStorageHtml',
    'insuranceHtml'
  ],
  description: 'Email template for sending detailed price quotes to customers'
}; 