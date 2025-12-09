import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../domain/tenants/repositories/tenant.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { UpdateTenantInputDto } from '../dtos/update-tenant.input.dto';
import { UpdateTenantUseCase } from './update-tenant.use-case';

/**
 * 更新租户用例单元测试
 *
 * 测试更新租户用例的所有场景。
 *
 * @describe UpdateTenantUseCase
 */
describe('UpdateTenantUseCase', () => {
  let useCase: UpdateTenantUseCase;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId2 = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockTenantRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findByDomain: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTenantUseCase,
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

    useCase = module.get<UpdateTenantUseCase>(UpdateTenantUseCase);
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

    it('应该成功更新租户名称', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: 'Old Name',
        domain: 'test-tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input: UpdateTenantInputDto = {
        tenantId: validTenantId,
        name: 'New Name',
      };

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.findByName.mockResolvedValue(null);
      tenantRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(validTenantId);
      expect(result.name).toBe('New Name');

      expect(tenantRepository.findById).toHaveBeenCalled();
      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该处理租户不存在的情况', async () => {
      const input: UpdateTenantInputDto = {
        tenantId: validTenantId,
        name: 'New Name',
      };

      tenantRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(tenantRepository.findById).toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });

    it('应该处理租户名称已存在的情况', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: 'Old Name',
        domain: 'test-tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const existingTenant = Tenant.reconstitute({
        id: validTenantId2,
        name: 'New Name',
        domain: 'other-tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input: UpdateTenantInputDto = {
        tenantId: validTenantId,
        name: 'New Name',
      };

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.findByName.mockResolvedValue(existingTenant);

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

      expect(tenantRepository.findById).toHaveBeenCalled();
      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });
  });
});
