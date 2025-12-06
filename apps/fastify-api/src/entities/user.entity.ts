import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

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
   * 使用 UUID 格式自动生成的主键。
   *
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
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
