import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { MicroservicesService } from './microservices.service';
import { of, throwError } from 'rxjs';

describe('MicroservicesService', () => {
  let service: MicroservicesService;
  let adminServiceClient: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    const mockClientProxy = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicroservicesService,
        {
          provide: 'ADMIN_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<MicroservicesService>(MicroservicesService);
    adminServiceClient = module.get('ADMIN_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to admin service client', async () => {
      await service.onModuleInit();

      expect(adminServiceClient.connect).toHaveBeenCalled();
    });
  });

  describe('send', () => {
    it('should send message and return result', async () => {
      const pattern = 'get.product';
      const data = { id: 1 };
      const expectedResult = { id: 1, name: 'Test Product' };

      adminServiceClient.send.mockReturnValue(of(expectedResult));

      const result = await service.send(pattern, data);

      expect(result).toEqual(expectedResult);
      expect(adminServiceClient.send).toHaveBeenCalledWith(pattern, data);
    });

    it('should handle different data types', async () => {
      const pattern = 'create.order';
      const data = {
        userId: 1,
        items: [{ productId: 1, quantity: 2 }],
      };
      const expectedResult = { orderNumber: 'ORD-123', status: 'pending' };

      adminServiceClient.send.mockReturnValue(of(expectedResult));

      const result = await service.send(pattern, data);

      expect(result).toEqual(expectedResult);
      expect(adminServiceClient.send).toHaveBeenCalledWith(pattern, data);
    });

    it('should handle empty data', async () => {
      const pattern = 'ping';
      const expectedResult = { status: 'ok' };

      adminServiceClient.send.mockReturnValue(of(expectedResult));

      const result = await service.send(pattern, null);

      expect(result).toEqual(expectedResult);
      expect(adminServiceClient.send).toHaveBeenCalledWith(pattern, null);
    });

    it('should propagate errors from client', async () => {
      const pattern = 'get.product';
      const data = { id: 999 };
      const error = new Error('Product not found');

      adminServiceClient.send.mockReturnValue(throwError(() => error));

      await expect(service.send(pattern, data)).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('emit', () => {
    it('should emit event without waiting for response', async () => {
      const pattern = 'product.created';
      const data = { id: 1, name: 'New Product' };

      adminServiceClient.emit.mockReturnValue(undefined as any);

      await service.emit(pattern, data);

      expect(adminServiceClient.emit).toHaveBeenCalledWith(pattern, data);
    });

    it('should handle different event patterns', async () => {
      const patterns = ['order.created', 'order.updated', 'order.cancelled'];

      for (const pattern of patterns) {
        adminServiceClient.emit.mockReturnValue(undefined as any);
        await service.emit(pattern, {});
        expect(adminServiceClient.emit).toHaveBeenCalledWith(pattern, {});
      }
    });

    it('should handle complex event data', async () => {
      const pattern = 'inventory.adjusted';
      const data = {
        productId: 1,
        quantity: -5,
        reason: 'Order fulfillment',
        orderNumber: 'ORD-123',
      };

      adminServiceClient.emit.mockReturnValue(undefined as any);

      await service.emit(pattern, data);

      expect(adminServiceClient.emit).toHaveBeenCalledWith(pattern, data);
    });
  });
});
