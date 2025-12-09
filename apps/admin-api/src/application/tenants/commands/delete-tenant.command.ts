import { ICommand } from '@nestjs/cqrs';

/**
 * 删除租户命令
 */
export class DeleteTenantCommand implements ICommand {
  constructor(public readonly tenantId: string) {}
}
