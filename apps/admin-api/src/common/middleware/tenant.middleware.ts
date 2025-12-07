import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { TENANT_CONTEXT_KEY } from '../constants/tenant.constants';

/**
 * 租户中间件
 *
 * 从请求中提取租户 ID 并验证其有效性。
 * 租户 ID 可以从以下来源提取（按优先级）：
 * 1. JWT Payload 中的 tenantId 字段（推荐）
 * 2. X-Tenant-Id 请求头（用于服务间调用）
 *
 * **工作流程**：
 * 1. 检查路由是否标记为 @PublicTenant()，如果是则跳过
 * 2. 从 JWT payload（request.user.tenantId）提取租户 ID
 * 3. 如果 JWT 中没有，则从 X-Tenant-Id 请求头提取
 * 4. 验证租户 ID 格式（UUID）
 * 5. 将租户 ID 存储到 request.tenantId 供后续使用
 *
 * @class TenantMiddleware
 * @implements {NestMiddleware}
 * @description 租户上下文管理中间件
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  /**
   * 构造函数
   *
   * 注入反射器依赖，用于读取路由元数据。
   *
   * @param {Reflector} reflector - 反射器，用于读取路由元数据
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * 中间件处理方法
   *
   * 提取和验证租户 ID，并将其附加到请求对象。
   *
   * @param {FastifyRequest} req - Fastify 请求对象
   * @param {FastifyReply} reply - Fastify 响应对象
   * @param {() => void} next - 下一个中间件的回调函数
   * @throws {BadRequestException} 当租户 ID 缺失或无效时抛出
   */
  use(req: FastifyRequest, reply: FastifyReply, next: () => void): void {
    // 注意：在中间件阶段无法直接访问路由元数据（需要 ExecutionContext）
    // 这里先不检查 @PublicTenant()，在 Guard 中检查更合适
    // 如果路由标记为 @PublicTenant()，后续的 Guard 会处理

    // 提取租户 ID（优先级：JWT > Header）
    let tenantId: string | undefined;

    // 方法 1: 从 JWT payload 提取（推荐）
    // 注意：此时 JWT 可能还未验证，所以 request.user 可能不存在
    // 如果 AuthGuard 在 TenantMiddleware 之后执行，则从 header 提取
    const user = (req as any).user;
    if (user?.tenantId) {
      tenantId = user.tenantId;
    }

    // 方法 2: 从请求头提取（用于服务间调用或 JWT 验证前）
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] as string | undefined;
    }

    // 如果找到了租户 ID，验证格式并存储
    if (tenantId) {
      // 验证租户 ID 格式（UUID）
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('无效的租户 ID 格式');
      }

      // 将租户 ID 附加到请求对象
      (req as any)[TENANT_CONTEXT_KEY] = tenantId;
    }
    // 注意：如果租户 ID 不存在，不在这里抛出异常
    // 因为某些路由可能标记为 @PublicTenant()，允许没有租户 ID
    // 租户 ID 的必需性验证应该在 Guard 或 Service 层进行

    next();
  }

  /**
   * 验证 UUID 格式
   *
   * @private
   * @param {string} value - 待验证的字符串
   * @returns {boolean} 如果是有效的 UUID 则返回 true
   */
  private isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
