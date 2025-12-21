import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ProductMutationResponse {
  @Field()
  message: string;

  @Field()
  jobId: string;
}
