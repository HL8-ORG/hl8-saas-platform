import { Logger } from '@hl8/logger';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { Email } from '../../../domain/auth/value-objects/email.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { IEventBus } from '../../../infrastructure/events';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { VerifyEmailInputDto } from '../dtos/verify-email.input.dto';
import { VerifyEmailOutputDto } from '../dtos/verify-email.output.dto';

/**
 * 验证邮箱用例
 *
 * 处理邮箱验证业务逻辑，使用验证码验证用户邮箱。
 *
 * @class VerifyEmailUseCase
 * @implements {IUseCase<VerifyEmailInputDto, VerifyEmailOutputDto>}
 * @description 验证邮箱用例
 */
@Injectable()
export class VerifyEmailUseCase implements IUseCase<
  VerifyEmailInputDto,
  VerifyEmailOutputDto
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
    private readonly logger: Logger,
  ) {}

  /**
   * 执行邮箱验证用例
   *
   * @param {VerifyEmailInputDto} input - 验证输入参数
   * @returns {Promise<VerifyEmailOutputDto>} 验证结果
   * @throws {NotFoundException} 当用户不存在时抛出
   * @throws {ConflictException} 当邮箱已验证时抛出
   * @throws {UnauthorizedException} 当验证码无效或已过期时抛出
   */
  async execute(input: VerifyEmailInputDto): Promise<VerifyEmailOutputDto> {
    const { email: emailStr, code } = input;

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

    // 验证邮箱
    try {
      user.verifyEmail(code);
    } catch (error) {
      // 将领域层的 Error 转换为应用层的 NestJS 异常
      if (error instanceof Error) {
        if (error.message === '邮箱已经验证过了') {
          throw new ConflictException(error.message);
        }
        if (
          error.message === '验证码不存在，请重新申请' ||
          error.message === '验证码已过期，请重新申请' ||
          error.message === '验证码错误'
        ) {
          throw new UnauthorizedException(error.message);
        }
      }
      // 如果无法识别错误类型，重新抛出原始错误
      throw error;
    }

    // 保存用户（验证状态已更新）
    await this.userRepository.save(user);

    // 发布领域事件
    const domainEvents = user.getUncommittedEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    user.commit();

    this.logger.log({
      message: 'Email verified successfully',
      userId: user.id.toString(),
      email: email.value,
    });

    return {
      userId: user.id.toString(),
      email: user.email.value,
      isEmailVerified: user.isEmailVerified,
      message: '邮箱验证成功',
    };
  }
}
