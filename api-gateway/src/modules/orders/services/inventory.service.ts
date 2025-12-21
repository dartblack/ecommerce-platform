import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/common/services/http-client.service';

export interface ProductInfo {
  id: number;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  stockStatus: string;
  isActive: boolean;
}

type AdminServiceProductPayload =
  | ProductInfo
  | {
      id: number;
      name: string;
      sku: string;
      price: number | string;
      stock_quantity?: number | string;
      stock_status?: string;
      is_active?: boolean | number | string;
      // allow additional keys
      [key: string]: any;
    };

export interface InventoryCheckResult {
  available: boolean;
  product: ProductInfo;
  requestedQuantity: number;
  availableQuantity: number;
  message?: string;
}

interface AxiosError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: any;
      [key: string]: any;
    };
  };
  message?: string;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Build admin service URL
   */
  private buildAdminServiceUrl(path: string): string {
    const adminServiceUrl = this.configService.get<string>('adminService.url');
    const apiPrefix = this.configService.get<string>('adminService.apiPrefix');
    return `${adminServiceUrl}/${apiPrefix}/internal/${path}`;
  }

  /**
   * Get standard headers for API requests
   */
  private getStandardHeaders(
    includeContentType = false,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  /**
   * Handle HTTP errors consistently
   */
  private handleHttpError(
    error: any,
    context: string,
    custom404Message?: string,
  ): never {
    const axiosError = error as AxiosError;

    if (axiosError.response?.status === 404 && custom404Message) {
      throw new BadRequestException(custom404Message);
    }

    const errorMessage =
      axiosError.response?.data?.message || axiosError.message;
    this.logger.error(`${context}: ${errorMessage}`);
    throw new BadRequestException(`${context}: ${errorMessage}`);
  }

  /**
   * Normalize product payloads coming from admin-service (snake_case) into the
   * camelCase shape used by this gateway.
   */
  private normalizeProductInfo(raw: AdminServiceProductPayload): ProductInfo {
    const anyRaw = raw as any;

    const stockQuantity = anyRaw.stockQuantity ?? anyRaw.stock_quantity ?? 0;

    const stockStatus =
      anyRaw.stockStatus ?? anyRaw.stock_status ?? 'out_of_stock';

    const isActiveRaw = anyRaw.isActive ?? anyRaw.is_active ?? false;

    const isActive =
      typeof isActiveRaw === 'boolean'
        ? isActiveRaw
        : typeof isActiveRaw === 'number'
          ? isActiveRaw === 1
          : typeof isActiveRaw === 'string'
            ? isActiveRaw === '1' || isActiveRaw.toLowerCase() === 'true'
            : false;

    return {
      id: Number(anyRaw.id),
      name: String(anyRaw.name ?? ''),
      sku: String(anyRaw.sku ?? ''),
      price: Number(anyRaw.price ?? 0),
      stockQuantity: Number(stockQuantity ?? 0),
      stockStatus: String(stockStatus ?? 'out_of_stock'),
      isActive,
    };
  }

  /**
   * Validate product availability and return check result
   */
  private validateProductAvailability(
    product: ProductInfo,
    requestedQuantity: number,
  ): InventoryCheckResult {
    if (!product.isActive) {
      return {
        available: false,
        product,
        requestedQuantity,
        availableQuantity: product.stockQuantity,
        message: `Product "${product.name}" is not active`,
      };
    }

    if (product.stockStatus === 'out_of_stock') {
      return {
        available: false,
        product,
        requestedQuantity,
        availableQuantity: product.stockQuantity,
        message: `Product "${product.name}" is out of stock`,
      };
    }

    if (product.stockQuantity < requestedQuantity) {
      return {
        available: false,
        product,
        requestedQuantity,
        availableQuantity: product.stockQuantity,
        message: `Insufficient stock for product "${product.name}". Available: ${product.stockQuantity}, Requested: ${requestedQuantity}`,
      };
    }

    return {
      available: true,
      product,
      requestedQuantity,
      availableQuantity: product.stockQuantity,
    };
  }

  /**
   * Create a not-found product result
   */
  private createNotFoundProductResult(
    productId: number,
    requestedQuantity: number,
  ): InventoryCheckResult {
    return {
      available: false,
      product: {
        id: productId,
        name: `Product ${productId}`,
        sku: '',
        price: 0,
        stockQuantity: 0,
        stockStatus: 'out_of_stock',
        isActive: false,
      },
      requestedQuantity,
      availableQuantity: 0,
      message: `Product ${productId} not found`,
    };
  }

  /**
   * Check inventory availability for a single product
   */
  async checkProductAvailability(
    productId: number,
    requestedQuantity: number,
  ): Promise<InventoryCheckResult> {
    try {
      const productUrl = this.buildAdminServiceUrl(`products/${productId}`);
      const headers = this.getStandardHeaders();

      this.logger.debug(
        `Checking inventory for product ${productId}, requested quantity: ${requestedQuantity}`,
      );

      const response = await this.httpClient.get<{
        success: boolean;
        data?: AdminServiceProductPayload;
      }>(productUrl, { headers });

      if (!response.data?.success || !response.data?.data) {
        throw new BadRequestException(`Product ${productId} not found`);
      }

      const product = this.normalizeProductInfo(response.data.data);
      return this.validateProductAvailability(product, requestedQuantity);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleHttpError(
        error,
        `Failed to check inventory for product ${productId}`,
        `Product ${productId} not found`,
      );
    }
  }

  /**
   * Check inventory availability for multiple products
   */
  async checkMultipleProductsAvailability(
    orderItems: Array<{ productId: number; quantity: number }>,
  ): Promise<InventoryCheckResult[]> {
    try {
      const batchUrl = this.buildAdminServiceUrl('products/batch');
      const productIds = orderItems.map((item) => item.productId);
      const headers = this.getStandardHeaders(true);

      this.logger.debug(
        `Checking inventory for products: ${productIds.join(', ')}`,
      );

      const response = await this.httpClient.post<{
        success: boolean;
        data?: AdminServiceProductPayload[];
      }>(batchUrl, { ids: productIds }, { headers });

      if (!response.data?.success || !response.data?.data) {
        throw new BadRequestException('Failed to fetch product information');
      }

      const products = response.data.data.map((p) =>
        this.normalizeProductInfo(p),
      );
      const productMap = new Map(products.map((p) => [p.id, p]));

      const results: InventoryCheckResult[] = [];

      for (const orderItem of orderItems) {
        const product = productMap.get(orderItem.productId);

        if (!product) {
          results.push(
            this.createNotFoundProductResult(
              orderItem.productId,
              orderItem.quantity,
            ),
          );
          continue;
        }

        results.push(
          this.validateProductAvailability(product, orderItem.quantity),
        );
      }

      return results;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleHttpError(
        error,
        'Failed to check inventory for multiple products',
      );
    }
  }

  /**
   * Deduct inventory for an order
   */
  async deductInventoryForOrder(
    orderNumber: string,
    items: Array<{ productId: number; quantity: number }>,
  ): Promise<{
    success: boolean;
    message?: string;
    data?: Array<{
      product_id: number;
      product_name: string;
      quantity_deducted: number;
      quantity_before: number;
      quantity_after: number;
    }>;
  }> {
    try {
      const deductUrl = this.buildAdminServiceUrl('inventory/deduct-for-order');
      const headers = this.getStandardHeaders(true);

      this.logger.log(`Deducting inventory for order ${orderNumber}`);

      const response = await this.httpClient.post<{
        success: boolean;
        message?: string;
        data?: {
          order_number: string;
          items: Array<{
            product_id: number;
            product_name: string;
            quantity_deducted: number;
            quantity_before: number;
            quantity_after: number;
          }>;
        };
      }>(
        deductUrl,
        {
          order_number: orderNumber,
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
        },
        { headers },
      );

      if (!response.data?.success) {
        throw new BadRequestException(
          response.data?.message || 'Failed to deduct inventory',
        );
      }

      this.logger.log(
        `Inventory deducted successfully for order ${orderNumber}`,
      );

      return {
        success: true,
        message: response.data.message,
        data: response.data.data?.items,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleHttpError(
        error,
        `Failed to deduct inventory for order ${orderNumber}`,
      );
    }
  }
}
