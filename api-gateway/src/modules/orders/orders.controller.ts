import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
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
    @Request() req: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const command = new CreateOrderCommand(
      req.user?.id || null,
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
    @Request() req: any,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const query = new GetOrdersQuery(req.user?.id, status, page, limit);
    return this.queryBus.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  async getOrder(@Request() req: any, @Param('id') id: string) {
    const query = new GetOrderQuery(parseInt(id, 10), req.user?.id);
    return this.queryBus.execute(query);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  async cancelOrder(
    @Request() req: any,
    @Param('id') id: string,
    @Body() cancelDto: { reason?: string },
  ) {
    const command = new CancelOrderCommand(
      parseInt(id, 10),
      req.user?.id,
      cancelDto.reason,
    );
    return this.commandBus.execute(command);
  }

  @Post(':id/confirm-payment')
  @ApiOperation({ summary: 'Confirm payment for order (mock)' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  async confirmPayment(@Request() req: any, @Param('id') id: string) {
    const command = new ConfirmPaymentCommand(parseInt(id, 10), req.user?.id);
    return this.commandBus.execute(command);
  }
}
