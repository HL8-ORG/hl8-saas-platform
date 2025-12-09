import { ICommand } from '@nestjs/cqrs';

/**
 * 创建租户命令
 */
export class CreateTenantCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly domain?: string,
    public readonly isActive?: boolean,
  ) {}
}
