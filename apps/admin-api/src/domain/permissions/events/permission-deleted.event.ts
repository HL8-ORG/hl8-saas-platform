import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { PermissionId } from '../value-objects/permission-id.vo';

/**
 * 权限已删除领域事件
 */
export class PermissionDeletedEvent extends DomainEventBase {
  public readonly permissionId: string;
  public readonly resource: string;
  public readonly action: string;

  constructor(
    permissionId: PermissionId,
    tenantId: TenantId,
    resource: string,
    action: string,
  ) {
    super(
      permissionId.toString(),
      'PermissionDeletedEvent',
      tenantId.toString(),
    );
    this.permissionId = permissionId.toString();
    this.resource = resource;
    this.action = action;
  }
}
