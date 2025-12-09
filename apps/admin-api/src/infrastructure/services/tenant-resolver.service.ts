import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { FastifyRequest } from 'fastify';
import { Repository } from 'typeorm';
// import { TENANT_CONTEXT_KEY } from '../../../common/constants/tenant.constants';
// import { Tenant } from '../../../entities/tenant.entity';
import { TENANT_CONTEXT_KEY } from '@/common/constants/tenant.constants';
import { Tenant } from '@/domain/tenants/entities';
import { ITenantResolver } from '../../application/shared/interfaces/tenant-resolver.interface';

/**
 * 租户解析器服务实现
 *
 * 从请求上下文中解析租户ID，支持多种来源。
 *
 * @class TenantResolverService
 * @implements {ITenantResolver}
 * @description 租户解析器服务实现
 */
@Injectable()
export class TenantResolverService implements ITenantResolver {
  /**
   * 构造函数
   *
   * 注入请求对象、配置服务和租户仓储。
   *
   * @param {FastifyRequest} request - 请求对象
   * @param {ConfigService} config - 配置服务
   * @param {Repository<Tenant>} tenantRepository - 租户仓储
   */
  constructor(
    @Inject(REQUEST) private readonly request: FastifyRequest,
    private readonly config: ConfigService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * 获取当前租户ID（同步方法）
   *
   * 从请求上下文中获取租户ID，适用于已有租户上下文的情况。
   *
   * @returns {string} 当前租户ID
   * @throws {BadRequestException} 当租户ID不存在时抛出
   */
  getCurrentTenantId(): string {
    const tenantId = (this.request as any)[TENANT_CONTEXT_KEY];
    if (!tenantId) {
      throw new BadRequestException('租户上下文缺失');
    }
    return tenantId;
  }

  /**
   * 解析租户ID（异步方法）
   *
   * 用于注册等公共接口，支持从多个来源获取租户ID：
   * 1. 请求上下文（如果存在）
   * 2. X-Tenant-Id 请求头（如果提供）
   * 3. 默认租户（域名为 'default' 的租户，或第一个租户）
   *
   * @param {FastifyRequest} [req] - 可选的请求对象（用于注册等公共接口）
   * @returns {Promise<string>} 租户ID
   * @throws {BadRequestException} 当租户ID不存在且无法获取默认租户时抛出
   */
  async resolveTenantId(req?: FastifyRequest): Promise<string> {
    // 优先从请求上下文获取
    let tenantId = (this.request as any)[TENANT_CONTEXT_KEY];

    // 如果请求上下文没有，尝试从传入的请求对象获取（用于注册等公共接口）
    if (!tenantId && req) {
      tenantId = (req as any)[TENANT_CONTEXT_KEY];

      // 如果还是没有，尝试从请求头获取
      if (!tenantId) {
        tenantId = req.headers['x-tenant-id'] as string | undefined;
      }
    }

    // 如果仍然没有租户ID，尝试使用默认租户
    if (!tenantId) {
      const defaultTenantDomain = this.config.get<string>(
        'DEFAULT_TENANT_DOMAIN',
        'default',
      );
      const defaultTenant = await this.tenantRepository.findOne({
        where: { domain: defaultTenantDomain },
      });

      if (defaultTenant) {
        tenantId = defaultTenant.id;
      } else {
        // 如果默认租户也不存在，使用第一个租户
        const firstTenant = await this.tenantRepository.findOne({
          order: { createdAt: 'ASC' },
        });

        if (firstTenant) {
          tenantId = firstTenant.id;
        }
      }
    }

    if (!tenantId) {
      throw new BadRequestException('租户上下文缺失，且系统中没有可用租户');
    }

    return tenantId;
  }
}
