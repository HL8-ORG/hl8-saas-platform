import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission as DomainPermission } from '../../../../domain/permissions/entities/permission.aggregate';
import { PermissionId } from '../../../../domain/permissions/value-objects/permission-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { PermissionMapper } from '../../mappers/permission.mapper';
import { Permission as OrmPermission } from '../entities/permission.entity';
import { PermissionReadRepository } from './permission-read.repository';

/**
 * 权限只读仓储单元测试
 *
 * 测试 PermissionReadRepository 的所有方法。
 *
 * @describe PermissionReadRepository
 */
describe('PermissionReadRepository', () => {
  let repository: PermissionReadRepository;
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
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionReadRepository,
        {
          provide: getRepositoryToken(OrmPermission),
          useValue: mockOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<PermissionReadRepository>(PermissionReadRepository);
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
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('应该查询所有权限', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.find.mockResolvedValue([mockOrmPermission]);
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

      const result = await repository.findAll(tenantId);

      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { tenantId: validTenantId },
      });
      expect(result).toHaveLength(1);
    });
  });
});
