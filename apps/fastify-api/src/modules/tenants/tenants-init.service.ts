import { Logger } from '@hl8/logger';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/tenant.entity';

/**
 * 租户初始化服务
 *
 * 在应用启动时自动创建默认租户（如果不存在）。
 *
 * **初始化逻辑**：
 * - 检查默认租户是否存在（根据配置的 DEFAULT_TENANT_DOMAIN）
 * - 如果不存在，自动创建默认租户
 * - 默认租户名称为 "默认租户"，域名为配置的 DEFAULT_TENANT_DOMAIN
 *
 * @class TenantsInitService
 * @implements {OnModuleInit}
 * @description 租户初始化服务，负责应用启动时的租户初始化
 */
@Injectable()
export class TenantsInitService implements OnModuleInit {
  /**
   * 构造函数
   *
   * 注入租户仓库、配置服务和日志记录器依赖。
   *
   * @param {Repository<Tenant>} tenantRepository - 租户仓库
   * @param {ConfigService} configService - 配置服务
   * @param {Logger} logger - Pino 日志记录器
   */
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  /**
   * 模块初始化钩子
   *
   * 在模块初始化时自动执行，创建默认租户（如果不存在）。
   *
   * @returns {Promise<void>}
   */
  async onModuleInit(): Promise<void> {
    const defaultTenantDomain = this.configService.get<string>(
      'DEFAULT_TENANT_DOMAIN',
      'default',
    );

    // 检查默认租户是否已存在
    const existingTenant = await this.tenantRepository.findOne({
      where: { domain: defaultTenantDomain },
    });

    if (existingTenant) {
      this.logger.log(
        {
          message: '默认租户已存在',
          tenantId: existingTenant.id,
          domain: existingTenant.domain,
        },
        'TenantsInitService',
      );
      return;
    }

    // 创建默认租户
    const defaultTenant = this.tenantRepository.create({
      name: '默认租户',
      domain: defaultTenantDomain,
      isActive: true,
    });

    const savedTenant = await this.tenantRepository.save(defaultTenant);

    this.logger.log(
      {
        message: '已自动创建默认租户',
        tenantId: savedTenant.id,
        domain: savedTenant.domain,
      },
      'TenantsInitService',
    );
  }
}
