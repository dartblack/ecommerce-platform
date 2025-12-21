import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OrderSyncService } from './order-sync.service';
import { HttpClientService } from 'src/common/services/http-client.service';
import { Order, PaymentStatus } from '../../../database/entities/order.entity';
import { AxiosResponse, AxiosError } from 'axios';

describe('OrderSyncService', () => {
  let service: OrderSyncService;
  let httpClient: jest.Mocked<HttpClientService>;
  let configService: jest.Mocked<ConfigService>;

  const mockOrder: Partial<Order> = {
    orderNumber: 'ORD-123',
    userId: 1,
    status: 'pending',
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: 'credit_card',
    subtotal: 100.0,
    tax: 10.0,
    shipping: 5.0,
    discount: 0,
    total: 115.0,
    shippingFirstName: 'John',
    shippingLastName: 'Doe',
    shippingEmail: 'john@example.com',
    shippingPhone: '1234567890',
    shippingAddressLine1: '123 Main St',
    shippingCity: 'New York',
    shippingState: 'NY',
    shippingPostalCode: '10001',
    shippingCountry: 'US',
    billingFirstName: 'John',
    billingLastName: 'Doe',
    billingEmail: 'john@example.com',
    billingPhone: '1234567890',
    billingAddressLine1: '123 Main St',
    billingCity: 'New York',
    billingState: 'NY',
    billingPostalCode: '10001',
    billingCountry: 'US',
    orderItems: [
      {
        productId: 1,
        productName: 'Test Product',
        productSku: 'SKU-001',
        quantity: 2,
        price: 50.0,
        subtotal: 100.0,
      } as any,
    ],
  };

  beforeEach(async () => {
    const mockHttpClient = {
      post: jest.fn(),
      put: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          'adminService.url': 'http://admin-service',
          'adminService.apiPrefix': 'admin-api',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderSyncService,
        {
          provide: HttpClientService,
          useValue: mockHttpClient,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OrderSyncService>(OrderSyncService);
    httpClient = module.get(HttpClientService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct base URL', () => {
      expect(configService.get).toHaveBeenCalledWith('adminService.url');
      expect(configService.get).toHaveBeenCalledWith('adminService.apiPrefix');
    });
  });

  describe('syncOrder', () => {
    it('should sync order successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          message: 'Order synced successfully',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      const result = await service.syncOrder(mockOrder as Order);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Order synced successfully');
      expect(httpClient.post).toHaveBeenCalledWith(
        'http://admin-service/admin-api/internal/orders/sync',
        expect.objectContaining({
          order_number: 'ORD-123',
          user_id: 1,
          status: 'pending',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': 'sync-order-ORD-123',
          }),
        }),
      );
    });

    it('should handle order with order_number field', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      const orderWithSnakeCase = {
        order_number: 'ORD-456',
        user_id: 2,
      };

      await service.syncOrder(orderWithSnakeCase);

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          order_number: 'ORD-456',
          user_id: 2,
        }),
        expect.any(Object),
      );
    });

    it('should handle order without orderNumber', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      const orderWithoutNumber = { userId: 1 };

      await service.syncOrder(orderWithoutNumber);

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          order_number: 'UNKNOWN',
        }),
        expect.any(Object),
      );
    });

    it('should transform order items correctly', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      await service.syncOrder(mockOrder as Order);

      const callArgs = httpClient.post.mock.calls[0];
      const transformedOrder = callArgs[1];

      expect(transformedOrder.order_items).toHaveLength(1);
      expect(transformedOrder.order_items[0]).toEqual({
        product_id: 1,
        product_name: 'Test Product',
        product_sku: 'SKU-001',
        quantity: 2,
        price: 50.0,
        subtotal: 100.0,
      });
    });

    it('should handle API error response', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: false,
          message: 'Validation failed',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      const result = await service.syncOrder(mockOrder as Order);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Validation failed');
    });

    it('should handle HTTP errors', async () => {
      const axiosError: AxiosError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error' },
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        toJSON: jest.fn(),
        name: 'AxiosError',
        message: 'Request failed',
      };

      httpClient.post.mockRejectedValue(axiosError);

      const result = await service.syncOrder(mockOrder as Order);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Server error');
    });

    it('should handle errors without response data', async () => {
      const error = new Error('Network error');
      httpClient.post.mockRejectedValue(error);

      const result = await service.syncOrder(mockOrder as Order);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          message: 'Status updated',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.put.mockResolvedValue(mockResponse);

      const result = await service.updateOrderStatus(
        'ORD-123',
        'shipped',
        'TRACK-001',
        PaymentStatus.PAID,
      );

      expect(result.success).toBe(true);
      expect(httpClient.put).toHaveBeenCalledWith(
        'http://admin-service/admin-api/internal/orders/ORD-123/status',
        {
          status: 'shipped',
          tracking_number: 'TRACK-001',
          payment_status: PaymentStatus.PAID,
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': 'update-order-status-ORD-123-shipped-TRACK-001',
          }),
        }),
      );
    });

    it('should update status without tracking number', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.put.mockResolvedValue(mockResponse);

      await service.updateOrderStatus('ORD-123', 'processing');

      expect(httpClient.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'processing',
          tracking_number: undefined,
        }),
        expect.any(Object),
      );
    });

    it('should handle errors when updating status', async () => {
      const axiosError: AxiosError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Order not found' },
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        toJSON: jest.fn(),
        name: 'AxiosError',
        message: 'Request failed',
      };

      httpClient.put.mockRejectedValue(axiosError);

      const result = await service.updateOrderStatus('ORD-999', 'shipped');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Order not found');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          message: 'Order cancelled',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.put.mockResolvedValue(mockResponse);

      const result = await service.cancelOrder('ORD-123', 'Customer request');

      expect(result.success).toBe(true);
      expect(httpClient.put).toHaveBeenCalledWith(
        'http://admin-service/admin-api/internal/orders/ORD-123/cancel',
        { reason: 'Customer request' },
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Idempotency-Key': expect.anything(),
          }),
        }),
      );
    });

    it('should cancel order without reason', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.put.mockResolvedValue(mockResponse);

      await service.cancelOrder('ORD-123');

      expect(httpClient.put).toHaveBeenCalledWith(
        expect.any(String),
        { reason: undefined },
        expect.any(Object),
      );
    });

    it('should handle errors when cancelling order', async () => {
      const axiosError: AxiosError = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Cannot cancel order' },
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        toJSON: jest.fn(),
        name: 'AxiosError',
        message: 'Request failed',
      };

      httpClient.put.mockRejectedValue(axiosError);

      const result = await service.cancelOrder('ORD-123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot cancel order');
    });
  });

  describe('transformOrder', () => {
    it('should transform date fields to ISO strings', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      const orderWithDates = {
        ...mockOrder,
        shippedAt: new Date('2024-01-01'),
        deliveredAt: '2024-01-02T00:00:00Z',
        cancelledAt: null,
      };

      await service.syncOrder(orderWithDates as any);

      const callArgs = httpClient.post.mock.calls[0];
      const transformedOrder = callArgs[1];

      expect(transformedOrder.shipped_at).toBe('2024-01-01T00:00:00.000Z');
      expect(transformedOrder.delivered_at).toBe('2024-01-02T00:00:00Z');
      expect(transformedOrder.cancelled_at).toBeNull();
    });
  });
});
