import { LoggerModule } from '@hl8/logger';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../../entities/tenant.entity';
import { TenantsInitService } from './tenants-init.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

/**
 * 租户管理模块
 *
 * 提供租户管理的功能，包括：
 * - 租户的 CRUD 操作
 * - 租户验证
 * - 应用启动时自动创建默认租户
 *
 * **模块职责**：
 * - 提供租户管理控制器和服务
 * - 注册 Tenant 实体
 * - 在应用启动时初始化默认租户
 *
 * @class TenantsModule
 * @description 租户管理功能模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), LoggerModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantsInitService],
  exports: [TenantsService], // 导出服务供其他模块使用
})
export class TenantsModule {}
