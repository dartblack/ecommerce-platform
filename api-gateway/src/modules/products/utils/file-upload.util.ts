import { FileUpload } from 'graphql-upload/GraphQLUpload.mjs';
import { ImageData } from '../commands/create-product.command';

/**
 * Converts a GraphQL FileUpload to ImageData format
 */
export async function convertFileUploadToImageData(
  fileUpload: Promise<FileUpload> | null | undefined,
): Promise<ImageData | null> {
  if (!fileUpload) {
    return null;
  }

  const file = await fileUpload;
  if (!file) {
    return null;
  }

  // Convert stream to buffer
  const stream = file.createReadStream();
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);

  return {
    buffer,
    mimetype: file.mimetype,
    originalname: file.filename,
  };
}
