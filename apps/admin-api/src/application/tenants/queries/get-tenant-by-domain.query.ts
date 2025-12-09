import { IQuery } from '@nestjs/cqrs';

/**
 * 根据域名获取租户查询
 */
export class GetTenantByDomainQuery implements IQuery {
  constructor(public readonly domain: string) {}
}
