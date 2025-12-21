import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/common/services/http-client.service';
import { Order, PaymentStatus } from '../../../database/entities/order.entity';

interface AdminServiceResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ServiceResult {
  success: boolean;
  message?: string;
}

@Injectable()
export class OrderSyncService {
  private readonly logger = new Logger(OrderSyncService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService,
  ) {
    const adminUrl = this.configService.get<string>('adminService.url');
    const apiPrefix = this.configService.get<string>('adminService.apiPrefix');
    this.baseUrl = `${adminUrl}/${apiPrefix}/internal`;
  }

  async syncOrder(order: Order | Record<string, any>): Promise<ServiceResult> {
    const orderNumber = this.resolveOrderNumber(order);
    const idempotencyKey = `sync-order-${orderNumber}`;

    try {
      this.logger.log(`Syncing order ${orderNumber} to admin-service`);

      const response = await this.httpClient.post<AdminServiceResponse>(
        `${this.baseUrl}/orders/sync`,
        this.transformOrder(order),
        { headers: this.defaultHeaders(idempotencyKey) },
      );

      this.assertSuccess(response.data);

      this.logger.log(`Order ${orderNumber} synced successfully`);

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return this.handleError(error, `sync order ${orderNumber}`);
    }
  }

  async updateOrderStatus(
    orderNumber: string,
    status: string,
    trackingNumber?: string,
    paymentStatus?: PaymentStatus,
  ): Promise<ServiceResult> {
    const idempotencyKey = `update-order-status-${orderNumber}-${status}${trackingNumber ? `-${trackingNumber}` : ''}`;

    try {
      this.logger.log(`Updating order ${orderNumber} status to "${status}"`);

      const response = await this.httpClient.put<AdminServiceResponse>(
        `${this.baseUrl}/orders/${orderNumber}/status`,
        {
          status,
          tracking_number: trackingNumber,
          payment_status: paymentStatus,
        },
        { headers: this.defaultHeaders(idempotencyKey) },
      );

      this.assertSuccess(response.data);

      this.logger.log(`Order ${orderNumber} status updated successfully`);

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return this.handleError(error, `update status for order ${orderNumber}`);
    }
  }

  async cancelOrder(
    orderNumber: string,
    reason?: string,
  ): Promise<ServiceResult> {
    try {
      this.logger.log(`Cancelling order ${orderNumber}`);

      const response = await this.httpClient.put<AdminServiceResponse>(
        `${this.baseUrl}/orders/${orderNumber}/cancel`,
        { reason },
        { headers: this.defaultHeaders() },
      );

      this.assertSuccess(response.data);

      this.logger.log(`Order ${orderNumber} cancelled successfully`);

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return this.handleError(error, `cancel order ${orderNumber}`);
    }
  }

  private defaultHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return headers;
  }

  private assertSuccess(response?: AdminServiceResponse): void {
    if (!response?.success) {
      throw new Error(response?.message || 'Admin service error');
    }
  }

  private handleError(error: any, action: string): ServiceResult {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Unknown admin-service error';

    this.logger.error(`Failed to ${action}: ${message}`, error?.stack);

    return {
      success: false,
      message,
    };
  }

  private resolveOrderNumber(order: any): string {
    return order.orderNumber || order.order_number || 'UNKNOWN';
  }

  private transformOrder(order: Order | any): Record<string, any> {
    const iso = (value: any): string | null => {
      if (!value) return null;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'string') return value;
      return null;
    };

    const pick = (camel: string, snake: string) => order[camel] ?? order[snake];

    return {
      order_number: this.resolveOrderNumber(order),
      user_id: pick('userId', 'user_id'),
      status: order.status,
      payment_status: pick('paymentStatus', 'payment_status'),
      payment_method: pick('paymentMethod', 'payment_method'),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,

      shipping_first_name: pick('shippingFirstName', 'shipping_first_name'),
      shipping_last_name: pick('shippingLastName', 'shipping_last_name'),
      shipping_email: pick('shippingEmail', 'shipping_email'),
      shipping_phone: pick('shippingPhone', 'shipping_phone'),
      shipping_address_line_1: pick(
        'shippingAddressLine1',
        'shipping_address_line_1',
      ),
      shipping_address_line_2: pick(
        'shippingAddressLine2',
        'shipping_address_line_2',
      ),
      shipping_city: pick('shippingCity', 'shipping_city'),
      shipping_state: pick('shippingState', 'shipping_state'),
      shipping_postal_code: pick('shippingPostalCode', 'shipping_postal_code'),
      shipping_country: pick('shippingCountry', 'shipping_country'),

      billing_first_name: pick('billingFirstName', 'billing_first_name'),
      billing_last_name: pick('billingLastName', 'billing_last_name'),
      billing_email: pick('billingEmail', 'billing_email'),
      billing_phone: pick('billingPhone', 'billing_phone'),
      billing_address_line_1: pick(
        'billingAddressLine1',
        'billing_address_line_1',
      ),
      billing_address_line_2: pick(
        'billingAddressLine2',
        'billing_address_line_2',
      ),
      billing_city: pick('billingCity', 'billing_city'),
      billing_state: pick('billingState', 'billing_state'),
      billing_postal_code: pick('billingPostalCode', 'billing_postal_code'),
      billing_country: pick('billingCountry', 'billing_country'),

      notes: order.notes,
      tracking_number: pick('trackingNumber', 'tracking_number'),
      shipped_at: iso(pick('shippedAt', 'shipped_at')),
      delivered_at: iso(pick('deliveredAt', 'delivered_at')),
      cancelled_at: iso(pick('cancelledAt', 'cancelled_at')),

      order_items: Array.isArray(order.orderItems)
        ? order.orderItems.map((item: any) => ({
            product_id: item.productId ?? item.product_id,
            product_name: item.productName ?? item.product_name,
            product_sku: item.productSku ?? item.product_sku,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          }))
        : [],
    };
  }
}
