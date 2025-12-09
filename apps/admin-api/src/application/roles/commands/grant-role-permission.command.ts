import { ICommand } from '@nestjs/cqrs';

/**
 * 授予角色权限命令
 */
export class GrantRolePermissionCommand implements ICommand {
  constructor(
    public readonly roleId: string,
    public readonly tenantId: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly description?: string,
  ) {}
}
