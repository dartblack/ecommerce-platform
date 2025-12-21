import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Order, OrderStatus } from '../../../database/entities/order.entity';
import { CancelOrderCommand } from '../commands/cancel-order.command';
import { OrderCancelledEvent } from '../events/order-cancelled.event';

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CancelOrderCommand): Promise<Order> {
    const { orderId, userId, reason } = command;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (userId !== undefined && order.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to cancel this order',
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Order ${orderId} is already cancelled`);
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException(`Cannot cancel delivered order ${orderId}`);
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();

    if (reason) {
      order.notes = order.notes
        ? `${order.notes}\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }

    const cancelledOrder = await this.orderRepository.save(order);

    this.eventBus.publish(new OrderCancelledEvent(orderId, reason));

    return cancelledOrder;
  }
}
