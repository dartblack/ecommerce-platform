import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: jest.Mocked<MailerService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockMailerService = {
      sendMail: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'email') {
          return {
            host: 'localhost',
            port: 1025,
            from: {
              name: 'Ecommerce Platform',
              address: 'noreply@example.com',
            },
          };
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get(MailerService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with email configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('email');
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockInfo = {
        messageId: 'test-message-id',
        accepted: ['recipient@example.com'],
        rejected: [],
        pending: [],
        response: '250 OK',
      };

      mailerService.sendMail.mockResolvedValue(mockInfo);

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      };

      const result = await service.sendEmail(options);

      expect(result).toBe(true);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
        from: undefined,
      });
    });

    it('should send email with custom from address', async () => {
      const mockInfo = {
        messageId: 'test-message-id',
        accepted: ['recipient@example.com'],
        rejected: [],
        pending: [],
        response: '250 OK',
      };

      mailerService.sendMail.mockResolvedValue(mockInfo);

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        from: 'custom@example.com',
        fromName: 'Custom Sender',
      };

      await service.sendEmail(options);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: undefined,
        from: 'Custom Sender <custom@example.com>',
      });
    });

    it('should send email with default from when from is not provided', async () => {
      const mockInfo = {
        messageId: 'test-message-id',
        accepted: ['recipient@example.com'],
        rejected: [],
        pending: [],
        response: '250 OK',
      };

      mailerService.sendMail.mockResolvedValue(mockInfo);

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await service.sendEmail(options);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: undefined,
        from: undefined,
      });
    });

    it('should throw error when email sending fails', async () => {
      const error = new Error('SMTP connection failed');
      mailerService.sendMail.mockRejectedValue(error);

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await expect(service.sendEmail(options)).rejects.toThrow(
        'SMTP connection failed',
      );
    });
  });

  describe('sendOrderConfirmationEmail', () => {
    it('should send order confirmation email successfully', async () => {
      const mockInfo = {
        messageId: 'test-message-id',
        accepted: ['customer@example.com'],
        rejected: [],
        pending: [],
        response: '250 OK',
      };

      mailerService.sendMail.mockResolvedValue(mockInfo);

      const orderData = {
        orderNumber: 'ORD-123',
        customerName: 'John Doe',
        customerEmail: 'customer@example.com',
        orderDate: new Date('2024-01-01'),
        items: [
          {
            productName: 'Test Product',
            quantity: 2,
            price: 99.99,
            subtotal: 199.98,
          },
        ],
        subtotal: 199.98,
        tax: 20.0,
        shipping: 5.0,
        discount: 0,
        total: 224.98,
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          addressLine2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      };

      const result = await service.sendOrderConfirmationEmail(orderData);

      expect(result).toBe(true);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'customer@example.com',
        subject: 'Order Confirmation - ORD-123',
        template: 'order-confirmation',
        context: {
          orderNumber: 'ORD-123',
          orderDate: new Date('2024-01-01'),
          items: orderData.items,
          shippingAddress: orderData.shippingAddress,
          subtotal: 199.98,
          tax: 20.0,
          shipping: 5.0,
          discount: 0,
          total: 224.98,
        },
      });
    });

    it('should throw error when order confirmation email fails', async () => {
      const error = new Error('Template not found');
      mailerService.sendMail.mockRejectedValue(error);

      const orderData = {
        orderNumber: 'ORD-123',
        customerName: 'John Doe',
        customerEmail: 'customer@example.com',
        orderDate: new Date('2024-01-01'),
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'US',
        },
      };

      await expect(
        service.sendOrderConfirmationEmail(orderData),
      ).rejects.toThrow('Template not found');
    });

    it('should handle order with multiple items', async () => {
      const mockInfo = {
        messageId: 'test-message-id',
        accepted: ['customer@example.com'],
        rejected: [],
        pending: [],
        response: '250 OK',
      };

      mailerService.sendMail.mockResolvedValue(mockInfo);

      const orderData = {
        orderNumber: 'ORD-123',
        customerName: 'John Doe',
        customerEmail: 'customer@example.com',
        orderDate: new Date('2024-01-01'),
        items: [
          {
            productName: 'Product 1',
            quantity: 1,
            price: 50.0,
            subtotal: 50.0,
          },
          {
            productName: 'Product 2',
            quantity: 2,
            price: 75.0,
            subtotal: 150.0,
          },
        ],
        subtotal: 200.0,
        tax: 20.0,
        shipping: 5.0,
        discount: 10.0,
        total: 215.0,
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'US',
        },
      };

      await service.sendOrderConfirmationEmail(orderData);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({ productName: 'Product 1' }),
              expect.objectContaining({ productName: 'Product 2' }),
            ]),
            discount: 10.0,
          }),
        }),
      );
    });
  });
});
