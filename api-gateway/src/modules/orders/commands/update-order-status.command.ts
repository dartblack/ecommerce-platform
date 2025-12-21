import { Command } from '@nestjs/cqrs';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../../database/entities/order.entity';

export class UpdateOrderStatusCommand extends Command<Order> {
  constructor(
    public readonly orderId: number,
    public readonly status: OrderStatus,
    public readonly trackingNumber?: string,
    public readonly paymentStatus?: PaymentStatus,
  ) {
    super();
  }
}
