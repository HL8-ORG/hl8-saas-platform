import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantReadRepository } from '../../../../domain/tenants/repositories/tenant-read.repository.interface';
import { GetTenantByDomainQuery } from '../get-tenant-by-domain.query';
import { GetTenantByDomainHandler } from './get-tenant-by-domain.handler';

/**
 * 根据域名获取租户查询处理器单元测试
 *
 * 测试 GetTenantByDomainHandler 的所有场景。
 *
 * @describe GetTenantByDomainHandler
 */
describe('GetTenantByDomainHandler', () => {
  let handler: GetTenantByDomainHandler;
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
        GetTenantByDomainHandler,
        {
          provide: 'ITenantReadRepository',
          useValue: mockTenantReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetTenantByDomainHandler>(GetTenantByDomainHandler);
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

      const query = new GetTenantByDomainQuery(validDomain);

      tenantReadRepository.findByDomain.mockResolvedValue(mockTenant);

      const result = await handler.execute(query);

      expect(tenantReadRepository.findByDomain).toHaveBeenCalled();
      expect(result.id).toBe(validTenantId);
      expect(result.name).toBe(validTenantName);
      expect(result.domain).toBe(validDomain);
      expect(result.isActive).toBe(true);
    });

    it('应该抛出 NotFoundException 当租户不存在时', async () => {
      const query = new GetTenantByDomainQuery(validDomain);

      tenantReadRepository.findByDomain.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('租户不存在');

      expect(tenantReadRepository.findByDomain).toHaveBeenCalled();
    });
  });
});
