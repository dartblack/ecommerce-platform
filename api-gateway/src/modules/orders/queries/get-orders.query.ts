import { Query } from '@nestjs/cqrs';
import { OrderStatus } from '../../../database/entities/order.entity';
import { GetOrdersResult } from '../handlers/get-orders.handler';

export class GetOrdersQuery extends Query<GetOrdersResult> {
  constructor(
    public readonly userId?: number,
    public readonly status?: OrderStatus,
    public readonly page?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
