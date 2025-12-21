import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OrderSyncService } from '../services/order-sync.service';
import { PaymentStatus } from 'src/database/entities/order.entity';

export enum OrderJobName {
  SYNC = 'sync-order',
  UPDATE_STATUS = 'update-order-status',
  CANCEL = 'cancel-order',
}

export interface SyncOrderJobData {
  order: {
    id: number;
    orderNumber: string;
    userId: number | null;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;

    shippingFirstName: string | null;
    shippingLastName: string | null;
    shippingEmail: string | null;
    shippingPhone: string | null;
    shippingAddressLine1: string | null;
    shippingAddressLine2: string | null;
    shippingCity: string | null;
    shippingState: string | null;
    shippingPostalCode: string | null;
    shippingCountry: string | null;

    billingFirstName: string | null;
    billingLastName: string | null;
    billingEmail: string | null;
    billingPhone: string | null;
    billingAddressLine1: string | null;
    billingAddressLine2: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingPostalCode: string | null;
    billingCountry: string | null;

    notes: string | null;
    trackingNumber: string | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;

    orderItems: Array<{
      productId: number;
      productName: string;
      productSku: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
  };
}

export interface UpdateOrderStatusJobData {
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  paymentStatus?: PaymentStatus;
}

export interface CancelOrderJobData {
  orderNumber: string;
  reason?: string;
}

@Processor('order-sync')
@Injectable()
export class OrderSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderSyncProcessor.name);

  constructor(private readonly orderSyncService: OrderSyncService) {
    super();
  }

  async process(
    job: Job<SyncOrderJobData | UpdateOrderStatusJobData | CancelOrderJobData>,
  ): Promise<any> {
    this.logger.log(`Processing order job [${job.id}] with name "${job.name}"`);

    try {
      switch (job.name) {
        case OrderJobName.SYNC:
          return await this.syncOrder(job as Job<SyncOrderJobData>);

        case OrderJobName.UPDATE_STATUS:
          return await this.updateOrderStatus(
            job as Job<UpdateOrderStatusJobData>,
          );

        case OrderJobName.CANCEL:
          return await this.cancelOrder(job as Job<CancelOrderJobData>);

        default:
          throw new UnrecoverableError(`Unsupported job name: ${job.name}`);
      }
    } catch (error: any) {
      this.handleError(error, job);
    }
  }

  private async syncOrder(job: Job<SyncOrderJobData>): Promise<any> {
    const { order } = job.data;

    this.logger.log(`Syncing order ${order.orderNumber} to admin service`);

    const result = await this.orderSyncService.syncOrder(order);

    if (!result.success) {
      throw new Error(result.message || 'Order sync failed');
    }

    this.logger.log(`Order ${order.orderNumber} synced successfully`);

    return {
      success: true,
      orderNumber: order.orderNumber,
      message: result.message,
    };
  }

  private async updateOrderStatus(
    job: Job<UpdateOrderStatusJobData>,
  ): Promise<any> {
    const { orderNumber, status, trackingNumber, paymentStatus } = job.data;

    this.logger.log(`Updating order ${orderNumber} status to "${status}"`);

    const result = await this.orderSyncService.updateOrderStatus(
      orderNumber,
      status,
      trackingNumber,
      paymentStatus,
    );

    if (!result.success) {
      throw new Error(result.message || 'Order status update failed');
    }

    this.logger.log(`Order ${orderNumber} status updated successfully`);

    return {
      success: true,
      orderNumber,
      message: result.message,
    };
  }

  private async cancelOrder(job: Job<CancelOrderJobData>): Promise<any> {
    const { orderNumber, reason } = job.data;

    this.logger.log(`Cancelling order ${orderNumber}`);

    const result = await this.orderSyncService.cancelOrder(orderNumber, reason);

    if (!result.success) {
      throw new Error(result.message || 'Order cancellation failed');
    }

    this.logger.log(`Order ${orderNumber} cancelled successfully`);

    return {
      success: true,
      orderNumber,
      message: result.message,
    };
  }

  private handleError(error: any, job: Job): never {
    const message = error?.message || 'Unknown order sync error';

    this.logger.error(`Order job [${job.id}] failed: ${message}`, error?.stack);

    if (error instanceof UnrecoverableError) {
      throw error;
    }

    throw error;
  }
}
