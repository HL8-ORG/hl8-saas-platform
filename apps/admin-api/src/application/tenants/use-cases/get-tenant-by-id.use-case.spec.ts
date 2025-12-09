import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantReadRepository } from '../../../domain/tenants/repositories/tenant-read.repository.interface';
import { GetTenantByIdInputDto } from '../dtos/get-tenant-by-id.input.dto';
import { GetTenantByIdUseCase } from './get-tenant-by-id.use-case';

/**
 * 根据ID获取租户用例单元测试
 *
 * 测试根据ID获取租户用例的所有场景。
 *
 * @describe GetTenantByIdUseCase
 */
describe('GetTenantByIdUseCase', () => {
  let useCase: GetTenantByIdUseCase;
  let tenantReadRepository: jest.Mocked<ITenantReadRepository>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  beforeEach(async () => {
    const mockTenantReadRepository = {
      findById: jest.fn(),
      findByDomain: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTenantByIdUseCase,
        {
          provide: 'ITenantReadRepository',
          useValue: mockTenantReadRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetTenantByIdUseCase>(GetTenantByIdUseCase);
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
        domain: 'test-tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input: GetTenantByIdInputDto = {
        tenantId: validTenantId,
      };

      tenantReadRepository.findById.mockResolvedValue(mockTenant);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(validTenantId);
      expect(result.name).toBe('Test Tenant');
      expect(result.domain).toBe('test-tenant');
      expect(result.isActive).toBe(true);

      expect(tenantReadRepository.findById).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it('应该处理租户不存在的情况', async () => {
      const input: GetTenantByIdInputDto = {
        tenantId: validTenantId,
      };

      tenantReadRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(tenantReadRepository.findById).toHaveBeenCalled();
    });
  });
});
