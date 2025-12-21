import { IEvent } from '@nestjs/cqrs';
import { OrderStatus } from '../../../database/entities/order.entity';

export class OrderStatusUpdatedEvent implements IEvent {
  constructor(
    public readonly orderId: number,
    public readonly oldStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
    public readonly trackingNumber?: string,
  ) {}
}
