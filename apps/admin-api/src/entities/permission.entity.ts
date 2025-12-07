import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Tenant } from './tenant.entity';

/**
 * 权限实体
 *
 * 表示系统中的权限信息，用于基于角色的访问控制（RBAC）。
 * 权限由资源和操作组成，例如：'user' + 'read:any' = 读取任何用户的权限。
 *
 * @class Permission
 * @description 权限实体，映射到数据库 permissions 表
 */
@Entity('permissions')
@Unique(['tenantId', 'resource', 'action'])
export class Permission {
  /**
   * 权限唯一标识符
   *
   * 使用 UUID 格式自动生成的主键。
   *
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 资源标识符
   *
   * 用于标识权限控制的目标资源，这是业务层面的概念，不是数据库表名。
   * 可以是：
   * - 资源组：如 'user'（用户资源组）、'role'（角色资源组）
   * - 具体资源：如 'user_roles'（用户角色）、'user_permissions'（用户权限）、'users_list'（用户列表）
   *
   * **注意**：resource 与数据库表名的对应关系：
   * - 'user' 对应 users 表（User 实体）
   * - 'role' 对应 roles 表（Role 实体）
   * - 'user_roles' 是业务概念，可能涉及 users 和 roles 两个表的关系
   * - 'users_list' 是业务概念，表示用户列表这个功能点
   *
   * @type {string}
   *
   * @example
   * - 'user' - 用户资源组
   * - 'role' - 角色资源组
   * - 'user_roles' - 用户角色关联
   * - 'user_permissions' - 用户权限查询
   * - 'users_list' - 用户列表功能
   */
  @Column({ type: 'varchar', length: 100 })
  resource: string;

  /**
   * 操作类型
   *
   * 定义对资源的操作类型，格式通常为 '动作:所有权'。
   * 例如：'read:any'、'read:own'、'create:any'、'update:own'、'delete:any'
   *
   * @type {string}
   *
   * @example
   * - 'read:any' - 读取任何资源
   * - 'read:own' - 只读取自己的资源
   * - 'create:any' - 创建任何资源
   * - 'update:own' - 只更新自己的资源
   * - 'delete:any' - 删除任何资源
   */
  @Column({ type: 'varchar', length: 50 })
  action: string;

  /**
   * 权限描述
   *
   * 权限的详细描述，说明权限的用途和范围。
   *
   * @type {string | undefined}
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  description?: string;

  /**
   * 租户 ID
   *
   * 用于多租户数据隔离，所有查询和操作都会自动限制在当前租户范围内。
   *
   * @type {string}
   */
  @Column({
    name: 'tenant_id',
    type: 'uuid',
  })
  @Index()
  tenantId: string;

  /**
   * 关联的租户
   *
   * 权限所属的租户实体。
   *
   * @type {Tenant}
   */
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  /**
   * 关联的角色
   *
   * 拥有此权限的所有角色（多对多关系）。
   *
   * @type {Role[]}
   */
  @ManyToMany(() => Role, (role) => role.permissions)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  /**
   * 创建时间
   *
   * 权限创建的时间戳。
   *
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 更新时间
   *
   * 权限最后更新的时间戳。
   *
   * @type {Date}
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
