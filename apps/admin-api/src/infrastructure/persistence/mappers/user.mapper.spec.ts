import { Email } from '../../../domain/auth/value-objects/email.vo';
import { PasswordHash } from '../../../domain/auth/value-objects/password-hash.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';
import {
  User as DomainUser,
  UserRole,
} from '../../../domain/users/entities/user.aggregate';
import { User as OrmUser } from '../typeorm/entities/user.entity';
import { UserMapper } from './user.mapper';

/**
 * 用户映射器单元测试
 *
 * 测试用户领域实体和 ORM 实体之间的映射。
 *
 * @describe UserMapper
 */
describe('UserMapper', () => {
  const validBcryptHash =
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqBWVHxkd0';
  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  describe('toDomain', () => {
    it('应该将 ORM 实体转换为领域实体', () => {
      const ormUser: OrmUser = {
        id: validUserId,
        email: 'test@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: null,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        refreshTokens: [],
      };

      const domainUser = UserMapper.toDomain(ormUser);

      expect(domainUser).toBeInstanceOf(DomainUser);
      expect(domainUser.id.toString()).toBe(validUserId);
      expect(domainUser.email.value).toBe('test@example.com');
      expect(domainUser.fullName).toBe('Test User');
      expect(domainUser.role).toBe(UserRole.USER);
      expect(domainUser.isActive).toBe(true);
      expect(domainUser.isEmailVerified).toBe(false);
      expect(domainUser.tenantId.toString()).toBe(validTenantId);
    });

    it('应该处理管理员角色', () => {
      const ormUser: OrmUser = {
        id: validUserId,
        email: 'admin@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Admin User',
        role: UserRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        refreshTokens: [],
      };

      const domainUser = UserMapper.toDomain(ormUser);

      expect(domainUser.role).toBe(UserRole.ADMIN);
      expect(domainUser.isEmailVerified).toBe(true);
    });

    it('应该处理未激活用户', () => {
      const ormUser: OrmUser = {
        id: validUserId,
        email: 'inactive@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Inactive User',
        role: UserRole.USER,
        isActive: false,
        isEmailVerified: false,
        emailVerificationCode: null,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        refreshTokens: [],
      };

      const domainUser = UserMapper.toDomain(ormUser);

      expect(domainUser.isActive).toBe(false);
    });
  });

  describe('toOrm', () => {
    it('应该将领域实体转换为 ORM 实体', () => {
      const email = new Email('test@example.com');
      const passwordHash = new PasswordHash(validBcryptHash);
      const tenantId = new TenantId(validTenantId);
      const userId = new UserId(validUserId);

      const domainUser = DomainUser.reconstitute({
        id: validUserId,
        email: 'test@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: null,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const ormUser = UserMapper.toOrm(domainUser);

      expect(ormUser.id).toBe(validUserId);
      expect(ormUser.email).toBe('test@example.com');
      expect(ormUser.passwordHash).toBe(validBcryptHash);
      expect(ormUser.fullName).toBe('Test User');
      expect(ormUser.role).toBe(UserRole.USER);
      expect(ormUser.isActive).toBe(true);
      expect(ormUser.isEmailVerified).toBe(false);
      expect(ormUser.tenantId).toBe(validTenantId);
    });

    it('应该处理所有用户属性', () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
      const domainUser = DomainUser.reconstitute({
        id: validUserId,
        email: 'admin@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Admin User',
        role: UserRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: '123456',
        emailVerificationExpiresAt: expiresAt,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      const ormUser = UserMapper.toOrm(domainUser);

      expect(ormUser.role).toBe(UserRole.ADMIN);
      expect(ormUser.isEmailVerified).toBe(true);
      expect(ormUser.emailVerificationCode).toBe('123456');
      expect(ormUser.emailVerificationExpiresAt).toEqual(expiresAt);
    });
  });

  describe('往返转换', () => {
    it('应该能够往返转换（ORM -> Domain -> ORM）', () => {
      const originalOrm: OrmUser = {
        id: validUserId,
        email: 'test@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: null,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        refreshTokens: [],
      };

      const domain = UserMapper.toDomain(originalOrm);
      const convertedOrm = UserMapper.toOrm(domain);

      expect(convertedOrm.id).toBe(originalOrm.id);
      expect(convertedOrm.email).toBe(originalOrm.email);
      expect(convertedOrm.passwordHash).toBe(originalOrm.passwordHash);
      expect(convertedOrm.fullName).toBe(originalOrm.fullName);
      expect(convertedOrm.role).toBe(originalOrm.role);
      expect(convertedOrm.isActive).toBe(originalOrm.isActive);
      expect(convertedOrm.isEmailVerified).toBe(originalOrm.isEmailVerified);
      expect(convertedOrm.tenantId).toBe(originalOrm.tenantId);
    });

    it('应该能够往返转换（Domain -> ORM -> Domain）', () => {
      const originalDomain = DomainUser.reconstitute({
        id: validUserId,
        email: 'test@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: null,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const orm = UserMapper.toOrm(originalDomain);
      const convertedDomain = UserMapper.toDomain(orm);

      expect(convertedDomain.id.toString()).toBe(originalDomain.id.toString());
      expect(convertedDomain.email.value).toBe(originalDomain.email.value);
      expect(convertedDomain.fullName).toBe(originalDomain.fullName);
      expect(convertedDomain.role).toBe(originalDomain.role);
      expect(convertedDomain.isActive).toBe(originalDomain.isActive);
      expect(convertedDomain.isEmailVerified).toBe(
        originalDomain.isEmailVerified,
      );
      expect(convertedDomain.tenantId.toString()).toBe(
        originalDomain.tenantId.toString(),
      );
    });
  });
});
