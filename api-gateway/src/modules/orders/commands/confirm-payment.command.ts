import { Command } from '@nestjs/cqrs';
import { Order } from '../../../database/entities/order.entity';

export class ConfirmPaymentCommand extends Command<Order> {
  constructor(
    public readonly orderId: number,
    public readonly userId?: number,
  ) {
    super();
  }
}
