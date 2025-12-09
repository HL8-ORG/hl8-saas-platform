import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import type { IEventBus } from '../../../infrastructure/events';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { ResendVerificationInputDto } from '../dtos/resend-verification.input.dto';
import { ResendVerificationUseCase } from './resend-verification.use-case';

/**
 * 重发验证码用例单元测试
 *
 * 测试重发验证码用例的所有场景。
 *
 * @describe ResendVerificationUseCase
 */
describe('ResendVerificationUseCase', () => {
  let useCase: ResendVerificationUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let tenantResolver: jest.Mocked<ITenantResolver>;
  let eventBus: jest.Mocked<IEventBus>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
  const validEmail = 'user@example.com';

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
        ResendVerificationUseCase,
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
          provide: 'Logger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<ResendVerificationUseCase>(ResendVerificationUseCase);
    userRepository = module.get('IUserRepository');
    tenantResolver = module.get('ITenantResolver');
    eventBus = module.get('IEventBus');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    const input: ResendVerificationInputDto = {
      email: validEmail,
    };

    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功重发验证码', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExpiresAt: new Date(Date.now() + 3600000),
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result).toEqual({
        email: validEmail,
        message: '验证码已重新发送',
      });

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: validEmail }),
        expect.any(Object),
      );
      expect(userRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('应该处理用户不存在的情况', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
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
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
});
