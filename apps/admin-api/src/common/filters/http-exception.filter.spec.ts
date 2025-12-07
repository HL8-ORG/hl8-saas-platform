import { Logger } from '@hl8/logger';
import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { HttpExceptionFilter } from './http-exception.filter';

/**
 * HTTP 异常过滤器单元测试
 *
 * 测试异常过滤器的错误处理和响应格式化逻辑。
 *
 * @describe HttpExceptionFilter
 */
describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let logger: jest.Mocked<Logger>;
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;

  beforeEach(async () => {
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    mockRequest = {
      url: '/test',
      method: 'GET',
      correlationId: 'test-correlation-id',
    } as unknown as FastifyRequest;

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      raw: {
        statusCode: 200,
        setHeader: jest.fn(),
        end: jest.fn(),
      },
    } as unknown as FastifyReply;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    logger = module.get(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    let mockHost: ArgumentsHost;

    beforeEach(() => {
      mockHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockReply),
        }),
      } as unknown as ArgumentsHost;
    });

    it('应该处理 HttpException 并返回标准错误响应', () => {
      const exception = new BadRequestException('Bad request');
      const replyAny = mockReply as any;
      replyAny.status = jest.fn().mockReturnThis();
      replyAny.send = jest.fn().mockReturnThis();

      filter.catch(exception, mockHost);

      expect(logger.error).toHaveBeenCalled();
      expect(replyAny.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(replyAny.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Bad request',
            code: 'BAD_REQUEST',
          }),
          meta: expect.objectContaining({
            correlationId: 'test-correlation-id',
          }),
        }),
      );
    });

    it('应该处理字符串类型的异常响应', () => {
      const exception = new UnauthorizedException('Unauthorized');
      const replyAny = mockReply as any;
      replyAny.status = jest.fn().mockReturnThis();
      replyAny.send = jest.fn().mockReturnThis();

      filter.catch(exception, mockHost);

      expect(replyAny.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          }),
        }),
      );
    });

    it('应该处理对象类型的异常响应', () => {
      const exception = new BadRequestException({
        message: 'Validation failed',
        error: 'Bad Request',
      });
      const replyAny = mockReply as any;
      replyAny.status = jest.fn().mockReturnThis();
      replyAny.send = jest.fn().mockReturnThis();

      filter.catch(exception, mockHost);

      expect(replyAny.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Validation failed',
            code: expect.any(String),
            details: 'Bad Request',
          }),
        }),
      );
    });

    it('应该处理验证错误数组', () => {
      const exception = new UnprocessableEntityException({
        message: ['Email is required', 'Password is too short'],
        error: 'Validation Error',
      });
      const replyAny = mockReply as any;
      replyAny.status = jest.fn().mockReturnThis();
      replyAny.send = jest.fn().mockReturnThis();

      filter.catch(exception, mockHost);

      expect(replyAny.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Email is required',
            code: expect.any(String),
            details: expect.objectContaining({
              validationErrors: ['Email is required', 'Password is too short'],
            }),
          }),
        }),
      );
    });

    it('应该处理不同类型的 HTTP 异常', () => {
      const exceptions = [
        { exception: new ForbiddenException('Forbidden'), code: 'FORBIDDEN' },
        { exception: new NotFoundException('Not found'), code: 'NOT_FOUND' },
        { exception: new ConflictException('Conflict'), code: 'CONFLICT' },
      ];

      exceptions.forEach(({ exception, code }) => {
        const replyAny = mockReply as any;
        replyAny.status = jest.fn().mockReturnThis();
        replyAny.send = jest.fn().mockReturnThis();

        filter.catch(exception, mockHost);

        expect(replyAny.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code,
            }),
          }),
        );
      });
    });

    it('应该处理非 HttpException 的 Error', () => {
      const error = new Error('Internal error');
      const replyAny = mockReply as any;
      replyAny.status = jest.fn().mockReturnThis();
      replyAny.send = jest.fn().mockReturnThis();

      filter.catch(error, mockHost);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String),
        }),
        expect.any(String),
      );
      expect(replyAny.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(replyAny.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Internal error',
            code: 'INTERNAL_SERVER_ERROR',
          }),
        }),
      );
    });

    it('应该处理未知类型的异常', () => {
      const unknownError = 'Unknown error';
      const replyAny = mockReply as any;
      replyAny.status = jest.fn().mockReturnThis();
      replyAny.send = jest.fn().mockReturnThis();

      filter.catch(unknownError, mockHost);

      expect(replyAny.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(replyAny.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
          }),
        }),
      );
    });

    it('当 reply.status 不存在时应该使用 fallback', () => {
      const exception = new BadRequestException('Bad request');
      const replyWithoutStatus = {
        raw: {
          statusCode: 200,
          setHeader: jest.fn(),
          end: jest.fn(),
        },
      } as unknown as FastifyReply;

      const mockHostWithoutStatus = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(replyWithoutStatus),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockHostWithoutStatus);

      expect(replyWithoutStatus.raw.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(replyWithoutStatus.raw.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
      expect(replyWithoutStatus.raw.end).toHaveBeenCalled();
    });
  });
});
