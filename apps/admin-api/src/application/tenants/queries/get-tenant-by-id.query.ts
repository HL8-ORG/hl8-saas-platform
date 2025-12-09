import { IQuery } from '@nestjs/cqrs';

/**
 * 根据ID获取租户查询
 */
export class GetTenantByIdQuery implements IQuery {
  constructor(public readonly tenantId: string) {}
}
