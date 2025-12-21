import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ProductQueryDto,
  SortField,
  SortOrder,
} from '../dtos/product-query.dto';
import { ProductDto } from '../dtos/product-response.dto';

export interface ElasticsearchSearchResponse {
  hits: {
    total: {
      value: number;
    };
    hits: Array<{
      _source: any;
    }>;
  };
}

export interface ElasticsearchGetProductsResponse {
  products: ProductDto[];
  total: number;
}

@Injectable()
export class ElasticsearchService {
  private readonly host: string;
  private readonly index: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const host = this.configService.get<string>('elasticsearch.host');
    const index = this.configService.get<string>('elasticsearch.productsIndex');

    if (!host) {
      throw new Error('Elasticsearch host is not configured');
    }
    if (!index) {
      throw new Error('Elasticsearch products index is not configured');
    }

    this.host = host;
    this.index = index;
  }

  async searchProducts(
    queryDto: ProductQueryDto,
  ): Promise<ElasticsearchGetProductsResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      categoryIds,
      minPrice,
      maxPrice,
      stockStatus,
      isActive,
      sortBy = SortField.SORT_ORDER,
      sortOrder = SortOrder.ASC,
    } = queryDto;

    const from = (page - 1) * limit;

    const must: any[] = [];
    const should: any[] = [];
    const filter: any[] = [];

    // Search query
    if (search) {
      should.push(
        {
          multi_match: {
            query: search,
            fields: ['name^3', 'description^2', 'short_description', 'sku'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        },
        {
          match_phrase: {
            name: {
              query: search,
              boost: 2,
            },
          },
        },
      );
    }

    // Category filter
    if (categoryId) {
      filter.push({ term: { category_id: categoryId } });
    }

    if (categoryIds && categoryIds.length > 0) {
      filter.push({
        terms: {
          category_id: categoryIds,
        },
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange: any = {};
      if (minPrice !== undefined) {
        priceRange.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        priceRange.lte = maxPrice;
      }
      filter.push({
        range: {
          price: priceRange,
        },
      });
    }

    if (stockStatus) {
      filter.push({ term: { stock_status: stockStatus } });
    }

    if (isActive !== undefined) {
      filter.push({ term: { is_active: isActive } });
    }

    const query: any = {};

    if (must.length > 0 || should.length > 0 || filter.length > 0) {
      query.bool = {};
      if (must.length > 0) query.bool.must = must;
      if (should.length > 0) query.bool.should = should;
      if (filter.length > 0) query.bool.filter = filter;

      // If there are should clauses, set minimum_should_match
      if (should.length > 0) {
        query.bool.minimum_should_match = search ? 1 : 0;
      }
    } else {
      query.match_all = {};
    }

    const sort: any[] = [];
    if (sortBy === SortField.PRICE) {
      sort.push({ price: { order: sortOrder } });
    } else if (sortBy === SortField.NAME) {
      sort.push({ 'name.keyword': { order: sortOrder } });
    } else if (sortBy === SortField.CREATED_AT) {
      sort.push({ created_at: { order: sortOrder } });
    } else {
      sort.push({ sort_order: { order: sortOrder } });
      sort.push({ id: { order: SortOrder.ASC } }); // Secondary sort for consistency
    }

    const searchBody = {
      query,
      sort,
      from,
      size: limit,
      _source: [
        'id',
        'name',
        'slug',
        'description',
        'short_description',
        'sku',
        'price',
        'compare_at_price',
        'category_id',
        'category_name',
        'stock_quantity',
        'stock_status',
        'is_active',
        'image',
        'image_url',
        'sort_order',
        'created_at',
        'updated_at',
      ],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<ElasticsearchSearchResponse>(
          `${this.host}/${this.index}/_search`,
          searchBody,
        ),
      );

      return {
        products: response.data.hits.hits.map((hit) =>
          this.transformProduct(hit._source),
        ),
        total: response.data.hits.total.value,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          products: [],
          total: 0,
        };
      }
      throw error;
    }
  }

  private transformProduct(source: any): ProductDto {
    return {
      id: source.id,
      name: source.name || '',
      slug: source.slug || '',
      description: source.description || null,
      shortDescription: source.short_description || null,
      sku: source.sku || '',
      price: source.price || 0,
      compareAtPrice: source.compare_at_price || null,
      categoryId: source.category_id || null,
      categoryName: source.category_name || null,
      stockQuantity: source.stock_quantity || 0,
      stockStatus: source.stock_status || 'in_stock', // Default to 'in_stock' if null
      isActive: source.is_active !== undefined ? source.is_active : true,
      image: source.image || null,
      imageUrl: source.image_url || null,
      sortOrder: source.sort_order || 0,
      createdAt: source.created_at || new Date().toISOString(),
      updatedAt: source.updated_at || new Date().toISOString(),
    };
  }

  async getProductById(id: number): Promise<ProductDto | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(`${this.host}/${this.index}/_doc/${id}`),
      );

      return this.transformProduct(response.data._source);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}
