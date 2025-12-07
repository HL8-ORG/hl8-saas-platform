import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyRequest } from 'fastify';
import { of } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import { ResponseInterceptor } from './response.interceptor';

/**
 * 响应拦截器单元测试
 *
 * 测试响应拦截器的数据包装和格式化逻辑。
 *
 * @describe ResponseInterceptor
 */
describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor<unknown>>(ResponseInterceptor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    beforeEach(() => {
      const mockRequest = {
        correlationId: 'test-correlation-id',
      } as unknown as FastifyRequest;

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      mockCallHandler = {
        handle: jest.fn(),
      } as unknown as CallHandler;
    });

    it('应该包装普通数据为标准响应格式', (done) => {
      const data = { id: '1', name: 'Test' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(data));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(response).toEqual({
          success: true,
          data,
          meta: {
            correlationId: 'test-correlation-id',
            timestamp: expect.any(String),
          },
        });
        done();
      });
    });

    it('应该保留已格式化的响应并更新元数据', (done) => {
      const existingResponse: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '1' },
        meta: {
          requestId: 'existing-request-id',
        },
      };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of(existingResponse),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(response).toEqual({
          success: true,
          data: { id: '1' },
          meta: {
            requestId: 'existing-request-id',
            correlationId: 'test-correlation-id',
            timestamp: expect.any(String),
          },
        });
        done();
      });
    });

    it('应该处理 undefined 数据', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(undefined));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(response).toEqual({
          success: true,
          data: undefined,
          meta: {
            correlationId: 'test-correlation-id',
            timestamp: expect.any(String),
          },
        });
        done();
      });
    });

    it('应该处理 null 数据', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(response).toEqual({
          success: true,
          data: null,
          meta: {
            correlationId: 'test-correlation-id',
            timestamp: expect.any(String),
          },
        });
        done();
      });
    });

    it('应该处理数组数据', (done) => {
      const data = [{ id: '1' }, { id: '2' }];
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(data));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(response).toEqual({
          success: true,
          data,
          meta: {
            correlationId: 'test-correlation-id',
            timestamp: expect.any(String),
          },
        });
        done();
      });
    });

    it('应该生成 ISO 格式的时间戳', (done) => {
      const data = { id: '1' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(data));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(response.meta?.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
        done();
      });
    });

    it('当 correlationId 不存在时应该处理', (done) => {
      const mockRequestWithoutCorrelationId = {} as unknown as FastifyRequest;
      const mockExecutionContextWithoutCorrelationId = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest
            .fn()
            .mockReturnValue(mockRequestWithoutCorrelationId),
        }),
      } as unknown as ExecutionContext;

      const data = { id: '1' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(data));

      const result = interceptor.intercept(
        mockExecutionContextWithoutCorrelationId,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(response.meta?.correlationId).toBeUndefined();
        expect(response).toEqual({
          success: true,
          data,
          meta: {
            timestamp: expect.any(String),
          },
        });
        done();
      });
    });
  });
});
