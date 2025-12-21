import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { Roles } from '../../passport/decorators/role.decorator';
import { RolesEnum } from '../../passport/enums/roles.enum';
import { Product, ProductListResponse } from './types/product.type';
import { ProductMutationResponse } from './types/product-response.type';
import { ProductQueryInput } from './inputs/product-query.input';
import { CreateProductInput } from './inputs/create-product.input';
import { UpdateProductInput } from './inputs/update-product.input';
import { SearchProductsQuery } from '../queries/search-products.query';
import { GetProductQuery } from '../queries/get-product.query';
import { CreateProductCommand } from '../commands/create-product.command';
import { UpdateProductCommand } from '../commands/update-product.command';
import {
  ProductQueryDto,
  StockStatus as DtoStockStatus,
  SortField as DtoSortField,
  SortOrder as DtoSortOrder,
} from '../dtos/product-query.dto';
import { Public } from 'src/modules/passport/decorators/public.decorator';
import { ProductMapper } from '../mappers/product.mapper';
import { convertFileUploadToImageData } from '../utils/file-upload.util';
import { plainToInstance } from 'class-transformer';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly productMapper: ProductMapper,
  ) {}

  @Public()
  @Query(() => ProductListResponse, { name: 'products' })
  async getProducts(
    @Args('input', { nullable: true }) input?: ProductQueryInput,
  ): Promise<ProductListResponse> {
    const queryDto: ProductQueryDto = {
      page: input?.page || 1,
      limit: input?.limit || 20,
      search: input?.search,
      categoryId: input?.categoryId,
      stockStatus: input?.stockStatus as DtoStockStatus | undefined,
      sortBy: input?.sortBy as DtoSortField | undefined,
      sortOrder: input?.sortOrder as DtoSortOrder | undefined,
    };

    const query = new SearchProductsQuery(queryDto);
    const { products, total } = await this.queryBus.execute(query);

    const limit = input?.limit || 20;
    const page = input?.page || 1;
    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  @Public()
  @Query(() => Product, { name: 'product', nullable: true })
  async getProduct(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Product> {
    const query = new GetProductQuery(id);
    return await this.queryBus.execute(query);
  }

  @Mutation(() => ProductMutationResponse, { name: 'createProduct' })
  @Roles(RolesEnum.ADMIN)
  async createProduct(
    @Args('input') input: CreateProductInput,
  ): Promise<ProductMutationResponse> {
    const productDto = this.productMapper.toCreateDto(input);
    const imageData = await convertFileUploadToImageData(input.image);
    const command = new CreateProductCommand(productDto, imageData);
    const result = await this.commandBus.execute(command);
    return plainToInstance(ProductMutationResponse, result);
  }

  @Mutation(() => ProductMutationResponse, { name: 'updateProduct' })
  @Roles(RolesEnum.ADMIN)
  async updateProduct(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateProductInput,
  ): Promise<ProductMutationResponse> {
    const productDto = this.productMapper.toUpdateDto(input);
    const imageData = await convertFileUploadToImageData(input.image);
    const command = new UpdateProductCommand(id, productDto, imageData);
    const result = await this.commandBus.execute(command);
    return plainToInstance(ProductMutationResponse, result);
  }
}
