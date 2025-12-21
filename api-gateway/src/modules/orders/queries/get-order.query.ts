import { Query } from '@nestjs/cqrs';
import { Order } from '../../../database/entities/order.entity';

export class GetOrderQuery extends Query<Order | null> {
  constructor(
    public readonly orderId: number,
    public readonly userId?: number,
  ) {
    super();
  }
}
