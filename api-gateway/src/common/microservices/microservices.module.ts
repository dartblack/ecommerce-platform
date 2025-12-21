import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MicroservicesService } from './microservices.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'ADMIN_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: configService.get<string>('redis.host') || 'localhost',
            port: configService.get<number>('redis.port') || 6379,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [MicroservicesService],
  exports: [MicroservicesService, ClientsModule],
})
export class MicroservicesModule {}
