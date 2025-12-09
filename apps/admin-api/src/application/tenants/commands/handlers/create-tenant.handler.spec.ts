import { ConflictException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../../domain/tenants/repositories/tenant.repository.interface';
import { CreateTenantCommand } from '../create-tenant.command';
import { CreateTenantHandler } from './create-tenant.handler';

/**
 * 创建租户命令处理器单元测试
 *
 * 测试 CreateTenantHandler 的所有场景。
 *
 * @describe CreateTenantHandler
 */
describe('CreateTenantHandler', () => {
  let handler: CreateTenantHandler;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantName = 'Test Tenant';
  const validDomain = 'test-tenant';

  beforeEach(async () => {
    const mockTenantRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findByDomain: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTenantHandler,
        {
          provide: 'ITenantRepository',
          useValue: mockTenantRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<CreateTenantHandler>(CreateTenantHandler);
    tenantRepository = module.get('ITenantRepository');
    eventBus = module.get(EventBus);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该成功创建租户（带域名）', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreateTenantCommand(
        validTenantName,
        validDomain,
        true,
      );

      tenantRepository.findByName.mockResolvedValue(null);
      tenantRepository.findByDomain.mockResolvedValue(null);
      jest.spyOn(Tenant, 'create').mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockTenant, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(tenantRepository.findByDomain).toHaveBeenCalled();
      expect(Tenant.create).toHaveBeenCalled();
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(validTenantId);
      expect(result.name).toBe(validTenantName);
      expect(result.domain).toBe(validDomain);
      expect(result.isActive).toBe(true);
    });

    it('应该成功创建租户（不带域名）', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreateTenantCommand(validTenantName, undefined, true);

      tenantRepository.findByName.mockResolvedValue(null);
      jest.spyOn(Tenant, 'create').mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockTenant, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(tenantRepository.findByDomain).not.toHaveBeenCalled();
      expect(result.domain).toBeNull();
    });

    it('应该抛出 ConflictException 当租户名称已存在时', async () => {
      const existingTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreateTenantCommand(
        validTenantName,
        validDomain,
        true,
      );

      tenantRepository.findByName.mockResolvedValue(existingTenant);

      await expect(handler.execute(command)).rejects.toThrow(ConflictException);
      await expect(handler.execute(command)).rejects.toThrow(
        `租户名称 ${validTenantName} 已存在`,
      );

      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });

    it('应该抛出 ConflictException 当租户域名已存在时', async () => {
      const existingTenant = Tenant.reconstitute({
        id: validTenantId,
        name: 'Other Tenant',
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreateTenantCommand(
        validTenantName,
        validDomain,
        true,
      );

      tenantRepository.findByName.mockResolvedValue(null);
      tenantRepository.findByDomain.mockResolvedValue(existingTenant);

      await expect(handler.execute(command)).rejects.toThrow(ConflictException);
      await expect(handler.execute(command)).rejects.toThrow(
        `租户域名 ${validDomain} 已存在`,
      );

      expect(tenantRepository.findByDomain).toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreateTenantCommand(
        validTenantName,
        validDomain,
        true,
      );

      tenantRepository.findByName.mockResolvedValue(null);
      tenantRepository.findByDomain.mockResolvedValue(null);
      jest.spyOn(Tenant, 'create').mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(undefined);
      const mockEvents = [{ type: 'TenantCreatedEvent' }];
      jest
        .spyOn(mockTenant, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
