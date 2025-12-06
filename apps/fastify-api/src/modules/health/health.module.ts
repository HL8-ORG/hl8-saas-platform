import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * 健康检查模块
 *
 * 负责应用健康状态检查功能。
 *
 * **模块职责**：
 * - 提供健康检查控制器
 * - 导入 Terminus 模块（用于健康检查）
 *
 * @class HealthModule
 * @description 应用健康检查功能模块
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
