import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '../../../entities/permission.entity';
import { Role } from '../../../entities/role.entity';
import { AddRolePermissionDto } from '../dtos/add-role-permission.dto';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { RolesService } from '../services/roles.service';
import { RolesController } from './roles.controller';

/**
 * 角色控制器单元测试
 *
 * 测试角色控制器的 HTTP 请求处理逻辑。
 *
 * @describe RolesController
 */
describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: jest.Mocked<RolesService>;

  const mockRole: Role = {
    id: 'role-1',
    name: 'admin',
    displayName: '管理员',
    description: '系统管理员',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Role;

  beforeEach(async () => {
    const mockRolesService = {
      findAllRoles: jest.fn(),
      addRole: jest.fn(),
      findById: jest.fn(),
      rolePermissions: jest.fn(),
      getRolePermissionsWithDetails: jest.fn(),
      grantPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    rolesService = module.get(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllRoles', () => {
    it('应该返回所有角色', async () => {
      const roles = [mockRole];
      rolesService.findAllRoles.mockResolvedValue(roles);

      const result = await controller.findAllRoles();

      expect(rolesService.findAllRoles).toHaveBeenCalled();
      expect(result).toEqual(roles);
    });

    it('应该返回空数组当没有角色时', async () => {
      rolesService.findAllRoles.mockResolvedValue([]);

      const result = await controller.findAllRoles();

      expect(result).toEqual([]);
    });
  });

  describe('createRole', () => {
    const createRoleDto: CreateRoleDto = {
      name: 'editor',
      displayName: '编辑',
      description: '内容编辑',
    };

    it('应该成功创建角色', async () => {
      rolesService.addRole.mockResolvedValue(mockRole);

      const result = await controller.createRole(createRoleDto);

      expect(rolesService.addRole).toHaveBeenCalledWith(createRoleDto);
      expect(result).toEqual(mockRole);
    });
  });

  describe('findRolePermissions', () => {
    const roleId = 'role-1';

    it('应该返回角色的权限列表', async () => {
      const permissions = [
        ['user', 'read'],
        ['user', 'write'],
      ];
      rolesService.findById.mockResolvedValue(mockRole);
      rolesService.rolePermissions.mockResolvedValue(permissions);

      const result = await controller.findRolePermissions(roleId);

      expect(rolesService.findById).toHaveBeenCalledWith(roleId);
      expect(rolesService.rolePermissions).toHaveBeenCalledWith(mockRole.name);
      expect(result).toEqual(permissions);
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      rolesService.findById.mockResolvedValue(null);

      await expect(controller.findRolePermissions(roleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findRolePermissions(roleId)).rejects.toThrow(
        '角色不存在',
      );
      expect(rolesService.rolePermissions).not.toHaveBeenCalled();
    });
  });

  describe('findRolePermissionsWithDetails', () => {
    const roleId = 'role-1';

    it('应该返回角色的权限详情', async () => {
      const permissions: Permission[] = [
        {
          id: 'permission-1',
          resource: 'user',
          action: 'read',
          description: '读取用户',
        } as Permission,
      ];
      rolesService.findById.mockResolvedValue(mockRole);
      rolesService.getRolePermissionsWithDetails.mockResolvedValue(permissions);

      const result = await controller.findRolePermissionsWithDetails(roleId);

      expect(rolesService.findById).toHaveBeenCalledWith(roleId);
      expect(rolesService.getRolePermissionsWithDetails).toHaveBeenCalledWith(
        mockRole.id,
      );
      expect(result).toEqual(permissions);
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      rolesService.findById.mockResolvedValue(null);

      await expect(
        controller.findRolePermissionsWithDetails(roleId),
      ).rejects.toThrow(NotFoundException);
      expect(rolesService.getRolePermissionsWithDetails).not.toHaveBeenCalled();
    });
  });

  describe('addRolePermission', () => {
    const roleId = 'role-1';
    const addPermissionDto: AddRolePermissionDto = {
      operation: 'read',
      resource: 'user',
    };

    it('应该成功为角色授予权限', async () => {
      rolesService.findById.mockResolvedValue(mockRole);
      rolesService.grantPermission.mockResolvedValue(true);

      const result = await controller.addRolePermission(
        roleId,
        addPermissionDto,
      );

      expect(rolesService.findById).toHaveBeenCalledWith(roleId);
      expect(rolesService.grantPermission).toHaveBeenCalledWith(
        mockRole.name,
        addPermissionDto.operation,
        addPermissionDto.resource,
      );
      expect(result).toBe(true);
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      rolesService.findById.mockResolvedValue(null);

      await expect(
        controller.addRolePermission(roleId, addPermissionDto),
      ).rejects.toThrow(NotFoundException);
      expect(rolesService.grantPermission).not.toHaveBeenCalled();
    });
  });
});
