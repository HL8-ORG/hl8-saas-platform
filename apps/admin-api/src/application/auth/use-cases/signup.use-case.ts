import { Logger } from '@hl8/logger';
import { MailService } from '@hl8/mail';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { Email } from '../../../domain/auth/value-objects/email.vo';
import { PasswordHash } from '../../../domain/auth/value-objects/password-hash.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import { IEventBus } from '../../../infrastructure/events';
import type { IPasswordHasher } from '../../shared/interfaces/password-hasher.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { SignupInputDto } from '../dtos/signup.input.dto';
import { SignupOutputDto } from '../dtos/signup.output.dto';

/**
 * 用户注册用例
 *
 * 处理用户注册业务逻辑，包括创建用户、生成验证码、发送验证邮件等。
 *
 * @class SignupUseCase
 * @implements {IUseCase<SignupInputDto, SignupOutputDto>}
 * @description 用户注册用例
 */
@Injectable()
export class SignupUseCase implements IUseCase<
  SignupInputDto,
  SignupOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserRepository} userRepository - 用户仓储
   * @param {IPasswordHasher} passwordHasher - 密码哈希服务
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @param {IEventBus} eventBus - 事件总线
   * @param {ConfigService} config - 配置服务
   * @param {MailService} mailService - 邮件服务
   * @param {Logger} logger - 日志服务
   */
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
    @Inject('ConfigService')
    private readonly config: ConfigService,
    @Inject('MailService')
    private readonly mailService: MailService,
    @Inject('Logger')
    private readonly logger: Logger,
  ) {}

  /**
   * 执行用户注册用例
   *
   * @param {SignupInputDto} input - 注册输入参数
   * @returns {Promise<SignupOutputDto>} 注册结果
   * @throws {ConflictException} 当邮箱已被使用时抛出
   */
  async execute(input: SignupInputDto): Promise<SignupOutputDto> {
    const { email: emailStr, password, fullName } = input;

    // 解析租户ID
    const tenantIdStr =
      input.tenantId || (await this.tenantResolver.resolveTenantId());
    const tenantId = new TenantId(tenantIdStr);

    // 创建值对象
    const email = new Email(emailStr);

    // 检查邮箱是否已存在
    const emailExists = await this.userRepository.emailExists(email, tenantId);
    if (emailExists) {
      throw new ConflictException('Email already in use');
    }

    // 哈希密码
    const passwordHashStr = await this.passwordHasher.hash(password);
    const passwordHash = new PasswordHash(passwordHashStr);

    // 获取默认用户角色
    const defaultRole =
      (this.config.get<string>('DEFAULT_USER_ROLE') as UserRole) ||
      UserRole.USER;

    // 创建用户聚合根
    const user = User.create(
      email,
      passwordHash,
      fullName,
      defaultRole,
      tenantId,
    );

    // 保存用户
    await this.userRepository.save(user);

    // 发布领域事件
    const domainEvents = user.getUncommittedEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    user.commit();

    this.logger.log({
      message: 'User registered successfully',
      userId: user.id.toString(),
      email: email.value,
      role: defaultRole,
    });

    return {
      userId: user.id.toString(),
      email: user.email.value,
      fullName: user.fullName,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      message: 'User registered successfully',
    };
  }
}
