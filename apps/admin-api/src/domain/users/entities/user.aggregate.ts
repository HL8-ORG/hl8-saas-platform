import { AggregateRoot } from '@/core/entities';
import {
  EmailVerifiedEvent,
  PasswordChangedEvent,
  ProfileUpdatedEvent,
  UserActivatedEvent,
  UserDeactivatedEvent,
  UserRegisteredEvent,
  VerificationCodeResentEvent,
} from '../../auth/events';
import { Email } from '../../auth/value-objects/email.vo';
import { PasswordHash } from '../../auth/value-objects/password-hash.vo';
import { VerificationCode } from '../../auth/value-objects/verification-code.vo';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { UserId } from '../../shared/value-objects/user-id.vo';

/**
 * 用户角色枚举
 *
 * 定义系统中可用的用户角色。
 *
 * @enum {string} UserRole
 */
export enum UserRole {
  /** 普通用户角色 */
  USER = 'USER',
  /** 管理员角色 */
  ADMIN = 'ADMIN',
}

/**
 * 用户属性接口
 *
 * 定义用户聚合根的所有属性，用于 Entity 基类的泛型参数。
 *
 * @interface UserProps
 */
interface UserProps {
  /** 用户ID */
  id: UserId;
  /** 用户邮箱 */
  email: Email;
  /** 密码哈希 */
  passwordHash: PasswordHash;
  /** 用户全名 */
  fullName: string;
  /** 用户角色 */
  role: UserRole;
  /** 是否激活 */
  isActive: boolean;
  /** 邮箱是否已验证 */
  isEmailVerified: boolean;
  /** 邮箱验证码 */
  emailVerificationCode: VerificationCode | null;
  /** 租户ID */
  tenantId: TenantId;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 用户聚合根
 *
 * 用户领域的聚合根，包含用户的核心业务逻辑。
 * 遵循充血模型，所有业务规则都在聚合根内部实现。
 * 继承 AggregateRoot 基类，支持领域事件发布。
 *
 * **业务规则**：
 * - 用户创建时必须提供邮箱、密码、全名和租户ID
 * - 邮箱在租户内必须唯一
 * - 新用户默认未验证邮箱
 * - 新用户默认状态为激活
 *
 * **事件发布**：
 * - 使用 `this.apply(event)` 应用领域事件
 * - 在应用层调用 `user.commit()` 发布事件到事件总线
 *
 * @class User
 * @extends {AggregateRoot<UserProps>}
 * @description 用户聚合根，包含用户的核心业务逻辑
 */
export class User extends AggregateRoot<UserProps> {
  /**
   * 私有构造函数
   *
   * 防止直接实例化，必须通过静态工厂方法创建。
   *
   * @private
   * @param {UserProps} props - 用户属性对象
   */
  private constructor(props: UserProps) {
    super(props);
  }

  /**
   * 创建新用户
   *
   * 工厂方法，创建新的用户聚合根实例。
   * 自动生成用户ID（使用ULID），设置默认值并发布用户注册事件。
   *
   * @static
   * @param {Email} email - 邮箱
   * @param {PasswordHash} passwordHash - 密码哈希
   * @param {string} fullName - 全名
   * @param {UserRole} role - 角色，默认为 USER
   * @param {TenantId} tenantId - 租户ID
   * @returns {User} 新创建的用户聚合根
   *
   * @example
   * ```typescript
   * const email = new Email('user@example.com');
   * const passwordHash = new PasswordHash(hashedPassword);
   * const tenantId = new TenantId('tenant-id');
   * const user = User.create(email, passwordHash, 'John Doe', UserRole.USER, tenantId);
   * ```
   */
  static create(
    email: Email,
    passwordHash: PasswordHash,
    fullName: string,
    role: UserRole,
    tenantId: TenantId,
  ): User {
    // 自动生成用户ID（使用ULID）
    const userId = UserId.generate();
    const now = new Date();

    // 生成邮箱验证码
    const verificationCode = VerificationCode.generate();

    const user = new User({
      id: userId,
      email,
      passwordHash,
      fullName,
      role: role || UserRole.USER,
      isActive: true,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      tenantId,
      createdAt: now,
      updatedAt: now,
    });

    // 发布用户注册事件
    const event = new UserRegisteredEvent(
      userId.toString(),
      email.value,
      fullName,
      role || UserRole.USER,
      verificationCode.value,
      tenantId.toString(),
    );
    user.apply(event);

    return user;
  }

