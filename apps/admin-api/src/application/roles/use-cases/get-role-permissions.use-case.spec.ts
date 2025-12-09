import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../domain/roles/entities/role.aggregate';
import type { IRoleReadRepository } from '../../../domain/roles/repositories/role-read.repository.interface';
import type { IPermissionsService } from '../../shared/interfaces/permissions-service.interface';
import { GetRolePermissionsInputDto } from '../dtos/get-role-permissions.input.dto';
import { GetRolePermissionsUseCase } from './get-role-permissions.use-case';

/**
 * 获取角色权限用例单元测试
 *
 * 测试获取角色权限用例的所有场景。
 *
 * @describe GetRolePermissionsUseCase
 */
describe('GetRolePermissionsUseCase', () => {
  let useCase: GetRolePermissionsUseCase;
  let roleReadRepository: jest.Mocked<IRoleReadRepository>;
  let permissionsService: jest.Mocked<IPermissionsService>;

  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockRoleReadRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    const mockPermissionsService = {
      getRolePermissions: jest.fn(),
      grantRolePermission: jest.fn(),
      revokeRolePermission: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      updateDescription: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRolePermissionsUseCase,
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

    useCase = module.get<GetRolePermissionsUseCase>(GetRolePermissionsUseCase);
    roleReadRepository = module.get('IRoleReadRepository');
    permissionsService = module.get('IPermissionsService');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功获取角色权限', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockPermissions = [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
          resource: 'users',
          action: 'create',
          description: 'Create users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAZ',
          resource: 'users',
          action: 'read',
          description: 'Read users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FB0',
          resource: 'users',
          action: 'update',
          description: 'Update users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FB1',
          resource: 'users',
          action: 'delete',
          description: 'Delete users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any;

      const input = new GetRolePermissionsInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
      });

      roleReadRepository.findById.mockResolvedValue(mockRole);
      permissionsService.getRolePermissions.mockResolvedValue(mockPermissions);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.permissions).toHaveLength(4);
      expect(result.permissions[0]).toEqual({
        resource: 'users',
        action: 'create',
      });
      expect(result.permissions[1]).toEqual({
        resource: 'users',
        action: 'read',
      });

      expect(roleReadRepository.findById).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(permissionsService.getRolePermissions).toHaveBeenCalledWith(
        validRoleId,
      );
    });

    it('应该处理角色不存在的情况', async () => {
      const input = new GetRolePermissionsInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
      });

      roleReadRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(roleReadRepository.findById).toHaveBeenCalled();
      expect(permissionsService.getRolePermissions).not.toHaveBeenCalled();
    });

    it('应该处理角色没有权限的情况', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new GetRolePermissionsInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
      });

      roleReadRepository.findById.mockResolvedValue(mockRole);
      permissionsService.getRolePermissions.mockResolvedValue([]);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.permissions).toHaveLength(0);

      expect(roleReadRepository.findById).toHaveBeenCalled();
      expect(permissionsService.getRolePermissions).toHaveBeenCalledWith(
        validRoleId,
      );
    });
  });
});
