import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  ElasticsearchGetProductsResponse,
  ElasticsearchService,
} from '../services/elasticsearch.service';
import { SearchProductsQuery } from '../queries/search-products.query';

@QueryHandler(SearchProductsQuery)
export class SearchProductsHandler implements IQueryHandler<SearchProductsQuery> {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async execute(
    query: SearchProductsQuery,
  ): Promise<ElasticsearchGetProductsResponse> {
    return this.elasticsearchService.searchProducts(query.queryDto);
  }
}
