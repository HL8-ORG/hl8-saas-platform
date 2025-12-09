import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../../domain/roles/entities/role.aggregate';
import type { IRoleReadRepository } from '../../../../domain/roles/repositories/role-read.repository.interface';
import type { IPermissionsService } from '../../../shared/interfaces/permissions-service.interface';
import { GetRolePermissionsQuery } from '../get-role-permissions.query';
import { GetRolePermissionsHandler } from './get-role-permissions.handler';

/**
 * 获取角色权限查询处理器单元测试
 *
 * 测试 GetRolePermissionsHandler 的所有场景。
 *
 * @describe GetRolePermissionsHandler
 */
describe('GetRolePermissionsHandler', () => {
  let handler: GetRolePermissionsHandler;
  let roleReadRepository: jest.Mocked<IRoleReadRepository>;
  let permissionsService: jest.Mocked<IPermissionsService>;

  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRoleName = 'admin';

  beforeEach(async () => {
    const mockRoleReadRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRolePermissionsHandler,
        {
          provide: 'IRoleReadRepository',
          useValue: mockRoleReadRepository,
        },
        {
          provide: 'IPermissionsService',
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    handler = module.get<GetRolePermissionsHandler>(GetRolePermissionsHandler);
    roleReadRepository = module.get('IRoleReadRepository');
    permissionsService = module.get('IPermissionsService');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该返回角色权限列表', async () => {
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

      const mockPermissions = [
        {
          id: 'permission1',
          resource: 'users',
          action: 'read',
          description: 'Read users',
          tenantId: validTenantId,
        },
        {
          id: 'permission2',
          resource: 'users',
          action: 'write',
          description: 'Write users',
          tenantId: validTenantId,
        },
      ];

      const query = new GetRolePermissionsQuery(
        validRoleId,
        validTenantId,
        false,
      );

      roleReadRepository.findById.mockResolvedValue(mockRole);
      permissionsService.getRolePermissions.mockResolvedValue(
        mockPermissions as any,
      );

      const result = await handler.execute(query);

      expect(roleReadRepository.findById).toHaveBeenCalled();
      expect(permissionsService.getRolePermissions).toHaveBeenCalledWith(
        validRoleId,
      );
      expect(result.permissions).toHaveLength(2);
      expect(result.permissions[0].resource).toBe('users');
      expect(result.permissions[0].action).toBe('read');
      expect(result.permissions[1].resource).toBe('users');
      expect(result.permissions[1].action).toBe('write');
    });

    it('应该抛出 NotFoundException 当角色不存在时', async () => {
      const query = new GetRolePermissionsQuery(
        validRoleId,
        validTenantId,
        false,
      );

      roleReadRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('角色不存在');

      expect(roleReadRepository.findById).toHaveBeenCalled();
      expect(permissionsService.getRolePermissions).not.toHaveBeenCalled();
    });

    it('应该支持 withDetails 参数', async () => {
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

      const query = new GetRolePermissionsQuery(
        validRoleId,
        validTenantId,
        true,
      );

      roleReadRepository.findById.mockResolvedValue(mockRole);
      permissionsService.getRolePermissions.mockResolvedValue([]);

      await handler.execute(query);

      expect(roleReadRepository.findById).toHaveBeenCalled();
      expect(permissionsService.getRolePermissions).toHaveBeenCalled();
    });
  });
});
