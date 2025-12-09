import { ICommand } from '@nestjs/cqrs';

/**
 * 删除角色命令
 */
export class DeleteRoleCommand implements ICommand {
  constructor(
    public readonly roleId: string,
    public readonly tenantId: string,
  ) {}
}
