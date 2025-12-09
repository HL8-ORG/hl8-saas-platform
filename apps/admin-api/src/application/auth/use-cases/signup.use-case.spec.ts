import { Logger } from '@hl8/logger';
import { MailService } from '@hl8/mail';
import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { Email } from '../../../domain/auth/value-objects/email.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import { IEventBus } from '../../../infrastructure/events';
import type { IPasswordHasher } from '../../shared/interfaces/password-hasher.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { SignupInputDto } from '../dtos/signup.input.dto';
import { SignupUseCase } from './signup.use-case';

/**
 * 用户注册用例单元测试
 *
 * 测试用户注册用例的业务逻辑。
 *
 * @describe SignupUseCase
 */
describe('SignupUseCase', () => {
  let useCase: SignupUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let tenantResolver: jest.Mocked<ITenantResolver>;
  let eventBus: jest.Mocked<IEventBus>;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const mockUserRepository = {
      emailExists: jest.fn(),
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    const mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockMailService = {
      sendMail: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignupUseCase,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'IPasswordHasher',
          useValue: mockPasswordHasher,
        },
        {
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
        {
          provide: 'ConfigService',
          useValue: mockConfigService,
        },
        {
          provide: 'MailService',
          useValue: mockMailService,
        },
        {
          provide: 'Logger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<SignupUseCase>(SignupUseCase);
    userRepository = module.get('IUserRepository');
    passwordHasher = module.get('IPasswordHasher');
    tenantResolver = module.get('ITenantResolver');
    eventBus = module.get('IEventBus');
    configService = module.get('ConfigService');
    mailService = module.get('MailService');
    logger = module.get('Logger');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const input: SignupInputDto = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    };

    const tenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV'; // 有效的 ULID
    const hashedPassword =
      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqBWVHxkd0'; // 有效的 bcrypt 哈希

    beforeEach(() => {
      tenantResolver.resolveTenantId.mockResolvedValue(tenantId);
      userRepository.emailExists.mockResolvedValue(false);
      passwordHasher.hash.mockResolvedValue(hashedPassword);
      configService.get.mockReturnValue(undefined); // 使用默认角色
      userRepository.save.mockResolvedValue(undefined);
      eventBus.publish.mockResolvedValue(undefined);
    });

    it('应该成功注册新用户', async () => {
      const result = await useCase.execute(input);

      expect(tenantResolver.resolveTenantId).toHaveBeenCalled();
      expect(userRepository.emailExists).toHaveBeenCalledWith(
        expect.any(Email),
        expect.any(TenantId),
      );
      expect(passwordHasher.hash).toHaveBeenCalledWith(input.password);
      expect(userRepository.save).toHaveBeenCalledWith(expect.any(User));
      expect(result.userId).toBeDefined();
      expect(result.email).toBe(input.email);
      expect(result.fullName).toBe(input.fullName);
      expect(result.isActive).toBe(true);
      expect(result.isEmailVerified).toBe(false);
    });

    it('应该使用提供的租户ID', async () => {
      const customTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX'; // 另一个有效的 ULID
      const inputWithTenant: SignupInputDto = {
        ...input,
        tenantId: customTenantId,
      };

      await useCase.execute(inputWithTenant);

      expect(tenantResolver.resolveTenantId).not.toHaveBeenCalled();
      expect(userRepository.emailExists).toHaveBeenCalledWith(
        expect.any(Email),
        expect.objectContaining({
          value: customTenantId,
        }),
      );
    });

    it('应该使用配置的默认用户角色', async () => {
      configService.get.mockReturnValue('ADMIN');

      await useCase.execute(input);

      const savedUser = userRepository.save.mock.calls[0][0] as User;
      expect(savedUser.role).toBe(UserRole.ADMIN);
    });

    it('应该使用默认用户角色当配置不存在时', async () => {
      configService.get.mockReturnValue(undefined);

      await useCase.execute(input);

      const savedUser = userRepository.save.mock.calls[0][0] as User;
      expect(savedUser.role).toBe(UserRole.USER);
    });

    it('应该发布领域事件', async () => {
      await useCase.execute(input);

      // 验证事件总线被调用（User.create 会发布 UserRegisteredEvent）
      // 注意：事件在 useCase.execute 中被发布，所以这里只需要验证 publish 被调用
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('应该记录日志', async () => {
      await useCase.execute(input);

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User registered successfully',
          email: input.email,
        }),
      );
    });

    it('当邮箱已存在时应该抛出 ConflictException', async () => {
      userRepository.emailExists.mockResolvedValue(true);

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(input)).rejects.toThrow(
        'Email already in use',
      );

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('应该正确处理特殊字符邮箱', async () => {
      const specialEmailInput: SignupInputDto = {
        ...input,
        email: 'test+special@example.com',
      };

      const result = await useCase.execute(specialEmailInput);

      expect(result.email).toBe(specialEmailInput.email);
    });

    it('应该正确处理长用户名', async () => {
      const longNameInput: SignupInputDto = {
        ...input,
        fullName: 'A'.repeat(200),
      };

      const result = await useCase.execute(longNameInput);

      expect(result.fullName).toBe(longNameInput.fullName);
    });
  });
});
