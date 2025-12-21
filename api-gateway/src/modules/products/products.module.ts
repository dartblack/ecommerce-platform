import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { ProductsController } from './products.controller';
import { ElasticsearchService } from './services/elasticsearch.service';
import { SearchProductsHandler } from './handlers/search-products.handler';
import { GetProductHandler } from './handlers/get-product.handler';
import { CreateProductHandler } from './handlers/create-product.handler';
import { UpdateProductHandler } from './handlers/update-product.handler';
import { ProductCreationProcessor } from './processors/product-creation.processor';
import { HttpClientService } from 'src/common/services/http-client.service';
import { ProductsResolver } from './graphql/products.resolver';
import { ProductMapper } from './mappers/product.mapper';

const QueryHandlers = [SearchProductsHandler, GetProductHandler];
const CommandHandlers = [CreateProductHandler, UpdateProductHandler];

@Module({
  imports: [
    CqrsModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    BullModule.registerQueue({
      name: 'product-creation',
    }),
  ],
  controllers: [ProductsController],
  providers: [
    ElasticsearchService,
    HttpClientService,
    ProductMapper,
    ...QueryHandlers,
    ...CommandHandlers,
    ProductCreationProcessor,
    ProductsResolver,
  ],
  exports: [ElasticsearchService],
})
export class ProductsModule {}
