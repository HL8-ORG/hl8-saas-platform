import { ICommand } from '@nestjs/cqrs';

/**
 * 创建角色命令
 */
export class CreateRoleCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly displayName?: string,
    public readonly description?: string,
    public readonly isActive?: boolean,
  ) {}
}
