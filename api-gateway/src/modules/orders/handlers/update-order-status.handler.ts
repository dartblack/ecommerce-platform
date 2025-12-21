import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../../database/entities/order.entity';
import { UpdateOrderStatusCommand } from '../commands/update-order-status.command';
import { OrderStatusUpdatedEvent } from '../events/order-status-updated.event';

@CommandHandler(UpdateOrderStatusCommand)
export class UpdateOrderStatusHandler implements ICommandHandler<UpdateOrderStatusCommand> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateOrderStatusCommand): Promise<Order> {
    const { orderId, status, trackingNumber, paymentStatus } = command;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const oldStatus = order.status;

    order.status = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    const now = new Date();
    if (status === OrderStatus.SHIPPED && !order.shippedAt) {
      order.shippedAt = now;
    } else if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
      order.deliveredAt = now;
    }

    const updatedOrder = await this.orderRepository.save(order);

    this.eventBus.publish(
      new OrderStatusUpdatedEvent(orderId, oldStatus, status, trackingNumber),
    );

    return updatedOrder;
  }
}
