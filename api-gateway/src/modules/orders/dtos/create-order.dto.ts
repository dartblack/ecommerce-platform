import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  MinLength,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity of the product' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class ShippingAddressDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: '123 Main St', description: 'Address line 1' })
  @IsString()
  @MaxLength(255)
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Apt 4B', description: 'Address line 2' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: 'NY', description: 'State or province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty({ example: '10001', description: 'Postal code' })
  @IsString()
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({ example: 'United States', description: 'Country' })
  @IsString()
  @MaxLength(100)
  country: string;
}

export class PaymentDetailsDto {
  @ApiProperty({
    example: '4111111111111111',
    description: 'Card number (13-19 digits)',
  })
  @IsString()
  @Matches(/^[\d\s]{13,19}$/, {
    message: 'Card number must be between 13 and 19 digits',
  })
  cardNumber: string;

  @ApiProperty({ example: 'John Doe', description: 'Card holder name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  cardHolderName: string;

  @ApiProperty({ example: 12, description: 'Expiry month (1-12)' })
  @IsNumber()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  expiryMonth: number;

  @ApiProperty({ example: 2025, description: 'Expiry year (4 digits)' })
  @IsNumber()
  @Min(2024)
  @Max(2100)
  @Type(() => Number)
  expiryYear: number;

  @ApiProperty({ example: '123', description: 'CVV (3-4 digits)' })
  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'CVV must be 3 or 4 digits' })
  cvv: string;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderItemDto],
    example: [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ],
    description: 'Array of order items',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one order item is required' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @ApiProperty({ type: ShippingAddressDto, description: 'Shipping address' })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({
    type: ShippingAddressDto,
    description:
      'Billing address (defaults to shipping address if not provided)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  billingAddress?: ShippingAddressDto;

  @ApiPropertyOptional({
    example: 'credit_card',
    description: 'Payment method',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiProperty({ type: PaymentDetailsDto, description: 'Payment details' })
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails: PaymentDetailsDto;

  @ApiPropertyOptional({
    example: 'Please leave at the front door',
    description: 'Order notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
