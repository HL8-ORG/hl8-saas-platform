import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../../domain/tenants/repositories/tenant.repository.interface';
import { UpdateTenantCommand } from '../update-tenant.command';
import { UpdateTenantHandler } from './update-tenant.handler';

/**
 * 更新租户命令处理器单元测试
 *
 * 测试 UpdateTenantHandler 的所有场景。
 *
 * @describe UpdateTenantHandler
 */
describe('UpdateTenantHandler', () => {
  let handler: UpdateTenantHandler;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantName = 'Test Tenant';
  const validDomain = 'test-tenant';
  const newTenantName = 'Updated Tenant';
  const newDomain = 'updated-tenant';

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
        UpdateTenantHandler,
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

    handler = module.get<UpdateTenantHandler>(UpdateTenantHandler);
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
    it('应该成功更新租户名称', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateTenantCommand(validTenantId, newTenantName);

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.findByName.mockResolvedValue(null);
      tenantRepository.save.mockResolvedValue(undefined);
      const updateSpy = jest.spyOn(mockTenant, 'update');
      jest.spyOn(mockTenant, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(tenantRepository.findById).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalled();
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(validTenantId);
    });

    it('应该成功更新租户域名', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateTenantCommand(
        validTenantId,
        undefined,
        newDomain,
      );

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.findByDomain.mockResolvedValue(null);
      tenantRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockTenant, 'update').mockImplementation(() => {});
      jest.spyOn(mockTenant, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(tenantRepository.findByDomain).toHaveBeenCalled();
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(validTenantId);
    });

    it('应该成功激活租户', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateTenantCommand(
        validTenantId,
        undefined,
        undefined,
        true,
      );

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(undefined);
      const activateSpy = jest.spyOn(mockTenant, 'activate');
      jest.spyOn(mockTenant, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(activateSpy).toHaveBeenCalled();
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(result.isActive).toBe(true);
    });

    it('应该成功停用租户', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateTenantCommand(
        validTenantId,
        undefined,
        undefined,
        false,
      );

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(undefined);
      const deactivateSpy = jest.spyOn(mockTenant, 'deactivate');
      jest.spyOn(mockTenant, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(deactivateSpy).toHaveBeenCalled();
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });

    it('应该抛出 NotFoundException 当租户不存在时', async () => {
      const command = new UpdateTenantCommand(validTenantId, newTenantName);

      tenantRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('租户不存在');

      expect(tenantRepository.findById).toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });

    it('应该抛出 ConflictException 当新名称已存在时', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const existingTenant = Tenant.reconstitute({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
        name: newTenantName,
        domain: 'other-domain',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateTenantCommand(validTenantId, newTenantName);

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.findByName.mockResolvedValue(existingTenant);

      await expect(handler.execute(command)).rejects.toThrow(ConflictException);
      await expect(handler.execute(command)).rejects.toThrow(
        `租户名称 ${newTenantName} 已存在`,
      );

      expect(tenantRepository.findByName).toHaveBeenCalled();
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

      const command = new UpdateTenantCommand(validTenantId, newTenantName);

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.findByName.mockResolvedValue(null);
      tenantRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockTenant, 'update').mockImplementation(() => {});
      const mockEvents = [{ type: 'TenantUpdatedEvent' }];
      jest
        .spyOn(mockTenant, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
