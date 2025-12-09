import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import {
  User as DomainUser,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import { UserMapper } from '../../mappers/user.mapper';
import { User as OrmUser } from '../entities/user.entity';
import { UserProfileRepository } from './user-profile.repository';

/**
 * 用户资料仓储单元测试
 *
 * 测试 UserProfileRepository 的所有方法。
 *
 * @describe UserProfileRepository
 */
describe('UserProfileRepository', () => {
  let repository: UserProfileRepository;
  let ormRepository: jest.Mocked<Repository<OrmUser>>;

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
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileRepository,
        {
          provide: getRepositoryToken(OrmUser),
          useValue: mockOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UserProfileRepository>(UserProfileRepository);
    ormRepository = module.get(getRepositoryToken(OrmUser));
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('应该根据ID和租户ID查找用户', async () => {
      const userId = new UserId(validUserId);
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(mockOrmUser);
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

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: validUserId,
          tenantId: validTenantId,
        },
      });
      expect(UserMapper.toDomain).toHaveBeenCalledWith(mockOrmUser);
      expect(result).toBeDefined();
      expect(result?.id.toString()).toBe(validUserId);
    });

    it('应该返回 null 当用户不存在时', async () => {
      const userId = new UserId(validUserId);
      const tenantId = new TenantId(validTenantId);

      ormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById(userId, tenantId);

      expect(ormRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('应该更新已存在的用户', async () => {
      const domainUser = DomainUser.reconstitute({
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
      });

      const existingEntity = { ...mockOrmUser } as OrmUser;
      ormRepository.findOne.mockResolvedValue(existingEntity);
      jest.spyOn(UserMapper, 'toOrm').mockReturnValue(mockOrmUser);
      jest.spyOn(UserMapper, 'updateOrm').mockImplementation(() => {});
      ormRepository.save.mockResolvedValue(mockOrmUser);

      await repository.save(domainUser);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: validUserId },
      });
      expect(UserMapper.toOrm).toHaveBeenCalledWith(domainUser);
      expect(UserMapper.updateOrm).toHaveBeenCalledWith(
        existingEntity,
        domainUser,
      );
      expect(ormRepository.save).toHaveBeenCalledWith(existingEntity);
    });

    it('应该创建新用户', async () => {
      const domainUser = DomainUser.reconstitute({
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
      });

      ormRepository.findOne.mockResolvedValue(null);
      jest.spyOn(UserMapper, 'toOrm').mockReturnValue(mockOrmUser);
      ormRepository.save.mockResolvedValue(mockOrmUser);

      await repository.save(domainUser);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: validUserId },
      });
      expect(UserMapper.toOrm).toHaveBeenCalledWith(domainUser);
      expect(ormRepository.save).toHaveBeenCalledWith(mockOrmUser);
    });
  });

  describe('delete', () => {
    it('应该软删除用户', async () => {
      const userId = new UserId(validUserId);
      const tenantId = new TenantId(validTenantId);

      ormRepository.update.mockResolvedValue({ affected: 1 } as any);

      await repository.delete(userId, tenantId);

      expect(ormRepository.update).toHaveBeenCalledWith(
        {
          id: validUserId,
          tenantId: validTenantId,
        },
        {
          isActive: false,
        },
      );
    });
  });
});
