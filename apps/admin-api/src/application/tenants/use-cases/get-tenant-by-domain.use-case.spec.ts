import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantReadRepository } from '../../../domain/tenants/repositories/tenant-read.repository.interface';
import { GetTenantByDomainInputDto } from '../dtos/get-tenant-by-domain.input.dto';
import { GetTenantByDomainUseCase } from './get-tenant-by-domain.use-case';

/**
 * 根据域名获取租户用例单元测试
 *
 * 测试根据域名获取租户用例的所有场景。
 *
 * @describe GetTenantByDomainUseCase
 */
describe('GetTenantByDomainUseCase', () => {
  let useCase: GetTenantByDomainUseCase;
  let tenantReadRepository: jest.Mocked<ITenantReadRepository>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validDomain = 'test-tenant';

  beforeEach(async () => {
    const mockTenantReadRepository = {
      findById: jest.fn(),
      findByDomain: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTenantByDomainUseCase,
        {
          provide: 'ITenantReadRepository',
          useValue: mockTenantReadRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetTenantByDomainUseCase>(GetTenantByDomainUseCase);
    tenantReadRepository = module.get('ITenantReadRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功获取租户信息', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: 'Test Tenant',
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input: GetTenantByDomainInputDto = {
        domain: validDomain,
      };

      tenantReadRepository.findByDomain.mockResolvedValue(mockTenant);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(validTenantId);
      expect(result.name).toBe('Test Tenant');
      expect(result.domain).toBe(validDomain);
      expect(result.isActive).toBe(true);

      expect(tenantReadRepository.findByDomain).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it('应该处理租户不存在的情况', async () => {
      const input: GetTenantByDomainInputDto = {
        domain: validDomain,
      };

      tenantReadRepository.findByDomain.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(tenantReadRepository.findByDomain).toHaveBeenCalled();
    });
  });
});
