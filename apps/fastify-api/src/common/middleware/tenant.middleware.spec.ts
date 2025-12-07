import { BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { TENANT_CONTEXT_KEY } from '../constants/tenant.constants';
import { TenantMiddleware } from './tenant.middleware';

/**
 * 租户中间件单元测试
 *
 * 测试租户中间件的租户 ID 提取和验证功能。
 *
 * @describe TenantMiddleware
 */
describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;
  let nextCallback: jest.Mock;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantMiddleware, Reflector],
    }).compile();

    middleware = module.get<TenantMiddleware>(TenantMiddleware);
    reflector = module.get<Reflector>(Reflector);

    nextCallback = jest.fn();

    mockRequest = {
      headers: {},
    } as unknown as FastifyRequest;

    mockReply = {} as unknown as FastifyReply;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    const validTenantId = '550e8400-e29b-41d4-a716-446655440000';

    it('应该从 JWT payload 中提取租户 ID', () => {
      (mockRequest as any).user = { tenantId: validTenantId };

      middleware.use(mockRequest, mockReply, nextCallback);

      expect((mockRequest as any)[TENANT_CONTEXT_KEY]).toBe(validTenantId);
      expect(nextCallback).toHaveBeenCalled();
    });

    it('应该从 X-Tenant-Id 请求头中提取租户 ID', () => {
      mockRequest.headers['x-tenant-id'] = validTenantId;

      middleware.use(mockRequest, mockReply, nextCallback);

      expect((mockRequest as any)[TENANT_CONTEXT_KEY]).toBe(validTenantId);
      expect(nextCallback).toHaveBeenCalled();
    });

    it('JWT payload 中的租户 ID 应该优先于请求头', () => {
      const jwtTenantId = '550e8400-e29b-41d4-a716-446655440001';
      const headerTenantId = '550e8400-e29b-41d4-a716-446655440002';
      (mockRequest as any).user = { tenantId: jwtTenantId };
      mockRequest.headers['x-tenant-id'] = headerTenantId;

      middleware.use(mockRequest, mockReply, nextCallback);

      expect((mockRequest as any)[TENANT_CONTEXT_KEY]).toBe(jwtTenantId);
      expect(nextCallback).toHaveBeenCalled();
    });

    it('当租户 ID 格式无效时应该抛出 BadRequestException', () => {
      mockRequest.headers['x-tenant-id'] = 'invalid-uuid';

      expect(() => {
        middleware.use(mockRequest, mockReply, nextCallback);
      }).toThrow(BadRequestException);
      expect(() => {
        middleware.use(mockRequest, mockReply, nextCallback);
      }).toThrow('无效的租户 ID 格式');
      expect(nextCallback).not.toHaveBeenCalled();
    });

    it('当租户 ID 为空字符串时不应该抛出异常（允许公共路由）', () => {
      mockRequest.headers['x-tenant-id'] = '';

      middleware.use(mockRequest, mockReply, nextCallback);

      // 空字符串会被视为无效，但不会抛出异常（允许公共路由）
      expect((mockRequest as any)[TENANT_CONTEXT_KEY]).toBeUndefined();
      expect(nextCallback).toHaveBeenCalled();
    });

    it('当没有租户 ID 时不应该抛出异常（允许公共路由）', () => {
      mockRequest.headers = {};
      (mockRequest as any).user = null;

      middleware.use(mockRequest, mockReply, nextCallback);

      expect((mockRequest as any)[TENANT_CONTEXT_KEY]).toBeUndefined();
      expect(nextCallback).toHaveBeenCalled();
    });

    it('应该验证 UUID 格式', () => {
      const invalidIds = [
        'not-a-uuid',
        '550e8400',
        '550e8400-e29b-41d4',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
      ];

      invalidIds.forEach((invalidId) => {
        mockRequest.headers['x-tenant-id'] = invalidId;
        expect(() => {
          middleware.use(mockRequest, mockReply, nextCallback);
        }).toThrow(BadRequestException);
      });
    });

    it('应该接受有效的 UUID v4 格式', () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        '00000000-0000-4000-8000-000000000000',
      ];

      validUuids.forEach((validUuid) => {
        mockRequest.headers['x-tenant-id'] = validUuid;
        nextCallback.mockClear();
        middleware.use(mockRequest, mockReply, nextCallback);
        expect((mockRequest as any)[TENANT_CONTEXT_KEY]).toBe(validUuid);
        expect(nextCallback).toHaveBeenCalled();
      });
    });

    it('应该调用 next 回调函数', () => {
      mockRequest.headers['x-tenant-id'] = validTenantId;

      middleware.use(mockRequest, mockReply, nextCallback);

      expect(nextCallback).toHaveBeenCalledTimes(1);
    });

    it('应该将租户 ID 附加到请求对象', () => {
      mockRequest.headers['x-tenant-id'] = validTenantId;

      middleware.use(mockRequest, mockReply, nextCallback);

      expect((mockRequest as any)[TENANT_CONTEXT_KEY]).toBe(validTenantId);
    });
  });
});
