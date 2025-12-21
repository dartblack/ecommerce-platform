import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtUserDto } from '../dtos/jwt-user.dto';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtUserDto => {
    let user: Express.User | undefined;
    if (context.getType() === 'http') {
      const request: Request = context.switchToHttp().getRequest();
      user = request.user;
    }

    if (context.getType<'graphql'>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      user = gqlContext.getContext().req.user;
    }
    if (!user) {
      throw new Error(
        'User not found in context. Make sure you are authenticating your request using the @AuthGuard() decorator.',
      );
    }

    return plainToInstance(JwtUserDto, user);
  },
);
