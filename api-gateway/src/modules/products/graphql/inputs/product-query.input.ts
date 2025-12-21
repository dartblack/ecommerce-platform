import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StockStatus } from '../enums/stock-status.enum';
import { SortField } from '../enums/sort-field.enum';
import { SortOrder } from '../enums/sort-order.enum';

@InputType()
export class ProductQueryInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @Field(() => StockStatus, { nullable: true })
  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @Field(() => SortField, { nullable: true })
  @IsOptional()
  @IsEnum(SortField)
  sortBy?: SortField;

  @Field(() => SortOrder, { nullable: true })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
