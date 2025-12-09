import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../domain/roles/entities/role.aggregate';
import type { IRoleRepository } from '../../../domain/roles/repositories/role.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { AuthZService } from '../../../lib/casbin/services/authz.service';
import type { IPermissionsService } from '../../shared/interfaces/permissions-service.interface';
import { GrantRolePermissionInputDto } from '../dtos/grant-role-permission.input.dto';
import { GrantRolePermissionUseCase } from './grant-role-permission.use-case';

/**
 * 授予角色权限用例单元测试
 *
 * 测试授予角色权限用例的所有场景。
 *
 * @describe GrantRolePermissionUseCase
 */
describe('GrantRolePermissionUseCase', () => {
  let useCase: GrantRolePermissionUseCase;
  let roleRepository: jest.Mocked<IRoleRepository>;
  let eventBus: jest.Mocked<IEventBus>;
  let authzService: jest.Mocked<AuthZService>;
  let permissionsService: jest.Mocked<IPermissionsService>;

  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validPermissionId = '01ARZ3NDEKTSV4RRFFQ69G5FAY';

  beforeEach(async () => {
    const mockRoleRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    const mockAuthzService = {
      addPolicy: jest.fn(),
      removePolicy: jest.fn(),
      hasPolicy: jest.fn(),
      getPolicies: jest.fn(),
    };

    const mockPermissionsService = {
      createOrGet: jest.fn(),
      assignPermissionToRole: jest.fn(),
      removePermissionFromRole: jest.fn(),
      getRolePermissions: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByResourceAndAction: jest.fn(),
      updateDescription: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrantRolePermissionUseCase,
        {
          provide: 'IRoleRepository',
          useValue: mockRoleRepository,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
        {
          provide: AuthZService,
          useValue: mockAuthzService,
        },
        {
          provide: 'IPermissionsService',
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    useCase = module.get<GrantRolePermissionUseCase>(
      GrantRolePermissionUseCase,
    );
    roleRepository = module.get('IRoleRepository');
    eventBus = module.get('IEventBus');
    authzService = module.get(AuthZService);
    permissionsService = module.get('IPermissionsService');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功授予角色权限', async () => {
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

      const mockPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'create',
        description: 'Create users',
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const input = new GrantRolePermissionInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
        resource: 'users',
        action: 'create',
        description: 'Create users',
      });

      roleRepository.findById.mockResolvedValue(mockRole);
      permissionsService.createOrGet.mockResolvedValue(mockPermission);
      permissionsService.assignPermissionToRole.mockResolvedValue(undefined);
      authzService.addPolicy.mockResolvedValue(true);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.success).toBe(true);
      expect(result.message).toBe('权限授予成功');

      expect(roleRepository.findById).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(permissionsService.createOrGet).toHaveBeenCalledWith({
        resource: 'users',
        action: 'create',
        description: 'Create users',
      });
      expect(permissionsService.assignPermissionToRole).toHaveBeenCalledWith(
        validRoleId,
        validPermissionId,
      );
      expect(authzService.addPolicy).toHaveBeenCalledWith(
        'admin',
        validTenantId,
        'users',
        'create',
      );
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该处理角色不存在的情况', async () => {
      const input = new GrantRolePermissionInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
        resource: 'users',
        action: 'create',
      });

      roleRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(roleRepository.findById).toHaveBeenCalled();
      expect(permissionsService.createOrGet).not.toHaveBeenCalled();
      expect(permissionsService.assignPermissionToRole).not.toHaveBeenCalled();
      expect(authzService.addPolicy).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });

    it('应该处理角色未激活的情况', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: false,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new GrantRolePermissionInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
        resource: 'users',
        action: 'create',
      });

      roleRepository.findById.mockResolvedValue(mockRole);

      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);

      expect(roleRepository.findById).toHaveBeenCalled();
      expect(permissionsService.createOrGet).not.toHaveBeenCalled();
      expect(permissionsService.assignPermissionToRole).not.toHaveBeenCalled();
      expect(authzService.addPolicy).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });

    it('应该处理 Casbin 添加策略失败的情况', async () => {
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

      const mockPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'create',
        description: 'Create users',
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const input = new GrantRolePermissionInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
        resource: 'users',
        action: 'create',
      });

      roleRepository.findById.mockResolvedValue(mockRole);
      permissionsService.createOrGet.mockResolvedValue(mockPermission);
      permissionsService.assignPermissionToRole.mockResolvedValue(undefined);
      authzService.addPolicy.mockResolvedValue(false);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.success).toBe(false);
      expect(result.message).toBe('权限授予失败');

      expect(roleRepository.findById).toHaveBeenCalled();
      expect(permissionsService.createOrGet).toHaveBeenCalled();
      expect(permissionsService.assignPermissionToRole).toHaveBeenCalled();
      expect(authzService.addPolicy).toHaveBeenCalled();
      expect(eventBus.publishAll).toHaveBeenCalled();
    });
  });
});
