import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, timeout } from 'rxjs';

interface AdminLoginResponse {
  success: boolean;
  data?: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
    token: string;
    token_type: string;
  };
  message?: string;
}

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
          .post<AdminLoginResponse>(
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

      const { user, token, token_type } = response.data.data;

      /**
       * Return minimal trusted identity
       * Token is returned only because you explicitly need it
       */
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken: token,
        tokenType: token_type,
      };
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401 || status === 422) {
        return null;
      }

      throw new UnauthorizedException('Authentication service unavailable');
    }
  }
}
