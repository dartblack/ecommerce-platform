import { registerEnumType } from '@nestjs/graphql';

export enum SortField {
  PRICE = 'price',
  NAME = 'name',
  CREATED_AT = 'created_at',
  SORT_ORDER = 'sort_order',
}

registerEnumType(SortField, {
  name: 'SortField',
});
