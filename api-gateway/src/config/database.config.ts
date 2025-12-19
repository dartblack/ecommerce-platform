import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category } from 'src/database/entities/category.entity';
import { Product } from 'src/database/entities/product.entity';
import { Order } from 'src/database/entities/order.entity';
import { OrderItem } from 'src/database/entities/order-item.entity';
import { InventoryMovement } from 'src/database/entities/inventory-movement.entity';
import { User } from 'src/database/entities/user.entity';

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
    constructor(private configService: ConfigService) { }

    createTypeOrmOptions(): TypeOrmModuleOptions {
        const dbConfig = this.configService.get('database');
        const nodeEnv = this.configService.get<string>('nodeEnv');

        return {
            type: 'postgres',
            host: dbConfig.host,
            port: dbConfig.port,
            username: dbConfig.username,
            password: dbConfig.password,
            database: dbConfig.database,
            synchronize: false,
            logging: nodeEnv === 'development',
            migrationsRun: false,
            autoLoadEntities: true,
            entities: [
                User,
                Category,
                Product,
                Order,
                OrderItem,
                InventoryMovement,
            ],
        };
    }
}
