import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  OrderStatus,
  PaymentStatus,
} from '../../../database/entities/order.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'New order status',
    example: OrderStatus.SHIPPED,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({
    description: 'Tracking number for shipped orders',
    example: 'TRACK123456',
  })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Payment status',
    example: PaymentStatus.PAID,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
