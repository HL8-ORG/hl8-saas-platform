import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantReadRepository } from '../../../../domain/tenants/repositories/tenant-read.repository.interface';
import { GetTenantsQuery } from '../get-tenants.query';
import { GetTenantsHandler } from './get-tenants.handler';

/**
 * 获取租户列表查询处理器单元测试
 *
 * 测试 GetTenantsHandler 的所有场景。
 *
 * @describe GetTenantsHandler
 */
describe('GetTenantsHandler', () => {
  let handler: GetTenantsHandler;
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
        GetTenantsHandler,
        {
          provide: 'ITenantReadRepository',
          useValue: mockTenantReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetTenantsHandler>(GetTenantsHandler);
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
    it('应该返回租户列表', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetTenantsQuery();

      tenantReadRepository.findAll.mockResolvedValue([mockTenant]);

      const result = await handler.execute(query);

      expect(tenantReadRepository.findAll).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(validTenantId);
      expect(result.data[0].name).toBe(validTenantName);
      expect(result.data[0].domain).toBe(validDomain);
      expect(result.data[0].isActive).toBe(true);
    });

    it('应该返回空列表当没有租户时', async () => {
      const query = new GetTenantsQuery();

      tenantReadRepository.findAll.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(0);
    });
  });
});
