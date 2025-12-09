import {
  User as DomainUser,
  UserRole,
} from '../../../domain/users/entities/user.aggregate';
import { User as OrmUser } from '../typeorm/entities/user.entity';

/**
 * 用户映射器
 *
 * 负责领域模型和ORM实体之间的映射转换。
 * 遵循Clean Architecture原则，领域层不依赖基础设施层。
 *
 * @class UserMapper
 * @description 用户领域模型 ↔ ORM实体映射器
 */
export class UserMapper {
  /**
   * 将ORM实体转换为领域聚合根
   *
   * 从数据库ORM实体重构领域聚合根。
   *
   * @static
   * @param {OrmUser} ormEntity - ORM实体
   * @returns {DomainUser} 领域聚合根
   *
   * @example
   * ```typescript
   * const domainUser = UserMapper.toDomain(ormUser);
   * ```
   */
  static toDomain(ormEntity: OrmUser): DomainUser {
    return DomainUser.reconstitute({
      id: ormEntity.id,
      email: ormEntity.email,
      passwordHash: ormEntity.passwordHash,
      fullName: ormEntity.fullName,
      role: ormEntity.role as UserRole,
      tenantId: ormEntity.tenantId,
      isActive: ormEntity.isActive,
      isEmailVerified: ormEntity.isEmailVerified,
      emailVerificationCode: ormEntity.emailVerificationCode,
      emailVerificationExpiresAt: ormEntity.emailVerificationExpiresAt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  /**
   * 将领域聚合根转换为ORM实体数据
   *
   * 将领域聚合根转换为ORM实体可以使用的数据对象。
   *
   * @static
   * @param {DomainUser} domainEntity - 领域聚合根
   * @returns {Partial<OrmUser>} ORM实体数据对象
   *
   * @example
   * ```typescript
   * const ormData = UserMapper.toOrm(domainUser);
   * ```
   */
  static toOrm(domainEntity: DomainUser): Partial<OrmUser> {
    const data: Partial<OrmUser> = {
      id: domainEntity.id.toString(),
      email: domainEntity.email.value,
      passwordHash: domainEntity.passwordHash.value,
      fullName: domainEntity.fullName,
      role: domainEntity.role,
      tenantId: domainEntity.tenantId.toString(),
      isActive: domainEntity.isActive,
      isEmailVerified: domainEntity.isEmailVerified,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };

    // 处理验证码
    if (domainEntity.emailVerificationCode) {
      data.emailVerificationCode = domainEntity.emailVerificationCode.value;
      data.emailVerificationExpiresAt =
        domainEntity.emailVerificationCode.expiresAt;
    } else {
      data.emailVerificationCode = null;
      data.emailVerificationExpiresAt = null;
    }

    return data;
  }

  /**
   * 更新ORM实体
   *
   * 使用领域聚合根的数据更新ORM实体。
   *
   * @static
   * @param {OrmUser} ormEntity - 要更新的ORM实体
   * @param {DomainUser} domainEntity - 领域聚合根
   * @returns {void}
   *
   * @example
   * ```typescript
   * UserMapper.updateOrm(ormUser, domainUser);
   * ```
   */
  static updateOrm(ormEntity: OrmUser, domainEntity: DomainUser): void {
    const data = UserMapper.toOrm(domainEntity);

    ormEntity.email = data.email!;
    ormEntity.passwordHash = data.passwordHash!;
    ormEntity.fullName = data.fullName!;
    ormEntity.role = data.role!;
    ormEntity.tenantId = data.tenantId!;
    ormEntity.isActive = data.isActive!;
    ormEntity.isEmailVerified = data.isEmailVerified!;
    ormEntity.emailVerificationCode = data.emailVerificationCode ?? null;
    ormEntity.emailVerificationExpiresAt =
      data.emailVerificationExpiresAt ?? null;
    ormEntity.updatedAt = data.updatedAt!;
  }
}
