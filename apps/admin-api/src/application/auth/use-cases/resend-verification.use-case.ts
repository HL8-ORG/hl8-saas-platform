import { Logger } from '@hl8/logger';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { Email } from '../../../domain/auth/value-objects/email.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { IEventBus } from '../../../infrastructure/events';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { ResendVerificationInputDto } from '../dtos/resend-verification.input.dto';
import { ResendVerificationOutputDto } from '../dtos/resend-verification.output.dto';

/**
 * 重发验证码用例
 *
 * 处理重发邮箱验证码业务逻辑，生成新的验证码并发布事件。
 *
 * @class ResendVerificationUseCase
 * @implements {IUseCase<ResendVerificationInputDto, ResendVerificationOutputDto>}
 * @description 重发验证码用例
 */
@Injectable()
export class ResendVerificationUseCase implements IUseCase<
  ResendVerificationInputDto,
  ResendVerificationOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserRepository} userRepository - 用户仓储
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @param {IEventBus} eventBus - 事件总线
   * @param {Logger} logger - 日志服务
   */
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
    @Inject('Logger')
    private readonly logger: Logger,
  ) {}

  /**
   * 执行重发验证码用例
   *
   * @param {ResendVerificationInputDto} input - 重发验证码输入参数
   * @returns {Promise<ResendVerificationOutputDto>} 重发结果
   * @throws {NotFoundException} 当用户不存在时抛出
   * @throws {ConflictException} 当邮箱已验证时抛出
   */
  async execute(
    input: ResendVerificationInputDto,
  ): Promise<ResendVerificationOutputDto> {
    const { email: emailStr } = input;

    // 获取当前租户ID
    const tenantIdStr = this.tenantResolver.getCurrentTenantId();
    const tenantId = new TenantId(tenantIdStr);

    // 创建邮箱值对象
    const email = new Email(emailStr);

    // 查找用户
    const user = await this.userRepository.findByEmail(email, tenantId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 重发验证码（聚合根会生成新验证码并发布事件）
    try {
      user.resendVerificationCode();
    } catch (error) {
      // 将领域层的 Error 转换为应用层的 NestJS 异常
      if (error instanceof Error) {
        if (error.message === '邮箱已经验证过了，无需重新发送验证码') {
          throw new ConflictException(error.message);
        }
      }
      // 如果无法识别错误类型，重新抛出原始错误
      throw error;
    }

    // 保存用户（验证码已更新）
    await this.userRepository.save(user);

    // 发布领域事件
    const domainEvents = user.getUncommittedEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    user.commit();

    this.logger.log({
      message: 'Verification code resent',
      userId: user.id.toString(),
      email: email.value,
    });

    return {
      email: user.email.value,
      message: '验证码已重新发送',
    };
  }
}
