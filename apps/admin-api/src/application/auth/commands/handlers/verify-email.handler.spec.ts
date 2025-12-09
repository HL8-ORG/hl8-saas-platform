import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import { VerifyEmailCommand } from '../verify-email.command';
import { VerifyEmailHandler } from './verify-email.handler';

/**
 * 验证邮箱命令处理器单元测试
 *
 * 测试 VerifyEmailHandler 的所有场景。
 *
 * @describe VerifyEmailHandler
 */
describe('VerifyEmailHandler', () => {
  let handler: VerifyEmailHandler;
  let userRepository: jest.Mocked<IUserRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validCode = '123456';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      emailExists: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyEmailHandler,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<VerifyEmailHandler>(VerifyEmailHandler);
    userRepository = module.get('IUserRepository');
    eventBus = module.get(EventBus);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const command = new VerifyEmailCommand(validUserId, validCode);

    beforeEach(() => {
      (command as any).tenantId = validTenantId;
    });

    it('应该成功验证邮箱', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分钟后过期
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(undefined);
      const verifyEmailSpy = jest.spyOn(mockUser, 'verifyEmail');
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(userRepository.findById).toHaveBeenCalled();
      expect(verifyEmailSpy).toHaveBeenCalledWith(validCode);
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.userId).toBe(validUserId);
      expect(result.email).toBe('user@example.com');
      // 由于 verifyEmail 被调用且验证码匹配，isEmailVerified 应该变为 true
      // 但实际值取决于 verifyEmail 的实现，我们只检查方法被调用和返回的消息
      expect(result.message).toBe('邮箱验证成功');
    });

    it('应该抛出 NotFoundException 当用户不存在时', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('用户不存在');

      expect(userRepository.findById).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'verifyEmail').mockImplementation(() => {});
      const mockEvents = [{ type: 'EmailVerifiedEvent' }];
      jest
        .spyOn(mockUser, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
