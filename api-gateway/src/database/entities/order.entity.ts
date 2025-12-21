import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  SUCCESS = 'success',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'order_number' })
  @Index()
  orderNumber: string;

  @Column({ nullable: true, name: 'user_id' })
  @Index()
  userId: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @Index()
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status',
  })
  @Index()
  paymentStatus: PaymentStatus;

  @Column({ nullable: true, name: 'payment_method' })
  paymentMethod: string;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  // Shipping Address
  @Column({ nullable: true, name: 'shipping_first_name' })
  shippingFirstName: string;

  @Column({ nullable: true, name: 'shipping_last_name' })
  shippingLastName: string;

  @Column({ nullable: true, name: 'shipping_email' })
  shippingEmail: string;

  @Column({ nullable: true, name: 'shipping_phone' })
  shippingPhone: string;

  @Column({ nullable: true, name: 'shipping_address_line_1' })
  shippingAddressLine1: string;

  @Column({ nullable: true, name: 'shipping_address_line_2' })
  shippingAddressLine2: string;

  @Column({ nullable: true, name: 'shipping_city' })
  shippingCity: string;

  @Column({ nullable: true, name: 'shipping_state' })
  shippingState: string;

  @Column({ nullable: true, name: 'shipping_postal_code' })
  shippingPostalCode: string;

  @Column({ nullable: true, name: 'shipping_country' })
  shippingCountry: string;

  // Billing Address
  @Column({ nullable: true, name: 'billing_first_name' })
  billingFirstName: string;

  @Column({ nullable: true, name: 'billing_last_name' })
  billingLastName: string;

  @Column({ nullable: true, name: 'billing_email' })
  billingEmail: string;

  @Column({ nullable: true, name: 'billing_phone' })
  billingPhone: string;

  @Column({ nullable: true, name: 'billing_address_line_1' })
  billingAddressLine1: string;

  @Column({ nullable: true, name: 'billing_address_line_2' })
  billingAddressLine2: string;

  @Column({ nullable: true, name: 'billing_city' })
  billingCity: string;

  @Column({ nullable: true, name: 'billing_state' })
  billingState: string;

  @Column({ nullable: true, name: 'billing_postal_code' })
  billingPostalCode: string;

  @Column({ nullable: true, name: 'billing_country' })
  billingCountry: string;

  // Additional fields
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true, name: 'tracking_number' })
  trackingNumber: string;

  @Column({ nullable: true, name: 'shipped_at', type: 'timestamp' })
  shippedAt: Date;

  @Column({ nullable: true, name: 'delivered_at', type: 'timestamp' })
  deliveredAt: Date;

  @Column({ nullable: true, name: 'cancelled_at', type: 'timestamp' })
  cancelledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  orderItems: OrderItem[];
}
