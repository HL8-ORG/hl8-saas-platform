import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { User } from 'src/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * 认证模块
 *
 * 负责用户认证相关的功能，包括注册、登录、令牌刷新和登出。
 *
 * **模块职责**：
 * - 提供认证控制器和服务
 * - 注册 User 和 RefreshToken 实体
 * - 配置全局 JWT 模块
 *
 * @class AuthModule
 * @description 用户认证功能模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
