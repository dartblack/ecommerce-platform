import { IEvent } from '@nestjs/cqrs';

export class OrderCancelledEvent implements IEvent {
  constructor(
    public readonly orderId: number,
    public readonly reason?: string,
  ) {}
}
