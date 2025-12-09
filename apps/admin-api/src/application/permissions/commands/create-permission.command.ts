import { ICommand } from '@nestjs/cqrs';

export class CreatePermissionCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly description?: string,
  ) {}
}
