import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { GetProductQuery } from '../queries/get-product.query';
import { ProductDto } from '../dtos/product-response.dto';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async execute(query: GetProductQuery): Promise<ProductDto> {
    const product: ProductDto = await this.elasticsearchService.getProductById(
      query.id,
    );

    if (!product) {
      throw new NotFoundException(`Product with ID ${query.id} not found`);
    }

    return product;
  }
}
