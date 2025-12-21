import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../dto/error-response.dto';

@Catch()
export class HttpExceptionFilter
  implements ExceptionFilter, GqlExceptionFilter
{
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let status: number;
    let message: string | string[];
    let error: string;
    let request: Request | undefined;
    let response: Response | undefined;
    let path: string = '/graphql';
    let isGraphQL = false;
    let isValidHttpContext = false;

    try {
      const ctx = host.switchToHttp();
      response = ctx.getResponse<Response>();
      request = ctx.getRequest<Request>();

      if (
        response &&
        typeof response.status === 'function' &&
        typeof response.json === 'function'
      ) {
        isValidHttpContext = true;
        if (request) {
          path = request.url || '/';
        }
      } else {
        isGraphQL = true;
        response = undefined;
      }
    } catch (e) {
      console.error(e);
      isGraphQL = true;
      response = undefined;
    }

    if (!isValidHttpContext) {
      try {
        const gqlHost = GqlArgumentsHost.create(host);
        const gqlContext: any = gqlHost.getContext();
        request = gqlContext?.req;
        if (request) {
          path = request.url || '/graphql';
        }
      } catch (gqlError) {
        console.error(gqlError);
        path = '/graphql';
      }
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.constructor.name;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.constructor.name;
      } else {
        message = exception.message;
        error = exception.constructor.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
      error = exception.constructor.name || 'Error';

      const requestInfo = request
        ? `${request.method} ${request.url}`
        : 'GraphQL request';

      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
        requestInfo,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';

      const requestInfo = request
        ? `${request.method} ${request.url}`
        : 'GraphQL request';

      this.logger.error(
        `Unknown error occurred`,
        JSON.stringify(exception),
        requestInfo,
      );
    }

    const normalizedMessage = Array.isArray(message) ? message : [message];

    if (isGraphQL || !isValidHttpContext || !response) {
      if (exception instanceof HttpException) {
        throw exception;
      }
      throw new HttpException(
        {
          statusCode: status,
          message: normalizedMessage,
          error,
        },
        status,
      );
    }

    const errorResponse = new ErrorResponseDto(
      status,
      normalizedMessage,
      error,
      path,
    );

    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error: ${JSON.stringify(errorResponse)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `HTTP ${status} Error: ${JSON.stringify(errorResponse)}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
