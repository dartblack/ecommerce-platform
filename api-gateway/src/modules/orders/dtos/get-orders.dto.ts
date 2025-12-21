import { OrderStatus } from '../../../database/entities/order.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class GetOrdersDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  limit: number;
}
