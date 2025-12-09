import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTenantHandler } from '../../application/tenants/commands/handlers/create-tenant.handler';
import { DeleteTenantHandler } from '../../application/tenants/commands/handlers/delete-tenant.handler';
import { UpdateTenantHandler } from '../../application/tenants/commands/handlers/update-tenant.handler';
import { GetTenantByDomainHandler } from '../../application/tenants/queries/handlers/get-tenant-by-domain.handler';
import { GetTenantByIdHandler } from '../../application/tenants/queries/handlers/get-tenant-by-id.handler';
import { GetTenantsHandler } from '../../application/tenants/queries/handlers/get-tenants.handler';
import { Tenant as OrmTenant } from '../../infrastructure/persistence/typeorm/entities/tenant.entity';
import { TenantReadRepository } from '../../infrastructure/persistence/typeorm/repositories/tenant-read.repository';
import { TenantRepository } from '../../infrastructure/persistence/typeorm/repositories/tenant.repository';
import { TenantsController } from '../../interface/controllers/tenants/tenants.controller';

/**
 * 租户模块（Clean Architecture）
 *
 * 负责租户管理相关的功能，使用 Clean Architecture 架构。
 * 集成所有用例、仓储和服务。
 *
 * **模块职责**：
 * - 提供租户控制器（表现层）
 * - 注册所有 Command/Query Handlers（应用层）
 * - 注册所有仓储实现（基础设施层）
 * - 配置 CQRS 模块和事件总线
 *
 * @class TenantsModule
 * @description 租户管理功能模块（Clean Architecture）
 */
@Module({
  imports: [
    // CQRS 模块：支持命令查询职责分离和事件驱动架构
    CqrsModule,
    // TypeORM 模块：注册 ORM 实体
    TypeOrmModule.forFeature([OrmTenant]),
  ],
  controllers: [TenantsController],
  providers: [
    // ==================== Command Handlers ====================
    CreateTenantHandler,
    UpdateTenantHandler,
    DeleteTenantHandler,

    // ==================== Query Handlers ====================
    GetTenantsHandler,
    GetTenantByIdHandler,
    GetTenantByDomainHandler,

    // ==================== 仓储实现（基础设施层） ====================
    // 租户仓储（写操作）
    TenantRepository,
    {
      provide: 'ITenantRepository',
      useExisting: TenantRepository,
    },
    // 租户只读仓储（读操作）
    TenantReadRepository,
    {
      provide: 'ITenantReadRepository',
      useExisting: TenantReadRepository,
    },
  ],
})
export class TenantsModule {}
