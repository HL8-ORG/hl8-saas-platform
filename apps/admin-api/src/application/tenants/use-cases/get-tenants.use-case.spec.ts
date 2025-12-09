import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantReadRepository } from '../../../domain/tenants/repositories/tenant-read.repository.interface';
import { GetTenantsInputDto } from '../dtos/get-tenants.input.dto';
import { GetTenantsUseCase } from './get-tenants.use-case';

/**
 * 获取租户列表用例单元测试
 *
 * 测试获取租户列表用例的所有场景。
 *
 * @describe GetTenantsUseCase
 */
describe('GetTenantsUseCase', () => {
  let useCase: GetTenantsUseCase;
  let tenantReadRepository: jest.Mocked<ITenantReadRepository>;

  const validTenantId1 = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId2 = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockTenantReadRepository = {
      findById: jest.fn(),
      findByDomain: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTenantsUseCase,
        {
          provide: 'ITenantReadRepository',
          useValue: mockTenantReadRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetTenantsUseCase>(GetTenantsUseCase);
    tenantReadRepository = module.get('ITenantReadRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功获取租户列表', async () => {
      const mockTenants = [
        Tenant.reconstitute({
          id: validTenantId1,
          name: 'Test Tenant 1',
          domain: 'test-tenant-1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Tenant.reconstitute({
          id: validTenantId2,
          name: 'Test Tenant 2',
          domain: 'test-tenant-2',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const input: GetTenantsInputDto = {};

      tenantReadRepository.findAll.mockResolvedValue(mockTenants);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(validTenantId1);
      expect(result.data[0].name).toBe('Test Tenant 1');
      expect(result.data[0].domain).toBe('test-tenant-1');
      expect(result.data[1].id).toBe(validTenantId2);
      expect(result.data[1].name).toBe('Test Tenant 2');
      expect(result.data[1].domain).toBe('test-tenant-2');

      expect(tenantReadRepository.findAll).toHaveBeenCalled();
    });

    it('应该处理空租户列表的情况', async () => {
      const input: GetTenantsInputDto = {};

      tenantReadRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data).toHaveLength(0);

      expect(tenantReadRepository.findAll).toHaveBeenCalled();
    });
  });
});
