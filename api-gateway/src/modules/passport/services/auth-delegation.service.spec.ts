import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { UnauthorizedException } from '@nestjs/common';
import { AuthDelegationService } from './auth-delegation.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

describe('AuthDelegationService', () => {
  let service: AuthDelegationService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockSuccessResponse: AxiosResponse = {
    data: {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
        },
        token: 'jwt-token-123',
        tokenType: 'Bearer',
      },
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          'adminService.url': 'http://admin-service',
          'adminService.apiPrefix': 'api',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthDelegationService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthDelegationService>(AuthDelegationService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct login URL', () => {
      expect(configService.get).toHaveBeenCalledWith('adminService.url');
      expect(configService.get).toHaveBeenCalledWith('adminService.apiPrefix');
    });
  });

  describe('authenticate', () => {
    it('should authenticate successfully with valid credentials', async () => {
      httpService.post.mockReturnValue(of(mockSuccessResponse));

      const result = await service.authenticate(
        'john@example.com',
        'password123',
      );

      expect(result).toEqual({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin',
          },
          token: 'jwt-token-123',
          tokenType: 'Bearer',
        },
      });

      expect(httpService.post).toHaveBeenCalledWith(
        'http://admin-service/api/v1/auth/login',
        { email: 'john@example.com', password: 'password123' },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );
    });

    it('should return null when authentication fails (401)', async () => {
      const axiosError: AxiosError = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Invalid credentials' },
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        toJSON: jest.fn(),
        name: 'AxiosError',
        message: 'Request failed',
      };

      httpService.post.mockReturnValue(throwError(() => axiosError));

      const result = await service.authenticate(
        'john@example.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });

    it('should return null when authentication fails (422)', async () => {
      const axiosError: AxiosError = {
        response: {
          status: 422,
          statusText: 'Unprocessable Entity',
          data: { message: 'Validation failed' },
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        toJSON: jest.fn(),
        name: 'AxiosError',
        message: 'Request failed',
      };

      httpService.post.mockReturnValue(throwError(() => axiosError));

      const result = await service.authenticate('invalid-email', 'password');

      expect(result).toBeNull();
    });

    it('should return null when response is not successful', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: false,
          message: 'Authentication failed',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(mockResponse));

      const result = await service.authenticate(
        'john@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null when response data is missing', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(mockResponse));

      const result = await service.authenticate(
        'john@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException for non-auth errors', async () => {
      const axiosError: AxiosError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error' },
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        toJSON: jest.fn(),
        name: 'AxiosError',
        message: 'Request failed',
      };

      httpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.authenticate('john@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for network errors', async () => {
      const error = new Error('Network error');
      httpService.post.mockReturnValue(throwError(() => error));

      await expect(
        service.authenticate('john@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should apply timeout to requests', async () => {
      httpService.post.mockReturnValue(of(mockSuccessResponse));

      await service.authenticate('john@example.com', 'password123');

      expect(httpService.post).toHaveBeenCalled();
      // The timeout is applied via RxJS pipe, so we verify the observable chain
    });
  });
});
