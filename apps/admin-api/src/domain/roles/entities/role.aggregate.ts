import { AggregateRoot } from '@/core/entities';
import { RoleId } from '../../shared/value-objects/role-id.vo';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import {
  RoleActivatedEvent,
  RoleCreatedEvent,
  RoleDeactivatedEvent,
  RoleDeletedEvent,
  RolePermissionGrantedEvent,
  RolePermissionRevokedEvent,
  RoleUpdatedEvent,
} from '../events';
import { RoleName } from '../value-objects/role-name.vo';

/**
 * 角色属性接口
 *
 * 定义角色聚合根的所有属性，用于 Entity 基类的泛型参数。
 *
 * @interface RoleProps
 */
interface RoleProps {
  /** 角色ID */
  id: RoleId;
  /** 角色名称 */
  name: RoleName;
  /** 角色显示名称 */
  displayName: string;
  /** 角色描述 */
  description: string | null;
  /** 是否激活 */
  isActive: boolean;
  /** 租户ID */
  tenantId: TenantId;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 角色聚合根
 *
 * 角色领域的聚合根，包含角色的核心业务逻辑。
 * 遵循充血模型，所有业务规则都在聚合根内部实现。
 * 继承 AggregateRoot 基类，支持领域事件发布。
 *
 * **业务规则**：
 * - 角色创建时必须提供名称和租户ID
 * - 角色名称在租户内必须唯一
 * - 新角色默认状态为激活
 *
 * **事件发布**：
 * - 使用 `this.apply(event)` 应用领域事件
 * - 在应用层调用 `role.commit()` 发布事件到事件总线
 *
 * @class Role
 * @extends {AggregateRoot<RoleProps>}
 * @description 角色聚合根，包含角色的核心业务逻辑
 */
export class Role extends AggregateRoot<RoleProps> {
  /**
   * 私有构造函数
   *
   * 防止直接实例化，必须通过静态工厂方法创建。
   *
   * @private
   * @param {RoleProps} props - 角色属性对象
   */
  private constructor(props: RoleProps) {
    super(props);
  }

  /**
   * 创建新角色
   *
   * 工厂方法，创建新的角色聚合根实例。
   * 自动生成角色ID（使用ULID），设置默认值并发布角色创建事件。
   *
   * @static
   * @param {RoleName} name - 角色名称
   * @param {TenantId} tenantId - 租户ID
   * @param {string} [displayName] - 显示名称，默认为name
   * @param {string} [description] - 描述
   * @param {boolean} [isActive=true] - 是否激活，默认为 true
   * @returns {Role} 新创建的角色聚合根
   *
   * @example
   * ```typescript
   * const name = new RoleName('admin');
   * const tenantId = new TenantId('tenant-id');
   * const role = Role.create(name, tenantId, 'Administrator', '管理员角色');
   * ```
   */
  static create(
    name: RoleName,
    tenantId: TenantId,
    displayName?: string,
    description?: string,
    isActive: boolean = true,
  ): Role {
    // 自动生成角色ID（使用ULID）
    const roleId = RoleId.generate();
    const now = new Date();

    const role = new Role({
      id: roleId,
      name,
      displayName: displayName || name.value,
      description: description || null,
      isActive,
      tenantId,
      createdAt: now,
      updatedAt: now,
    });

    // 发布角色创建事件
    const event = new RoleCreatedEvent(roleId.toString(), tenantId, name.value);
    role.apply(event);

    return role;
  }

  /**
   * 重构现有角色
   *
   * 从持久化存储重构角色聚合根实例。
   * 用于从数据库加载现有角色。
   *
   * @static
   * @param {object} props - 角色属性
   * @returns {Role} 重构的角色聚合根
   */
  static reconstitute(props: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    isActive: boolean;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Role {
    const roleProps: RoleProps = {
      id: new RoleId(props.id),
      name: new RoleName(props.name),
      displayName: props.displayName,
      description: props.description,
      isActive: props.isActive,
      tenantId: new TenantId(props.tenantId),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    return new Role(roleProps);
  }

  // Getter 方法 - 通过 props 访问属性
  get id(): RoleId {
    return this.props.id;
  }

  get name(): RoleName {
    return this.props.name;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get description(): string | null {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
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
   * 更新角色信息
   *
   * 更新角色的显示名称和描述。
   *
   * @param {string} [displayName] - 新的显示名称
   * @param {string | null} [description] - 新的描述
   * @returns {string[]} 更新的字段列表
   */
  update(displayName?: string, description?: string | null): string[] {
    const updatedFields: string[] = [];

    if (displayName !== undefined && displayName !== this.props.displayName) {
      this.props.displayName = displayName;
      updatedFields.push('displayName');
    }

    if (description !== undefined && description !== this.props.description) {
      this.props.description = description;
      updatedFields.push('description');
    }

    if (updatedFields.length > 0) {
      this.props.updatedAt = new Date();

      // 发布角色更新事件
      const event = new RoleUpdatedEvent(
        this.props.id.toString(),
        this.props.tenantId,
        updatedFields,
      );
      this.apply(event);
    }

    return updatedFields;
  }

  /**
   * 激活角色
   *
   * 将角色设置为激活状态。
   *
   * @throws {Error} 当角色已经是激活状态时抛出异常
   */
  activate(): void {
    if (this.props.isActive) {
      throw new Error('角色已经处于激活状态');
    }

    this.props.isActive = true;
    this.props.updatedAt = new Date();

    // 发布角色激活事件
    const event = new RoleActivatedEvent(
      this.props.id.toString(),
      this.props.tenantId,
      this.props.name.value,
    );
    this.apply(event);
  }

  /**
   * 停用角色
   *
   * 将角色设置为非激活状态。
   *
   * @throws {Error} 当角色已经是非激活状态时抛出异常
   */
  deactivate(): void {
    if (!this.props.isActive) {
      throw new Error('角色已经处于非激活状态');
    }

    this.props.isActive = false;
    this.props.updatedAt = new Date();

    // 发布角色停用事件
    const event = new RoleDeactivatedEvent(
      this.props.id.toString(),
      this.props.tenantId,
      this.props.name.value,
    );
    this.apply(event);
  }

  /**
   * 授予权限
   *
   * 为角色授予指定资源的操作权限。
   *
   * @param {string} resource - 资源标识
   * @param {string} action - 操作类型
   * @returns {void}
   */
  grantPermission(resource: string, action: string): void {
    // 发布角色权限授予事件
    const event = new RolePermissionGrantedEvent(
      this.props.id.toString(),
      this.props.tenantId,
      this.props.name.value,
      resource,
      action,
    );
    this.apply(event);
  }

  /**
   * 撤销权限
   *
   * 撤销角色的指定资源的操作权限。
   *
   * @param {string} resource - 资源标识
   * @param {string} action - 操作类型
   * @returns {void}
   */
  revokePermission(resource: string, action: string): void {
    // 发布角色权限撤销事件
    const event = new RolePermissionRevokedEvent(
      this.props.id.toString(),
      this.props.tenantId,
      this.props.name.value,
      resource,
      action,
    );
    this.apply(event);
  }

  /**
   * 删除角色
   *
   * 标记角色为已删除状态。
   * 注意：这里只是标记删除，实际删除由仓储实现处理。
   *
   * @returns {void}
   */
  delete(): void {
    // 发布角色删除事件
    const event = new RoleDeletedEvent(
      this.props.id.toString(),
      this.props.tenantId,
      this.props.name.value,
    );
    this.apply(event);
  }
}
