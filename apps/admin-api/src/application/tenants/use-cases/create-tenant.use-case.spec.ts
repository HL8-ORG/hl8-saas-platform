import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../domain/tenants/repositories/tenant.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { CreateTenantInputDto } from '../dtos/create-tenant.input.dto';
import { CreateTenantUseCase } from './create-tenant.use-case';

/**
 * 创建租户用例单元测试
 *
 * 测试创建租户用例的所有场景。
 *
 * @describe CreateTenantUseCase
 */
describe('CreateTenantUseCase', () => {
  let useCase: CreateTenantUseCase;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  beforeEach(async () => {
    const mockTenantRepository = {
      findByName: jest.fn(),
      findByDomain: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
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
        CreateTenantUseCase,
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

    useCase = module.get<CreateTenantUseCase>(CreateTenantUseCase);
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

    it('应该成功创建租户', async () => {
      const input = new CreateTenantInputDto({
        name: 'Test Tenant',
        domain: 'test-tenant',
        isActive: true,
      });

      tenantRepository.findByName.mockResolvedValue(null);
      tenantRepository.findByDomain.mockResolvedValue(null);
      tenantRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Tenant');
      expect(result.domain).toBe('test-tenant');
      expect(result.isActive).toBe(true);

      expect(tenantRepository.findByName).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(tenantRepository.findByDomain).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(tenantRepository.save).toHaveBeenCalledWith(expect.any(Tenant));
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该成功创建没有域名的租户', async () => {
      const input = new CreateTenantInputDto({
        name: 'Test Tenant',
        isActive: true,
      });

      tenantRepository.findByName.mockResolvedValue(null);
      tenantRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Tenant');
      expect(result.domain).toBeNull();
      expect(result.isActive).toBe(true);

      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(tenantRepository.findByDomain).not.toHaveBeenCalled();
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该处理租户名称已存在的情况', async () => {
      const existingTenant = Tenant.reconstitute({
        id: validTenantId,
        name: 'Test Tenant',
        domain: 'test-tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new CreateTenantInputDto({
        name: 'Test Tenant',
        domain: 'test-tenant',
        isActive: true,
      });

      tenantRepository.findByName.mockResolvedValue(existingTenant);

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });

    it('应该处理租户域名已存在的情况', async () => {
      const existingTenant = Tenant.reconstitute({
        id: validTenantId,
        name: 'Existing Tenant',
        domain: 'test-tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new CreateTenantInputDto({
        name: 'Test Tenant',
        domain: 'test-tenant',
        isActive: true,
      });

      tenantRepository.findByName.mockResolvedValue(null);
      tenantRepository.findByDomain.mockResolvedValue(existingTenant);

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(tenantRepository.findByDomain).toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });
  });
});
