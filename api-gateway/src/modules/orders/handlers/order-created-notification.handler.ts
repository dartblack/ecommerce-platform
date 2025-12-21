import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { OrderCreatedEvent } from '../events/order-created.event';
import { MicroservicesService } from '../../../common/microservices/microservices.service';

@EventsHandler(OrderCreatedEvent)
@Injectable()
export class OrderCreatedNotificationHandler implements IEventHandler<OrderCreatedEvent> {
  constructor(private readonly microservicesService: MicroservicesService) {}

  handle(event: OrderCreatedEvent) {
    try {
      this.microservicesService.emit('order.created', {
        orderId: event.order.id,
        orderNumber: event.order.orderNumber,
        userId: event.order.userId,
        total: event.order.total,
        createdAt: event.order.createdAt,
      });
    } catch (error) {
      console.error(
        'Failed to send order.created event to microservices:',
        error,
      );
    }
  }
}
