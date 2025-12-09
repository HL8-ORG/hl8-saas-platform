import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../../domain/tenants/repositories/tenant.repository.interface';
import { DeleteTenantCommand } from '../delete-tenant.command';
import { DeleteTenantHandler } from './delete-tenant.handler';

/**
 * 删除租户命令处理器单元测试
 *
 * 测试 DeleteTenantHandler 的所有场景。
 *
 * @describe DeleteTenantHandler
 */
describe('DeleteTenantHandler', () => {
  let handler: DeleteTenantHandler;
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
        DeleteTenantHandler,
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

    handler = module.get<DeleteTenantHandler>(DeleteTenantHandler);
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
    it('应该成功删除租户', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new DeleteTenantCommand(validTenantId);

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.delete.mockResolvedValue(undefined);
      const deleteSpy = jest.spyOn(mockTenant, 'delete');
      jest.spyOn(mockTenant, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(tenantRepository.findById).toHaveBeenCalled();
      expect(deleteSpy).toHaveBeenCalled();
      expect(tenantRepository.delete).toHaveBeenCalled();
      expect(result.message).toBe('租户删除成功');
    });

    it('应该抛出 NotFoundException 当租户不存在时', async () => {
      const command = new DeleteTenantCommand(validTenantId);

      tenantRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('租户不存在');

      expect(tenantRepository.findById).toHaveBeenCalled();
      expect(tenantRepository.delete).not.toHaveBeenCalled();
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

      const command = new DeleteTenantCommand(validTenantId);

      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.delete.mockResolvedValue(undefined);
      jest.spyOn(mockTenant, 'delete').mockImplementation(() => {});
      const mockEvents = [{ type: 'TenantDeletedEvent' }];
      jest
        .spyOn(mockTenant, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
