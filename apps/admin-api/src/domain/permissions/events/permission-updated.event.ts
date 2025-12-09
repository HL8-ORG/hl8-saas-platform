import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { PermissionId } from '../value-objects/permission-id.vo';

/**
 * 权限已更新领域事件
 */
export class PermissionUpdatedEvent extends DomainEventBase {
  public readonly permissionId: string;
  public readonly updatedFields: string[];

  constructor(
    permissionId: PermissionId,
    tenantId: TenantId,
    updatedFields: string[],
  ) {
    super(
      permissionId.toString(),
      'PermissionUpdatedEvent',
      tenantId.toString(),
    );
    this.permissionId = permissionId.toString();
    this.updatedFields = updatedFields;
  }
}
