import { AggregateRoot } from '@/core/entities/aggregate-root';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import {
  PermissionCreatedEvent,
  PermissionDeletedEvent,
  PermissionUpdatedEvent,
} from '../events';
import { PermissionId } from '../value-objects/permission-id.vo';

/**
 * 权限属性接口
 */
interface PermissionProps {
  id: PermissionId;
  resource: string;
  action: string;
  description: string | null;
  tenantId: TenantId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 权限聚合根
 *
 * 权限领域的聚合根，包含权限的核心业务逻辑。
 *
 * @class Permission
 * @extends {AggregateRoot<PermissionProps>}
 */
export class Permission extends AggregateRoot<PermissionProps> {
  private constructor(props: PermissionProps) {
    super(props);
  }

  /**
   * 创建新权限
   *
   * @static
   * @param {string} resource - 资源标识
   * @param {string} action - 操作类型
   * @param {TenantId} tenantId - 租户ID
   * @param {string} [description] - 描述
   * @returns {Permission}
   */
  static create(
    resource: string,
    action: string,
    tenantId: TenantId,
    description?: string,
  ): Permission {
    const permissionId = PermissionId.generate();
    const now = new Date();

    const permission = new Permission({
      id: permissionId,
      resource,
      action,
      description: description || null,
      tenantId,
      createdAt: now,
      updatedAt: now,
    });

    const event = new PermissionCreatedEvent(
      permissionId,
      tenantId,
      resource,
      action,
    );
    permission.apply(event);

    return permission;
  }

  /**
   * 重构权限聚合根
   *
   * @static
   * @param {object} props
   * @returns {Permission}
   */
  static reconstitute(props: {
    id: string;
    resource: string;
    action: string;
    description: string | null;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Permission {
    return new Permission({
      id: new PermissionId(props.id),
      resource: props.resource,
      action: props.action,
      description: props.description,
      tenantId: new TenantId(props.tenantId),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  get id(): PermissionId {
    return this.props.id;
  }

  get resource(): string {
    return this.props.resource;
  }

  get action(): string {
    return this.props.action;
  }

  get description(): string | null {
    return this.props.description;
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
   * 更新权限信息
   *
   * @param {string} [description] - 新的描述
   * @returns {string[]} 更新的字段列表
   */
  update(description?: string | null): string[] {
    const updatedFields: string[] = [];

    if (description !== undefined && description !== this.props.description) {
      this.props.description = description;
      updatedFields.push('description');
    }

    if (updatedFields.length > 0) {
      this.props.updatedAt = new Date();

      const event = new PermissionUpdatedEvent(
        this.props.id,
        this.props.tenantId,
        updatedFields,
      );
      this.apply(event);
    }

    return updatedFields;
  }

  /**
   * 删除权限
   */
  delete(): void {
    const event = new PermissionDeletedEvent(
      this.props.id,
      this.props.tenantId,
      this.props.resource,
      this.props.action,
    );
    this.apply(event);
  }
}
