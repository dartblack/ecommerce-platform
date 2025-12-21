import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from './commands/create-order.command';
import { CancelOrderCommand } from './commands/cancel-order.command';
import { ConfirmPaymentCommand } from './commands/confirm-payment.command';
import { GetOrderQuery } from './queries/get-order.query';
import { GetOrdersQuery } from './queries/get-orders.query';
import { OrderStatus } from '../../database/entities/order.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { CurrentUser } from '../passport/decorators/current-user.decorator';
import { JwtUserDto } from '../passport/dtos/jwt-user.dto';
import { GetOrdersDto } from './dtos/get-orders.dto';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async createOrder(
    @CurrentUser() user: JwtUserDto,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const command = new CreateOrderCommand(
      user.sub,
      createOrderDto.orderItems,
      createOrderDto.shippingAddress,
      createOrderDto.paymentDetails,
      createOrderDto.billingAddress,
      createOrderDto.paymentMethod,
      createOrderDto.notes,
    );
    return this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Get orders list' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(
    @CurrentUser() user: JwtUserDto,
    @Query() search: GetOrdersDto,
  ) {
    const query = new GetOrdersQuery(
      user.sub,
      search.status,
      search.page,
      search.limit,
    );
    return this.queryBus.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  async getOrder(@CurrentUser() user: JwtUserDto, @Param('id') id: string) {
    const query = new GetOrderQuery(parseInt(id, 10), user.sub);
    return this.queryBus.execute(query);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  async cancelOrder(
    @CurrentUser() user: JwtUserDto,
    @Param('id') id: string,
    @Body() cancelDto: { reason?: string },
  ) {
    const command = new CancelOrderCommand(
      parseInt(id, 10),
      user.sub,
      cancelDto.reason,
    );
    return this.commandBus.execute(command);
  }

  @Post(':id/confirm-payment')
  @ApiOperation({ summary: 'Confirm payment for order (mock)' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  async confirmPayment(
    @CurrentUser() user: JwtUserDto,
    @Param('id') id: string,
  ) {
    const command = new ConfirmPaymentCommand(parseInt(id, 10), user.sub);
    return this.commandBus.execute(command);
  }
}
