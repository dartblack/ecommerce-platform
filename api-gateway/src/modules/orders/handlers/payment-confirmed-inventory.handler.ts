import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentConfirmedEvent } from '../events/payment-confirmed.event';
import { InventoryJobName } from '../processors/inventory-sync.processor';

@EventsHandler(PaymentConfirmedEvent)
@Injectable()
export class PaymentConfirmedInventoryHandler implements IEventHandler<PaymentConfirmedEvent> {
  private readonly logger = new Logger(PaymentConfirmedInventoryHandler.name);

  constructor(
    @InjectQueue('inventory-sync') private readonly inventorySyncQueue: Queue,
  ) {}

  async handle(event: PaymentConfirmedEvent) {
    try {
      const order = event.order;

      const items = order.orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const job = await this.inventorySyncQueue.add(
        InventoryJobName.DEDUCT,
        {
          orderNumber: order.orderNumber,
          items,
        },
        {
          jobId: `deduct-inventory-${order.orderNumber}`,
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
        `Inventory deduction job queued for order ${order.orderNumber} after payment confirmation, job ID: ${job.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to queue inventory deduction for order ${event.order.orderNumber} after payment confirmation: ${error.message}`,
        error.stack,
      );
    }
  }
}
