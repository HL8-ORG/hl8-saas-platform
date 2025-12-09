import { ConflictException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import { Email } from '../../../../domain/auth/value-objects/email.vo';
import { PasswordHash } from '../../../../domain/auth/value-objects/password-hash.vo';
import { Tenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../../domain/tenants/repositories/tenant.repository.interface';
import { TenantName } from '../../../../domain/tenants/value-objects/tenant-name.vo';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IPasswordHasher } from '../../../shared/interfaces/password-hasher.interface';
import { SignupOutputDto } from '../../dtos/signup.output.dto';
import { SignupCommand } from '../signup.command';

@CommandHandler(SignupCommand)
export class SignupHandler implements ICommandHandler<SignupCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
    private readonly eventBus: EventBus,
    private readonly config: ConfigService,
  ) {}

  async execute(command: SignupCommand): Promise<SignupOutputDto> {
    const { email, password, fullName, tenantName } = command;

    const emailVo = new Email(email);
    // 需要通过 tenantName 获取 tenant，然后用 tenantId 查找用户
    const tenantNameVo = new TenantName(tenantName);
    let tenant = await this.tenantRepository.findByName(tenantNameVo);

    // 如果租户不存在，后续会创建，但这里需要 tenantId 来检查用户是否已存在
    // 如果租户不存在，用户肯定也不存在（在该租户下）
    // 但如果租户存在，我们需要检查

    if (tenant) {
      const existingUser = await this.userRepository.findByEmail(
        emailVo,
        tenant.id,
      );
      if (existingUser) {
        throw new ConflictException('该邮箱已被注册');
      }
    }

    // 如果租户不存在，创建租户
    if (!tenant) {
      tenant = Tenant.create(tenantNameVo, null, true);
      await this.tenantRepository.save(tenant);
      const tenantEvents = tenant.getUncommittedEvents();
      if (tenantEvents.length > 0) {
        this.eventBus.publishAll(tenantEvents);
        tenant.commit();
      }
    }

    const passwordHashStr = await this.passwordHasher.hash(password);
    const passwordHash = new PasswordHash(passwordHashStr);

    const defaultRole =
      (this.config.get<string>('DEFAULT_USER_ROLE') as UserRole) ||
      UserRole.USER;

    const user = User.create(
      emailVo,
      passwordHash,
      fullName,
      defaultRole,
      tenant.id,
    );

    await this.userRepository.save(user);

    const domainEvents = user.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      user.commit();
    }

    const dto = new SignupOutputDto();
    dto.userId = user.id.toString();
    dto.email = user.email.value;
    dto.fullName = user.fullName;
    dto.message = '注册成功';
    return dto;
  }
}
