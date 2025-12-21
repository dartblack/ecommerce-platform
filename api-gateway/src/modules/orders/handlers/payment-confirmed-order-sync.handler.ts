import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentConfirmedEvent } from '../events/payment-confirmed.event';

@EventsHandler(PaymentConfirmedEvent)
@Injectable()
export class PaymentConfirmedOrderSyncHandler implements IEventHandler<PaymentConfirmedEvent> {
  private readonly logger = new Logger(PaymentConfirmedOrderSyncHandler.name);

  constructor(
    @InjectQueue('order-sync') private readonly orderSyncQueue: Queue,
  ) {}

  async handle(event: PaymentConfirmedEvent) {
    try {
      const order = event.order;

      const idempotencyKey = `update-order-status-${order.orderNumber}-${order.status}`;
      const job = await this.orderSyncQueue.add(
        'update-order-status',
        {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
        {
          jobId: idempotencyKey,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600,
            count: 100,
          },
          removeOnFail: {
            age: 86400,
          },
        },
      );

      this.logger.log(
        `Order status sync job queued for order ${order.orderNumber} after payment confirmation, job ID: ${job.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to queue order status sync for order ${event.order.orderNumber} after payment confirmation: ${error.message}`,
        error.stack,
      );
    }
  }
}
