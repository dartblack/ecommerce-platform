import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MicroservicesService implements OnModuleInit {
  constructor(
    @Inject('ADMIN_SERVICE') private readonly adminServiceClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.adminServiceClient.connect();
  }

  async send<TResult = any, TInput = any>(
    pattern: string,
    data: TInput,
  ): Promise<TResult> {
    return firstValueFrom(
      this.adminServiceClient.send<TResult, TInput>(pattern, data),
    );
  }

  emit<TResult = any, TInput = any>(pattern: string, data: TInput): void {
    this.adminServiceClient.emit<TResult, TInput>(pattern, data);
  }
}
