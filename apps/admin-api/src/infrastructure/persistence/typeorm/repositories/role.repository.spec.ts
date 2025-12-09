import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role as DomainRole } from '../../../../domain/roles/entities/role.aggregate';
import { RoleName } from '../../../../domain/roles/value-objects/role-name.vo';
import { RoleId } from '../../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { RoleMapper } from '../../mappers/role.mapper';
import { Role as OrmRole } from '../entities/role.entity';
import { RoleRepository } from './role.repository';

/**
 * 角色仓储单元测试
 *
 * 测试 RoleRepository 的所有方法。
 *
 * @describe RoleRepository
 */
describe('RoleRepository', () => {
  let repository: RoleRepository;
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
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleRepository,
        {
          provide: getRepositoryToken(OrmRole),
          useValue: mockOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<RoleRepository>(RoleRepository);
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

  describe('save', () => {
    it('应该更新已存在的角色', async () => {
      const domainRole = DomainRole.reconstitute({
        id: validRoleId,
        name: validRoleName,
        displayName: 'Administrator',
        description: 'Administrator role',
        tenantId: validTenantId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const existingEntity = { id: validRoleId } as OrmRole;
      ormRepository.findOne.mockResolvedValue(existingEntity);
      jest.spyOn(RoleMapper, 'toOrm').mockReturnValue(mockOrmRole);
      jest.spyOn(RoleMapper, 'updateOrm').mockImplementation(() => {});
      ormRepository.save.mockResolvedValue(mockOrmRole);

      await repository.save(domainRole);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: validRoleId },
        select: ['id'],
      });
      expect(RoleMapper.toOrm).toHaveBeenCalledWith(domainRole);
      expect(RoleMapper.updateOrm).toHaveBeenCalledWith(
        existingEntity,
        domainRole,
      );
      expect(ormRepository.save).toHaveBeenCalledWith(existingEntity);
    });

    it('应该创建新角色', async () => {
      const domainRole = DomainRole.reconstitute({
        id: validRoleId,
        name: validRoleName,
        displayName: 'Administrator',
        description: 'Administrator role',
        tenantId: validTenantId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      ormRepository.findOne.mockResolvedValue(null);
      jest.spyOn(RoleMapper, 'toOrm').mockReturnValue(mockOrmRole);
      ormRepository.save.mockResolvedValue(mockOrmRole);

      await repository.save(domainRole);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: validRoleId },
        select: ['id'],
      });
      expect(RoleMapper.toOrm).toHaveBeenCalledWith(domainRole);
      expect(ormRepository.save).toHaveBeenCalledWith(mockOrmRole);
    });
  });

  describe('delete', () => {
    it('应该删除角色', async () => {
      const roleId = new RoleId(validRoleId);
      const tenantId = new TenantId(validTenantId);

      ormRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete(roleId, tenantId);

      expect(ormRepository.delete).toHaveBeenCalledWith({
        id: validRoleId,
        tenantId: validTenantId,
      });
    });
  });
});
