import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { HttpClientService } from 'src/common/services/http-client.service';
import { AxiosResponse, AxiosError } from 'axios';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpClient: jest.Mocked<HttpClientService>;

  beforeEach(async () => {
    const mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
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
        InventoryService,
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

    service = module.get<InventoryService>(InventoryService);
    httpClient = module.get(HttpClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkProductAvailability', () => {
    it('should return available when product is active and in stock', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            name: 'Test Product',
            sku: 'SKU-001',
            price: 99.99,
            stock_quantity: 10,
            stock_status: 'in_stock',
            is_active: true,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.checkProductAvailability(1, 5);

      expect(result.available).toBe(true);
      expect(result.product.id).toBe(1);
      expect(result.requestedQuantity).toBe(5);
      expect(result.availableQuantity).toBe(10);
      expect(result.message).toBeUndefined();
    });

    it('should return unavailable when product is not active', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            name: 'Test Product',
            sku: 'SKU-001',
            price: 99.99,
            stock_quantity: 10,
            stock_status: 'in_stock',
            is_active: false,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.checkProductAvailability(1, 5);

      expect(result.available).toBe(false);
      expect(result.message).toContain('not active');
    });

    it('should return unavailable when product is out of stock', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            name: 'Test Product',
            sku: 'SKU-001',
            price: 99.99,
            stock_quantity: 0,
            stock_status: 'out_of_stock',
            is_active: true,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.checkProductAvailability(1, 5);

      expect(result.available).toBe(false);
      expect(result.message).toContain('out of stock');
    });

    it('should return unavailable when insufficient quantity', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            name: 'Test Product',
            sku: 'SKU-001',
            price: 99.99,
            stock_quantity: 3,
            stock_status: 'in_stock',
            is_active: true,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.checkProductAvailability(1, 5);

      expect(result.available).toBe(false);
      expect(result.message).toContain('Insufficient stock');
      expect(result.message).toContain('Available: 3');
      expect(result.message).toContain('Requested: 5');
    });

    it('should throw BadRequestException when product not found', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: false,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.get.mockResolvedValue(mockResponse);

      await expect(service.checkProductAvailability(999, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle 404 error', async () => {
      const axiosError: AxiosError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Product not found' },
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        toJSON: jest.fn(),
        name: 'AxiosError',
        message: 'Request failed',
      };

      httpClient.get.mockRejectedValue(axiosError);

      await expect(service.checkProductAvailability(999, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should normalize snake_case product data', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            name: 'Test Product',
            sku: 'SKU-001',
            price: '99.99',
            stock_quantity: '10',
            stock_status: 'in_stock',
            is_active: 1,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.checkProductAvailability(1, 5);

      expect(result.product.price).toBe(99.99);
      expect(result.product.stockQuantity).toBe(10);
      expect(result.product.isActive).toBe(true);
    });

    it('should normalize boolean string values', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            name: 'Test Product',
            sku: 'SKU-001',
            price: 99.99,
            stock_quantity: 10,
            stock_status: 'in_stock',
            is_active: 'true',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.checkProductAvailability(1, 5);

      expect(result.product.isActive).toBe(true);
    });
  });

  describe('checkMultipleProductsAvailability', () => {
    it('should check multiple products successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: [
            {
              id: 1,
              name: 'Product 1',
              sku: 'SKU-001',
              price: 99.99,
              stock_quantity: 10,
              stock_status: 'in_stock',
              is_active: true,
            },
            {
              id: 2,
              name: 'Product 2',
              sku: 'SKU-002',
              price: 149.99,
              stock_quantity: 5,
              stock_status: 'in_stock',
              is_active: true,
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      const results = await service.checkMultipleProductsAvailability([
        { productId: 1, quantity: 5 },
        { productId: 2, quantity: 3 },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].available).toBe(true);
      expect(results[1].available).toBe(true);
      expect(httpClient.post).toHaveBeenCalledWith(
        'http://admin-service/admin-api/internal/products/batch',
        { ids: [1, 2] },
        expect.any(Object),
      );
    });

    it('should handle missing products in batch', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: [
            {
              id: 1,
              name: 'Product 1',
              sku: 'SKU-001',
              price: 99.99,
              stock_quantity: 10,
              stock_status: 'in_stock',
              is_active: true,
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      const results = await service.checkMultipleProductsAvailability([
        { productId: 1, quantity: 5 },
        { productId: 999, quantity: 3 },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].available).toBe(true);
      expect(results[1].available).toBe(false);
      expect(results[1].message).toContain('not found');
    });

    it('should handle batch API errors', async () => {
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

      await expect(
        service.checkMultipleProductsAvailability([
          { productId: 1, quantity: 5 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deductInventoryForOrder', () => {
    it('should deduct inventory successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          message: 'Inventory deducted',
          data: {
            order_number: 'ORD-123',
            items: [
              {
                product_id: 1,
                product_name: 'Test Product',
                quantity_deducted: 5,
                quantity_before: 10,
                quantity_after: 5,
              },
            ],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      const result = await service.deductInventoryForOrder('ORD-123', [
        { productId: 1, quantity: 5 },
      ]);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Inventory deducted');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].product_id).toBe(1);
      expect(result.data[0].quantity_deducted).toBe(5);
      expect(httpClient.post).toHaveBeenCalledWith(
        'http://admin-service/admin-api/internal/inventory/deduct-for-order',
        {
          order_number: 'ORD-123',
          items: [{ product_id: 1, quantity: 5 }],
        },
        expect.any(Object),
      );
    });

    it('should throw BadRequestException when deduction fails', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: false,
          message: 'Insufficient stock',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.post.mockResolvedValue(mockResponse);

      await expect(
        service.deductInventoryForOrder('ORD-123', [
          { productId: 1, quantity: 100 },
        ]),
      ).rejects.toThrow(BadRequestException);
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

      await expect(
        service.deductInventoryForOrder('ORD-123', [
          { productId: 1, quantity: 5 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('normalizeProductInfo', () => {
    it('should handle camelCase product data', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            name: 'Test Product',
            sku: 'SKU-001',
            price: 99.99,
            stockQuantity: 10,
            stockStatus: 'in_stock',
            isActive: true,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.checkProductAvailability(1, 5);

      expect(result.product.stockQuantity).toBe(10);
      expect(result.product.stockStatus).toBe('in_stock');
      expect(result.product.isActive).toBe(true);
    });

    it('should handle default values for missing fields', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            name: 'Test Product',
            sku: 'SKU-001',
            price: 99.99,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpClient.get.mockResolvedValue(mockResponse);

      const result = await service.checkProductAvailability(1, 5);

      expect(result.product.stockQuantity).toBe(0);
      expect(result.product.stockStatus).toBe('out_of_stock');
      expect(result.product.isActive).toBe(false);
    });
  });
});
