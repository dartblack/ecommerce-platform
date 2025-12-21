import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export interface OrderConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: Date;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  from: {
    name: string;
    address: string;
  };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private emailConfig?: EmailConfig;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.emailConfig = this.configService.get<EmailConfig>('email');
    this.logger.log(
      `Email service initialized with MailHog at ${this.emailConfig?.host}:${this.emailConfig?.port}`,
    );
  }

  /**
   * Send email using MailerService
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      this.logger.log(
        `Sending email to ${options.to} with subject: ${options.subject}`,
      );

      const mailOptions = {
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        from: options.from
          ? `${options.fromName || this.emailConfig?.from.name} <${options.from}>`
          : undefined, // Use default from config
      };

      const info: SentMessageInfo =
        await this.mailerService.sendMail(mailOptions);

      this.logger.log(
        `Email sent successfully to ${options.to}, message ID: ${info.messageId}`,
      );
      this.logger.debug(`MailHog preview: http://localhost:8025`);

      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send order confirmation email using Handlebars templates
   */
  async sendOrderConfirmationEmail(
    data: OrderConfirmationEmailData,
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Sending order confirmation email for order ${data.orderNumber} to ${data.customerEmail}`,
      );

      const context = {
        orderNumber: data.orderNumber,
        orderDate: data.orderDate,
        items: data.items,
        shippingAddress: data.shippingAddress,
        subtotal: data.subtotal,
        tax: data.tax,
        shipping: data.shipping,
        discount: data.discount,
        total: data.total,
      };

      await this.mailerService.sendMail({
        to: data.customerEmail,
        subject: `Order Confirmation - ${data.orderNumber}`,
        template: 'order-confirmation',
        context,
      });

      this.logger.log(
        `Order confirmation email sent successfully for order ${data.orderNumber}`,
      );
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send order confirmation email for order ${data.orderNumber}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
