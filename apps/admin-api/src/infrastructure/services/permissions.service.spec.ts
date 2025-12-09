import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import type { ITenantResolver } from '../../application/shared/interfaces/tenant-resolver.interface';
import { Permission } from '../persistence/typeorm/entities/permission.entity';
import { Role } from '../persistence/typeorm/entities/role.entity';
import { PermissionsService } from './permissions.service';

/**
 * 权限服务单元测试
 *
 * 测试权限服务的所有方法，包括缓存逻辑。
 *
 * @describe PermissionsService
 */
describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let tenantResolver: jest.Mocked<ITenantResolver>;
  let cacheManager: jest.Mocked<Cache>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validPermissionId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockPermissionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({
        affected: 0,
        generatedMaps: [],
        raw: [],
      }),
      delete: jest.fn(),
    };

    const mockQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };

    const mockRoleRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      count: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
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
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    permissionRepository = module.get(getRepositoryToken(Permission));
    roleRepository = module.get(getRepositoryToken(Role));
    tenantResolver = module.get('ITenantResolver');
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    // 使用 resetAllMocks 而不是 clearAllMocks，这样可以保留 mock 实现
    jest.resetAllMocks();
    // 确保 update 方法有默认的 mock 实现
    permissionRepository.update.mockResolvedValue({
      affected: 0,
      generatedMaps: [],
      raw: [],
    } as any);
    // 确保 delete 方法也有默认的 mock 实现
    permissionRepository.delete.mockResolvedValue({
      affected: 0,
      raw: [],
    } as any);
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('createOrGet', () => {
    it('应该从缓存返回已存在的权限', async () => {
      const permissionData = {
        resource: 'users',
        action: 'read',
        description: 'Read users',
      };

      const cachedPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'read',
        description: 'Read users',
        tenantId: validTenantId,
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      cacheManager.get.mockResolvedValue(cachedPermission);

      const result = await service.createOrGet(permissionData);

      expect(cacheManager.get).toHaveBeenCalledWith(
        `permission:${validTenantId}:users:read`,
      );
      expect(result).toEqual(cachedPermission);
      expect(permissionRepository.findOne).not.toHaveBeenCalled();
    });

    it('应该从数据库返回已存在的权限并缓存', async () => {
      const permissionData = {
        resource: 'users',
        action: 'read',
        description: 'Read users',
      };

      const existingPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'read',
        description: 'Read users',
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Permission;

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      cacheManager.get.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(existingPermission);

      const result = await service.createOrGet(permissionData);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          resource: 'users',
          action: 'read',
          tenantId: validTenantId,
        },
        select: ['id', 'resource', 'action', 'description', 'tenantId'],
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        `permission:${validTenantId}:users:read`,
        existingPermission,
        5 * 60,
      );
      expect(result).toEqual(existingPermission);
    });

    it('应该创建新权限并缓存', async () => {
      const permissionData = {
        resource: 'users',
        action: 'write',
        description: 'Write users',
      };

      const newPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'write',
        description: 'Write users',
        tenantId: validTenantId,
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      cacheManager.get.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(null);
      permissionRepository.create.mockReturnValue(newPermission as Permission);
      permissionRepository.save.mockResolvedValue(newPermission as Permission);

      const result = await service.createOrGet(permissionData);

      expect(permissionRepository.create).toHaveBeenCalledWith({
        resource: 'users',
        action: 'write',
        description: 'Write users',
        tenantId: validTenantId,
      });
      expect(permissionRepository.save).toHaveBeenCalledWith(newPermission);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `permission:${validTenantId}:users:write`,
        newPermission,
        5 * 60,
      );
      expect(cacheManager.del).toHaveBeenCalledWith(
        `permissions:list:${validTenantId}`,
      );
      expect(result).toEqual(newPermission);
    });

    it('应该使用传入的 tenantId 而不是当前租户', async () => {
      const permissionData = {
        resource: 'users',
        action: 'read',
        tenantId: 'custom-tenant-id',
      };

      const cachedPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'read',
        tenantId: 'custom-tenant-id',
      };

      cacheManager.get.mockResolvedValue(cachedPermission);

      const result = await service.createOrGet(permissionData);

      expect(cacheManager.get).toHaveBeenCalledWith(
        `permission:custom-tenant-id:users:read`,
      );
      expect(tenantResolver.getCurrentTenantId).not.toHaveBeenCalled();
      expect(result).toEqual(cachedPermission);
    });
  });

  describe('findAll', () => {
    it('应该从缓存返回权限列表', async () => {
      const cachedPermissions = [
        {
          id: validPermissionId,
          resource: 'users',
          action: 'read',
          tenantId: validTenantId,
        },
      ];

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      cacheManager.get.mockResolvedValue(cachedPermissions);

      const result = await service.findAll();

      expect(cacheManager.get).toHaveBeenCalledWith(
        `permissions:list:${validTenantId}`,
      );
      expect(result).toEqual(cachedPermissions);
      expect(permissionRepository.find).not.toHaveBeenCalled();
    });

    it('应该从数据库查询权限列表并缓存', async () => {
      const permissions = [
        {
          id: validPermissionId,
          resource: 'users',
          action: 'read',
          tenantId: validTenantId,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as unknown as Permission[];

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      cacheManager.get.mockResolvedValue(null);
      permissionRepository.find.mockResolvedValue(permissions);

      const result = await service.findAll();

      expect(permissionRepository.find).toHaveBeenCalledWith({
        where: { tenantId: validTenantId },
        relations: ['roles'],
        order: { resource: 'ASC', action: 'ASC' },
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        `permissions:list:${validTenantId}`,
        permissions,
        2 * 60,
      );
      expect(result).toEqual(permissions);
    });

    it('应该使用传入的 tenantId', async () => {
      const permissions = [
        {
          id: validPermissionId,
          resource: 'users',
          action: 'read',
          tenantId: 'custom-tenant-id',
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as unknown as Permission[];

      cacheManager.get.mockResolvedValue(null);
      permissionRepository.find.mockResolvedValue(permissions);

      const result = await service.findAll('custom-tenant-id');

      expect(permissionRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'custom-tenant-id' },
        relations: ['roles'],
        order: { resource: 'ASC', action: 'ASC' },
      });
      expect(tenantResolver.getCurrentTenantId).not.toHaveBeenCalled();
      expect(result).toEqual(permissions);
    });
  });

  describe('findById', () => {
    it('应该从缓存返回权限', async () => {
      const cachedPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'read',
        tenantId: validTenantId,
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      cacheManager.get.mockResolvedValue(cachedPermission);

      const result = await service.findById(validPermissionId);

      expect(cacheManager.get).toHaveBeenCalledWith(
        `permission:id:${validPermissionId}:${validTenantId}`,
      );
      expect(result).toEqual(cachedPermission);
      expect(permissionRepository.findOne).not.toHaveBeenCalled();
    });

    it('应该从数据库查询权限并缓存', async () => {
      const permission = {
        id: validPermissionId,
        resource: 'users',
        action: 'read',
        tenantId: validTenantId,
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Permission;

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      cacheManager.get.mockResolvedValue(undefined);
      permissionRepository.findOne.mockResolvedValue(permission);

      const result = await service.findById(validPermissionId);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: validPermissionId, tenantId: validTenantId },
        relations: ['roles'],
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        `permission:id:${validPermissionId}:${validTenantId}`,
        permission,
        5 * 60,
      );
      expect(result).toEqual(permission);
    });

    it('应该返回 null 当权限不存在时', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      cacheManager.get.mockResolvedValue(undefined);
      permissionRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(validPermissionId);

      expect(result).toBeNull();
    });
  });

  describe('updateDescription', () => {
    it('应该更新权限描述', async () => {
      const permission = {
        id: validPermissionId,
        resource: 'users',
        action: 'read',
        description: 'Old description',
        tenantId: validTenantId,
      };

      const updatedPermission = {
        ...permission,
        description: 'New description',
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      permissionRepository.update.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: [],
      } as any);
      // updateDescription 会调用 findById，需要 mock
      cacheManager.get.mockResolvedValue(undefined);
      permissionRepository.findOne.mockResolvedValue(
        updatedPermission as Permission,
      );

      const result = await service.updateDescription(
        validPermissionId,
        'New description',
      );

      expect(permissionRepository.update).toHaveBeenCalledWith(
        { id: validPermissionId, tenantId: validTenantId },
        { description: 'New description' },
      );
      expect(cacheManager.del).toHaveBeenCalledWith(
        `permission:id:${validPermissionId}:${validTenantId}`,
      );
      expect(cacheManager.del).toHaveBeenCalledWith(
        `permissions:list:${validTenantId}`,
      );
      expect(result).toEqual(updatedPermission);
    });

    it('应该抛出 NotFoundException 当权限不存在时', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      permissionRepository.update.mockResolvedValue({
        affected: 0,
        generatedMaps: [],
        raw: [],
      } as any);
      // 不需要 mock findById，因为会在 result.affected === 0 时直接抛出异常

      await expect(
        service.updateDescription(validPermissionId, 'New description'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('应该删除权限并清除缓存', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      roleRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      permissionRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.delete(validPermissionId);

      expect(roleRepository.createQueryBuilder).toHaveBeenCalledWith('role');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'role.permissions',
        'permission',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'permission.id = :id',
        { id: validPermissionId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'role.tenantId = :tenantId',
        { tenantId: validTenantId },
      );
      expect(permissionRepository.delete).toHaveBeenCalledWith({
        id: validPermissionId,
        tenantId: validTenantId,
      });
      expect(cacheManager.del).toHaveBeenCalledWith(
        `permission:id:${validPermissionId}:${validTenantId}`,
      );
      expect(cacheManager.del).toHaveBeenCalledWith(
        `permissions:list:${validTenantId}`,
      );
    });

    it('应该抛出 BadRequestException 当权限仍被角色使用时', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2), // 2 个角色使用此权限
      };
      roleRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      // 不需要 mock delete，因为会在 roleCount > 0 时直接抛出异常

      await expect(service.delete(validPermissionId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.delete(validPermissionId)).rejects.toThrow(
        /权限仍被 \d+ 个角色使用，无法删除/,
      );
      expect(permissionRepository.delete).not.toHaveBeenCalled();
    });

    it('应该抛出 NotFoundException 当权限不存在时', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      roleRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      permissionRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.delete(validPermissionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
