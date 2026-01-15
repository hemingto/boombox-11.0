/**
 * @fileoverview Centralized messaging service with template-based SMS and email sending
 * @source Consolidated from boombox-10.0 scattered messaging logic
 * @refactor Created centralized template-based messaging system
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { twilioClient } from './twilioClient';
import sgMail from '@sendgrid/mail';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import {
  MessageTemplate,
  TemplateVariables,
  MessageResult,
  TemplateValidationError,
  MessageDomain,
  MessageChannel,
} from './types';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export class MessageService {
  /**
   * Render template with variables using template literal syntax
   */
  private static renderTemplate(
    template: string,
    variables: TemplateVariables
  ): string {
    return template.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
      const value = variables[variableName];
      if (value === undefined || value === null) {
        console.warn(
          `Template variable "${variableName}" is undefined or null`
        );
        return match; // Keep original placeholder if variable is missing
      }
      return String(value);
    });
  }

  /**
   * Validate template variables against required variables
   */
  private static validateTemplateVariables(
    template: MessageTemplate,
    variables: TemplateVariables
  ): TemplateValidationError[] {
    const errors: TemplateValidationError[] = [];

    for (const requiredVar of template.requiredVariables) {
      if (
        variables[requiredVar] === undefined ||
        variables[requiredVar] === null
      ) {
        errors.push({
          field: requiredVar,
          message: `Required variable "${requiredVar}" is missing or null`,
        });
      }
    }

    return errors;
  }

  /**
   * Send SMS message using template
   */
  static async sendSms(
    to: string,
    template: MessageTemplate,
    variables: TemplateVariables
  ): Promise<MessageResult> {
    try {
      // Validate required variables
      const validationErrors = this.validateTemplateVariables(
        template,
        variables
      );
      if (validationErrors.length > 0) {
        throw new Error(
          `Template validation failed: ${validationErrors.map(e => e.message).join(', ')}`
        );
      }

      // Check Twilio configuration
      if (
        !process.env.TWILIO_PHONE_NUMBER ||
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN
      ) {
        throw new Error('Twilio credentials not configured');
      }

      // Render message text
      const messageBody = this.renderTemplate(template.text, variables);

      // Send SMS via Twilio
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
      });

      console.log(`SMS sent successfully to ${to} with SID: ${message.sid}`);
      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error: any) {
      console.error('Error sending SMS:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send email message using template
   */
  static async sendEmail(
    to: string,
    template: MessageTemplate,
    variables: TemplateVariables
  ): Promise<MessageResult> {
    try {
      // Validate required variables
      const validationErrors = this.validateTemplateVariables(
        template,
        variables
      );
      if (validationErrors.length > 0) {
        throw new Error(
          `Template validation failed: ${validationErrors.map(e => e.message).join(', ')}`
        );
      }

      // Check SendGrid configuration
      if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
        throw new Error('SendGrid credentials not configured');
      }

      // Render email content
      const subject = template.subject
        ? this.renderTemplate(template.subject, variables)
        : 'Boombox Notification';
      const text = this.renderTemplate(template.text, variables);
      const html = template.html
        ? this.renderTemplate(template.html, variables)
        : undefined;

      // Send email via SendGrid
      const msg = {
        to: to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: subject,
        text: text,
        html: html,
      };

      const response = await sgMail.send(msg);

      console.log(`Email sent successfully to ${to}`);
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || 'unknown',
      };
    } catch (error: any) {
      console.error('Error sending email:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get template file path for template loading
   */
  static getTemplatePath(
    channel: MessageChannel,
    domain: MessageDomain,
    templateName: string
  ): string {
    return `templates/${channel}/${domain}/${templateName}`;
  }

  /**
   * Utility method to validate phone number format for SMS
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Utility method to validate email format
   */
  static validateEmail(email: string): boolean {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }


}
