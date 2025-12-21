import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OrderStatusUpdatedEvent } from '../events/order-status-updated.event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../database/entities/order.entity';

@EventsHandler(OrderStatusUpdatedEvent)
@Injectable()
export class OrderStatusUpdatedSyncHandler implements IEventHandler<OrderStatusUpdatedEvent> {
  private readonly logger = new Logger(OrderStatusUpdatedSyncHandler.name);

  constructor(
    @InjectQueue('order-sync') private readonly orderSyncQueue: Queue,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async handle(event: OrderStatusUpdatedEvent) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: event.orderId },
      });

      if (!order) {
        this.logger.warn(
          `Order ${event.orderId} not found for status update sync`,
        );
        return;
      }

      const idempotencyKey = `update-order-status-${order.orderNumber}-${event.newStatus}${event.trackingNumber ? `-${event.trackingNumber}` : ''}`;
      const job = await this.orderSyncQueue.add(
        'update-order-status',
        {
          orderNumber: order.orderNumber,
          status: event.newStatus,
          trackingNumber: event.trackingNumber,
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
        `Order status update job queued for ${order.orderNumber}, job ID: ${job.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to queue order status update for order ${event.orderId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
