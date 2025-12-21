import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { OrdersController } from './orders.controller';
import { InternalOrdersController } from './internal-orders.controller';
import { OrderService } from './services/order.service';
import { InventoryService } from './services/inventory.service';
import { OrderSyncService } from './services/order-sync.service';
import { MicroservicesModule } from '../../common/microservices/microservices.module';
import { EmailModule } from '../email/email.module';

// Commands
import { CreateOrderHandler } from './handlers/create-order.handler';
import { UpdateOrderStatusHandler } from './handlers/update-order-status.handler';
import { CancelOrderHandler } from './handlers/cancel-order.handler';
import { ConfirmPaymentHandler } from './handlers/confirm-payment.handler';

// Queries
import { GetOrderHandler } from './handlers/get-order.handler';
import { GetOrdersHandler } from './handlers/get-orders.handler';

// Events
import { OrderCreatedNotificationHandler } from './handlers/order-created-notification.handler';
import { OrderCreatedSyncHandler } from './handlers/order-created-sync.handler';
import { OrderStatusUpdatedSyncHandler } from './handlers/order-status-updated-sync.handler';
import { OrderCancelledSyncHandler } from './handlers/order-cancelled-sync.handler';
import { PaymentConfirmedInventoryHandler } from './handlers/payment-confirmed-inventory.handler';
import { PaymentConfirmedEmailHandler } from './handlers/payment-confirmed-email.handler';
import { PaymentConfirmedOrderSyncHandler } from './handlers/payment-confirmed-order-sync.handler';

// Processors
import { EmailProcessor } from './processors/email.processor';
import { OrderSyncProcessor } from './processors/order-sync.processor';
import { InventorySyncProcessor } from './processors/inventory-sync.processor';
import { HttpClientService } from 'src/common/services/http-client.service';
import { OrdersResolver } from './graphql/orders.resolver';

const CommandHandlers = [
  CreateOrderHandler,
  UpdateOrderStatusHandler,
  CancelOrderHandler,
  ConfirmPaymentHandler,
];

const QueryHandlers = [GetOrderHandler, GetOrdersHandler];

const EventHandlers = [
  OrderCreatedNotificationHandler,
  OrderCreatedSyncHandler,
  OrderStatusUpdatedSyncHandler,
  OrderCancelledSyncHandler,
  PaymentConfirmedInventoryHandler,
  PaymentConfirmedEmailHandler,
  PaymentConfirmedOrderSyncHandler,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Order, OrderItem]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'order-sync',
    }),
    BullModule.registerQueue({
      name: 'inventory-sync',
    }),
    EmailModule,
    MicroservicesModule,
  ],
  controllers: [OrdersController, InternalOrdersController],
  providers: [
    OrderService,
    InventoryService,
    OrderSyncService,
    EmailProcessor,
    OrderSyncProcessor,
    InventorySyncProcessor,
    HttpClientService,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    OrdersResolver,
  ],
  exports: [OrderService, InventoryService],
})
export class OrdersModule {}
