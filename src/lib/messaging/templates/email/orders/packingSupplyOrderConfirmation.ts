/**
 * @fileoverview Email template for packing supply order confirmation
 * @source boombox-10.0/src/app/lib/email.ts (lines 234-413: sendPackingSupplyOrderConfirmationEmail)
 * @refactor Extracted email template to centralized template system
 */

import { MessageTemplate } from '../../../types';

export const packingSupplyOrderConfirmationEmail: MessageTemplate = {
  subject: 'Order Confirmation #${orderId} - Your Packing Supplies Are On The Way! 📦',
  text: `Thank you for your packing supply order!

Order #\${orderId}
Delivery to: \${deliveryAddress}
Delivery: \${deliveryTimeText}
Total: \${totalPrice}

Items:
\${cartItemsText}

Track your order: \${trackingUrl}
\${stripeReceiptText}

Thanks for choosing Boombox!`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
          Thank You for Your Order! 🎉
        </h1>
        <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">
          Your packing supplies are on the way
        </p>
      </div>

      <!-- Order Details -->
      <div style="padding: 40px 30px;">
        
        <!-- Order Number -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
          <h2 style="color: #1a1a1a; margin: 0 0 5px 0; font-size: 18px;">Order Number</h2>
          <p style="color: #4a5568; margin: 0; font-size: 24px; font-weight: 600;">#\${orderId}</p>
        </div>

        <!-- Delivery Info -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📍 Delivery Information</h3>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
            <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px; font-weight: 500;">DELIVERING TO:</p>
            <p style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px;">\${deliveryAddress}</p>
            <p style="color: #4a5568; margin: 0 0 5px 0; font-size: 14px; font-weight: 500;">ESTIMATED DELIVERY:</p>
            <p style="color: #1a1a1a; margin: 0; font-size: 16px; font-weight: 600;">\${deliveryTimeText}</p>
          </div>
        </div>

        <!-- Order Items -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📦 Your Items</h3>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                \${itemsHtml}
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 15px 0; font-weight: 600; font-size: 16px;">
                    Total
                  </td>
                  <td style="padding: 15px 0; text-align: right; font-weight: 600; font-size: 18px; color: #1a1a1a;">
                    \${totalPrice}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="margin-bottom: 30px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <a href="\${trackingUrl}" 
               style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
              🚚 Track Your Delivery
            </a>
          </div>
          \${stripeReceiptButton}
        </div>

        <!-- Additional Info -->
        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h4 style="color: #0369a1; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">📱 Stay Updated</h4>
          <p style="color: #0284c7; margin: 0; font-size: 14px; line-height: 1.5;">
            We'll send you text notifications as your driver makes their way to you. You can also track your order in real-time using the link above.
          </p>
        </div>

        <!-- Footer Message -->
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
            Thanks for choosing Boombox for your packing supply needs!
          </p>
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            Questions? Contact us at <a href="mailto:support@boombox.com" style="color: #4f46e5;">support@boombox.com</a>
          </p>
        </div>

      </div>
    </div>
  `,
  requiredVariables: [
    'orderId',
    'customerName',
    'deliveryAddress',
    'totalPrice',
    'deliveryTimeText',
    'cartItemsText',
    'itemsHtml',
    'trackingUrl',
    'stripeReceiptText',
    'stripeReceiptButton'
  ],
  channel: 'email',
  domain: 'booking'
};

