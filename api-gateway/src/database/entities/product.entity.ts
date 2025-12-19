import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';
import { OrderItem } from './order-item.entity';
import { InventoryMovement } from './inventory-movement.entity';

export enum StockStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  ON_BACKORDER = 'on_backorder',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true, name: 'short_description' })
  shortDescription: string;

  @Column({ unique: true })
  @Index()
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'compare_at_price' })
  compareAtPrice: number;

  @Column({ nullable: true, name: 'category_id' })
  @Index()
  categoryId: number;

  @Column({ default: 0, name: 'stock_quantity' })
  stockQuantity: number;

  @Column({
    type: 'enum',
    enum: StockStatus,
    default: StockStatus.IN_STOCK,
    name: 'stock_status',
  })
  @Index()
  stockStatus: StockStatus;

  @Column({ default: true, name: 'is_active' })
  @Index()
  isActive: boolean;

  @Column({ nullable: true })
  image: string;

  @Column({ default: 0, name: 'sort_order' })
  @Index()
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => InventoryMovement, (movement) => movement.product)
  inventoryMovements: InventoryMovement[];
}

