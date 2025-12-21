import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

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

  @Field({ nullable: true })
  categoryName?: string;

  @Field(() => Int)
  stockQuantity: number;

  @Field({ nullable: true })
  stockStatus?: string;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => Int)
  sortOrder: number;

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;
}

@ObjectType()
export class PaginationMeta {
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
export class ProductListResponse {
  @Field(() => [Product])
  data: Product[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
