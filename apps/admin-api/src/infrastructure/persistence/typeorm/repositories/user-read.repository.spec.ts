import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import {
  User as DomainUser,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import { UserMapper } from '../../mappers/user.mapper';
import { User as OrmUser } from '../entities/user.entity';
import { UserReadRepository } from './user-read.repository';

/**
 * 用户只读仓储单元测试
 *
 * 测试 UserReadRepository 的所有方法，包括缓存逻辑。
 *
 * @describe UserReadRepository
 */
describe('UserReadRepository', () => {
  let repository: UserReadRepository;
  let ormRepository: jest.Mocked<Repository<OrmUser>>;
  let cacheManager: jest.Mocked<Cache>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validEmail = 'user@example.com';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  const mockOrmUser: OrmUser = {
    id: validUserId,
    email: validEmail,
    passwordHash: validBcryptHash,
    fullName: 'Test User',
    role: UserRole.USER,
    tenantId: validTenantId,
    isActive: true,
    isEmailVerified: true,
    emailVerificationCode: null,
    emailVerificationExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as OrmUser;

  beforeEach(async () => {
    const mockOrmRepository = {
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserReadRepository,
        {
          provide: getRepositoryToken(OrmUser),
          useValue: mockOrmRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    repository = module.get<UserReadRepository>(UserReadRepository);
    ormRepository = module.get(getRepositoryToken(OrmUser));
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('应该从缓存获取用户', async () => {
      const userId = new UserId(validUserId);
      const tenantId = new TenantId(validTenantId);
      const cacheKey = `user:${validTenantId}:${validUserId}`;

      cacheManager.get.mockResolvedValue(mockOrmUser);
      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(
        DomainUser.reconstitute({
          id: validUserId,
          email: validEmail,
          passwordHash: validBcryptHash,
          fullName: 'Test User',
          role: UserRole.USER,
          tenantId: validTenantId,
          isActive: true,
          isEmailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findById(userId, tenantId);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(ormRepository.findOne).not.toHaveBeenCalled();
      expect(UserMapper.toDomain).toHaveBeenCalledWith(mockOrmUser);
      expect(result).toBeDefined();
    });

    it('应该从数据库查询并缓存用户', async () => {
      const userId = new UserId(validUserId);
      const tenantId = new TenantId(validTenantId);
      const cacheKey = `user:${validTenantId}:${validUserId}`;

      cacheManager.get.mockResolvedValue(null);
      ormRepository.findOne.mockResolvedValue(mockOrmUser);
      cacheManager.set.mockResolvedValue(undefined);
      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(
        DomainUser.reconstitute({
          id: validUserId,
          email: validEmail,
          passwordHash: validBcryptHash,
          fullName: 'Test User',
          role: UserRole.USER,
          tenantId: validTenantId,
          isActive: true,
          isEmailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findById(userId, tenantId);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: validUserId,
          tenantId: validTenantId,
        },
        select: [
          'id',
          'email',
          'fullName',
          'role',
          'isActive',
          'isEmailVerified',
          'tenantId',
          'createdAt',
          'updatedAt',
        ],
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        mockOrmUser,
        5 * 60 * 1000,
      );
      expect(result).toBeDefined();
    });

    it('应该返回 null 当用户不存在时', async () => {
      const userId = new UserId(validUserId);
      const tenantId = new TenantId(validTenantId);
      const cacheKey = `user:${validTenantId}:${validUserId}`;

      cacheManager.get.mockResolvedValue(null);
      ormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById(userId, tenantId);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(ormRepository.findOne).toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('应该分页查询用户列表', async () => {
      const tenantIdVo = new TenantId(validTenantId);
      const params = {
        tenantId: validTenantId,
        page: 1,
        limit: 10,
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockOrmUser], 1]),
      };

      ormRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<OrmUser>,
      );
      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(
        DomainUser.reconstitute({
          id: validUserId,
          email: validEmail,
          passwordHash: validBcryptHash,
          fullName: 'Test User',
          role: UserRole.USER,
          tenantId: validTenantId,
          isActive: true,
          isEmailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await repository.findMany(params);

      expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.tenantId = :tenantId',
        { tenantId: validTenantId },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('应该支持 isActive 过滤', async () => {
      const params = {
        tenantId: validTenantId,
        page: 1,
        limit: 10,
        isActive: true,
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      ormRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<OrmUser>,
      );

      await repository.findMany(params);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.isActive = :isActive',
        { isActive: true },
      );
    });

    it('应该支持搜索条件', async () => {
      const params = {
        tenantId: validTenantId,
        page: 1,
        limit: 10,
        search: 'test',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      ormRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<OrmUser>,
      );

      await repository.findMany(params);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(user.email LIKE :search OR user.fullName LIKE :search)',
        { search: '%test%' },
      );
    });
  });

  describe('exists', () => {
    it('应该从缓存检查用户是否存在', async () => {
      const userId = new UserId(validUserId);
      const tenantId = new TenantId(validTenantId);
      const cacheKey = `user:${validTenantId}:${validUserId}`;

      cacheManager.get.mockResolvedValue(mockOrmUser);

      const result = await repository.exists(userId, tenantId);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(ormRepository.count).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('应该从数据库检查用户是否存在', async () => {
      const userId = new UserId(validUserId);
      const tenantId = new TenantId(validTenantId);
      const cacheKey = `user:${validTenantId}:${validUserId}`;

      cacheManager.get.mockResolvedValue(null);
      ormRepository.count.mockResolvedValue(1);

      const result = await repository.exists(userId, tenantId);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(ormRepository.count).toHaveBeenCalledWith({
        where: {
          id: validUserId,
          tenantId: validTenantId,
        },
      });
      expect(result).toBe(true);
    });

    it('应该返回 false 当用户不存在时', async () => {
      const userId = new UserId(validUserId);
      const tenantId = new TenantId(validTenantId);
      const cacheKey = `user:${validTenantId}:${validUserId}`;

      cacheManager.get.mockResolvedValue(null);
      ormRepository.count.mockResolvedValue(0);

      const result = await repository.exists(userId, tenantId);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(ormRepository.count).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
