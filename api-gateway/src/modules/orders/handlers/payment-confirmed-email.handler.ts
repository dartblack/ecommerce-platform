import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentConfirmedEvent } from '../events/payment-confirmed.event';
import { OrderConfirmationEmailData } from '../../email/email.service';

@EventsHandler(PaymentConfirmedEvent)
@Injectable()
export class PaymentConfirmedEmailHandler implements IEventHandler<PaymentConfirmedEvent> {
  private readonly logger = new Logger(PaymentConfirmedEmailHandler.name);

  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async handle(event: PaymentConfirmedEvent) {
    try {
      const order = event.order;

      const emailData: OrderConfirmationEmailData = {
        orderNumber: order.orderNumber,
        customerName: `${order.shippingFirstName} ${order.shippingLastName}`,
        customerEmail: order.shippingEmail,
        orderDate: order.createdAt,
        items: order.orderItems.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        shippingAddress: {
          firstName: order.shippingFirstName,
          lastName: order.shippingLastName,
          addressLine1: order.shippingAddressLine1,
          addressLine2: order.shippingAddressLine2 || undefined,
          city: order.shippingCity,
          state: order.shippingState || undefined,
          postalCode: order.shippingPostalCode,
          country: order.shippingCountry,
        },
      };

      const job = await this.emailQueue.add(
        'send-order-confirmation',
        {
          orderData: emailData,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(
        `Order confirmation email job queued for order ${order.orderNumber} after payment confirmation, job ID: ${job.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to queue order confirmation email for order ${event.order.orderNumber} after payment confirmation: ${error.message}`,
        error.stack,
      );
    }
  }
}
