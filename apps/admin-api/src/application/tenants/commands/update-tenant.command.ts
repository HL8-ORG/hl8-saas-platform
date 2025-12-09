import { ICommand } from '@nestjs/cqrs';

/**
 * 更新租户命令
 */
export class UpdateTenantCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly name?: string,
    public readonly domain?: string | null,
    public readonly isActive?: boolean,
  ) {}
}
