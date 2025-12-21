import { InputType, Field, Int, Float } from '@nestjs/graphql';

@InputType()
export class OrderItemInput {
  @Field(() => Int)
  productId: number;

  @Field(() => Int)
  quantity: number;
}

@InputType()
export class ShippingAddressInput {
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

@InputType()
export class PaymentDetailsInput {
  @Field()
  cardNumber: string;

  @Field()
  cardHolderName: string;

  @Field(() => Int)
  expiryMonth: number;

  @Field(() => Int)
  expiryYear: number;

  @Field()
  cvv: string;
}

@InputType()
export class CreateOrderInput {
  @Field(() => [OrderItemInput])
  orderItems: OrderItemInput[];

  @Field(() => ShippingAddressInput)
  shippingAddress: ShippingAddressInput;

  @Field(() => ShippingAddressInput, { nullable: true })
  billingAddress?: ShippingAddressInput;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field(() => PaymentDetailsInput)
  paymentDetails: PaymentDetailsInput;

  @Field({ nullable: true })
  notes?: string;
}
