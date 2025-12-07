import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Permission } from './permission.entity';
import { Tenant } from './tenant.entity';

/**
 * 角色实体
 *
 * 表示系统中的角色信息，用于基于角色的访问控制（RBAC）。
 *
 * @class Role
 * @description 角色实体，映射到数据库 roles 表
 */
@Entity('roles')
@Unique(['tenantId', 'name'])
export class Role {
  /**
   * 角色唯一标识符
   *
   * 使用 UUID 格式自动生成的主键。
   *
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 角色名称
   *
   * 角色的唯一标识名称，用于 Casbin 策略中的角色定义。
   * 例如：'admin'、'user'、'manager'
   * 注意：唯一性约束在租户级别（tenantId + name 唯一）
   *
   * @type {string}
   */
  @Column({ length: 50 })
  name: string;

  /**
   * 角色显示名称
   *
   * 角色的友好显示名称，用于用户界面展示。
   *
   * @type {string}
   */
  @Column({ name: 'display_name', length: 100, nullable: true })
  displayName?: string;

  /**
   * 角色描述
   *
   * 角色的详细描述，说明角色的用途和权限范围。
   *
   * @type {string}
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * 是否激活
   *
   * 标识角色是否处于激活状态。
   * 非激活的角色不能分配给用户。
   *
   * @type {boolean}
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * 租户 ID
   *
   * 用于多租户数据隔离，所有查询和操作都会自动限制在当前租户范围内。
   *
   * @type {string}
   */
  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  /**
   * 关联的租户
   *
   * 角色所属的租户实体。
   *
   * @type {Tenant}
   */
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  /**
   * 创建时间
   *
   * 角色创建的时间戳。
   *
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 关联的权限
   *
   * 此角色拥有的所有权限（多对多关系）。
   *
   * @type {Permission[]}
   */
  @ManyToMany(() => Permission, (permission) => permission.roles)
  permissions: Permission[];

  /**
   * 更新时间
   *
   * 角色最后更新的时间戳。
   *
   * @type {Date}
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
