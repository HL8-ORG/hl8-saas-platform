import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '../../../entities/permission.entity';
import { PermissionsService } from '../services/permissions.service';
import { PermissionsController } from './permissions.controller';

/**
 * 权限控制器单元测试
 *
 * 测试权限控制器的 HTTP 请求处理逻辑。
 *
 * @describe PermissionsController
 */
describe('PermissionsController', () => {
  let controller: PermissionsController;
  let permissionsService: jest.Mocked<PermissionsService>;

  const mockPermission: Permission = {
    id: 'permission-1',
    resource: 'user',
    action: 'read',
    description: '读取用户',
    tenantId: 'tenant-1',
    roles: [],
  } as Permission;

  beforeEach(async () => {
    const mockPermissionsService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      createOrGet: jest.fn(),
      updateDescription: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
    permissionsService = module.get(PermissionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllPermissions', () => {
    it('应该返回所有权限', async () => {
      const permissions = [mockPermission];
      permissionsService.findAll.mockResolvedValue(permissions);

      const result = await controller.findAllPermissions();

      expect(permissionsService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(permissions);
    });

    it('当提供 tenantId 查询参数时应该传递给服务', async () => {
      const tenantId = 'tenant-1';
      const permissions = [mockPermission];
      permissionsService.findAll.mockResolvedValue(permissions);

      const result = await controller.findAllPermissions(tenantId);

      expect(permissionsService.findAll).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(permissions);
    });

    it('应该返回空数组当没有权限时', async () => {
      permissionsService.findAll.mockResolvedValue([]);

      const result = await controller.findAllPermissions();

      expect(result).toEqual([]);
    });
  });

  describe('findPermissionById', () => {
    const permissionId = 'permission-1';

    it('应该返回权限', async () => {
      permissionsService.findById.mockResolvedValue(mockPermission);

      const result = await controller.findPermissionById(permissionId);

      expect(permissionsService.findById).toHaveBeenCalledWith(permissionId);
      expect(result).toEqual(mockPermission);
    });

    it('当权限不存在时应该抛出 NotFoundException', async () => {
      permissionsService.findById.mockResolvedValue(null);

      await expect(controller.findPermissionById(permissionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findPermissionById(permissionId)).rejects.toThrow(
        '权限不存在',
      );
    });
  });

  describe('createPermission', () => {
    const createPermissionDto = {
      resource: 'user',
      action: 'read',
      description: '读取用户',
    };

    it('应该成功创建权限', async () => {
      permissionsService.createOrGet.mockResolvedValue(mockPermission);

      const result = await controller.createPermission(createPermissionDto);

      expect(permissionsService.createOrGet).toHaveBeenCalledWith(
        createPermissionDto,
      );
      expect(result).toEqual(mockPermission);
    });

    it('当权限已存在时应该返回现有权限', async () => {
      permissionsService.createOrGet.mockResolvedValue(mockPermission);

      const result = await controller.createPermission(createPermissionDto);

      expect(result).toEqual(mockPermission);
    });

    it('当提供 tenantId 时应该传递给服务', async () => {
      const createDtoWithTenant = {
        ...createPermissionDto,
        tenantId: 'tenant-1',
      };
      permissionsService.createOrGet.mockResolvedValue(mockPermission);

      await controller.createPermission(createDtoWithTenant);

      expect(permissionsService.createOrGet).toHaveBeenCalledWith(
        createDtoWithTenant,
      );
    });
  });

  describe('updatePermissionDescription', () => {
    const permissionId = 'permission-1';
    const updateDto = {
      description: '新的描述',
    };

    it('应该成功更新权限描述', async () => {
      const updatedPermission = {
        ...mockPermission,
        description: '新的描述',
      };
      permissionsService.updateDescription.mockResolvedValue(updatedPermission);

      const result = await controller.updatePermissionDescription(
        permissionId,
        updateDto,
      );

      expect(permissionsService.updateDescription).toHaveBeenCalledWith(
        permissionId,
        updateDto.description,
      );
      expect(result).toEqual(updatedPermission);
    });
  });

  describe('deletePermission', () => {
    const permissionId = 'permission-1';

    it('应该成功删除权限', async () => {
      permissionsService.delete.mockResolvedValue(undefined);

      const result = await controller.deletePermission(permissionId);

      expect(permissionsService.delete).toHaveBeenCalledWith(permissionId);
      expect(result).toEqual({ message: '权限删除成功' });
    });
  });
});
