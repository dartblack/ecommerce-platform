import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateProductCommand } from '../commands/update-product.command';

export interface UpdateProductResponse {
  jobId?: string;
  message: string;
}
@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    @InjectQueue('product-creation') private readonly productQueue: Queue,
  ) {}

  async execute(command: UpdateProductCommand): Promise<UpdateProductResponse> {
    let imageBase64: string | null = null;
    let imageMimetype: string | null = null;
    let imageOriginalname: string | null = null;

    if (command.imageData) {
      imageBase64 = command.imageData.buffer.toString('base64');
      imageMimetype = command.imageData.mimetype;
      imageOriginalname = command.imageData.originalname;
    }

    const job = await this.productQueue.add(
      'update-product',
      {
        productId: command.productId,
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
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return {
      message: 'Product update job queued successfully',
      jobId: job.id!,
    };
  }
}
