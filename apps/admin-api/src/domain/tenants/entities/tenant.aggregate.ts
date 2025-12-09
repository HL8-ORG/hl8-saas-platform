import { AggregateRoot } from '@/core/entities';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import {
  TenantActivatedEvent,
  TenantCreatedEvent,
  TenantDeactivatedEvent,
  TenantDeletedEvent,
  TenantUpdatedEvent,
} from '../events';
import { TenantDomain } from '../value-objects/tenant-domain.vo';
import { TenantName } from '../value-objects/tenant-name.vo';

/**
 * 租户属性接口
 *
 * 定义租户聚合根的所有属性，用于 Entity 基类的泛型参数。
 *
 * @interface TenantProps
 */
interface TenantProps {
  /** 租户ID */
  id: TenantId;
  /** 租户名称 */
  name: TenantName;
  /** 租户域名（可选） */
  domain: TenantDomain | null;
  /** 是否激活 */
  isActive: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 租户聚合根
 *
 * 租户领域的聚合根，包含租户的核心业务逻辑。
 * 遵循充血模型，所有业务规则都在聚合根内部实现。
 * 继承 AggregateRoot 基类，支持领域事件发布。
 *
 * **业务规则**：
 * - 租户创建时必须提供名称
 * - 租户名称必须唯一
 * - 租户域名必须唯一（如果提供）
 * - 新租户默认状态为激活
 *
 * **事件发布**：
 * - 使用 `this.apply(event)` 应用领域事件
 * - 在应用层调用 `tenant.commit()` 发布事件到事件总线
 *
 * @class Tenant
 * @extends {AggregateRoot<TenantProps>}
 * @description 租户聚合根，包含租户的核心业务逻辑
 */
export class Tenant extends AggregateRoot<TenantProps> {
  /**
   * 私有构造函数
   *
   * 防止直接实例化，必须通过静态工厂方法创建。
   *
   * @private
   * @param {TenantProps} props - 租户属性对象
   */
  private constructor(props: TenantProps) {
    super(props);
  }

  /**
   * 创建新租户
   *
   * 工厂方法，创建新的租户聚合根实例。
   * 自动生成租户ID（使用ULID），设置默认值并发布租户创建事件。
   *
   * @static
   * @param {TenantName} name - 租户名称
   * @param {TenantDomain | null} domain - 租户域名（可选）
   * @param {boolean} [isActive=true] - 是否激活，默认为 true
   * @returns {Tenant} 新创建的租户聚合根
   *
   * @example
   * ```typescript
   * const name = new TenantName('Acme Corporation');
   * const domain = new TenantDomain('acme');
   * const tenant = Tenant.create(name, domain);
   * ```
   */
  static create(
    name: TenantName,
    domain: TenantDomain | null,
    isActive: boolean = true,
  ): Tenant {
    // 自动生成租户ID（使用ULID）
    const tenantId = TenantId.generate();
    const now = new Date();

    const tenant = new Tenant({
      id: tenantId,
      name,
      domain,
      isActive,
      createdAt: now,
      updatedAt: now,
    });

    // 发布租户创建事件
    const event = new TenantCreatedEvent(tenantId, name.value, domain?.value);
    tenant.apply(event);

    return tenant;
  }

  /**
   * 重构现有租户
   *
   * 从持久化存储重构租户聚合根实例。
   * 用于从数据库加载现有租户。
   *
   * @static
   * @param {object} props - 租户属性
   * @returns {Tenant} 重构的租户聚合根
   */
  static reconstitute(props: {
    id: string;
    name: string;
    domain: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Tenant {
    const tenantProps: TenantProps = {
      id: new TenantId(props.id),
      name: new TenantName(props.name),
      domain: props.domain ? new TenantDomain(props.domain) : null,
      isActive: props.isActive,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    return new Tenant(tenantProps);
  }

  // Getter 方法 - 通过 props 访问属性
  get id(): TenantId {
    return this.props.id;
  }

  get name(): TenantName {
    return this.props.name;
  }

  get domain(): TenantDomain | null {
    return this.props.domain;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * 更新租户信息
   *
   * 更新租户的名称和域名。
   *
   * @param {TenantName} [name] - 新的租户名称
   * @param {TenantDomain | null} [domain] - 新的租户域名
   * @returns {string[]} 更新的字段列表
   * @throws {Error} 当名称或域名为空时抛出异常
   */
  update(name?: TenantName, domain?: TenantDomain | null): string[] {
    const updatedFields: string[] = [];

    if (name !== undefined) {
      if (!name.equals(this.props.name)) {
        this.props.name = name;
        updatedFields.push('name');
      }
    }

    if (domain !== undefined) {
      const newDomain = domain;
      const oldDomain = this.props.domain;

      // 处理 null 值比较
      if (
        (newDomain === null && oldDomain !== null) ||
        (newDomain !== null && oldDomain === null) ||
        (newDomain !== null &&
          oldDomain !== null &&
          !newDomain.equals(oldDomain))
      ) {
        this.props.domain = newDomain;
        updatedFields.push('domain');
      }
    }

    if (updatedFields.length > 0) {
      this.props.updatedAt = new Date();

      // 发布租户更新事件
      const event = new TenantUpdatedEvent(this.props.id, updatedFields);
      this.apply(event);
    }

    return updatedFields;
  }

  /**
   * 激活租户
   *
   * 将租户设置为激活状态。
   *
   * @throws {Error} 当租户已经是激活状态时抛出异常
   */
  activate(): void {
    if (this.props.isActive) {
      throw new Error('租户已经处于激活状态');
    }

    this.props.isActive = true;
    this.props.updatedAt = new Date();

    // 发布租户激活事件
    const event = new TenantActivatedEvent(
      this.props.id,
      this.props.name.value,
    );
    this.apply(event);
  }

  /**
   * 停用租户
   *
   * 将租户设置为非激活状态。
   *
   * @throws {Error} 当租户已经是非激活状态时抛出异常
   */
  deactivate(): void {
    if (!this.props.isActive) {
      throw new Error('租户已经处于非激活状态');
    }

    this.props.isActive = false;
    this.props.updatedAt = new Date();

    // 发布租户停用事件
    const event = new TenantDeactivatedEvent(
      this.props.id,
      this.props.name.value,
    );
    this.apply(event);
  }

  /**
   * 删除租户
   *
   * 标记租户为已删除状态。
   * 注意：这里只是标记删除，实际删除由仓储实现处理。
   *
   * @returns {void}
   */
  delete(): void {
    // 发布租户删除事件
    const event = new TenantDeletedEvent(this.props.id, this.props.name.value);
    this.apply(event);
  }
}
