import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, timeout } from 'rxjs';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthDelegationService {
  private readonly loginUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const base = this.configService.get<string>('adminService.url');
    const prefix = this.configService.get<string>('adminService.apiPrefix');
    this.loginUrl = `${base}/${prefix}/v1/auth/login`;
  }

  async authenticate(email: string, password: string) {
    try {
      const response = await lastValueFrom(
        this.httpService
          .post<LoginResponseDto>(
            this.loginUrl,
            { email, password },
            {
              headers: {
                Accept: 'application/json',
              },
            },
          )
          .pipe(timeout(5000)),
      );

      if (!response.data?.success || !response.data.data) {
        return null;
      }

      return plainToInstance(LoginResponseDto, response.data);

    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401 || status === 422) {
        return null;
      }

      throw new UnauthorizedException('Authentication service unavailable');
    }
  }
}
