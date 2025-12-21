import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateProductCommand } from '../commands/create-product.command';

export interface CreateProductResponse {
  jobId?: string;
  message: string;
}

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    @InjectQueue('product-creation') private readonly productQueue: Queue,
  ) {}

  async execute(command: CreateProductCommand): Promise<CreateProductResponse> {
    let imageBase64: string | null = null;
    let imageMimetype: string | null = null;
    let imageOriginalname: string | null = null;

    if (command.imageData) {
      imageBase64 = command.imageData.buffer.toString('base64');
      imageMimetype = command.imageData.mimetype;
      imageOriginalname = command.imageData.originalname;
    }

    const job = await this.productQueue.add(
      'create-product',
      {
        productData: command.productData,
        imageData: imageBase64
          ? {
              base64: imageBase64,
              mimetype: imageMimetype!,
              originalname: imageOriginalname!,
            }
          : null,
      },
      {
        jobId: `create-product-${command.productData.sku}`,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return {
      message: 'Product creation job queued successfully',
      jobId: job.id,
    };
  }
}
