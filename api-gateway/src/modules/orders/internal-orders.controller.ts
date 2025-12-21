import {
  Controller,
  Put,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateOrderStatusCommand } from './commands/update-order-status.command';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { Order } from '../../database/entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { Public } from '../passport/decorators/public.decorator';

@ApiTags('Internal Orders')
@Controller('internal/orders')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
@Public()
export class InternalOrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Put(':orderNumber/status')
  @ApiOperation({ summary: 'Update order status by order number (Internal)' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<{ success: boolean; message: string; data: { order: Order } }> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with order number ${orderNumber} not found`,
      );
    }

    const updatedOrder = await this.commandBus.execute(
      new UpdateOrderStatusCommand(
        order.id,
        updateOrderStatusDto.status,
        updateOrderStatusDto.trackingNumber,
        updateOrderStatusDto.paymentStatus,
      ),
    );

    return {
      success: true,
      message: 'Order status updated successfully',
      data: { order: updatedOrder },
    };
  }
}
