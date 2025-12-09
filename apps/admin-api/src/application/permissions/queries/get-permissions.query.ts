import { IQuery } from '@nestjs/cqrs';

export class GetPermissionsQuery implements IQuery {
  constructor(public readonly tenantId: string) {}
}
