import { Injectable } from '@nestjs/common';
import { CreateProductInput } from '../graphql/inputs/create-product.input';
import { UpdateProductInput } from '../graphql/inputs/update-product.input';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { StockStatus as DtoStockStatus } from '../dtos/product-query.dto';
import { StockStatus as GraphQLStockStatus } from '../graphql/enums/stock-status.enum';

@Injectable()
export class ProductMapper {
  /**
   * Maps GraphQL CreateProductInput to CreateProductDto
   */
  toCreateDto(input: CreateProductInput): CreateProductDto {
    return {
      name: input.name,
      slug: input.slug,
      description: input.description,
      shortDescription: input.shortDescription,
      sku: input.sku,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      categoryId: input.categoryId,
      stockQuantity: input.stockQuantity,
      stockStatus: this.mapStockStatus(input.stockStatus),
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder,
    };
  }

  /**
   * Maps GraphQL UpdateProductInput to UpdateProductDto
   * Only includes fields that are explicitly provided (not undefined)
   */
  toUpdateDto(input: UpdateProductInput): UpdateProductDto {
    const dto: UpdateProductDto = {};

    if (input.name !== undefined) dto.name = input.name;
    if (input.slug !== undefined) dto.slug = input.slug;
    if (input.description !== undefined) dto.description = input.description;
    if (input.shortDescription !== undefined)
      dto.shortDescription = input.shortDescription;
    if (input.sku !== undefined) dto.sku = input.sku;
    if (input.price !== undefined) dto.price = input.price;
    if (input.compareAtPrice !== undefined)
      dto.compareAtPrice = input.compareAtPrice;
    if (input.categoryId !== undefined) dto.categoryId = input.categoryId;
    if (input.stockQuantity !== undefined)
      dto.stockQuantity = input.stockQuantity;
    if (input.stockStatus !== undefined)
      dto.stockStatus = this.mapStockStatus(input.stockStatus);
    if (input.isActive !== undefined) dto.isActive = input.isActive;
    if (input.sortOrder !== undefined) dto.sortOrder = input.sortOrder;

    return dto;
  }

  /**
   * Maps GraphQL StockStatus enum to DTO StockStatus enum
   * Both enums have the same values, so this is a type-safe cast
   */
  private mapStockStatus(
    status: GraphQLStockStatus | undefined,
  ): DtoStockStatus | undefined {
    if (status === undefined) return undefined;
    return status as unknown as DtoStockStatus;
  }
}
