import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantReadRepository } from '../../../../domain/tenants/repositories/tenant-read.repository.interface';
import { GetTenantByIdQuery } from '../get-tenant-by-id.query';
import { GetTenantByIdHandler } from './get-tenant-by-id.handler';

/**
 * 根据ID获取租户查询处理器单元测试
 *
 * 测试 GetTenantByIdHandler 的所有场景。
 *
 * @describe GetTenantByIdHandler
 */
describe('GetTenantByIdHandler', () => {
  let handler: GetTenantByIdHandler;
  let tenantReadRepository: jest.Mocked<ITenantReadRepository>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantName = 'Test Tenant';
  const validDomain = 'test-tenant';

  beforeEach(async () => {
    const mockTenantReadRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findByDomain: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTenantByIdHandler,
        {
          provide: 'ITenantReadRepository',
          useValue: mockTenantReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetTenantByIdHandler>(GetTenantByIdHandler);
    tenantReadRepository = module.get('ITenantReadRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该返回租户信息', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetTenantByIdQuery(validTenantId);

      tenantReadRepository.findById.mockResolvedValue(mockTenant);

      const result = await handler.execute(query);

      expect(tenantReadRepository.findById).toHaveBeenCalled();
      expect(result.id).toBe(validTenantId);
      expect(result.name).toBe(validTenantName);
      expect(result.domain).toBe(validDomain);
      expect(result.isActive).toBe(true);
    });

    it('应该抛出 NotFoundException 当租户不存在时', async () => {
      const query = new GetTenantByIdQuery(validTenantId);

      tenantReadRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('租户不存在');

      expect(tenantReadRepository.findById).toHaveBeenCalled();
    });
  });
});
