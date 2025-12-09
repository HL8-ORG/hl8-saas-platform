import { IQuery } from '@nestjs/cqrs';

/**
 * 获取角色列表查询
 */
export class GetRolesQuery implements IQuery {
  constructor(public readonly tenantId: string) {}
}
