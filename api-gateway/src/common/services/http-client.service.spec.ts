import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from './http-client.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { TimeoutError } from 'rxjs';

describe('HttpClientService', () => {
  let service: HttpClientService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockResponse: AxiosResponse = {
    data: { success: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };

  beforeEach(async () => {
    const mockHttpService = {
      request: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'apiKey.outgoing': 'test-api-key',
          'http.timeoutMs': 5000,
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpClientService,
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

    service = module.get<HttpClientService>(HttpClientService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default API key and timeout', () => {
      expect(configService.get).toHaveBeenCalledWith('apiKey.outgoing');
      expect(configService.get).toHaveBeenCalledWith('http.timeoutMs');
    });

    it('should use default timeout when not configured', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'apiKey.outgoing') return 'test-key';
          if (key === 'http.timeoutMs') return undefined;
          return null;
        }),
      };

      const mockHttpService = {
        request: jest.fn().mockReturnValue(of(mockResponse)),
      };

      const module = await Test.createTestingModule({
        providers: [
          HttpClientService,
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

      const serviceInstance = module.get<HttpClientService>(HttpClientService);

      await serviceInstance.get('http://example.com');

      expect(mockHttpService.request).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should make GET request', async () => {
      httpService.request.mockReturnValue(of(mockResponse));

      const result = await service.get('http://example.com/api');

      expect(result).toEqual(mockResponse);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'http://example.com/api',
          data: undefined,
        }),
      );
    });

    it('should include API key in headers by default', async () => {
      httpService.request.mockReturnValue(of(mockResponse));

      await service.get('http://example.com/api');

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
            Accept: 'application/json',
          }),
        }),
      );
    });

    it('should skip API key when skipApiKey is true', async () => {
      httpService.request.mockReturnValue(of(mockResponse));

      await service.get('http://example.com/api', { skipApiKey: true });

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'X-API-Key': expect.anything(),
          }),
        }),
      );
    });

    it('should use custom API key when provided', async () => {
      httpService.request.mockReturnValue(of(mockResponse));

      await service.get('http://example.com/api', {
        apiKeyOverride: 'custom-api-key',
      });

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'custom-api-key',
          }),
        }),
      );
    });

    it('should use custom timeout when provided', async () => {
      httpService.request.mockReturnValue(of(mockResponse));

      await service.get('http://example.com/api', { timeoutMs: 10000 });

      expect(httpService.request).toHaveBeenCalled();
    });

    it('should merge custom headers', async () => {
      httpService.request.mockReturnValue(of(mockResponse));

      await service.get('http://example.com/api', {
        headers: { 'Custom-Header': 'custom-value' },
      });

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'custom-value',
            'X-API-Key': 'test-api-key',
            Accept: 'application/json',
          }),
        }),
      );
    });
  });

  describe('post', () => {
    it('should make POST request with data', async () => {
      httpService.request.mockReturnValue(of(mockResponse));
      const data = { name: 'test', value: 123 };

      const result = await service.post('http://example.com/api', data);

      expect(result).toEqual(mockResponse);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'http://example.com/api',
          data,
        }),
      );
    });

    it('should make POST request without data', async () => {
      httpService.request.mockReturnValue(of(mockResponse));

      await service.post('http://example.com/api');

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'http://example.com/api',
          data: undefined,
        }),
      );
    });
  });

  describe('put', () => {
    it('should make PUT request with data', async () => {
      httpService.request.mockReturnValue(of(mockResponse));
      const data = { id: 1, name: 'updated' };

      const result = await service.put('http://example.com/api/1', data);

      expect(result).toEqual(mockResponse);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          url: 'http://example.com/api/1',
          data,
        }),
      );
    });
  });

  describe('patch', () => {
    it('should make PATCH request with data', async () => {
      httpService.request.mockReturnValue(of(mockResponse));
      const data = { name: 'patched' };

      const result = await service.patch('http://example.com/api/1', data);

      expect(result).toEqual(mockResponse);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          url: 'http://example.com/api/1',
          data,
        }),
      );
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      httpService.request.mockReturnValue(of(mockResponse));

      const result = await service.delete('http://example.com/api/1');

      expect(result).toEqual(mockResponse);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: 'http://example.com/api/1',
          data: undefined,
        }),
      );
    });
  });

  describe('timeout handling', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new TimeoutError();
      httpService.request.mockReturnValue(throwError(() => timeoutError));

      await expect(
        service.get('http://example.com/api'),
      ).rejects.toBeInstanceOf(TimeoutError);
    });

    it('should use default timeout when not specified', async () => {
      httpService.request.mockReturnValue(of(mockResponse));

      await service.get('http://example.com/api');

      expect(httpService.request).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate HTTP errors', async () => {
      const axiosError: AxiosError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Server error' },
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        toJSON: jest.fn(),
        name: 'AxiosError',
        message: 'Request failed',
      };

      httpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(service.get('http://example.com/api')).rejects.toEqual(
        axiosError,
      );
    });
  });

  describe('buildAuthHeaders', () => {
    it('should return empty object when no API key configured', async () => {
      const mockConfigService = {
        get: jest.fn(() => undefined),
      };

      const mockHttpService = {
        request: jest.fn().mockReturnValue(of(mockResponse)),
      };

      const module = await Test.createTestingModule({
        providers: [
          HttpClientService,
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

      const serviceInstance = module.get<HttpClientService>(HttpClientService);

      await serviceInstance.get('http://example.com/api');

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'X-API-Key': expect.anything(),
          }),
        }),
      );
    });
  });
});
