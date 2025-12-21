import {
  ObjectType,
  Field,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import {
  OrderStatus,
  PaymentStatus,
} from '../../../../database/entities/order.entity';
import { OrderItem } from './order-item.type';

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
});

@ObjectType()
export class ShippingAddress {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  addressLine1: string;

  @Field({ nullable: true })
  addressLine2?: string;

  @Field()
  city: string;

  @Field({ nullable: true })
  state?: string;

  @Field()
  postalCode: string;

  @Field()
  country: string;
}

@ObjectType()
export class Order {
  @Field(() => Int)
  id: number;

  @Field()
  orderNumber: string;

  @Field(() => Int, { nullable: true })
  userId?: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  tax: number;

  @Field(() => Float)
  shipping: number;

  @Field(() => Float)
  discount: number;

  @Field(() => Float)
  total: number;

  @Field(() => ShippingAddress, { nullable: true })
  shippingAddress?: ShippingAddress;

  @Field(() => ShippingAddress, { nullable: true })
  billingAddress?: ShippingAddress;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  trackingNumber?: string;

  @Field({ nullable: true })
  shippedAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  cancelledAt?: Date;

  @Field(() => [OrderItem])
  orderItems: OrderItem[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class OrderListMeta {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;

  @Field()
  hasNext: boolean;

  @Field()
  hasPrev: boolean;
}

@ObjectType()
export class OrderListResponse {
  @Field(() => [Order])
  data: Order[];

  @Field(() => OrderListMeta)
  meta: OrderListMeta;
}
