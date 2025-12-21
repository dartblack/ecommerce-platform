import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { RolesEnum } from '../enums/roles.enum';
import { GqlExecutionContext } from '@nestjs/graphql';
import { LoginResponseDataDto } from '../dtos/login-response.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  getRequest(context: ExecutionContext) {
    if (context.getType<'graphql'>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getContext().req;
    }

    return context.switchToHttp().getRequest();
  }
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolesEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = this.getRequest(context);
    const userData: LoginResponseDataDto = request.user;
    const userRole = userData?.user?.role?.toLowerCase();

    return requiredRoles.some((role) => role.toLowerCase() === userRole);
  }
}
