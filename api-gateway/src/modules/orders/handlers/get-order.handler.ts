import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Order } from '../../../database/entities/order.entity';
import { GetOrderQuery } from '../queries/get-order.query';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async execute(query: GetOrderQuery): Promise<Order | null> {
    const { orderId, userId } = query;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['orderItems'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (userId !== undefined && order.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this order',
      );
    }

    return order;
  }
}
