import { Logger } from '@hl8/logger';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * HTTP 异常过滤器
 *
 * 全局异常过滤器，用于捕获和处理所有 HTTP 异常。
 * 将异常转换为统一的错误响应格式，并记录详细的错误日志。
 *
 * **功能特性**：
 * - 统一错误响应格式
 * - 自动生成错误代码
 * - 记录错误日志（包含关联 ID、堆栈跟踪等）
 * - 支持自定义错误消息和详情
 *
 * @class HttpExceptionFilter
 * @implements {ExceptionFilter}
 * @description 全局 HTTP 异常过滤器
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * 构造函数
   *
   * 注入日志记录器依赖。
   *
   * @param {Logger} logger - Pino 日志记录器
   */
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  /**
   * 捕获并处理异常
   *
   * 将异常转换为统一的错误响应格式，并记录错误日志。
   *
   * @param {unknown} exception - 捕获的异常对象
   * @param {ArgumentsHost} host - 参数宿主，提供请求和响应对象
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();
    const correlationId = request['correlationId'] as string;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;

        // Handle validation errors (message can be an array of validation errors)
        if (Array.isArray(responseObj.message)) {
          // For validation errors, use the first error message as the main message
          // and include all errors in details
          message = (responseObj.message[0] as string) || message;
          const errorDetails: Record<string, unknown> = {
            validationErrors: responseObj.message,
          };
          if (
            responseObj.error &&
            typeof responseObj.error === 'object' &&
            responseObj.error !== null
          ) {
            errorDetails.error = responseObj.error;
          }
          details = errorDetails;
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
          details = responseObj.error || responseObj.details;
        } else {
          details = responseObj.error || responseObj.details;
        }
      }

      // Generate error code from status
      code = this.getErrorCode(status, message);
    } else if (exception instanceof Error) {
      message = exception.message;
      code = 'INTERNAL_SERVER_ERROR';
    }

    // Log the error with correlation ID
    this.logger.error(
      {
        correlationId,
        statusCode: status,
        errorCode: code,
        message,
        details,
        path: request.url,
        method: request.method,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
      `Error occurred: ${message}`,
    );

    const errorResponse: ApiResponse = {
      success: false,
      error: {
        message,
        code,
        ...(details !== undefined && { details }),
      },
      meta: {
        correlationId,
      },
    };

    // Use Fastify reply API
    // NestJS Fastify adapter provides status() and send() methods
    const replyAny = reply as any;
    if (
      typeof replyAny.status === 'function' &&
      typeof replyAny.send === 'function'
    ) {
      replyAny.status(status).send(errorResponse);
    } else {
      // Fallback: use raw response object
      reply.raw.statusCode = status;
      reply.raw.setHeader('Content-Type', 'application/json');
      reply.raw.end(JSON.stringify(errorResponse));
    }
  }

  /**
   * 生成错误代码
   *
   * 根据 HTTP 状态码和错误消息生成标准化的错误代码。
   *
   * @private
   * @param {number} status - HTTP 状态码
   * @param {string} message - 错误消息
   * @returns {string} 错误代码
   */
  private getErrorCode(status: number, message: string): string {
    // Convert message to error code format
    const messageCode = message
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    // Map common HTTP status codes
    const statusCodeMap: { [key: number]: string } = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
    };

    // If we have a specific message code, use it, otherwise use status code
    if (messageCode && messageCode !== statusCodeMap[status]) {
      return messageCode;
    }

    return statusCodeMap[status] || 'INTERNAL_SERVER_ERROR';
  }
}
