import { IQuery } from '@nestjs/cqrs';

/**
 * 根据ID获取角色查询
 */
export class GetRoleByIdQuery implements IQuery {
  constructor(
    public readonly roleId: string,
    public readonly tenantId: string,
  ) {}
}
