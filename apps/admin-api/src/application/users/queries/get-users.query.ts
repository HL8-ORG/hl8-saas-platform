import { IQuery } from '@nestjs/cqrs';

export class GetUsersQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly isActive?: boolean,
    public readonly search?: string,
  ) {}
}
