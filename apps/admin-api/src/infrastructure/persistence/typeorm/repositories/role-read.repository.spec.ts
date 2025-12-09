import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role as DomainRole } from '../../../../domain/roles/entities/role.aggregate';
import { RoleName } from '../../../../domain/roles/value-objects/role-name.vo';
import { RoleId } from '../../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { RoleMapper } from '../../mappers/role.mapper';
import { Role as OrmRole } from '../entities/role.entity';
import { RoleReadRepository } from './role-read.repository';

/**
 * 角色只读仓储单元测试
 *
 * 测试 RoleReadRepository 的所有方法。
 *
 * @describe RoleReadRepository
 */
describe('RoleReadRepository', () => {
  let repository: RoleReadRepository;
  let ormRepository: jest.Mocked<Repository<OrmRole>>;

  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRoleName = 'ADMIN';

  const mockOrmRole: OrmRole = {
    id: validRoleId,
    name: validRoleName,
    displayName: 'Administrator',
    description: 'Administrator role',
    tenantId: validTenantId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as OrmRole;

  beforeEach(async () => {
    const mockOrmRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleReadRepository,
        {
          provide: getRepositoryToken(OrmRole),
          useValue: mockOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<RoleReadRepository>(RoleReadRepository);
    ormRepository = module.get(getRepositoryToken(OrmRole));
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('应该根据ID和租户ID查找角色', async () => {
      const roleId = new RoleId(validRoleId);
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(mockOrmRole);
      jest.spyOn(RoleMapper, 'toDomain').mockReturnValue(
        DomainRole.reconstitute({
          id: validRoleId,
          name: validRoleName,
          displayName: 'Administrator',
          description: 'Administrator role',
          tenantId: validTenantId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findById(roleId, tenantId);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: validRoleId,
          tenantId: validTenantId,
        },
      });
      expect(RoleMapper.toDomain).toHaveBeenCalledWith(mockOrmRole);
      expect(result).toBeDefined();
      expect(result?.id.toString()).toBe(validRoleId);
    });

    it('应该返回 null 当角色不存在时', async () => {
      const roleId = new RoleId(validRoleId);
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById(roleId, tenantId);

      expect(ormRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('应该根据名称和租户ID查找角色', async () => {
      const roleName = new RoleName(validRoleName);
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(mockOrmRole);
      jest.spyOn(RoleMapper, 'toDomain').mockReturnValue(
        DomainRole.reconstitute({
          id: validRoleId,
          name: validRoleName,
          displayName: 'Administrator',
          description: 'Administrator role',
          tenantId: validTenantId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findByName(roleName, tenantId);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: validRoleName,
          tenantId: validTenantId,
        },
      });
      expect(RoleMapper.toDomain).toHaveBeenCalledWith(mockOrmRole);
      expect(result).toBeDefined();
      expect(result?.name.value).toBe(validRoleName);
    });

    it('应该返回 null 当角色不存在时', async () => {
      const roleName = new RoleName(validRoleName);
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByName(roleName, tenantId);

      expect(ormRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('应该查询所有角色', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.find.mockResolvedValue([mockOrmRole]);
      jest.spyOn(RoleMapper, 'toDomain').mockReturnValue(
        DomainRole.reconstitute({
          id: validRoleId,
          name: validRoleName,
          displayName: 'Administrator',
          description: 'Administrator role',
          tenantId: validTenantId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findAll(tenantId);

      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { tenantId: validTenantId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('应该返回空数组当没有角色时', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.find.mockResolvedValue([]);

      const result = await repository.findAll(tenantId);

      expect(ormRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });

  describe('exists', () => {
    it('应该返回 true 当角色存在时', async () => {
      const roleName = new RoleName(validRoleName);
      const tenantId = new TenantId(validTenantId);

      ormRepository.count.mockResolvedValue(1);

      const result = await repository.exists(roleName, tenantId);

      expect(ormRepository.count).toHaveBeenCalledWith({
        where: {
          name: validRoleName,
          tenantId: validTenantId,
        },
      });
      expect(result).toBe(true);
    });

    it('应该返回 false 当角色不存在时', async () => {
      const roleName = new RoleName(validRoleName);
      const tenantId = new TenantId(validTenantId);

      ormRepository.count.mockResolvedValue(0);

      const result = await repository.exists(roleName, tenantId);

      expect(ormRepository.count).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
