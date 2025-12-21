import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../../database/entities/order.entity';
import { ConfirmPaymentCommand } from '../commands/confirm-payment.command';
import { PaymentConfirmedEvent } from '../events/payment-confirmed.event';

@CommandHandler(ConfirmPaymentCommand)
export class ConfirmPaymentHandler implements ICommandHandler<ConfirmPaymentCommand> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ConfirmPaymentCommand): Promise<Order> {
    const { orderId } = command;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['orderItems'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        `Order ${orderId} payment has already been confirmed`,
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        `Cannot confirm payment for cancelled order ${orderId}`,
      );
    }

    const mockPaymentResult = {
      success: true,
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      paymentStatus: 'paid' as const,
      message: 'Payment confirmed successfully',
      amount: order.total,
      timestamp: new Date(),
    };

    if (mockPaymentResult.success) {
      order.paymentStatus = PaymentStatus.PAID;
      order.status = OrderStatus.PROCESSING;

      const updatedOrder = await this.orderRepository.save(order);

      this.eventBus.publish(new PaymentConfirmedEvent(updatedOrder));

      return updatedOrder;
    } else {
      order.paymentStatus = PaymentStatus.FAILED;
      await this.orderRepository.save(order);

      throw new BadRequestException(
        `Payment confirmation failed: ${mockPaymentResult.message}`,
      );
    }
  }
}
