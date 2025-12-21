import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { StockStatus } from '../enums/stock-status.enum';
import GraphQLUpload, { FileUpload } from 'graphql-upload/GraphQLUpload.mjs';

@InputType()
export class CreateProductInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  shortDescription?: string;

  @Field()
  sku: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float, { nullable: true })
  compareAtPrice?: number;

  @Field(() => Int, { nullable: true })
  categoryId?: number;

  @Field(() => Int, { nullable: true })
  stockQuantity?: number;

  @Field(() => StockStatus, { nullable: true })
  stockStatus?: StockStatus;

  @Field({ nullable: true, defaultValue: true })
  isActive?: boolean;

  @Field(() => Int, { nullable: true })
  sortOrder?: number;

  @Field(() => GraphQLUpload, { nullable: true })
  image?: Promise<FileUpload>;
}
