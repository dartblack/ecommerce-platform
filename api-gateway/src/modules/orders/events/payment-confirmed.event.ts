import { Order } from '../../../database/entities/order.entity';

export class PaymentConfirmedEvent {
  constructor(public readonly order: Order) {}
}
