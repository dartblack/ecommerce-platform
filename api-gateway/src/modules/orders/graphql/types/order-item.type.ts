import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class OrderItem {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  orderId: number;

  @Field(() => Int)
  productId: number;

  @Field()
  productName: string;

  @Field()
  productSku: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  price: number;

  @Field(() => Float)
  subtotal: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
