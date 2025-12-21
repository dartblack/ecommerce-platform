import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { lastValueFrom, timeout } from 'rxjs';

export interface HttpClientOptions extends AxiosRequestConfig {
  skipApiKey?: boolean;

  apiKeyOverride?: string;

  timeoutMs?: number;
}

@Injectable()
export class HttpClientService {
  private readonly defaultApiKey?: string;
  private readonly defaultTimeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.defaultApiKey =
      this.configService.get<string>('apiKey.outgoing') || undefined;

    this.defaultTimeoutMs =
      this.configService.get<number>('http.timeoutMs') ?? 5000;
  }

  get<T = any>(
    url: string,
    options?: HttpClientOptions,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  post<T = any>(
    url: string,
    data?: any,
    options?: HttpClientOptions,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('POST', url, data, options);
  }

  put<T = any>(
    url: string,
    data?: any,
    options?: HttpClientOptions,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('PUT', url, data, options);
  }

  patch<T = any>(
    url: string,
    data?: any,
    options?: HttpClientOptions,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('PATCH', url, data, options);
  }

  delete<T = any>(
    url: string,
    options?: HttpClientOptions,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  private async request<T>(
    method: Method,
    url: string,
    data?: any,
    options: HttpClientOptions = {},
  ): Promise<AxiosResponse<T>> {
    const config = this.buildConfig(method, url, data, options);
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;

    return lastValueFrom(
      this.httpService.request<T>(config).pipe(timeout(timeoutMs)),
    );
  }

  private buildConfig(
    method: Method,
    url: string,
    data: any,
    options: HttpClientOptions,
  ): AxiosRequestConfig {
    const headers = {
      ...(options.headers ?? {}),
      ...this.buildAuthHeaders(options),
      Accept: 'application/json',
    };

    return {
      ...options,
      method,
      url,
      data,
      headers,
    };
  }

  private buildAuthHeaders(options: HttpClientOptions): Record<string, string> {
    if (options.skipApiKey) {
      return {};
    }

    const apiKey = options.apiKeyOverride ?? this.defaultApiKey;

    return apiKey ? { 'X-API-Key': apiKey } : {};
  }
}
