import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * 刷新令牌实体
 *
 * 表示用户的刷新令牌信息，支持多设备登录。
 * 每个刷新令牌关联到特定用户，并包含设备信息和过期时间。
 *
 * **设计说明**：
 * - Token 列未建立索引：TEXT 类型在 MySQL 中需要指定键长度才能建立索引，TypeORM 不支持
 * - 支持级联删除：当用户被删除时，关联的刷新令牌也会被删除
 *
 * @class RefreshToken
 * @description 刷新令牌实体，映射到数据库 refresh_tokens 表
 */
@Entity('refresh_tokens')
export class RefreshToken {
  /**
   * 刷新令牌唯一标识符
   *
   * 使用 ULID 格式的主键。
   *
   * @type {string}
   */
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  /**
   * 刷新令牌哈希值
   *
   * 刷新令牌的 bcrypt 哈希值，不存储明文令牌。
   *
   * **注意**：该列未建立索引，因为 TEXT 类型在 MySQL 中需要指定键长度才能建立索引。
   *
   * @type {string}
   */
  @Column({ type: 'text' })
  token: string;

  /**
   * 用户 ID
   *
   * 关联的用户唯一标识符，已建立索引以优化查询性能。
   *
   * @type {string}
   */
  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  /**
   * 关联的用户
   *
   * 刷新令牌所属的用户实体。
   * 支持级联删除：当用户被删除时，关联的刷新令牌也会被删除。
   *
   * @type {User}
   */
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * 设备信息
   *
   * 登录设备的 User-Agent 信息，用于安全审计。
   *
   * @type {string | null}
   */
  @Column({ name: 'device_info', type: 'varchar', length: 255, nullable: true })
  deviceInfo: string | null;

  /**
   * IP 地址
   *
   * 登录时的 IP 地址，用于安全审计。
   * 支持 IPv4 和 IPv6（最大长度 45 个字符）。
   *
   * @type {string | null}
   */
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  /**
   * 租户 ID
   *
   * 用于多租户数据隔离，提升查询性能。
   * RefreshToken 通过 User 关联租户，但为了查询性能也添加 tenantId 字段。
   *
   * @type {string}
   */
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  @Index()
  tenantId: string;

  /**
   * 过期时间
   *
   * 刷新令牌的过期时间戳。
   *
   * @type {Date}
   */
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  /**
   * 创建时间
   *
   * 刷新令牌的创建时间戳。
   *
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 更新时间
   *
   * 刷新令牌最后更新的时间戳。
   *
   * @type {Date}
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
