import { BadRequestException, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TENANT_CONTEXT_KEY } from '../../../common/constants/tenant.constants';
import { Permission } from '../../../entities/permission.entity';
import { Role } from '../../../entities/role.entity';
import { User } from '../../../entities/user.entity';
import { AuthZService } from '../../authz/services/authz.service';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { RolesService } from './roles.service';

/**
 * 角色服务单元测试
 *
 * 测试角色服务的核心业务逻辑，包括角色管理、用户-角色关联和角色-权限关联。
 *
 * @describe RolesService
 */
describe('RolesService', () => {
  let service: RolesService;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let authzService: jest.Mocked<AuthZService>;
  let permissionsService: jest.Mocked<PermissionsService>;

  const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';

  const mockRole: Role = {
    id: 'role-1',
    name: 'admin',
    displayName: '管理员',
    description: '系统管理员',
    tenantId: mockTenantId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [],
  } as Role;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    tenantId: mockTenantId,
    isActive: true,
  } as User;

  const mockPermission: Permission = {
    id: 'permission-1',
    resource: 'user',
    action: 'read',
    tenantId: mockTenantId,
  } as Permission;

  beforeEach(async () => {
    const mockRoleRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockAuthzService = {
      deleteRole: jest.fn(),
      addRoleForUser: jest.fn(),
      deleteRoleForUser: jest.fn(),
      hasRoleForUser: jest.fn(),
      addPermissionForUser: jest.fn(),
      deletePermissionForUser: jest.fn(),
      hasPermissionForUser: jest.fn(),
      getPermissionsForUser: jest.fn(),
      getUsersForRole: jest.fn(),
    };

    const mockPermissionsService = {
      createOrGet: jest.fn(),
      assignPermissionToRole: jest.fn(),
      removePermissionFromRole: jest.fn(),
      findByResourceAndAction: jest.fn(),
      getRolePermissions: jest.fn(),
    };

    const mockRequest = {
      [TENANT_CONTEXT_KEY]: mockTenantId,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: AuthZService,
          useValue: mockAuthzService,
        },
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<RolesService>(RolesService);
    roleRepository = module.get(getRepositoryToken(Role));
    userRepository = module.get(getRepositoryToken(User));
    authzService = module.get(AuthZService);
    permissionsService = module.get(PermissionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('addRole', () => {
    const roleData = {
      name: 'editor',
      displayName: '编辑',
      description: '内容编辑',
    };

    it('应该成功创建角色', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);

      const result = await service.addRole(roleData);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: roleData.name, tenantId: mockTenantId },
      });
      expect(roleRepository.create).toHaveBeenCalledWith({
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        tenantId: mockTenantId,
        isActive: true,
      });
      expect(roleRepository.save).toHaveBeenCalledWith(mockRole);
      expect(result).toEqual(mockRole);
    });

    it('当 displayName 未提供时应该使用 name', async () => {
      const roleDataWithoutDisplay = {
        name: 'editor',
        description: '内容编辑',
      };
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);

      await service.addRole(roleDataWithoutDisplay);

      expect(roleRepository.create).toHaveBeenCalledWith({
        name: roleDataWithoutDisplay.name,
        displayName: roleDataWithoutDisplay.name,
        description: roleDataWithoutDisplay.description,
        tenantId: mockTenantId,
        isActive: true,
      });
    });

    it('当角色名称已存在时应该抛出 BadRequestException', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      await expect(service.addRole(roleData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addRole(roleData)).rejects.toThrow(
        `角色 ${roleData.name} 已存在`,
      );
      expect(roleRepository.create).not.toHaveBeenCalled();
      expect(roleRepository.save).not.toHaveBeenCalled();
    });

    it('当租户上下文缺失时应该抛出 BadRequestException', async () => {
      const moduleWithoutTenant: TestingModule = await Test.createTestingModule(
        {
          providers: [
            RolesService,
            {
              provide: getRepositoryToken(Role),
              useValue: roleRepository,
            },
            {
              provide: getRepositoryToken(User),
              useValue: userRepository,
            },
            {
              provide: AuthZService,
              useValue: authzService,
            },
            {
              provide: PermissionsService,
              useValue: permissionsService,
            },
            {
              provide: REQUEST,
              useValue: {},
            },
          ],
        },
      ).compile();

      const serviceWithoutTenant =
        await moduleWithoutTenant.resolve<RolesService>(RolesService);

      await expect(serviceWithoutTenant.addRole(roleData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(serviceWithoutTenant.addRole(roleData)).rejects.toThrow(
        '租户上下文缺失',
      );
    });
  });

  describe('deleteRole', () => {
    it('应该成功删除角色', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      authzService.deleteRole.mockResolvedValue(true);
      roleRepository.remove.mockResolvedValue(mockRole);

      await service.deleteRole(mockRole.id);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRole.id, tenantId: mockTenantId },
      });
      expect(authzService.deleteRole).toHaveBeenCalledWith(mockRole.name);
      expect(roleRepository.remove).toHaveBeenCalledWith(mockRole);
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteRole('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteRole('non-existent-id')).rejects.toThrow(
        '角色不存在',
      );
      expect(authzService.deleteRole).not.toHaveBeenCalled();
      expect(roleRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('assignUser', () => {
    it('应该成功为用户分配角色', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(mockRole);
      authzService.addRoleForUser.mockResolvedValue(true);

      const result = await service.assignUser(mockUser.id, mockRole.name);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id, tenantId: mockTenantId },
      });
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: mockRole.name, tenantId: mockTenantId },
      });
      expect(authzService.addRoleForUser).toHaveBeenCalledWith(
        mockUser.id,
        mockRole.name,
      );
      expect(result).toBe(true);
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.assignUser('non-existent-user', mockRole.name),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignUser('non-existent-user', mockRole.name),
      ).rejects.toThrow('用户不存在');
      expect(authzService.addRoleForUser).not.toHaveBeenCalled();
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignUser(mockUser.id, 'non-existent-role'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignUser(mockUser.id, 'non-existent-role'),
      ).rejects.toThrow('角色 non-existent-role 不存在');
      expect(authzService.addRoleForUser).not.toHaveBeenCalled();
    });

    it('当角色未激活时应该抛出 BadRequestException', async () => {
      const inactiveRole = { ...mockRole, isActive: false };
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(inactiveRole);

      await expect(
        service.assignUser(mockUser.id, mockRole.name),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.assignUser(mockUser.id, mockRole.name),
      ).rejects.toThrow(`角色 ${mockRole.name} 未激活`);
      expect(authzService.addRoleForUser).not.toHaveBeenCalled();
    });
  });

  describe('deAssignUser', () => {
    it('应该成功取消用户的角色分配', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(mockRole);
      authzService.hasRoleForUser.mockResolvedValue(true);
      authzService.deleteRoleForUser.mockResolvedValue(true);

      const result = await service.deAssignUser(mockUser.id, mockRole.name);

      expect(authzService.hasRoleForUser).toHaveBeenCalledWith(
        mockUser.id,
        mockRole.name,
      );
      expect(authzService.deleteRoleForUser).toHaveBeenCalledWith(
        mockUser.id,
        mockRole.name,
      );
      expect(result).toBe(true);
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.deAssignUser('non-existent-user', mockRole.name),
      ).rejects.toThrow(NotFoundException);
      expect(authzService.deleteRoleForUser).not.toHaveBeenCalled();
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deAssignUser(mockUser.id, 'non-existent-role'),
      ).rejects.toThrow(NotFoundException);
      expect(authzService.deleteRoleForUser).not.toHaveBeenCalled();
    });

    it('当用户没有该角色时应该抛出 BadRequestException', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(mockRole);
      authzService.hasRoleForUser.mockResolvedValue(false);

      await expect(
        service.deAssignUser(mockUser.id, mockRole.name),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.deAssignUser(mockUser.id, mockRole.name),
      ).rejects.toThrow(`用户 ${mockUser.email} 没有角色 ${mockRole.name}`);
      expect(authzService.deleteRoleForUser).not.toHaveBeenCalled();
    });
  });

  describe('grantPermission', () => {
    it('应该成功为角色授予权限', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      permissionsService.createOrGet.mockResolvedValue(mockPermission);
      permissionsService.assignPermissionToRole.mockResolvedValue(undefined);
      authzService.addPermissionForUser.mockResolvedValue(true);

      const result = await service.grantPermission(
        mockRole.name,
        'read',
        'user',
      );

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: mockRole.name, tenantId: mockTenantId },
      });
      expect(permissionsService.createOrGet).toHaveBeenCalledWith({
        resource: 'user',
        action: 'read',
        description: undefined,
      });
      expect(permissionsService.assignPermissionToRole).toHaveBeenCalledWith(
        mockRole.id,
        mockPermission.id,
      );
      expect(authzService.addPermissionForUser).toHaveBeenCalledWith(
        mockRole.name,
        'user',
        'read',
      );
      expect(result).toBe(true);
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.grantPermission('non-existent-role', 'read', 'user'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.grantPermission('non-existent-role', 'read', 'user'),
      ).rejects.toThrow('角色 non-existent-role 不存在');
      expect(permissionsService.createOrGet).not.toHaveBeenCalled();
    });
  });

  describe('revokePermission', () => {
    it('应该成功撤销角色的权限', async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission],
      };
      roleRepository.findOne.mockResolvedValue(roleWithPermissions);
      authzService.hasPermissionForUser.mockResolvedValue(true);
      permissionsService.findByResourceAndAction.mockResolvedValue(
        mockPermission,
      );
      permissionsService.removePermissionFromRole.mockResolvedValue(undefined);
      authzService.deletePermissionForUser.mockResolvedValue(true);

      const result = await service.revokePermission(
        mockRole.name,
        'read',
        'user',
      );

      expect(authzService.hasPermissionForUser).toHaveBeenCalledWith(
        mockRole.name,
        'user',
        'read',
      );
      expect(permissionsService.findByResourceAndAction).toHaveBeenCalledWith(
        'user',
        'read',
      );
      expect(permissionsService.removePermissionFromRole).toHaveBeenCalledWith(
        mockRole.id,
        mockPermission.id,
      );
      expect(authzService.deletePermissionForUser).toHaveBeenCalledWith(
        mockRole.name,
        'user',
        'read',
      );
      expect(result).toBe(true);
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.revokePermission('non-existent-role', 'read', 'user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('当角色没有该权限时应该抛出 BadRequestException', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      authzService.hasPermissionForUser.mockResolvedValue(false);

      await expect(
        service.revokePermission(mockRole.name, 'read', 'user'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.revokePermission(mockRole.name, 'read', 'user'),
      ).rejects.toThrow(`角色 ${mockRole.name} 没有权限 read user`);
    });
  });

  describe('rolePermissions', () => {
    it('应该从 Permission 实体返回权限', async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission],
      };
      roleRepository.findOne.mockResolvedValue(roleWithPermissions);

      const result = await service.rolePermissions(mockRole.name);

      expect(result).toEqual([['user', 'read']]);
      expect(authzService.getPermissionsForUser).not.toHaveBeenCalled();
    });

    it('当 Permission 实体中没有权限时应该从 Casbin 获取', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      authzService.getPermissionsForUser.mockResolvedValue([['user', 'read']]);

      const result = await service.rolePermissions(mockRole.name);

      expect(authzService.getPermissionsForUser).toHaveBeenCalledWith(
        mockRole.name,
      );
      expect(result).toEqual([['user', 'read']]);
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.rolePermissions('non-existent-role'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRolePermissionsWithDetails', () => {
    it('应该返回角色的权限详情', async () => {
      permissionsService.getRolePermissions.mockResolvedValue([mockPermission]);

      const result = await service.getRolePermissionsWithDetails(mockRole.id);

      expect(permissionsService.getRolePermissions).toHaveBeenCalledWith(
        mockRole.id,
      );
      expect(result).toEqual([mockPermission]);
    });
  });

  describe('assignedUsers', () => {
    it('应该返回拥有指定角色的所有用户', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      authzService.getUsersForRole.mockResolvedValue(['user-1', 'user-2']);

      const result = await service.assignedUsers(mockRole.name);

      expect(authzService.getUsersForRole).toHaveBeenCalledWith(mockRole.name);
      expect(result).toEqual(['user-1', 'user-2']);
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.assignedUsers('non-existent-role')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllRoles', () => {
    it('应该返回所有角色', async () => {
      const roles = [mockRole];
      roleRepository.find.mockResolvedValue(roles);

      const result = await service.findAllRoles();

      expect(roleRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(roles);
    });
  });

  describe('findById', () => {
    it('应该根据 ID 返回角色', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findById(mockRole.id);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRole.id, tenantId: mockTenantId },
      });
      expect(result).toEqual(mockRole);
    });

    it('当角色不存在时应该返回 null', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('应该根据名称返回角色', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findByName(mockRole.name);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: mockRole.name, tenantId: mockTenantId },
      });
      expect(result).toEqual(mockRole);
    });
  });

  describe('exists', () => {
    it('当角色存在时应该返回 true', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.exists(mockRole.name);

      expect(result).toBe(true);
    });

    it('当角色不存在时应该返回 false', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      const result = await service.exists('non-existent-role');

      expect(result).toBe(false);
    });
  });
});