  /**
   * 重构现有用户
   *
   * 从持久化存储重构用户聚合根实例。
   * 用于从数据库加载现有用户。
   *
   * @static
   * @param {object} props - 用户属性
   * @returns {User} 重构的用户聚合根
   */
  static reconstitute(props: {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: UserRole;
    tenantId: string;
    isActive: boolean;
    isEmailVerified: boolean;
    emailVerificationCode: string | null;
    emailVerificationExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const userProps: UserProps = {
      id: new UserId(props.id),
      email: new Email(props.email),
      passwordHash: new PasswordHash(props.passwordHash),
      fullName: props.fullName,
      role: props.role,
      isActive: props.isActive,
      isEmailVerified: props.isEmailVerified,
      emailVerificationCode:
        props.emailVerificationCode && props.emailVerificationExpiresAt
          ? new VerificationCode(
              props.emailVerificationCode,
              props.emailVerificationExpiresAt,
            )
          : null,
      tenantId: new TenantId(props.tenantId),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    return new User(userProps);
  }

  // Getter 方法 - 通过 props 访问属性
  get id(): UserId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): PasswordHash {
    return this.props.passwordHash;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get emailVerificationCode(): VerificationCode | null {
    return this.props.emailVerificationCode;
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * 验证邮箱
   *
   * 使用验证码验证用户邮箱。
   *
   * @param {string} code - 验证码
   * @throws {Error} 当验证码无效或已过期时抛出异常
   */
  verifyEmail(code: string): void {
    if (this.props.isEmailVerified) {
      throw new Error('邮箱已经验证过了');
    }

    if (!this.props.emailVerificationCode) {
      throw new Error('验证码不存在，请重新申请');
    }

    if (this.props.emailVerificationCode.isExpired()) {
      throw new Error('验证码已过期，请重新申请');
    }

    if (!this.props.emailVerificationCode.verify(code)) {
      throw new Error('验证码错误');
    }

    this.props.isEmailVerified = true;
    this.props.emailVerificationCode = null;
    this.props.updatedAt = new Date();

    // 发布邮箱已验证事件
    const event = new EmailVerifiedEvent(
      this.props.id.toString(),
      this.props.email.value,
      this.props.tenantId.toString(),
    );
    this.apply(event);
  }

  /**
   * 重发验证码
   *
   * 生成新的邮箱验证码并发布验证码重发事件。
   */
  resendVerificationCode(): void {
    if (this.props.isEmailVerified) {
      throw new Error('邮箱已经验证过了，无需重新发送验证码');
    }

    const newCode = VerificationCode.generate();
    this.props.emailVerificationCode = newCode;
    this.props.updatedAt = new Date();

    // 发布验证码重发事件
    const event = new VerificationCodeResentEvent(
      this.props.id.toString(),
      this.props.email.value,
      newCode.value,
      this.props.tenantId.toString(),
    );
    this.apply(event);
  }

  /**
   * 修改密码
   *
   * 更新用户的密码哈希值。
   *
   * @param {PasswordHash} newPasswordHash - 新的密码哈希值
   * @throws {Error} 当新密码哈希与当前密码相同时抛出异常
   */
  changePassword(newPasswordHash: PasswordHash): void {
    if (this.props.passwordHash.equals(newPasswordHash)) {
      throw new Error('新密码不能与当前密码相同');
    }

    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = new Date();

    // 发布密码修改事件
    const event = new PasswordChangedEvent(
      this.props.id.toString(),
      this.props.tenantId.toString(),
    );
    this.apply(event);
  }

  /**
   * 停用用户
   *
   * 将用户账户设置为非激活状态。
   *
   * @throws {Error} 当用户已经是非激活状态时抛出异常
   */
  deactivate(): void {
    if (!this.props.isActive) {
      throw new Error('用户已经处于非激活状态');
    }

    this.props.isActive = false;
    this.props.updatedAt = new Date();

    // 发布用户停用事件
    const event = new UserDeactivatedEvent(
      this.props.id.toString(),
      this.props.email.value,
      this.props.tenantId.toString(),
    );
    this.apply(event);
  }

  /**
   * 激活用户
   *
   * 将用户账户设置为激活状态。
   *
   * @throws {Error} 当用户已经是激活状态时抛出异常
   */
  activate(): void {
    if (this.props.isActive) {
      throw new Error('用户已经处于激活状态');
    }

    this.props.isActive = true;
    this.props.updatedAt = new Date();

    // 发布用户激活事件
    const event = new UserActivatedEvent(
      this.props.id.toString(),
      this.props.email.value,
      this.props.tenantId.toString(),
    );
    this.apply(event);
  }

  /**
   * 更新用户资料
   *
   * 更新用户的全名等信息。
   *
   * @param {string} fullName - 新的全名
   * @returns {string[]} 更新的字段列表
   * @throws {Error} 当全名为空时抛出异常
   */
  updateProfile(fullName: string): string[] {
    const updatedFields: string[] = [];

    if (
      !fullName ||
      typeof fullName !== 'string' ||
      fullName.trim().length === 0
    ) {
      throw new Error('全名不能为空');
    }

    if (this.props.fullName !== fullName.trim()) {
      this.props.fullName = fullName.trim();
      updatedFields.push('fullName');
    }

    if (updatedFields.length > 0) {
      this.props.updatedAt = new Date();

      // 发布资料更新事件
      const event = new ProfileUpdatedEvent(
        this.props.id.toString(),
        updatedFields,
        this.props.tenantId.toString(),
      );
      this.apply(event);
    }

    return updatedFields;
  }
}
