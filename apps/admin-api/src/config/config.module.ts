import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env.validation';

/**
 * 应用配置模块
 *
 * 负责加载和验证应用配置。
 *
 * **配置特性**：
 * - 全局模块：配置在整个应用中可用
 * - 环境文件：从 `.env` 文件加载配置
 * - 配置验证：使用 `env.validation` 验证环境变量
 *
 * @class AppConfigModule
 * @description 应用配置管理模块
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
  ],
})
export class AppConfigModule {}
