import { Logger } from '@hl8/logger';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import type { IEventBus } from '../../../infrastructure/events';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { VerifyEmailInputDto } from '../dtos/verify-email.input.dto';
import { VerifyEmailUseCase } from './verify-email.use-case';

/**
 * 验证邮箱用例单元测试
 *
 * 测试验证邮箱用例的所有场景。
 *
 * @describe VerifyEmailUseCase
 */
describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let tenantResolver: jest.Mocked<ITenantResolver>;
  let eventBus: jest.Mocked<IEventBus>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
  const validEmail = 'user@example.com';
  const validCode = '123456';

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      emailExists: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyEmailUseCase,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
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
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<VerifyEmailUseCase>(VerifyEmailUseCase);
    userRepository = module.get('IUserRepository');
    tenantResolver = module.get('ITenantResolver');
    eventBus = module.get('IEventBus');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const input: VerifyEmailInputDto = {
      email: validEmail,
      code: validCode,
    };

    it('应该成功验证邮箱', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: validCode,
        emailVerificationExpiresAt: new Date(Date.now() + 3600000), // 1小时后过期
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(undefined);
      mockUser.getUncommittedEvents = jest
        .fn()
        .mockReturnValue([{ type: 'EmailVerifiedEvent' }]);
      (eventBus.publish as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.isEmailVerified).toBe(true);
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('应该处理用户不存在的情况', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('应该处理邮箱已验证的情况', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('应该处理验证码无效的情况', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: '654321', // 不同的验证码
        emailVerificationExpiresAt: new Date(Date.now() + 3600000),
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(useCase.execute(input)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('应该处理验证码已过期的情况', async () => {
      // 使用 jest.useFakeTimers 来模拟时间
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      // 创建一个在未来 1 小时后过期的验证码
      const expiresAt = new Date(now + 3600000);

      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: validCode,
        emailVerificationExpiresAt: expiresAt,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 将时间推进到过期时间之后
      jest.setSystemTime(expiresAt.getTime() + 1000);

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(useCase.execute(input)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();

      // 恢复真实时间
      jest.useRealTimers();
    });
  });
});
