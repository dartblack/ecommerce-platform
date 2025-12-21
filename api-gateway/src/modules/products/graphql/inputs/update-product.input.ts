import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { StockStatus } from '../enums/stock-status.enum';
import GraphQLUpload, { FileUpload } from 'graphql-upload/GraphQLUpload.mjs';

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  shortDescription?: string;

  @Field({ nullable: true })
  sku?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  compareAtPrice?: number;

  @Field(() => Int, { nullable: true })
  categoryId?: number;

  @Field(() => Int, { nullable: true })
  stockQuantity?: number;

  @Field(() => StockStatus, { nullable: true })
  stockStatus?: StockStatus;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field(() => Int, { nullable: true })
  sortOrder?: number;

  @Field(() => GraphQLUpload, { nullable: true })
  image?: Promise<FileUpload>;
}
