import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { OrderService } from './order.service';
import { CreateOrderCommand } from '../commands/create-order.command';
import { UpdateOrderStatusCommand } from '../commands/update-order-status.command';
import { CancelOrderCommand } from '../commands/cancel-order.command';
import { GetOrderQuery } from '../queries/get-order.query';
import { GetOrdersQuery } from '../queries/get-orders.query';
import { Order, OrderStatus } from '../../../database/entities/order.entity';
import { GetOrdersResult } from '../handlers/get-orders.handler';

describe('OrderService', () => {
  let service: OrderService;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockOrder: Order = {
    id: 1,
    orderNumber: 'ORD-123',
    userId: 1,
    status: 'pending',
    paymentStatus: 'pending' as any,
    paymentMethod: 'credit_card',
    subtotal: 100.0,
    tax: 10.0,
    shipping: 5.0,
    discount: 0,
    total: 115.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Order;

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order via command bus', async () => {
      const command = new CreateOrderCommand(
        1,
        [{ productId: 1, quantity: 2 }],
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          addressLine1: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'US',
        },
        {
          cardNumber: '4111111111111111',
          cardHolderName: 'John Doe',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          addressLine1: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'US',
        },
      );

      commandBus.execute.mockResolvedValue(mockOrder);

      const result = await service.createOrder(command);

      expect(result).toEqual(mockOrder);
      expect(commandBus.execute).toHaveBeenCalledWith(command);
    });

    it('should handle command execution errors', async () => {
      const command = new CreateOrderCommand(
        1,
        [],
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          addressLine1: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'US',
        },
        {
          cardNumber: '4111111111111111',
          cardHolderName: 'John Doe',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
        },
      );

      const error = new Error('Invalid order data');
      commandBus.execute.mockRejectedValue(error);

      await expect(service.createOrder(command)).rejects.toThrow(
        'Invalid order data',
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status via command bus', async () => {
      const command = new UpdateOrderStatusCommand(
        1,
        OrderStatus.SHIPPED,
        'TRACK-001',
      );

      const updatedOrder = { ...mockOrder, status: OrderStatus.SHIPPED };
      commandBus.execute.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus(command);

      expect(result).toEqual(updatedOrder);
      expect(result.status).toBe(OrderStatus.SHIPPED);
      expect(commandBus.execute).toHaveBeenCalledWith(command);
    });

    it('should handle status update errors', async () => {
      const command = new UpdateOrderStatusCommand(999, OrderStatus.SHIPPED);

      const error = new Error('Order not found');
      commandBus.execute.mockRejectedValue(error);

      await expect(service.updateOrderStatus(command)).rejects.toThrow(
        'Order not found',
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order via command bus', async () => {
      const command = new CancelOrderCommand(1, undefined, 'Customer request');

      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
      commandBus.execute.mockResolvedValue(cancelledOrder);

      const result = await service.cancelOrder(command);

      expect(result).toEqual(cancelledOrder);
      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(commandBus.execute).toHaveBeenCalledWith(command);
    });

    it('should handle cancellation errors', async () => {
      const command = new CancelOrderCommand(999);

      const error = new Error('Cannot cancel order');
      commandBus.execute.mockRejectedValue(error);

      await expect(service.cancelOrder(command)).rejects.toThrow(
        'Cannot cancel order',
      );
    });
  });

  describe('getOrder', () => {
    it('should get order by id via query bus', async () => {
      const query = new GetOrderQuery(1);

      queryBus.execute.mockResolvedValue(mockOrder);

      const result = await service.getOrder(1);

      expect(result).toEqual(mockOrder);
      expect(queryBus.execute).toHaveBeenCalledWith(query);
    });

    it('should return null when order not found', async () => {
      const query = new GetOrderQuery(999);

      queryBus.execute.mockResolvedValue(null);

      const result = await service.getOrder(999);

      expect(result).toBeNull();
      expect(queryBus.execute).toHaveBeenCalledWith(query);
    });

    it('should handle query execution errors', async () => {
      const query = new GetOrderQuery(1);

      const error = new Error('Database error');
      queryBus.execute.mockRejectedValue(error);

      await expect(service.getOrder(1)).rejects.toThrow('Database error');
    });
  });

  describe('getOrders', () => {
    it('should get orders via query bus', async () => {
      const query = new GetOrdersQuery(1, undefined, 1, 10);

      const mockResult: GetOrdersResult = {
        orders: [mockOrder],
        total: 1,
        page: 1,
        limit: 10,
      };

      queryBus.execute.mockResolvedValue(mockResult);

      const result = await service.getOrders(query);

      expect(result).toEqual(mockResult);
      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(queryBus.execute).toHaveBeenCalledWith(query);
    });

    it('should handle empty results', async () => {
      const query = new GetOrdersQuery(undefined, undefined, 1, 10);

      const mockResult: GetOrdersResult = {
        orders: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      queryBus.execute.mockResolvedValue(mockResult);

      const result = await service.getOrders(query);

      expect(result.orders).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle query with filters', async () => {
      const query = new GetOrdersQuery(1, OrderStatus.PENDING, 1, 10);

      const mockResult: GetOrdersResult = {
        orders: [mockOrder],
        total: 1,
        page: 1,
        limit: 10,
      };

      queryBus.execute.mockResolvedValue(mockResult);

      const result = await service.getOrders(query);

      expect(result).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(query);
    });

    it('should handle query execution errors', async () => {
      const query = new GetOrdersQuery(undefined, undefined, 1, 10);

      const error = new Error('Database error');
      queryBus.execute.mockRejectedValue(error);

      await expect(service.getOrders(query)).rejects.toThrow('Database error');
    });
  });
});
