import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../../database/entities/order.entity';
import { OrderItem } from '../../../database/entities/order-item.entity';
import { CreateOrderCommand } from '../commands/create-order.command';
import { OrderCreatedEvent } from '../events/order-created.event';
import { InventoryService } from '../services/inventory.service';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly eventBus: EventBus,
    private readonly inventoryService: InventoryService,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Order> {
    const {
      userId,
      orderItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
    } = command;

    const inventoryChecks =
      await this.inventoryService.checkMultipleProductsAvailability(
        orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      );

    const unavailableProducts = inventoryChecks.filter(
      (check) => !check.available,
    );
    if (unavailableProducts.length > 0) {
      const errorMessages = unavailableProducts
        .map((check) => check.message || 'Product unavailable')
        .join('; ');
      throw new BadRequestException(`Inventory check failed: ${errorMessages}`);
    }

    const productMap = new Map(
      inventoryChecks.map((check) => [check.product.id, check.product]),
    );

    const orderNumber = this.generateOrderNumber();

    const subtotal = orderItems.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      const price = product?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);
    const tax = subtotal * 0.1;
    const shipping = 0;
    const discount = 0;
    const total = subtotal + tax + shipping - discount;

    const order = this.orderRepository.create({
      orderNumber,
      userId: userId ?? undefined,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      shippingFirstName: shippingAddress.firstName,
      shippingLastName: shippingAddress.lastName,
      shippingEmail: shippingAddress.email,
      shippingPhone: shippingAddress.phone,
      shippingAddressLine1: shippingAddress.addressLine1,
      shippingAddressLine2: shippingAddress.addressLine2,
      shippingCity: shippingAddress.city,
      shippingState: shippingAddress.state,
      shippingPostalCode: shippingAddress.postalCode,
      shippingCountry: shippingAddress.country,
      billingFirstName: billingAddress?.firstName || shippingAddress.firstName,
      billingLastName: billingAddress?.lastName || shippingAddress.lastName,
      billingEmail: billingAddress?.email || shippingAddress.email,
      billingPhone: billingAddress?.phone || shippingAddress.phone,
      billingAddressLine1:
        billingAddress?.addressLine1 || shippingAddress.addressLine1,
      billingAddressLine2:
        billingAddress?.addressLine2 || shippingAddress.addressLine2,
      billingCity: billingAddress?.city || shippingAddress.city,
      billingState: billingAddress?.state || shippingAddress.state,
      billingPostalCode:
        billingAddress?.postalCode || shippingAddress.postalCode,
      billingCountry: billingAddress?.country || shippingAddress.country,
      notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    const items = orderItems.map((item) => {
      const product = productMap.get(item.productId);
      const price = product?.price ?? 0;
      return this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        productName: product?.name ?? `Product ${item.productId}`,
        productSku: product?.sku ?? `SKU-${item.productId}`,
        quantity: item.quantity,
        price,
        subtotal: price * item.quantity,
      });
    });

    await this.orderItemRepository.save(items);

    const orderWithItems = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['orderItems'],
    });

    this.eventBus.publish(new OrderCreatedEvent(orderWithItems!));

    return orderWithItems!;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${timestamp}-${random}`;
  }
}
