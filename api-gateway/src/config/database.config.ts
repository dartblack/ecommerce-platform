import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
            entities: [],
        };
    }
}
