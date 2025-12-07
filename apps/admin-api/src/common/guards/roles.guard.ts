import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * 用户角色枚举
 *
 * ORM 无关的用户角色枚举定义。
 * 可以根据需要定义自己的角色或从 ORM 实体中导入。
 *
 * @enum {string} UserRole
 */
export enum UserRole {
  /** 普通用户角色 */
  USER = 'USER',
  /** 管理员角色 */
  ADMIN = 'ADMIN',
}

/**
 * 角色守卫
 *
 * 实现了 `CanActivate` 接口，用于根据用户角色进行授权。
 * 它从 `Reflector` 获取路由所需的角色，并检查当前用户的角色是否匹配。
 *
 * **工作流程**：
 * 1. 从路由元数据中获取所需的角色列表
 * 2. 如果没有指定角色要求，则允许访问
 * 3. 检查请求中的用户信息
 * 4. 验证用户角色是否在允许的角色列表中
 *
 * @class RolesGuard
 * @implements {CanActivate}
 * @description 负责处理基于角色的访问控制
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * 构造函数
   *
   * 注入反射器依赖。
   *
   * @param {Reflector} reflector - 用于读取元数据的反射器服务
   */
  constructor(private reflector: Reflector) {}

  /**
   * 确定当前请求是否允许执行。
   *
   * 检查用户角色是否满足路由要求。
   *
   * @param {ExecutionContext} context - 执行上下文，提供当前请求的详细信息
   * @returns {boolean} 如果允许访问则返回 `true`
   * @throws {UnauthorizedException} 当请求中未找到用户信息时抛出
   * @throws {ForbiddenException} 当用户角色不满足要求时抛出
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role?: UserRole | string; [key: string]: unknown };
    }>();
    const { user } = request;
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    // Extract role from user object (JWT payload)
    const userRole = user.role as UserRole | string | undefined;
    if (!userRole) {
      throw new ForbiddenException('User role not found in token');
    }

    // Check if user role matches any of the required roles
    if (!requiredRoles.includes(userRole as UserRole)) {
      throw new ForbiddenException('Insufficient role to access this resource');
    }

    return true;
  }
}
