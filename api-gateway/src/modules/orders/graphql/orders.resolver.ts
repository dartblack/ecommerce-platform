import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Context,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { Order, OrderListResponse, ShippingAddress } from './types/order.type';
import { CreateOrderInput } from './inputs/create-order.input';
import { GetOrdersInput } from './inputs/get-orders.input';
import { Order as OrderEntity } from '../../../database/entities/order.entity';
import { GetOrderQuery } from '../queries/get-order.query';
import { GetOrdersQuery } from '../queries/get-orders.query';
import { CreateOrderCommand } from '../commands/create-order.command';
import { CancelOrderCommand } from '../commands/cancel-order.command';
import { ConfirmPaymentCommand } from '../commands/confirm-payment.command';
import { CreateOrderDto } from '../dtos/create-order.dto';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Query(() => OrderListResponse, { name: 'orders' })
  async getOrders(
    @Args('input', { nullable: true }) input?: GetOrdersInput,
    @Context() context?: any,
  ): Promise<OrderListResponse> {
    const userId: number = context?.req?.user?.id;
    const limit = input?.limit || 20;
    const pageNum = input?.page || 1;
    const query = new GetOrdersQuery(userId, input?.status, pageNum, limit);
    const result = await this.queryBus.execute(query);

    const orders = result.orders || [];
    const total = result.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: orders,
      meta: {
        page: pageNum,
        limit,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }

  @Query(() => Order, { name: 'order', nullable: true })
  async getOrder(
    @Args('id', { type: () => Int }) id: number,
    @Context() context?: any,
  ): Promise<Order | null> {
    const userId: number = context?.req?.user?.id;
    const query = new GetOrderQuery(id, userId);
    return await this.queryBus.execute(query);
  }

  @Mutation(() => Order, { name: 'createOrder' })
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @Context() context?: any,
  ): Promise<Order> {
    const userId: number = context?.req?.user?.id || null;

    const createOrderDto: CreateOrderDto = {
      orderItems: input.orderItems,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress,
      paymentMethod: input.paymentMethod,
      paymentDetails: input.paymentDetails,
      notes: input.notes,
    };

    const command = new CreateOrderCommand(
      userId,
      createOrderDto.orderItems,
      createOrderDto.shippingAddress,
      createOrderDto.paymentDetails,
      createOrderDto.billingAddress,
      createOrderDto.paymentMethod,
      createOrderDto.notes,
    );

    return await this.commandBus.execute(command);
  }

  @Mutation(() => Order, { name: 'cancelOrder' })
  async cancelOrder(
    @Args('id', { type: () => Int }) id: number,
    @Args('reason', { nullable: true }) reason?: string,
    @Context() context?: any,
  ): Promise<Order> {
    const userId: number = context?.req?.user?.id;
    const command = new CancelOrderCommand(id, userId, reason);
    return await this.commandBus.execute(command);
  }

  @Mutation(() => Order, { name: 'confirmPayment' })
  async confirmPayment(
    @Args('id', { type: () => Int }) id: number,
    @Context() context?: any,
  ): Promise<Order> {
    const userId: number = context?.req?.user?.id;
    const command = new ConfirmPaymentCommand(id, userId);
    return await this.commandBus.execute(command);
  }

  @ResolveField(() => ShippingAddress, { nullable: true })
  shippingAddress(@Parent() order: OrderEntity): ShippingAddress | null {
    if (!order.shippingFirstName) return null;
    return {
      firstName: order.shippingFirstName,
      lastName: order.shippingLastName,
      email: order.shippingEmail,
      phone: order.shippingPhone,
      addressLine1: order.shippingAddressLine1,
      addressLine2: order.shippingAddressLine2,
      city: order.shippingCity,
      state: order.shippingState,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
    };
  }

  @ResolveField(() => ShippingAddress, { nullable: true })
  billingAddress(@Parent() order: OrderEntity): ShippingAddress | null {
    if (!order.billingFirstName) return null;
    return {
      firstName: order.billingFirstName,
      lastName: order.billingLastName,
      email: order.billingEmail,
      phone: order.billingPhone,
      addressLine1: order.billingAddressLine1,
      addressLine2: order.billingAddressLine2,
      city: order.billingCity,
      state: order.billingState,
      postalCode: order.billingPostalCode,
      country: order.billingCountry,
    };
  }
}
