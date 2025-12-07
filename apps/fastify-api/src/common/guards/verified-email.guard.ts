import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { FastifyRequest } from 'fastify';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

/**
 * 邮箱验证守卫
 *
 * 确保只有已验证邮箱的用户才能访问受保护的端点。
 * 用于保护需要已验证邮箱才能执行的操作（如更新密码、敏感操作等）。
 *
 * **业务规则**：
 * - 用户必须已认证（已通过 JWT 验证）
 * - 用户邮箱必须已验证
 *
 * **使用方式**：
 * ```typescript
 * @UseGuards(AuthGuard, VerifiedEmailGuard)
 * @Patch('/update-password')
 * async updatePassword() {
 *   // 只有已验证邮箱的用户才能访问
 * }
 * ```
 *
 * @class VerifiedEmailGuard
 * @implements {CanActivate}
 * @description 验证用户邮箱是否已验证的守卫
 */
@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  /**
   * 构造函数
   *
   * 注入用户仓库，用于从数据库查询用户信息。
   *
   * @param {Repository<User>} userRepository - 用户仓库
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 判断是否允许访问
   *
   * 检查当前用户的邮箱是否已验证。
   * 从数据库查询用户信息，验证邮箱状态。
   *
   * **验证流程**：
   * 1. 从请求中获取用户信息（由 AuthGuard 设置）
   * 2. 从 JWT 载荷中提取用户 ID（sub 字段）
   * 3. 从数据库查询用户信息
   * 4. 检查用户的 isEmailVerified 字段
   * 5. 如果未验证，抛出 UnauthorizedException
   *
   * @param {ExecutionContext} context - 执行上下文
   * @returns {Promise<boolean>} 如果用户邮箱已验证返回 true
   * @throws {UnauthorizedException} 当用户未认证或邮箱未验证时抛出
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      FastifyRequest & {
        user?: {
          sub?: string;
          [key: string]: unknown;
        };
      }
    >();

    const userPayload = request.user;

    if (!userPayload || !userPayload.sub) {
      throw new UnauthorizedException('用户未认证');
    }

    // 从数据库查询用户信息
    const user = await this.userRepository.findOne({
      where: { id: userPayload.sub as string },
      select: ['id', 'isEmailVerified'],
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('邮箱未验证，请先验证邮箱');
    }

    return true;
  }
}
