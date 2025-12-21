import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../database/entities/order.entity';

@EventsHandler(OrderCancelledEvent)
@Injectable()
export class OrderCancelledSyncHandler implements IEventHandler<OrderCancelledEvent> {
  private readonly logger = new Logger(OrderCancelledSyncHandler.name);

  constructor(
    @InjectQueue('order-sync') private readonly orderSyncQueue: Queue,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async handle(event: OrderCancelledEvent) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: event.orderId },
      });

      if (!order) {
        this.logger.warn(
          `Order ${event.orderId} not found for cancellation sync`,
        );
        return;
      }

      const job = await this.orderSyncQueue.add(
        'cancel-order',
        {
          orderNumber: order.orderNumber,
          reason: event.reason,
        },
        {
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
        `Order cancellation job queued for ${order.orderNumber}, job ID: ${job.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to queue order cancellation for order ${event.orderId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
