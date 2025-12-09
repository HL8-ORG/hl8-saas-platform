import { IQuery } from '@nestjs/cqrs';

/**
 * 获取角色权限查询
 */
export class GetRolePermissionsQuery implements IQuery {
  constructor(
    public readonly roleId: string,
    public readonly tenantId: string,
    public readonly withDetails: boolean = false,
  ) {}
}
