import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

/**
 * 关联 ID 中间件单元测试
 *
 * 测试关联 ID 中间件的请求追踪功能。
 *
 * @describe CorrelationIdMiddleware
 */
describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;
  let nextCallback: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrelationIdMiddleware],
    }).compile();

    middleware = module.get<CorrelationIdMiddleware>(CorrelationIdMiddleware);

    nextCallback = jest.fn();

    mockRequest = {
      headers: {},
    } as unknown as FastifyRequest;

    mockReply = {
      raw: {
        setHeader: jest.fn(),
      },
    } as unknown as FastifyReply;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('应该从请求头中提取关联 ID', () => {
      const correlationId = randomUUID();
      mockRequest.headers['x-correlation-id'] = correlationId;
      const replyAny = mockReply as any;
      replyAny.header = jest.fn().mockReturnThis();

      middleware.use(mockRequest, mockReply, nextCallback);

      expect(mockRequest['correlationId']).toBe(correlationId);
      expect(replyAny.header).toHaveBeenCalledWith(
        'X-Correlation-ID',
        correlationId,
      );
      expect(nextCallback).toHaveBeenCalled();
    });

    it('当请求头中没有关联 ID 时应该生成新的 UUID', () => {
      mockRequest.headers = {};
      const replyAny = mockReply as any;
      replyAny.header = jest.fn().mockReturnThis();

      middleware.use(mockRequest, mockReply, nextCallback);

      expect(mockRequest['correlationId']).toBeDefined();
      expect(typeof mockRequest['correlationId']).toBe('string');
      expect(mockRequest['correlationId']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(replyAny.header).toHaveBeenCalledWith(
        'X-Correlation-ID',
        mockRequest['correlationId'],
      );
      expect(nextCallback).toHaveBeenCalled();
    });

    it('应该使用 reply.header 方法设置响应头', () => {
      const correlationId = randomUUID();
      mockRequest.headers['x-correlation-id'] = correlationId;
      const replyAny = mockReply as any;
      replyAny.header = jest.fn().mockReturnThis();

      middleware.use(mockRequest, mockReply, nextCallback);

      expect(replyAny.header).toHaveBeenCalledWith(
        'X-Correlation-ID',
        correlationId,
      );
    });

    it('当 reply.header 不存在时应该使用 reply.raw.setHeader', () => {
      const correlationId = randomUUID();
      mockRequest.headers['x-correlation-id'] = correlationId;
      const replyAny = mockReply as any;
      replyAny.header = undefined;

      middleware.use(mockRequest, mockReply, nextCallback);

      expect(mockReply.raw.setHeader).toHaveBeenCalledWith(
        'X-Correlation-ID',
        correlationId,
      );
      expect(nextCallback).toHaveBeenCalled();
    });

    it('应该调用 next 回调函数', () => {
      mockRequest.headers = {};
      const replyAny = mockReply as any;
      replyAny.header = jest.fn().mockReturnThis();

      middleware.use(mockRequest, mockReply, nextCallback);

      expect(nextCallback).toHaveBeenCalledTimes(1);
    });

    it('应该将关联 ID 附加到请求对象', () => {
      const correlationId = randomUUID();
      mockRequest.headers['x-correlation-id'] = correlationId;
      const replyAny = mockReply as any;
      replyAny.header = jest.fn().mockReturnThis();

      middleware.use(mockRequest, mockReply, nextCallback);

      expect(mockRequest['correlationId']).toBe(correlationId);
    });

    it('应该处理空字符串的关联 ID', () => {
      mockRequest.headers['x-correlation-id'] = '';
      const replyAny = mockReply as any;
      replyAny.header = jest.fn().mockReturnThis();

      middleware.use(mockRequest, mockReply, nextCallback);

      // 空字符串应该被视为 falsy，会生成新的 UUID
      expect(mockRequest['correlationId']).toBeDefined();
      expect(mockRequest['correlationId']).not.toBe('');
      expect(mockRequest['correlationId']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });
});
