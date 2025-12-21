import { Command } from '@nestjs/cqrs';
import { CreateProductDto } from '../dtos/create-product.dto';
import { CreateProductResponse } from '../handlers/create-product.handler';

export interface ImageData {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export class CreateProductCommand extends Command<CreateProductResponse> {
  constructor(
    public readonly productData: CreateProductDto,
    public readonly imageData: ImageData | null,
  ) {
    super();
  }
}
