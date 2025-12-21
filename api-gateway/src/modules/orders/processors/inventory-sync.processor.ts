import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';

export enum InventoryJobName {
  DEDUCT = 'deduct-inventory',
}

export interface DeductInventoryJobData {
  orderNumber: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

@Processor('inventory-sync')
@Injectable()
export class InventorySyncProcessor extends WorkerHost {
  private readonly logger = new Logger(InventorySyncProcessor.name);

  constructor(private readonly inventoryService: InventoryService) {
    super();
  }

  async process(job: Job<DeductInventoryJobData>): Promise<any> {
    this.logger.log(
      `Processing inventory job [${job.id}] with name "${job.name}" for order ${job.data.orderNumber}`,
    );

    try {
      if (job.name !== InventoryJobName.DEDUCT) {
        throw new UnrecoverableError(
          `Unsupported inventory job name: ${job.name}. Expected: ${InventoryJobName.DEDUCT}`,
        );
      }

      return await this.deductInventory(job);
    } catch (error: any) {
      this.handleError(error, job);
    }
  }

  private async deductInventory(
    job: Job<DeductInventoryJobData>,
  ): Promise<any> {
    const { orderNumber, items } = job.data;

    this.logger.log(`Deducting inventory for order ${orderNumber}`);

    const result = await this.inventoryService.deductInventoryForOrder(
      orderNumber,
      items,
    );

    if (result.success) {
      this.logger.log(
        `Inventory updated successfully for order ${orderNumber}`,
      );
      if (result.data) {
        result.data.forEach((item) => {
          this.logger.debug(
            `Product ${item.product_name}: ${item.quantity_before} -> ${item.quantity_after} (deducted ${item.quantity_deducted})`,
          );
        });
      }
      return {
        success: true,
        message: result.message,
        orderNumber,
        data: result.data,
      };
    } else {
      throw new Error(result.message || 'Failed to update inventory');
    }
  }

  private handleError(error: any, job: Job): never {
    const message = error?.message || 'Unknown inventory sync error';

    this.logger.error(
      `Inventory job [${job.id}] failed: ${message}`,
      error?.stack,
    );

    if (error instanceof UnrecoverableError) {
      throw error;
    }

    throw error;
  }
}
