/**
 * @fileoverview SendGrid email client with template functions for all business domains
 * @source boombox-10.0/src/app/lib/email.ts
 * @refactor Moved to messaging domain structure, preserved all functionality
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface SendGridError extends Error {
  response?: {
    status: number;
    body: any;
  };
}

/**
 * Send driver invitation email with invite token
 */
export async function sendDriverInvitationEmail(
  email: string,
  inviteToken: string,
  movingPartnerName: string
) {
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/driver-accept-invite?token=${inviteToken}`;

  console.log('Preparing to send driver invitation email:', {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    hasApiKey: !!process.env.SENDGRID_API_KEY,
  });

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    subject: `You've been invited to join ${movingPartnerName} on Boombox`,
    text: `You've been invited to join ${movingPartnerName} as a driver on Boombox. This invitation will expire in 15 days.\n\nClick the button below to complete your driver profile and start accepting deliveries: ${inviteLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="font-size: 24px; margin-bottom: 20px;">You've been invited to join ${movingPartnerName}</h1>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          You've been invited to join ${movingPartnerName} as a driver on Boombox. This invitation will expire in 15 days.
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
          Click the button below to complete your driver profile and start accepting jobs:
        </p>
        
        <div style="margin: 30px 0;">
          <a href="${inviteLink}" 
             style="display: inline-block; padding: 15px 30px; background-color: #1a1a1a; color: white; text-decoration: none; border-radius: 6px; font-size: 16px;">
            Complete Your Profile
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If the button doesn't work, you can copy and paste this link into your browser:<br>
          <span style="color: #999; word-break: break-all;">${inviteLink}</span>
        </p>
      </div>
    `,
  };

  try {
    console.log('Attempting to send email via SendGrid...');
    await sgMail.send(msg);
    console.log('Email sent successfully!');
  } catch (error) {
    const sendGridError = error as SendGridError;
    console.error('Error sending driver invitation email:', sendGridError);
    if (sendGridError.response) {
      console.error('SendGrid API error:', {
        status: sendGridError.response.status,
        body: sendGridError.response.body,
      });
    }
    throw error;
  }
}

/**
 * Send admin verification email with temporary code
 */
export async function sendAdminVerificationEmail(email: string, code: string) {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    subject: 'Your Admin Login Verification Code',
    text: `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.`,
    html: `
      <h1>Admin Login Verification</h1>
      <p>Your verification code is:</p>
      <h2 style="font-size: 24px; padding: 10px; background: #f0f0f0; display: inline-block;">${code}</h2>
      <p>This code will expire in 15 minutes.</p>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending admin verification email:', error);
    throw error;
  }
}

/**
 * Send admin invitation email with signup token
 */
export async function sendAdminInvitationEmail(
  email: string,
  token: string,
  role: 'ADMIN' | 'SUPERADMIN'
) {
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/admin/signup?token=${token}`;

  console.log('Preparing to send admin invitation email:', {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    hasApiKey: !!process.env.SENDGRID_API_KEY,
  });

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    subject: `You've Been Invited to Join as ${role === 'SUPERADMIN' ? 'a Super Admin' : 'an Admin'}`,
    text: `You've been invited to join our platform as ${role === 'SUPERADMIN' ? 'a super admin' : 'an admin'}. Click this link to sign up: ${inviteLink}\n\nThis invitation expires in 15 days.`,
    html: `
      <h1>Welcome to Our Platform!</h1>
      <p>You've been invited to join our platform as ${role === 'SUPERADMIN' ? 'a super admin' : 'an admin'}.</p>
      <p><a href="${inviteLink}">Click here to sign up</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${inviteLink}</p>
      <p>This invitation expires in 15 days.</p>
    `,
  };

  try {
    console.log('Attempting to send email via SendGrid...');
    await sgMail.send(msg);
    console.log('Email sent successfully!');
  } catch (error) {
    const sendGridError = error as SendGridError;
    console.error('Error sending admin invitation email:', sendGridError);
    if (sendGridError.response) {
      console.error('SendGrid API error:', {
        status: sendGridError.response.status,
        body: sendGridError.response.body,
      });
    }
    throw error;
  }
}

