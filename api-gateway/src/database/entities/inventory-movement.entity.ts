import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

export enum InventoryMovementType {
  ADJUSTMENT = 'adjustment',
  SALE = 'sale',
  RETURN = 'return',
  DAMAGE = 'damage',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  INITIAL_STOCK = 'initial_stock',
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  @Index()
  productId: number;

  @Column({ nullable: true, name: 'user_id' })
  @Index()
  userId: number;

  @Column({
    type: 'enum',
    enum: InventoryMovementType,
    default: InventoryMovementType.ADJUSTMENT,
  })
  @Index()
  type: InventoryMovementType;

  @Column({ name: 'quantity_change' })
  quantityChange: number;

  @Column({ name: 'quantity_before' })
  quantityBefore: number;

  @Column({ name: 'quantity_after' })
  quantityAfter: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true, name: 'reference_number' })
  referenceNumber: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Product, (product) => product.inventoryMovements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User, (user) => user.inventoryMovements, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

