import { Query } from '@nestjs/cqrs';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { ElasticsearchGetProductsResponse } from '../services/elasticsearch.service';

export class SearchProductsQuery extends Query<ElasticsearchGetProductsResponse> {
  constructor(public readonly queryDto: ProductQueryDto) {
    super();
  }
}
