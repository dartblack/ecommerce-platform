import { Command } from '@nestjs/cqrs';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ImageData } from './create-product.command';
import { UpdateProductResponse } from '../handlers/update-product.handler';

export class UpdateProductCommand extends Command<UpdateProductResponse> {
  constructor(
    public readonly productId: number,
    public readonly productData: UpdateProductDto,
    public readonly imageData: ImageData | null,
  ) {
    super();
  }
}
