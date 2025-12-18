import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import config from './config/config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { BullModule } from '@nestjs/bullmq';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    DatabaseModule,
    CacheModule.register({
      store: redisStore,
      host: 'redis',
      port: 6379,
      ttl: 60000,
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: 'redis',
        port: 6379,
      },
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}