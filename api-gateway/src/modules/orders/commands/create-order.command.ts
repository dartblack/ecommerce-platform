import { Command } from '@nestjs/cqrs';
import { Order } from '../../../database/entities/order.entity';

export interface OrderItemDto {
  productId: number;
  quantity: number;
}

export interface ShippingAddressDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface PaymentDetailsDto {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}

export class CreateOrderCommand extends Command<Order> {
  constructor(
    public readonly userId: number | null,
    public readonly orderItems: OrderItemDto[],
    public readonly shippingAddress: ShippingAddressDto,
    public readonly paymentDetails: PaymentDetailsDto,
    public readonly billingAddress?: ShippingAddressDto,
    public readonly paymentMethod?: string,
    public readonly notes?: string,
  ) {
    super();
  }
}
