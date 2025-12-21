import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext) {
    try {
      const gqlContext = GqlExecutionContext.create(context);
      if (gqlContext) {
        const ctx = gqlContext.getContext();
        const request = ctx?.req || ctx?.request;
        if (request) {
          return request;
        }
      }
    } catch (e) {}

    try {
      return context.switchToHttp().getRequest();
    } catch (e) {
      throw new Error('No request found');
    }
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    try {
      const request = this.getRequest(context);
      if (!request || typeof request.logIn !== 'function') {
        try {
          const gqlContext = GqlExecutionContext.create(context);
          if (gqlContext) {
            return true;
          }
        } catch (e) {}
      }
    } catch (e) {
      return true;
    }
    console.log('>>>> jwt can activate');

    return super.canActivate(context);
  }
}
