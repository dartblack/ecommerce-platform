import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Laptop Pro 15' })
  name: string;

  @ApiProperty({ example: 'laptop-pro-15' })
  slug: string;

  @ApiProperty({ example: 'High-performance laptop...', required: false })
  description?: string;

  @ApiProperty({
    example: 'Powerful laptop for professionals',
    required: false,
  })
  shortDescription?: string;

  @ApiProperty({ example: 'LAPTOP-001' })
  sku: string;

  @ApiProperty({ example: 1299.99 })
  price: number;

  @ApiProperty({ example: 1499.99, required: false })
  compareAtPrice?: number;

  @ApiProperty({ example: 1, required: false })
  categoryId?: number;

  @ApiProperty({ example: 'Electronics', required: false })
  categoryName?: string;

  @ApiProperty({ example: 50 })
  stockQuantity: number;

  @ApiProperty({
    example: 'in_stock',
    enum: ['in_stock', 'out_of_stock', 'on_backorder'],
  })
  stockStatus: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'product-image.jpg', required: false })
  image?: string;

  @ApiProperty({ example: 'http://example.com/image.jpg', required: false })
  imageUrl?: string;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: string;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrev: boolean;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductDto] })
  data: ProductDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
