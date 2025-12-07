import { BadRequestException, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TENANT_CONTEXT_KEY } from '../../../common/constants/tenant.constants';
import { Permission } from '../../../entities/permission.entity';
import { Role } from '../../../entities/role.entity';
import { PermissionsService } from './permissions.service';

/**
 * 权限服务单元测试
 *
 * 测试权限服务的核心业务逻辑，包括权限管理、权限-角色关联等。
 *
 * @describe PermissionsService
 */
describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let roleRepository: jest.Mocked<Repository<Role>>;

  const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';

  const mockPermission: Permission = {
    id: 'permission-1',
    resource: 'user',
    action: 'read',
    description: '读取用户',
    tenantId: mockTenantId,
    roles: [],
  } as Permission;

  const mockRole: Role = {
    id: 'role-1',
    name: 'admin',
    tenantId: mockTenantId,
    permissions: [],
  } as Role;

  beforeEach(async () => {
    const mockPermissionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockRoleRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockRequest = {
      [TENANT_CONTEXT_KEY]: mockTenantId,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<PermissionsService>(PermissionsService);
    permissionRepository = module.get(getRepositoryToken(Permission));
    roleRepository = module.get(getRepositoryToken(Role));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('createOrGet', () => {
    const permissionData = {
      resource: 'user',
      action: 'read',
      description: '读取用户',
    };

    it('应该创建新权限', async () => {
      permissionRepository.findOne.mockResolvedValue(null);
      permissionRepository.create.mockReturnValue(mockPermission);
      permissionRepository.save.mockResolvedValue(mockPermission);

      const result = await service.createOrGet(permissionData);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          resource: permissionData.resource,
          action: permissionData.action,
          tenantId: mockTenantId,
        },
      });
      expect(permissionRepository.create).toHaveBeenCalledWith({
        resource: permissionData.resource,
        action: permissionData.action,
        description: permissionData.description,
        tenantId: mockTenantId,
      });
      expect(permissionRepository.save).toHaveBeenCalledWith(mockPermission);
      expect(result).toEqual(mockPermission);
    });

    it('当权限已存在时应该返回现有权限', async () => {
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.createOrGet(permissionData);

      expect(permissionRepository.findOne).toHaveBeenCalled();
      expect(permissionRepository.create).not.toHaveBeenCalled();
      expect(permissionRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockPermission);
    });

    it('当提供 tenantId 时应该使用提供的 tenantId', async () => {
      const customTenantId = 'custom-tenant-id';
      permissionRepository.findOne.mockResolvedValue(null);
      permissionRepository.create.mockReturnValue(mockPermission);
      permissionRepository.save.mockResolvedValue(mockPermission);

      await service.createOrGet({
        ...permissionData,
        tenantId: customTenantId,
      });

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          resource: permissionData.resource,
          action: permissionData.action,
          tenantId: customTenantId,
        },
      });
      expect(permissionRepository.create).toHaveBeenCalledWith({
        resource: permissionData.resource,
        action: permissionData.action,
        description: permissionData.description,
        tenantId: customTenantId,
      });
    });

    it('当租户上下文缺失时应该抛出 BadRequestException', async () => {
      const moduleWithoutTenant: TestingModule = await Test.createTestingModule(
        {
          providers: [
            PermissionsService,
            {
              provide: getRepositoryToken(Permission),
              useValue: permissionRepository,
            },
            {
              provide: getRepositoryToken(Role),
              useValue: roleRepository,
            },
            {
              provide: REQUEST,
              useValue: {},
            },
          ],
        },
      ).compile();

      const serviceWithoutTenant =
        await moduleWithoutTenant.resolve<PermissionsService>(
          PermissionsService,
        );

      await expect(
        serviceWithoutTenant.createOrGet(permissionData),
      ).rejects.toThrow(BadRequestException);
      await expect(
        serviceWithoutTenant.createOrGet(permissionData),
      ).rejects.toThrow('租户上下文缺失');
    });
  });

  describe('findAll', () => {
    it('应该返回所有权限', async () => {
      const permissions = [mockPermission];
      permissionRepository.find.mockResolvedValue(permissions);

      const result = await service.findAll();

      expect(permissionRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        relations: ['roles'],
        order: { resource: 'ASC', action: 'ASC' },
      });
      expect(result).toEqual(permissions);
    });

    it('当提供 tenantId 时应该使用提供的 tenantId', async () => {
      const customTenantId = 'custom-tenant-id';
      const permissions = [mockPermission];
      permissionRepository.find.mockResolvedValue(permissions);

      await service.findAll(customTenantId);

      expect(permissionRepository.find).toHaveBeenCalledWith({
        where: { tenantId: customTenantId },
        relations: ['roles'],
        order: { resource: 'ASC', action: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('应该根据 ID 返回权限', async () => {
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.findById(mockPermission.id);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPermission.id, tenantId: mockTenantId },
        relations: ['roles'],
      });
      expect(result).toEqual(mockPermission);
    });

    it('当权限不存在时应该返回 null', async () => {
      permissionRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByResourceAndAction', () => {
    it('应该根据资源和操作返回权限', async () => {
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.findByResourceAndAction('user', 'read');

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          resource: 'user',
          action: 'read',
          tenantId: mockTenantId,
        },
        relations: ['roles'],
      });
      expect(result).toEqual(mockPermission);
    });

    it('当提供 tenantId 时应该使用提供的 tenantId', async () => {
      const customTenantId = 'custom-tenant-id';
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      await service.findByResourceAndAction('user', 'read', customTenantId);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          resource: 'user',
          action: 'read',
          tenantId: customTenantId,
        },
        relations: ['roles'],
      });
    });
  });

  describe('updateDescription', () => {
    it('应该成功更新权限描述', async () => {
      const updatedPermission = {
        ...mockPermission,
        description: '新的描述',
      };
      permissionRepository.findOne.mockResolvedValue(mockPermission);
      permissionRepository.save.mockResolvedValue(updatedPermission);

      const result = await service.updateDescription(
        mockPermission.id,
        '新的描述',
      );

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPermission.id, tenantId: mockTenantId },
      });
      expect(permissionRepository.save).toHaveBeenCalledWith({
        ...mockPermission,
        description: '新的描述',
      });
      expect(result).toEqual(updatedPermission);
    });

    it('当权限不存在时应该抛出 NotFoundException', async () => {
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateDescription('non-existent-id', '新描述'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateDescription('non-existent-id', '新描述'),
      ).rejects.toThrow('权限不存在');
      expect(permissionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('应该成功删除权限', async () => {
      permissionRepository.findOne.mockResolvedValue(mockPermission);
      permissionRepository.remove.mockResolvedValue(mockPermission);

      await service.delete(mockPermission.id);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPermission.id, tenantId: mockTenantId },
        relations: ['roles'],
      });
      expect(permissionRepository.remove).toHaveBeenCalledWith(mockPermission);
    });

    it('当权限不存在时应该抛出 NotFoundException', async () => {
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete('non-existent-id')).rejects.toThrow(
        '权限不存在',
      );
      expect(permissionRepository.remove).not.toHaveBeenCalled();
    });

    it('当权限仍被角色使用时应该抛出 BadRequestException', async () => {
      const permissionWithRoles = {
        ...mockPermission,
        roles: [mockRole],
      };
      permissionRepository.findOne.mockResolvedValue(permissionWithRoles);

      await expect(service.delete(mockPermission.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.delete(mockPermission.id)).rejects.toThrow(
        '权限仍被 1 个角色使用，无法删除',
      );
      expect(permissionRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('assignPermissionToRole', () => {
    it('应该成功为角色关联权限', async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [],
      };
      roleRepository.findOne.mockResolvedValue(roleWithPermissions);
      permissionRepository.findOne.mockResolvedValue(mockPermission);
      roleRepository.save.mockResolvedValue(roleWithPermissions);

      await service.assignPermissionToRole(mockRole.id, mockPermission.id);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRole.id },
        relations: ['permissions'],
      });
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPermission.id },
      });
      expect(roleRepository.save).toHaveBeenCalled();
    });

    it('当权限已关联时应该直接返回', async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission],
      };
      roleRepository.findOne.mockResolvedValue(roleWithPermissions);
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      await service.assignPermissionToRole(mockRole.id, mockPermission.id);

      expect(roleRepository.save).not.toHaveBeenCalled();
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      await expect(
        service.assignPermissionToRole('non-existent-role', mockPermission.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignPermissionToRole('non-existent-role', mockPermission.id),
      ).rejects.toThrow('角色不存在');
    });

    it('当权限不存在时应该抛出 NotFoundException', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignPermissionToRole(mockRole.id, 'non-existent-permission'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignPermissionToRole(mockRole.id, 'non-existent-permission'),
      ).rejects.toThrow('权限不存在');
    });
  });

  describe('removePermissionFromRole', () => {
    it('应该成功取消角色与权限的关联', async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission],
      };
      roleRepository.findOne.mockResolvedValue(roleWithPermissions);
      roleRepository.save.mockResolvedValue(roleWithPermissions);

      await service.removePermissionFromRole(mockRole.id, mockPermission.id);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRole.id },
        relations: ['permissions'],
      });
      expect(roleRepository.save).toHaveBeenCalledWith({
        ...roleWithPermissions,
        permissions: [],
      });
    });

    it('当角色没有关联权限时应该直接返回', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      await service.removePermissionFromRole(mockRole.id, mockPermission.id);

      expect(roleRepository.save).not.toHaveBeenCalled();
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removePermissionFromRole(
          'non-existent-role',
          mockPermission.id,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removePermissionFromRole(
          'non-existent-role',
          mockPermission.id,
        ),
      ).rejects.toThrow('角色不存在');
    });
  });

  describe('getRolePermissions', () => {
    it('应该返回角色拥有的所有权限', async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission],
      };
      roleRepository.findOne.mockResolvedValue(roleWithPermissions);

      const result = await service.getRolePermissions(mockRole.id);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRole.id },
        relations: ['permissions'],
      });
      expect(result).toEqual([mockPermission]);
    });

    it('当角色没有权限时应该返回空数组', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.getRolePermissions(mockRole.id);

      expect(result).toEqual([]);
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getRolePermissions('non-existent-role'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getRolePermissions('non-existent-role'),
      ).rejects.toThrow('角色不存在');
    });
  });
});
