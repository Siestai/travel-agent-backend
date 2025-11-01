import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from './app-error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Handle AppError instances (already formatted)
    if (exception instanceof AppError) {
      return response.status(exception.status).json({
        ...exception,
      });
    }

    // Handle HttpException instances
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      this.logger.error(
        `HTTP Exception: ${status}`,
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : JSON.stringify(exceptionResponse),
      );

      return response.status(status).json({
        code: 'HTTP_ERROR',
        status,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || exception.message,
      });
    }

    // Handle database errors (like constraint violations)
    if (exception && typeof exception === 'object' && 'code' in exception) {
      const dbError = exception as any;

      // PostgreSQL unique constraint violation
      if (dbError.code === '23505') {
        this.logger.warn(`Database constraint violation: ${dbError.message}`);
        return response.status(HttpStatus.CONFLICT).json({
          code: 'CONFLICT',
          status: HttpStatus.CONFLICT,
          message: 'A record with this information already exists',
        });
      }

      // Other database errors
      this.logger.error(`Database error: ${dbError.code}`, dbError.message);
    }

    // Handle unknown errors
    this.logger.error(
      `Unhandled exception: ${exception}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    return response.status(status).json({
      code: 'INTERNAL_SERVER_ERROR',
      status,
      message:
        exception instanceof Error
          ? exception.message
          : 'An unexpected error occurred',
    });
  }
}
