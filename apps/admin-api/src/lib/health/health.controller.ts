import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public } from 'src/common/decorators/public.decorator';

/**
 * 健康检查控制器
 *
 * 提供应用健康状态检查端点，用于监控和负载均衡器健康检查。
 *
 * **检查项**：
 * - 数据库连接状态（通过 ping 检查）
 *
 * @class HealthController
 * @description 应用健康检查的 REST API 控制器
 */
@Controller('health')
export class HealthController {
  /**
   * 构造函数
   *
   * 注入健康检查服务和数据库健康指示器依赖。
   *
   * @param {HealthCheckService} health - 健康检查服务
   * @param {TypeOrmHealthIndicator} db - 数据库健康指示器
   */
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  /**
   * 健康检查
   *
   * 检查应用和数据库的健康状态。
   *
   * **检查内容**：
   * - 数据库连接：通过 ping 检查数据库是否可访问
   *
   * @returns {Promise<any>} 健康检查结果
   */
  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
