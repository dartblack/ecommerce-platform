import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  ParseIntPipe,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { Public } from '../passport/decorators/public.decorator';
import { Roles } from '../passport/decorators/role.decorator';
import { RolesEnum } from '../passport/enums/roles.enum';
import { ProductQueryDto } from './dtos/product-query.dto';
import {
  ProductListResponseDto,
  ProductDto,
} from './dtos/product-response.dto';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { SearchProductsQuery } from './queries/search-products.query';
import { GetProductQuery } from './queries/get-product.query';
import { CreateProductCommand } from './commands/create-product.command';
import { UpdateProductCommand } from './commands/update-product.command';
import { CreateProductResponse } from './handlers/create-product.handler';
import { UpdateProductResponse } from './handlers/update-product.handler';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get products list with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: ProductListResponseDto,
  })
  async getProducts(
    @Query() queryDto: ProductQueryDto,
  ): Promise<ProductListResponseDto> {
    const { page = 1, limit = 20 } = queryDto;

    const query = new SearchProductsQuery(queryDto);
    const { products, total } = await this.queryBus.execute(query);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single product by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductDto | null> {
    const query = new GetProductQuery(id);
    return await this.queryBus.execute(query);
  }

  @Post()
  @Roles(RolesEnum.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product creation job queued successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Product creation job queued successfully',
        },
        jobId: { type: 'string', example: '123' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CreateProductResponse> {
    let imageData: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
    } | null = null;
    if (file) {
      imageData = {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      };
    }

    const command = new CreateProductCommand(createProductDto, imageData);
    return await this.commandBus.execute(command);
  }

  @Put(':id')
  @Roles(RolesEnum.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a product (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product update job queued successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Product update job queued successfully',
        },
        jobId: { type: 'string', example: '123' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UpdateProductResponse> {
    let imageData: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
    } | null = null;
    if (file) {
      imageData = {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      };
    }

    const command = new UpdateProductCommand(id, updateProductDto, imageData);
    return await this.commandBus.execute(command);
  }
}
