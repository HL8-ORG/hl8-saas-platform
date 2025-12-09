import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { Tenant as DomainTenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import { TenantDomain } from '../../../../domain/tenants/value-objects/tenant-domain.vo';
import { TenantName } from '../../../../domain/tenants/value-objects/tenant-name.vo';
import { TenantMapper } from '../../mappers/tenant.mapper';
import { Tenant as OrmTenant } from '../entities/tenant.entity';
import { TenantRepository } from './tenant.repository';

/**
 * 租户仓储单元测试
 *
 * 测试 TenantRepository 的所有方法。
 *
 * @describe TenantRepository
 */
describe('TenantRepository', () => {
  let repository: TenantRepository;
  let ormRepository: jest.Mocked<Repository<OrmTenant>>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantName = 'Test Tenant';
  const validTenantDomain = 'test-tenant';

  const mockOrmTenant: OrmTenant = {
    id: validTenantId,
    name: validTenantName,
    domain: validTenantDomain,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as OrmTenant;

  beforeEach(async () => {
    const mockOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantRepository,
        {
          provide: getRepositoryToken(OrmTenant),
          useValue: mockOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<TenantRepository>(TenantRepository);
    ormRepository = module.get(getRepositoryToken(OrmTenant));
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('应该根据ID查找租户', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(mockOrmTenant);
      jest.spyOn(TenantMapper, 'toDomain').mockReturnValue(
        DomainTenant.reconstitute({
          id: validTenantId,
          name: validTenantName,
          domain: validTenantDomain,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findById(tenantId);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: validTenantId },
      });
      expect(TenantMapper.toDomain).toHaveBeenCalledWith(mockOrmTenant);
      expect(result).toBeDefined();
      expect(result?.id.toString()).toBe(validTenantId);
    });

    it('应该返回 null 当租户不存在时', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById(tenantId);

      expect(ormRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('应该根据名称查找租户', async () => {
      const tenantName = new TenantName(validTenantName);

      ormRepository.findOne.mockResolvedValue(mockOrmTenant);
      jest.spyOn(TenantMapper, 'toDomain').mockReturnValue(
        DomainTenant.reconstitute({
          id: validTenantId,
          name: validTenantName,
          domain: validTenantDomain,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findByName(tenantName);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { name: validTenantName },
      });
      expect(TenantMapper.toDomain).toHaveBeenCalledWith(mockOrmTenant);
      expect(result).toBeDefined();
      expect(result?.name.value).toBe(validTenantName);
    });

    it('应该返回 null 当租户不存在时', async () => {
      const tenantName = new TenantName(validTenantName);

      ormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByName(tenantName);

      expect(ormRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findByDomain', () => {
    it('应该根据域名查找租户', async () => {
      const tenantDomain = new TenantDomain(validTenantDomain);

      ormRepository.findOne.mockResolvedValue(mockOrmTenant);
      jest.spyOn(TenantMapper, 'toDomain').mockReturnValue(
        DomainTenant.reconstitute({
          id: validTenantId,
          name: validTenantName,
          domain: validTenantDomain,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findByDomain(tenantDomain);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { domain: validTenantDomain },
      });
      expect(TenantMapper.toDomain).toHaveBeenCalledWith(mockOrmTenant);
      expect(result).toBeDefined();
      expect(result?.domain?.value).toBe(validTenantDomain);
    });

    it('应该返回 null 当租户不存在时', async () => {
      const tenantDomain = new TenantDomain(validTenantDomain);

      ormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByDomain(tenantDomain);

      expect(ormRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('应该更新已存在的租户', async () => {
      const domainTenant = DomainTenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validTenantDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const existingEntity = { ...mockOrmTenant } as OrmTenant;
      ormRepository.findOne.mockResolvedValue(existingEntity);
      jest.spyOn(TenantMapper, 'updateOrm').mockImplementation(() => {});
      ormRepository.save.mockResolvedValue(mockOrmTenant);

      await repository.save(domainTenant);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: validTenantId },
      });
      expect(TenantMapper.updateOrm).toHaveBeenCalledWith(
        existingEntity,
        domainTenant,
      );
      expect(ormRepository.save).toHaveBeenCalledWith(existingEntity);
    });

    it('应该创建新租户', async () => {
      const domainTenant = DomainTenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: validTenantDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      ormRepository.findOne.mockResolvedValue(null);
      jest.spyOn(TenantMapper, 'toOrm').mockReturnValue(mockOrmTenant);
      ormRepository.save.mockResolvedValue(mockOrmTenant);

      await repository.save(domainTenant);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: validTenantId },
      });
      expect(TenantMapper.toOrm).toHaveBeenCalledWith(domainTenant);
      expect(ormRepository.save).toHaveBeenCalledWith(mockOrmTenant);
    });
  });

  describe('delete', () => {
    it('应该删除租户', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete(tenantId);

      expect(ormRepository.delete).toHaveBeenCalledWith({ id: validTenantId });
    });
  });
});
