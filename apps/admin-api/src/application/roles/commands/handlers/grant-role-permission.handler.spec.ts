import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../../domain/roles/entities/role.aggregate';
import type { IRoleRepository } from '../../../../domain/roles/repositories/role.repository.interface';
import { AuthZService } from '../../../../lib/casbin/services/authz.service';
import type { IPermissionsService } from '../../../shared/interfaces/permissions-service.interface';
import { GrantRolePermissionCommand } from '../grant-role-permission.command';
import { GrantRolePermissionHandler } from './grant-role-permission.handler';

/**
 * 授予角色权限命令处理器单元测试
 *
 * 测试 GrantRolePermissionHandler 的所有场景。
 *
 * @describe GrantRolePermissionHandler
 */
describe('GrantRolePermissionHandler', () => {
  let handler: GrantRolePermissionHandler;
  let roleRepository: jest.Mocked<IRoleRepository>;
  let permissionsService: jest.Mocked<IPermissionsService>;
  let authzService: jest.Mocked<AuthZService>;
  let eventBus: jest.Mocked<EventBus>;

  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validPermissionId = '01ARZ3NDEKTSV4RRFFQ69G5FAY';
  const validRoleName = 'admin';
  const validResource = 'users';
  const validAction = 'read';
  const validDescription = 'Read users';

  beforeEach(async () => {
    const mockRoleRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockPermissionsService = {
      createOrGet: jest.fn(),
      assignPermissionToRole: jest.fn(),
      getRolePermissions: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateDescription: jest.fn(),
      delete: jest.fn(),
    };

    const mockAuthzService = {
      addPolicy: jest.fn(),
      removePolicy: jest.fn(),
      hasPolicy: jest.fn(),
      getPolicies: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrantRolePermissionHandler,
        {
          provide: 'IRoleRepository',
          useValue: mockRoleRepository,
        },
        {
          provide: 'IPermissionsService',
          useValue: mockPermissionsService,
        },
        {
          provide: AuthZService,
          useValue: mockAuthzService,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<GrantRolePermissionHandler>(
      GrantRolePermissionHandler,
    );
    roleRepository = module.get('IRoleRepository');
    permissionsService = module.get('IPermissionsService');
    authzService = module.get(AuthZService);
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
    it('应该成功授予角色权限', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: validRoleName,
        tenantId: validTenantId,
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockPermission = {
        id: validPermissionId,
        resource: validResource,
        action: validAction,
        description: validDescription,
        tenantId: validTenantId,
      };

      const command = new GrantRolePermissionCommand(
        validRoleId,
        validTenantId,
        validResource,
        validAction,
        validDescription,
      );

      roleRepository.findById.mockResolvedValue(mockRole);
      permissionsService.createOrGet.mockResolvedValue(mockPermission as any);
      permissionsService.assignPermissionToRole.mockResolvedValue(undefined);
      authzService.addPolicy.mockResolvedValue(true);
      const grantPermissionSpy = jest.spyOn(mockRole, 'grantPermission');
      jest.spyOn(mockRole, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(roleRepository.findById).toHaveBeenCalled();
      expect(permissionsService.createOrGet).toHaveBeenCalledWith({
        resource: validResource,
        action: validAction,
        description: validDescription,
      });
      expect(permissionsService.assignPermissionToRole).toHaveBeenCalledWith(
        validRoleId,
        validPermissionId,
      );
      expect(authzService.addPolicy).toHaveBeenCalledWith(
        validRoleName,
        validTenantId,
        validResource,
        validAction,
      );
      expect(grantPermissionSpy).toHaveBeenCalledWith(
        validResource,
        validAction,
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('权限授予成功');
    });

    it('应该抛出 NotFoundException 当角色不存在时', async () => {
      const command = new GrantRolePermissionCommand(
        validRoleId,
        validTenantId,
        validResource,
        validAction,
        validDescription,
      );

      roleRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('角色不存在');

      expect(roleRepository.findById).toHaveBeenCalled();
      expect(permissionsService.createOrGet).not.toHaveBeenCalled();
    });

    it('应该抛出 BadRequestException 当角色未激活时', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: validRoleName,
        tenantId: validTenantId,
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new GrantRolePermissionCommand(
        validRoleId,
        validTenantId,
        validResource,
        validAction,
        validDescription,
      );

      roleRepository.findById.mockResolvedValue(mockRole);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        `角色 ${validRoleName} 未激活`,
      );

      expect(permissionsService.createOrGet).not.toHaveBeenCalled();
    });

    it('应该处理权限授予失败的情况', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: validRoleName,
        tenantId: validTenantId,
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockPermission = {
        id: validPermissionId,
        resource: validResource,
        action: validAction,
        description: validDescription,
        tenantId: validTenantId,
      };

      const command = new GrantRolePermissionCommand(
        validRoleId,
        validTenantId,
        validResource,
        validAction,
        validDescription,
      );

      roleRepository.findById.mockResolvedValue(mockRole);
      permissionsService.createOrGet.mockResolvedValue(mockPermission as any);
      permissionsService.assignPermissionToRole.mockResolvedValue(undefined);
      authzService.addPolicy.mockResolvedValue(false);
      jest.spyOn(mockRole, 'grantPermission').mockImplementation(() => {});
      jest.spyOn(mockRole, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('权限授予失败');
    });

    it('应该发布领域事件', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: validRoleName,
        tenantId: validTenantId,
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockPermission = {
        id: validPermissionId,
        resource: validResource,
        action: validAction,
        description: validDescription,
        tenantId: validTenantId,
      };

      const command = new GrantRolePermissionCommand(
        validRoleId,
        validTenantId,
        validResource,
        validAction,
        validDescription,
      );

      roleRepository.findById.mockResolvedValue(mockRole);
      permissionsService.createOrGet.mockResolvedValue(mockPermission as any);
      permissionsService.assignPermissionToRole.mockResolvedValue(undefined);
      authzService.addPolicy.mockResolvedValue(true);
      jest.spyOn(mockRole, 'grantPermission').mockImplementation(() => {});
      const mockEvents = [{ type: 'PermissionGrantedEvent' }];
      jest
        .spyOn(mockRole, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
