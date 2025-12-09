import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { Tenant as DomainTenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import { TenantDomain } from '../../../../domain/tenants/value-objects/tenant-domain.vo';
import { TenantName } from '../../../../domain/tenants/value-objects/tenant-name.vo';
import { TenantMapper } from '../../mappers/tenant.mapper';
import { Tenant as OrmTenant } from '../entities/tenant.entity';
import { TenantReadRepository } from './tenant-read.repository';

/**
 * 租户只读仓储单元测试
 *
 * 测试 TenantReadRepository 的所有方法。
 *
 * @describe TenantReadRepository
 */
describe('TenantReadRepository', () => {
  let repository: TenantReadRepository;
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
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantReadRepository,
        {
          provide: getRepositoryToken(OrmTenant),
          useValue: mockOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<TenantReadRepository>(TenantReadRepository);
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
      expect(result).toBeDefined();
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
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('应该查询所有租户', async () => {
      ormRepository.find.mockResolvedValue([mockOrmTenant]);
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

      const result = await repository.findAll();

      expect(ormRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('exists', () => {
    it('应该返回 true 当租户存在时', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.count.mockResolvedValue(1);

      const result = await repository.exists(tenantId);

      expect(ormRepository.count).toHaveBeenCalledWith({
        where: { id: validTenantId },
      });
      expect(result).toBe(true);
    });

    it('应该返回 false 当租户不存在时', async () => {
      const tenantId = new TenantId(validTenantId);

      ormRepository.count.mockResolvedValue(0);

      const result = await repository.exists(tenantId);

      expect(ormRepository.count).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
