import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOrdersTable1703070000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for PostgreSQL
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "order_status_enum" AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'success');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'paid', 'failed', 'refunded');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'order_number',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'order_status_enum',
            default: "'pending'",
          },
          {
            name: 'payment_status',
            type: 'payment_status_enum',
            default: "'pending'",
          },
          {
            name: 'payment_method',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'tax',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'shipping',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'discount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'shipping_first_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipping_last_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipping_email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipping_phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipping_address_line_1',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipping_address_line_2',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipping_city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipping_state',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipping_postal_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipping_country',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_first_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_last_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_address_line_1',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_address_line_2',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_state',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_postal_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billing_country',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tracking_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipped_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_order_number',
        columnNames: ['order_number'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_payment_status',
        columnNames: ['payment_status'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('orders');
    await queryRunner.query('DROP TYPE IF EXISTS "order_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "payment_status_enum"');
  }
}
