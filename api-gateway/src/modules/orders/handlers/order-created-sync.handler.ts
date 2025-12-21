import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OrderCreatedEvent } from '../events/order-created.event';

@EventsHandler(OrderCreatedEvent)
@Injectable()
export class OrderCreatedSyncHandler implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(OrderCreatedSyncHandler.name);

  constructor(
    @InjectQueue('order-sync') private readonly orderSyncQueue: Queue,
  ) {}

  async handle(event: OrderCreatedEvent) {
    try {
      const order = event.order;

      const orderData = {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        shippingFirstName: order.shippingFirstName,
        shippingLastName: order.shippingLastName,
        shippingEmail: order.shippingEmail,
        shippingPhone: order.shippingPhone,
        shippingAddressLine1: order.shippingAddressLine1,
        shippingAddressLine2: order.shippingAddressLine2,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPostalCode: order.shippingPostalCode,
        shippingCountry: order.shippingCountry,
        billingFirstName: order.billingFirstName,
        billingLastName: order.billingLastName,
        billingEmail: order.billingEmail,
        billingPhone: order.billingPhone,
        billingAddressLine1: order.billingAddressLine1,
        billingAddressLine2: order.billingAddressLine2,
        billingCity: order.billingCity,
        billingState: order.billingState,
        billingPostalCode: order.billingPostalCode,
        billingCountry: order.billingCountry,
        notes: order.notes,
        trackingNumber: order.trackingNumber,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
        orderItems:
          order.orderItems?.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })) || [],
      };

      const job = await this.orderSyncQueue.add(
        'sync-order',
        {
          order: orderData,
        },
        {
          jobId: `sync-order-${order.orderNumber}`,
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
        `Order sync job queued for order ${order.orderNumber}, job ID: ${job.id}`,
      );
    } catch (error: any) {
      // Log error but don't fail the operation - sync can be retried
      this.logger.error(
        `Failed to queue order sync for order ${event.order.orderNumber}: ${error.message}`,
        error.stack,
      );
    }
  }
}
