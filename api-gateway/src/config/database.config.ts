import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from 'src/database/entities/order.entity';
import { OrderItem } from 'src/database/entities/order-item.entity';
import { join } from 'path';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbConfig = this.configService.get<DatabaseConfig>('database');
    const nodeEnv = this.configService.get<string>('nodeEnv');

    return {
      type: 'postgres',
      host: dbConfig?.host || 'postgresdb',
      port: dbConfig?.port || 5432,
      username: dbConfig?.username || 'postgres',
      password: dbConfig?.password || 'postgres',
      database: dbConfig?.database || 'api-gateway',
      synchronize: false,
      logging: nodeEnv === 'development',
      migrationsRun: true,
      migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
      migrationsTableName: 'migrations',
      autoLoadEntities: true,
      entities: [Order, OrderItem],
    };
  }
}
