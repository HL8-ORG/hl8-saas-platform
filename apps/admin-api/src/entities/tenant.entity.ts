import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 租户实体
 *
 * 表示系统中的租户（组织/公司）信息。
 * 每个租户拥有独立的数据空间，通过 tenant_id 字段实现数据隔离。
 *
 * @class Tenant
 * @description 租户实体，映射到数据库 tenants 表
 */
@Entity('tenants')
export class Tenant {
  /**
   * 租户唯一标识符
   *
   * 使用 UUID 格式自动生成的主键。
   *
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 租户名称
   *
   * 租户的显示名称，必须唯一。
   *
   * @type {string}
   */
  @Column({ unique: true, length: 100 })
  name: string;

  /**
   * 租户域名
   *
   * 租户的子域名，用于基于域名的租户识别（可选）。
   * 例如：'acme' 对应 'acme.example.com'
   *
   * @type {string | undefined}
   */
  @Column({ unique: true, length: 255, nullable: true })
  @Index()
  domain?: string;

  /**
   * 是否激活
   *
   * 标识租户是否处于激活状态。
   * 非激活的租户无法访问系统。
   *
   * @type {boolean}
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * 创建时间
   *
   * 租户创建的时间戳。
   *
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 更新时间
   *
   * 租户最后更新的时间戳。
   *
   * @type {Date}
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
