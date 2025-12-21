import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthDelegationService } from '../services/auth-delegation.service';
import { LoginResponseDataDto } from '../dtos/login-response.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authDelegationService: AuthDelegationService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<LoginResponseDataDto> {
    const result = await this.authDelegationService.authenticate(
      email,
      password,
    );

    if (!result) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return result.data;
  }
}
