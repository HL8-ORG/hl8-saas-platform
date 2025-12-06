import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * 关联 ID 中间件
 *
 * @description
 * 为每个 HTTP 请求生成或提取关联 ID，用于请求追踪和日志关联。
 * 如果请求头中包含 `x-correlation-id`，则使用该值；否则生成新的 UUID。
 *
 * **功能特性**：
 * - 从请求头提取关联 ID 或生成新的 UUID
 * - 将关联 ID 附加到请求对象供后续使用
 * - 在响应头中设置关联 ID
 *
 * @class CorrelationIdMiddleware
 * @implements {NestMiddleware}
 * @description 关联 ID 中间件，用于请求追踪
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  /**
   * 中间件处理方法
   *
   * @description 提取或生成关联 ID，并将其附加到请求和响应中。
   *
   * @param {FastifyRequest} req - Fastify 请求对象
   * @param {FastifyReply} reply - Fastify 响应对象
   * @param {() => void} next - 下一个中间件的回调函数
   */
  use(req: FastifyRequest, reply: FastifyReply, next: () => void): void {
    // Get correlation ID from header or generate new one
    const correlationId =
      (req.headers['x-correlation-id'] as string) || randomUUID();

    // Attach to request for later use
    req['correlationId'] = correlationId;

    // Set response header
    // Fastify reply has header() method, but NestJS adapter may wrap it
    // Try multiple approaches for compatibility
    const replyAny = reply as any;
    if (typeof replyAny.header === 'function') {
      replyAny.header('X-Correlation-ID', correlationId);
    } else if (reply.raw && typeof reply.raw.setHeader === 'function') {
      reply.raw.setHeader('X-Correlation-ID', correlationId);
    }

    next();
  }
}