/**
 * Send urgent alert when no driver is available for appointment
 */
export async function sendNoDriverAvailableAlert(
  adminEmail: string,
  appointmentDetails: {
    appointmentId: number;
    jobCode?: string;
    date: string;
    time: string;
    address: string;
    unitNumber: number;
    userName: string;
    userPhone: string;
  }
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/appointments/${appointmentDetails.appointmentId}`;

  const msg = {
    to: adminEmail,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    subject: `🚨 URGENT: No Driver Available - Job ${appointmentDetails.jobCode || appointmentDetails.appointmentId}`,
    text: `
URGENT: No driver available for Boombox job

Job Details:
- Job Code: ${appointmentDetails.jobCode || 'N/A'}
- Appointment ID: ${appointmentDetails.appointmentId}
- Unit Number: ${appointmentDetails.unitNumber}
- Date: ${appointmentDetails.date}
- Time: ${appointmentDetails.time}
- Address: ${appointmentDetails.address}

Customer Details:
- Name: ${appointmentDetails.userName}
- Phone: ${appointmentDetails.userPhone}

Immediate action required. View appointment: ${dashboardUrl}
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ff4444; color: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 20px;">🚨 URGENT: No Driver Available</h1>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Job ${appointmentDetails.jobCode || appointmentDetails.appointmentId} requires immediate attention</h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">Job Details</h3>
          <ul style="color: #666; line-height: 1.6;">
            <li><strong>Job Code:</strong> ${appointmentDetails.jobCode || 'N/A'}</li>
            <li><strong>Appointment ID:</strong> ${appointmentDetails.appointmentId}</li>
            <li><strong>Unit Number:</strong> ${appointmentDetails.unitNumber}</li>
            <li><strong>Date:</strong> ${appointmentDetails.date}</li>
            <li><strong>Time:</strong> ${appointmentDetails.time}</li>
            <li><strong>Address:</strong> ${appointmentDetails.address}</li>
          </ul>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 30px;">
          <h3 style="color: #333; margin-top: 0;">Customer Details</h3>
          <ul style="color: #666; line-height: 1.6;">
            <li><strong>Name:</strong> ${appointmentDetails.userName}</li>
            <li><strong>Phone:</strong> ${appointmentDetails.userPhone}</li>
          </ul>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="display: inline-block; padding: 15px 30px; background-color: #ff4444; color: white; text-decoration: none; border-radius: 6px; font-size: 16px;">
            View Appointment in Dashboard
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          <strong>Immediate action required:</strong> Please manually assign a driver or contact the customer to reschedule.
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`No driver alert email sent to admin: ${adminEmail}`);
  } catch (error) {
    const sendGridError = error as SendGridError;
    console.error('Error sending no driver alert email:', sendGridError);
    if (sendGridError.response) {
      console.error('SendGrid API error:', {
        status: sendGridError.response.status,
        body: sendGridError.response.body,
      });
    }
    throw error;
  }
}

/**
 * Send packing supply order confirmation email with detailed order information
 */
