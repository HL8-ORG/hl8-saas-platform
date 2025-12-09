import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { Tenant } from './tenant.entity';

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
 * 用户实体
 *
 * 表示系统中的用户信息，包含用户的基本信息、认证信息和关联的刷新令牌。
 *
 * @class User
 * @description 用户实体，映射到数据库 users 表
 */
@Entity('users')
export class User {
  /**
   * 用户唯一标识符
   *
   * 使用 ULID 格式的主键。
   *
   * @type {string}
   */
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  /**
   * 用户全名
   *
   * 用户的完整姓名，最大长度 100 个字符。
   *
   * @type {string}
   */
  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  /**
   * 用户邮箱地址
   *
   * 用户的邮箱地址，必须唯一，作为登录凭证之一。
   * 最大长度 100 个字符。
   *
   * @type {string}
   */
  @Column({ unique: true, length: 100 })
  email: string;

  /**
   * 密码哈希值
   *
   * 用户密码的 bcrypt 哈希值，不存储明文密码。
   *
   * @type {string}
   */
  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  /**
   * 用户角色
   *
   * 用户的角色，默认为 USER。
   *
   * @type {UserRole}
   */
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  /**
   * 刷新令牌
   *
   * 用户当前的刷新令牌（已废弃，保留用于兼容性）。
   * 新的实现使用 RefreshToken 实体管理多个刷新令牌。
   *
   * @type {string | null}
   * @deprecated 使用 refreshTokens 关联关系代替
   */
  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string | null;

  /**
   * 是否激活
   *
   * 标识用户账户是否处于激活状态。
   * 非激活用户无法登录。
   *
   * @type {boolean}
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * 邮箱是否已验证
   *
   * 标识用户的邮箱是否已完成验证流程。
   * 未验证的用户可能无法访问某些受保护的功能。
   *
   * @type {boolean}
   */
  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  /**
   * 邮箱验证码
   *
   * 用于验证邮箱的 6 位数字验证码。
   * 验证成功后此字段将被清除。
   *
   * @type {string | null}
   */
  @Column({
    name: 'email_verification_code',
    type: 'varchar',
    length: 6,
    nullable: true,
  })
  emailVerificationCode: string | null;

  /**
   * 邮箱验证码过期时间
   *
   * 验证码的有效期限，超过此时间后验证码失效。
   * 验证成功后此字段将被清除。
   *
   * @type {Date | null}
   */
  @Column({
    name: 'email_verification_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  emailVerificationExpiresAt: Date | null;

  /**
   * 租户 ID
   *
   * 用于多租户数据隔离，所有查询和操作都会自动限制在当前租户范围内。
   *
   * @type {string}
   */
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  @Index()
  tenantId: string;

  /**
   * 关联的租户
   *
   * 用户所属的租户实体。
   *
   * @type {Tenant}
   */
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  /**
   * 刷新令牌列表
   *
   * 用户关联的所有刷新令牌（支持多设备登录）。
   *
   * @type {RefreshToken[]}
   */
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  /**
   * 创建时间
   *
   * 用户账户的创建时间戳。
   *
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  /**
   * 更新时间
   *
   * 用户账户最后更新的时间戳。
   *
   * @type {Date}
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
