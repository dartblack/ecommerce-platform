import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { HttpClientService } from 'src/common/services/http-client.service';

/* =========================
   Job Names
========================= */

export enum ProductJobName {
  CREATE = 'create-product',
  UPDATE = 'update-product',
}

/* =========================
   DTO Interfaces
========================= */

export interface ProductImageData {
  base64: string;
  mimetype: string;
  originalname: string;
}

export interface ProductBaseData {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  categoryId?: number;
  stockQuantity?: number;
  stockStatus?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateProductJobData {
  productData: Required<Pick<ProductBaseData, 'name' | 'sku' | 'price'>> &
    Omit<ProductBaseData, 'name' | 'sku' | 'price'>;
  imageData?: ProductImageData | null;
}

export interface UpdateProductJobData {
  productId: number;
  productData: ProductBaseData;
  imageData?: ProductImageData | null;
}

/* =========================
   Form Mapping
========================= */

const PRODUCT_FORM_MAP: Record<
  keyof ProductBaseData,
  { formKey: string; skipEmpty?: boolean }
> = {
  name: { formKey: 'name', skipEmpty: true },
  slug: { formKey: 'slug', skipEmpty: true },
  description: { formKey: 'description' },
  shortDescription: { formKey: 'short_description', skipEmpty: true },
  sku: { formKey: 'sku', skipEmpty: true },
  price: { formKey: 'price' },
  compareAtPrice: { formKey: 'compare_at_price' },
  categoryId: { formKey: 'category_id' },
  stockQuantity: { formKey: 'stock_quantity' },
  stockStatus: { formKey: 'stock_status', skipEmpty: true },
  isActive: { formKey: 'is_active' },
  sortOrder: { formKey: 'sort_order' },
};

/* =========================
   Processor
========================= */

@Processor('product-creation')
@Injectable()
export class ProductCreationProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductCreationProcessor.name);

  private readonly adminServiceUrl: string;
  private readonly apiPrefix: string;

  constructor(
    configService: ConfigService,
    private readonly httpClient: HttpClientService,
  ) {
    super();
    this.adminServiceUrl = configService.getOrThrow<string>('adminService.url');
    this.apiPrefix = `${configService.getOrThrow<string>(
      'adminService.apiPrefix',
    )}/internal`;
  }

  async process(
    job: Job<CreateProductJobData | UpdateProductJobData>,
  ): Promise<any> {
    const isUpdate = job.name === ProductJobName.UPDATE;

    this.logger.log(
      `Processing ${isUpdate ? 'UPDATE' : 'CREATE'} product job [${job.id}]`,
    );

    const url = this.buildUrl(job, isUpdate);
    const formData = this.buildFormData(job.data);

    try {
      const response = await this.sendRequest(url, formData, isUpdate);

      if (!response.data?.success) {
        this.logger.warn(
          `Unexpected response payload: ${JSON.stringify(response.data)}`,
        );
      }

      this.logger.log(
        `Product ${isUpdate ? 'updated' : 'created'} successfully`,
      );

      return response.data;
    } catch (error: any) {
      this.handleError(error, isUpdate);
    }
  }

  /* =========================
     Request Builders
  ========================= */

  private buildUrl(
    job: Job<CreateProductJobData | UpdateProductJobData>,
    isUpdate: boolean,
  ): string {
    if (!isUpdate) {
      return `${this.adminServiceUrl}/${this.apiPrefix}/products`;
    }

    const { productId } = job.data as UpdateProductJobData;

    return `${this.adminServiceUrl}/${this.apiPrefix}/products/${productId}`;
  }

  private buildFormData(
    data: CreateProductJobData | UpdateProductJobData,
  ): FormData {
    const formData = new FormData();

    this.appendProductData(formData, data.productData);
    this.appendImage(formData, data.imageData ?? null);

    return formData;
  }

  private async sendRequest(
    url: string,
    formData: FormData,
    isUpdate: boolean,
  ) {
    const headers = {
      Accept: 'application/json',
      ...formData.getHeaders(),
    };

    // Use longer timeout for file uploads (60 seconds)
    const options = {
      headers,
      timeoutMs: 60000,
    };

    if (isUpdate) {
      return this.httpClient.put(url, formData, options);
    }
    return this.httpClient.post(url, formData, options);
  }
  /* =========================
     Error Handling
  ========================= */

  private handleError(error: any, isUpdate: boolean): never {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message || error?.message || 'Unknown error';

    this.logger.error(
      `Product ${isUpdate ? 'update' : 'creation'} failed: ${message}`,
      error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.stack,
    );

    if (status && status < 500) {
      throw new UnrecoverableError(message);
    }

    throw error;
  }

  /* =========================
     Form Helpers
  ========================= */

  private appendProductData(formData: FormData, data: ProductBaseData): void {
    for (const [key, config] of Object.entries(PRODUCT_FORM_MAP)) {
      const value = (data as any)[key];
      if (value === undefined || value === null || value === '') continue;
      if (key === 'categoryId' && value === 0) continue;
      if (Array.isArray(value) && value.length === 0) continue;

      formData.append(
        config.formKey,
        typeof value === 'boolean' ? (value ? '1' : '0') : String(value),
      );
    }
  }

  private appendImage(
    formData: FormData,
    image: ProductImageData | null,
  ): void {
    if (!image) return;

    formData.append('image', Buffer.from(image.base64, 'base64'), {
      filename: image.originalname,
      contentType: image.mimetype,
    });

    this.logger.debug(
      `Attached image: ${image.originalname} (${image.mimetype})`,
    );
  }
}