export async function sendPackingSupplyOrderConfirmationEmail(
  customerEmail: string,
  orderDetails: {
    orderId: number;
    customerName: string;
    deliveryAddress: string;
    totalPrice: number;
    cartItems: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    deliveryWindow: {
      start: string;
      end: string;
      isSameDay: boolean;
      deliveryDate: string;
    };
    trackingUrl: string;
    stripePaymentIntentId?: string;
  }
) {
  // Generate Stripe receipt URL if payment intent ID is available
  // Note: This requires the payment intent to have receipt_email set
  const stripeReceiptUrl = orderDetails.stripePaymentIntentId
    ? `https://payments.stripe.com/receipts/${orderDetails.stripePaymentIntentId}/payment_intent_receipt`
    : null;

  // Format tracking URL to be absolute
  const fullTrackingUrl = orderDetails.trackingUrl.startsWith('http')
    ? orderDetails.trackingUrl
    : `${process.env.NEXT_PUBLIC_APP_URL}${orderDetails.trackingUrl}`;

  // Format delivery window
  // Fix timezone issue - parse the date string properly to avoid UTC conversion
  // orderDetails.deliveryWindow.deliveryDate is in format "YYYY-MM-DD"
  const [year, month, day] = orderDetails.deliveryWindow.deliveryDate
    .split('-')
    .map(Number);
  const deliveryDate = new Date(year, month - 1, day); // month is 0-indexed

  const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const deliveryTimeText = orderDetails.deliveryWindow.isSameDay
    ? `Today between 12:00 PM - 7:00 PM`
    : `${formattedDeliveryDate} between 12:00 PM - 7:00 PM`;

  // Generate order items HTML
  const itemsHtml = orderDetails.cartItems
    .map(
      item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
        <span style="font-weight: 500;">${item.quantity}x</span> ${item.name}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  const msg = {
    to: customerEmail,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@boombox.com',
    subject: `Order Confirmation #${orderDetails.orderId} - Your Packing Supplies Are On The Way! 📦`,
    text: `
Thank you for your packing supply order!

Order #${orderDetails.orderId}
Delivery to: ${orderDetails.deliveryAddress}
Delivery: ${deliveryTimeText}
Total: $${orderDetails.totalPrice.toFixed(2)}

Items:
${orderDetails.cartItems.map(item => `- ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Track your order: ${fullTrackingUrl}
${stripeReceiptUrl ? `View receipt: ${stripeReceiptUrl}` : ''}

Thanks for choosing Boombox!
    `,
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
            <p style="color: #4a5568; margin: 0; font-size: 24px; font-weight: 600;">#${orderDetails.orderId}</p>
          </div>

          <!-- Delivery Info -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📍 Delivery Information</h3>
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
              <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px; font-weight: 500;">DELIVERING TO:</p>
              <p style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px;">${orderDetails.deliveryAddress}</p>
              <p style="color: #4a5568; margin: 0 0 5px 0; font-size: 14px; font-weight: 500;">ESTIMATED DELIVERY:</p>
              <p style="color: #1a1a1a; margin: 0; font-size: 16px; font-weight: 600;">${deliveryTimeText}</p>
            </div>
          </div>

          <!-- Order Items -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📦 Your Items</h3>
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  ${itemsHtml}
                  <tr style="background-color: #f8fafc;">
                    <td style="padding: 15px 0; font-weight: 600; font-size: 16px;">
                      Total
                    </td>
                    <td style="padding: 15px 0; text-align: right; font-weight: 600; font-size: 18px; color: #1a1a1a;">
                      $${orderDetails.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="margin-bottom: 30px; text-align: center;">
            <div style="margin-bottom: 15px;">
              <a href="${fullTrackingUrl}" 
                 style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                🚚 Track Your Delivery
              </a>
            </div>
            ${
              stripeReceiptUrl
                ? `
              <div>
                <a href="${stripeReceiptUrl}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #4a5568; text-decoration: none; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 500;">
                  📄 View Receipt
                </a>
              </div>
            `
                : ''
            }
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
  };

  try {
    console.log(
      `Sending packing supply order confirmation email to: ${customerEmail}`
    );
    await sgMail.send(msg);
    console.log('Order confirmation email sent successfully!');
  } catch (error) {
    const sendGridError = error as SendGridError;
    console.error(
      'Error sending packing supply order confirmation email:',
      sendGridError
    );
    if (sendGridError.response) {
      console.error('SendGrid API error:', {
        status: sendGridError.response.status,
        body: sendGridError.response.body,
      });
    }
    throw error;
  }
}
