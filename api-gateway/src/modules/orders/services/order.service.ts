import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from '../commands/create-order.command';
import { UpdateOrderStatusCommand } from '../commands/update-order-status.command';
import { CancelOrderCommand } from '../commands/cancel-order.command';
import { GetOrderQuery } from '../queries/get-order.query';
import { GetOrdersQuery } from '../queries/get-orders.query';
import { Order } from '../../../database/entities/order.entity';
import { GetOrdersResult } from '../handlers/get-orders.handler';

@Injectable()
export class OrderService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async createOrder(command: CreateOrderCommand): Promise<Order> {
    return this.commandBus.execute(command);
  }

  async updateOrderStatus(command: UpdateOrderStatusCommand): Promise<Order> {
    return this.commandBus.execute(command);
  }

  async cancelOrder(command: CancelOrderCommand): Promise<Order> {
    return this.commandBus.execute(command);
  }

  async getOrder(orderId: number): Promise<Order | null> {
    return this.queryBus.execute(new GetOrderQuery(orderId));
  }

  async getOrders(query: GetOrdersQuery): Promise<GetOrdersResult> {
    return this.queryBus.execute(query);
  }
}
