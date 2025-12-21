import { Query } from '@nestjs/cqrs';
import { ProductDto } from '../dtos/product-response.dto';

export class GetProductQuery extends Query<ProductDto> {
  constructor(public readonly id: number) {
    super();
  }
}
