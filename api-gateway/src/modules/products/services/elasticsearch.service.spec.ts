import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ElasticsearchService } from './elasticsearch.service';
import {
  ProductQueryDto,
  SortField,
  SortOrder,
} from '../dtos/product-query.dto';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

describe('ElasticsearchService', () => {
  let service: ElasticsearchService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockSearchResponse: AxiosResponse = {
    data: {
      hits: {
        total: {
          value: 2,
        },
        hits: [
          {
            _source: {
              id: 1,
              name: 'Test Product 1',
              price: 99.99,
              stock_quantity: 10,
            },
          },
          {
            _source: {
              id: 2,
              name: 'Test Product 2',
              price: 149.99,
              stock_quantity: 5,
            },
          },
        ],
      },
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };

  const mockGetResponse: AxiosResponse = {
    data: {
      _source: {
        id: 1,
        name: 'Test Product 1',
        price: 99.99,
        stock_quantity: 10,
      },
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          'elasticsearch.host': 'http://localhost:9200',
          'elasticsearch.productsIndex': 'products',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElasticsearchService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ElasticsearchService>(ElasticsearchService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if host is not configured', async () => {
      const invalidConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'elasticsearch.host') return undefined;
          if (key === 'elasticsearch.productsIndex') return 'products';
          return null;
        }),
      };

      expect(() => {
        new ElasticsearchService(invalidConfigService as any, httpService);
      }).toThrow('Elasticsearch host is not configured');
    });

    it('should throw error if index is not configured', async () => {
      const invalidConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'elasticsearch.host') return 'http://localhost:9200';
          if (key === 'elasticsearch.productsIndex') return undefined;
          return null;
        }),
      };

      expect(() => {
        new ElasticsearchService(invalidConfigService as any, httpService);
      }).toThrow('Elasticsearch products index is not configured');
    });
  });

  describe('searchProducts', () => {
    it('should search products with default pagination', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {};
      const result = await service.searchProducts(queryDto);

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:9200/products/_search',
        expect.objectContaining({
          from: 0,
          size: 20,
          query: { match_all: {} },
        }),
      );
    });

    it('should search products with pagination', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        page: 2,
        limit: 10,
      };
      const result = await service.searchProducts(queryDto);

      expect(result.products).toHaveLength(2);
      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:9200/products/_search',
        expect.objectContaining({
          from: 10,
          size: 10,
        }),
      );
    });

    it('should search products with text search', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        search: 'laptop',
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.query.bool.should).toBeDefined();
      expect(searchBody.query.bool.should.length).toBeGreaterThan(0);
      expect(searchBody.query.bool.minimum_should_match).toBe(1);
    });

    it('should filter by categoryId', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        categoryId: 5,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.query.bool.filter).toContainEqual({
        term: { category_id: 5 },
      });
    });

    it('should filter by categoryIds', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        categoryIds: [5, 6, 7],
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.query.bool.filter).toContainEqual({
        terms: { category_id: [5, 6, 7] },
      });
    });

    it('should filter by price range', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        minPrice: 50,
        maxPrice: 200,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      const priceFilter = searchBody.query.bool.filter.find(
        (f: any) => f.range && f.range.price,
      );
      expect(priceFilter.range.price.gte).toBe(50);
      expect(priceFilter.range.price.lte).toBe(200);
    });

    it('should filter by minPrice only', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        minPrice: 100,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      const priceFilter = searchBody.query.bool.filter.find(
        (f: any) => f.range && f.range.price,
      );
      expect(priceFilter.range.price.gte).toBe(100);
      expect(priceFilter.range.price.lte).toBeUndefined();
    });

    it('should filter by maxPrice only', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        maxPrice: 200,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      const priceFilter = searchBody.query.bool.filter.find(
        (f: any) => f.range && f.range.price,
      );
      expect(priceFilter.range.price.lte).toBe(200);
      expect(priceFilter.range.price.gte).toBeUndefined();
    });

    it('should filter by stockStatus', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        stockStatus: 'in_stock',
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.query.bool.filter).toContainEqual({
        term: { stock_status: 'in_stock' },
      });
    });

    it('should filter by isActive', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        isActive: true,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.query.bool.filter).toContainEqual({
        term: { is_active: true },
      });
    });

    it('should sort by price ascending', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        sortBy: SortField.PRICE,
        sortOrder: SortOrder.ASC,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.sort).toContainEqual({
        price: { order: 'asc' },
      });
    });

    it('should sort by price descending', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        sortBy: SortField.PRICE,
        sortOrder: SortOrder.DESC,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.sort).toContainEqual({
        price: { order: 'desc' },
      });
    });

    it('should sort by name', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        sortBy: SortField.NAME,
        sortOrder: SortOrder.ASC,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.sort).toContainEqual({
        'name.keyword': { order: 'asc' },
      });
    });

    it('should sort by created_at', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        sortBy: SortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.sort).toContainEqual({
        created_at: { order: 'desc' },
      });
    });

    it('should use default sort order when sortBy is SORT_ORDER', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {
        sortBy: SortField.SORT_ORDER,
      };
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody.sort).toContainEqual({
        sort_order: { order: 'asc' },
      });
      expect(searchBody.sort).toContainEqual({
        id: { order: 'asc' },
      });
    });

    it('should return empty results when index does not exist (404)', async () => {
      const error = {
        response: {
          status: 404,
        },
      } as AxiosError;

      httpService.post.mockReturnValue(throwError(() => error));

      const queryDto: ProductQueryDto = {};
      const result = await service.searchProducts(queryDto);

      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw error for non-404 errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      } as AxiosError;

      httpService.post.mockReturnValue(throwError(() => error));

      const queryDto: ProductQueryDto = {};

      await expect(service.searchProducts(queryDto)).rejects.toEqual(error);
    });

    it('should include all required source fields', async () => {
      httpService.post.mockReturnValue(of(mockSearchResponse));

      const queryDto: ProductQueryDto = {};
      await service.searchProducts(queryDto);

      const callArgs = httpService.post.mock.calls[0];
      const searchBody = callArgs[1];

      expect(searchBody._source).toContain('id');
      expect(searchBody._source).toContain('name');
      expect(searchBody._source).toContain('price');
      expect(searchBody._source).toContain('sku');
    });
  });

  describe('getProductById', () => {
    it('should get product by id', async () => {
      httpService.get.mockReturnValue(of(mockGetResponse));

      const result = await service.getProductById(1);

      expect(result).toEqual({
        id: 1,
        name: 'Test Product 1',
        slug: '',
        description: null,
        shortDescription: null,
        sku: '',
        price: 99.99,
        compareAtPrice: null,
        categoryId: null,
        categoryName: null,
        stockQuantity: 10,
        stockStatus: 'in_stock',
        isActive: true,
        image: null,
        imageUrl: null,
        sortOrder: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:9200/products/_doc/1',
      );
    });

    it('should return null when product not found (404)', async () => {
      const error = {
        response: {
          status: 404,
        },
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => error));

      const result = await service.getProductById(999);

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getProductById(1)).rejects.toEqual(error);
    });
  });
});
