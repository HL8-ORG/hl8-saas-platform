import { Params } from '@hl8/logger';
import { IncomingMessage, ServerResponse } from 'http';

/**
 * Pino 日志配置
 *
 * 配置 Pino 日志记录器的行为，包括传输方式、日志级别、敏感信息脱敏等。
 *
 * **配置特性**：
 * - 开发环境：使用 pino-pretty 进行格式化输出
 * - 生产环境：使用 JSON 格式输出
 * - 自动脱敏：移除敏感信息（授权头、Cookie、密码等）
 * - 自定义日志级别：根据 HTTP 状态码自动调整日志级别
 * - 关联 ID：自动包含请求关联 ID
 * - 忽略健康检查端点：不记录健康检查请求
 *
 * @constant {Params} loggerConfig
 * @description Pino 日志记录器配置
 */
export const loggerConfig: Params = {
  pinoHttp: {
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              singleLine: false,
              messageFormat: '[{context}] {msg}',
            },
          }
        : undefined,

    customProps: (req: unknown) => {
      const request = req as { correlationId?: string };
      return {
        correlationId: request.correlationId,
      };
    },

    // Customize log levels for different status codes
    customLogLevel: (
      _req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
      err: Error | undefined,
    ) => {
      if (res.statusCode >= 500 || err) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },

    // Customize success message
    customSuccessMessage: (
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
    ) => {
      return `${req.method} ${req.url} - ${res.statusCode}`;
    },

    // Customize error message
    customErrorMessage: (
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
      err: Error,
    ) => {
      return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
    },

    // Redact sensitive information
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'res.headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },

    serializers: {
      req: (req: {
        id: string;
        method: string;
        url: string;
        query: unknown;
        params: unknown;
        headers: Record<string, unknown>;
        remoteAddress: string;
        remotePort: number;
      }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
        },
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      }),
      res: (res: { statusCode: number; headers: Record<string, unknown> }) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.headers['content-type'],
        },
      }),
    },

    level: process.env.LOG_LEVEL || 'info',

    // Don't log health check endpoints
    autoLogging: {
      ignore: (req: IncomingMessage) =>
        req.url === '/health' || req.url === '/api/v1/health',
    },
  },
};
