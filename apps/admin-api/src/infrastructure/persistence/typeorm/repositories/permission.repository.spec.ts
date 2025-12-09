import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission as DomainPermission } from '../../../../domain/permissions/entities/permission.aggregate';
import { PermissionId } from '../../../../domain/permissions/value-objects/permission-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { PermissionMapper } from '../../mappers/permission.mapper';
import { Permission as OrmPermission } from '../entities/permission.entity';
import { PermissionRepository } from './permission.repository';

/**
 * 权限仓储单元测试
 *
 * 测试 PermissionRepository 的所有方法。
 *
 * @describe PermissionRepository
 */
describe('PermissionRepository', () => {
  let repository: PermissionRepository;
  let ormRepository: jest.Mocked<Repository<OrmPermission>>;

  const validPermissionId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validResource = 'users';
  const validAction = 'read';

  const mockOrmPermission: OrmPermission = {
    id: validPermissionId,
    resource: validResource,
    action: validAction,
    description: 'Read users',
    tenantId: validTenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as OrmPermission;

  beforeEach(async () => {
    const mockOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionRepository,
        {
          provide: getRepositoryToken(OrmPermission),
          useValue: mockOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<PermissionRepository>(PermissionRepository);
    ormRepository = module.get(getRepositoryToken(OrmPermission));
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('应该根据ID和租户ID查找权限', async () => {
      const permissionId = new PermissionId(validPermissionId);
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(mockOrmPermission);
      jest.spyOn(PermissionMapper, 'toDomain').mockReturnValue(
        DomainPermission.reconstitute({
          id: validPermissionId,
          resource: validResource,
          action: validAction,
          description: 'Read users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findById(permissionId, tenantId);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: validPermissionId,
          tenantId: validTenantId,
        },
      });
      expect(PermissionMapper.toDomain).toHaveBeenCalledWith(mockOrmPermission);
      expect(result).toBeDefined();
      expect(result?.id.toString()).toBe(validPermissionId);
    });

    it('应该返回 null 当权限不存在时', async () => {
      const permissionId = new PermissionId(validPermissionId);
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById(permissionId, tenantId);

      expect(ormRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findByResourceAndAction', () => {
    it('应该根据资源、操作和租户ID查找权限', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(mockOrmPermission);
      jest.spyOn(PermissionMapper, 'toDomain').mockReturnValue(
        DomainPermission.reconstitute({
          id: validPermissionId,
          resource: validResource,
          action: validAction,
          description: 'Read users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findByResourceAndAction(
        validResource,
        validAction,
        tenantId,
      );

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: {
          resource: validResource,
          action: validAction,
          tenantId: validTenantId,
        },
      });
      expect(PermissionMapper.toDomain).toHaveBeenCalledWith(mockOrmPermission);
      expect(result).toBeDefined();
      expect(result?.resource).toBe(validResource);
      expect(result?.action).toBe(validAction);
    });

    it('应该返回 null 当权限不存在时', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByResourceAndAction(
        validResource,
        validAction,
        tenantId,
      );

      expect(ormRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('应该更新已存在的权限', async () => {
      const domainPermission = DomainPermission.reconstitute({
        id: validPermissionId,
        resource: validResource,
        action: validAction,
        description: 'Read users',
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const existingEntity = { ...mockOrmPermission } as OrmPermission;
      ormRepository.findOne.mockResolvedValue(existingEntity);
      jest.spyOn(PermissionMapper, 'updateOrm').mockImplementation(() => {});
      ormRepository.save.mockResolvedValue(mockOrmPermission);

      await repository.save(domainPermission);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: validPermissionId },
      });
      expect(PermissionMapper.updateOrm).toHaveBeenCalledWith(
        existingEntity,
        domainPermission,
      );
      expect(ormRepository.save).toHaveBeenCalledWith(existingEntity);
    });

    it('应该创建新权限', async () => {
      const domainPermission = DomainPermission.reconstitute({
        id: validPermissionId,
        resource: validResource,
        action: validAction,
        description: 'Read users',
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      ormRepository.findOne.mockResolvedValue(null);
      jest.spyOn(PermissionMapper, 'toOrm').mockReturnValue(mockOrmPermission);
      ormRepository.create.mockReturnValue(mockOrmPermission);
      ormRepository.save.mockResolvedValue(mockOrmPermission);

      await repository.save(domainPermission);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: validPermissionId },
      });
      expect(PermissionMapper.toOrm).toHaveBeenCalledWith(domainPermission);
      expect(ormRepository.create).toHaveBeenCalledWith(mockOrmPermission);
      expect(ormRepository.save).toHaveBeenCalledWith(mockOrmPermission);
    });
  });

  describe('delete', () => {
    it('应该删除权限', async () => {
      const permissionId = new PermissionId(validPermissionId);
      const tenantId = new TenantId(validTenantId);

      ormRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete(permissionId, tenantId);

      expect(ormRepository.delete).toHaveBeenCalledWith({
        id: validPermissionId,
        tenantId: validTenantId,
      });
    });
  });
});
