import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import { ResendVerificationCommand } from '../resend-verification.command';
import { ResendVerificationHandler } from './resend-verification.handler';

/**
 * 重发验证码命令处理器单元测试
 *
 * 测试 ResendVerificationHandler 的所有场景。
 *
 * @describe ResendVerificationHandler
 */
describe('ResendVerificationHandler', () => {
  let handler: ResendVerificationHandler;
  let userRepository: jest.Mocked<IUserRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
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
        ResendVerificationHandler,
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

    handler = module.get<ResendVerificationHandler>(ResendVerificationHandler);
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
    const command = new ResendVerificationCommand(validUserId);

    beforeEach(() => {
      (command as any).tenantId = validTenantId;
    });

    it('应该成功重发验证码', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(undefined);
      jest
        .spyOn(mockUser, 'resendVerificationCode')
        .mockImplementation(() => {});
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(userRepository.findById).toHaveBeenCalled();
      expect(mockUser.resendVerificationCode).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.email).toBe('user@example.com');
      expect(result.message).toBe('验证码已重新发送');
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
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(undefined);
      jest
        .spyOn(mockUser, 'resendVerificationCode')
        .mockImplementation(() => {});
      const mockEvents = [{ type: 'VerificationCodeResentEvent' }];
      jest
        .spyOn(mockUser, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
