import { registerEnumType } from '@nestjs/graphql';

export enum StockStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  ON_BACKORDER = 'on_backorder',
}

registerEnumType(StockStatus, {
  name: 'StockStatus',
});
