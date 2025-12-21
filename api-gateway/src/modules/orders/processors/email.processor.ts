import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  EmailService,
  OrderConfirmationEmailData,
} from '../../email/email.service';

export interface SendOrderConfirmationEmailJobData {
  orderData: OrderConfirmationEmailData;
}

@Processor('email')
@Injectable()
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendOrderConfirmationEmailJobData>): Promise<any> {
    this.logger.log(
      `Processing email job ${job.id} for order ${job.data.orderData.orderNumber}`,
    );

    try {
      const result = await this.emailService.sendOrderConfirmationEmail(
        job.data.orderData,
      );

      if (result) {
        this.logger.log(
          `Order confirmation email sent successfully for order ${job.data.orderData.orderNumber}`,
        );
        return {
          success: true,
          message: 'Order confirmation email sent successfully',
          orderNumber: job.data.orderData.orderNumber,
        };
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to send order confirmation email for order ${job.data.orderData.orderNumber}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
