import { ConflictException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '../../../../domain/permissions/entities/permission.aggregate';
import type { IPermissionRepository } from '../../../../domain/permissions/repositories/permission.repository.interface';
import { CreatePermissionCommand } from '../create-permission.command';
import { CreatePermissionHandler } from './create-permission.handler';

/**
 * 创建权限命令处理器单元测试
 *
 * 测试 CreatePermissionHandler 的所有场景。
 *
 * @describe CreatePermissionHandler
 */
describe('CreatePermissionHandler', () => {
  let handler: CreatePermissionHandler;
  let permissionRepository: jest.Mocked<IPermissionRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validPermissionId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validResource = 'users';
  const validAction = 'read';
  const validDescription = 'Read users';

  beforeEach(async () => {
    const mockPermissionRepository = {
      findById: jest.fn(),
      findByResourceAndAction: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePermissionHandler,
        {
          provide: 'IPermissionRepository',
          useValue: mockPermissionRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<CreatePermissionHandler>(CreatePermissionHandler);
    permissionRepository = module.get('IPermissionRepository');
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
    it('应该成功创建权限', async () => {
      const mockPermission = Permission.reconstitute({
        id: validPermissionId,
        resource: validResource,
        action: validAction,
        description: validDescription,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreatePermissionCommand(
        validTenantId,
        validResource,
        validAction,
        validDescription,
      );

      permissionRepository.findByResourceAndAction.mockResolvedValue(null);
      jest.spyOn(Permission, 'create').mockReturnValue(mockPermission);
      permissionRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockPermission, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(permissionRepository.findByResourceAndAction).toHaveBeenCalledWith(
        validResource,
        validAction,
        expect.any(Object),
      );
      expect(Permission.create).toHaveBeenCalled();
      expect(permissionRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(validPermissionId);
      expect(result.resource).toBe(validResource);
      expect(result.action).toBe(validAction);
      expect(result.description).toBe(validDescription);
    });

    it('应该抛出 ConflictException 当权限已存在时', async () => {
      const existingPermission = Permission.reconstitute({
        id: validPermissionId,
        resource: validResource,
        action: validAction,
        description: validDescription,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreatePermissionCommand(
        validTenantId,
        validResource,
        validAction,
        validDescription,
      );

      permissionRepository.findByResourceAndAction.mockResolvedValue(
        existingPermission,
      );

      await expect(handler.execute(command)).rejects.toThrow(ConflictException);
      await expect(handler.execute(command)).rejects.toThrow(
        `Permission with resource '${validResource}' and action '${validAction}' already exists.`,
      );

      expect(permissionRepository.findByResourceAndAction).toHaveBeenCalled();
      expect(permissionRepository.save).not.toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
      const mockPermission = Permission.reconstitute({
        id: validPermissionId,
        resource: validResource,
        action: validAction,
        description: validDescription,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreatePermissionCommand(
        validTenantId,
        validResource,
        validAction,
        validDescription,
      );

      permissionRepository.findByResourceAndAction.mockResolvedValue(null);
      jest.spyOn(Permission, 'create').mockReturnValue(mockPermission);
      permissionRepository.save.mockResolvedValue(undefined);
      const mockEvents = [{ type: 'PermissionCreatedEvent' }];
      jest
        .spyOn(mockPermission, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
