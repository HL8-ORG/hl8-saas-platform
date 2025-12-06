import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { User } from 'src/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * 用户模块
 *
 * 负责用户管理相关的功能，包括用户资料管理和用户列表查询。
 *
 * **模块职责**：
 * - 提供用户控制器和服务
 * - 注册 User 和 RefreshToken 实体
 *
 * @class UsersModule
 * @description 用户管理功能模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
