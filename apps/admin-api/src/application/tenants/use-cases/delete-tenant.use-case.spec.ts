import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../domain/tenants/repositories/tenant.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { DeleteTenantInputDto } from '../dtos/delete-tenant.input.dto';
import { DeleteTenantUseCase } from './delete-tenant.use-case';

/**
 * 删除租户用例单元测试
 *
 * 测试删除租户用例的所有场景。
 *
 * @describe DeleteTenantUseCase
 */
describe('DeleteTenantUseCase', () => {
  let useCase: DeleteTenantUseCase;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  beforeEach(async () => {
    const mockTenantRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findByDomain: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTenantUseCase,
        {
          provide: 'ITenantRepository',
          useValue: mockTenantRepository,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
      ],
    }).compile();

    useCase = module.get<DeleteTenantUseCase>(DeleteTenantUseCase);
    tenantRepository = module.get('ITenantRepository');
    eventBus = module.get('IEventBus');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功删除租户', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: 'Test Tenant',
        domain: 'test-tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input: DeleteTenantInputDto = {
        tenantId: validTenantId,
      };

      tenantRepository.findById.mockResolvedValue(mockTenant);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.message).toBe('租户删除成功');

      expect(tenantRepository.findById).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(tenantRepository.delete).toHaveBeenCalledWith(expect.any(Object));
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该处理租户不存在的情况', async () => {
      const input: DeleteTenantInputDto = {
        tenantId: validTenantId,
      };

      tenantRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(tenantRepository.findById).toHaveBeenCalled();
      expect(tenantRepository.delete).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });
  });
});
