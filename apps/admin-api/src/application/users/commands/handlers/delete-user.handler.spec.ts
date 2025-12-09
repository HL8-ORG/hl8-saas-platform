import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IUserProfileRepository } from '../../../../domain/users/repositories/user-profile.repository.interface';
import type { IRefreshTokenRepository } from '../../../shared/interfaces/refresh-token-repository.interface';
import { DeleteUserCommand } from '../delete-user.command';
import { DeleteUserHandler } from './delete-user.handler';

/**
 * 删除用户命令处理器单元测试
 *
 * 测试 DeleteUserHandler 的所有场景。
 *
 * @describe DeleteUserHandler
 */
describe('DeleteUserHandler', () => {
  let handler: DeleteUserHandler;
  let userProfileRepository: jest.Mocked<IUserProfileRepository>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserProfileRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockRefreshTokenRepository = {
      create: jest.fn(),
      findValidTokens: jest.fn(),
      findAllTokens: jest.fn(),
      findAndVerifyToken: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
      cleanupExpired: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUserHandler,
        {
          provide: 'IUserProfileRepository',
          useValue: mockUserProfileRepository,
        },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<DeleteUserHandler>(DeleteUserHandler);
    userProfileRepository = module.get('IUserProfileRepository');
    refreshTokenRepository = module.get('IRefreshTokenRepository');
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
    it('应该成功删除用户', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new DeleteUserCommand(validUserId, validTenantId);

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.delete.mockResolvedValue(undefined);
      refreshTokenRepository.deleteAll.mockResolvedValue(undefined);
      const deactivateSpy = jest.spyOn(mockUser, 'deactivate');
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(deactivateSpy).toHaveBeenCalled();
      expect(userProfileRepository.delete).toHaveBeenCalled();
      expect(refreshTokenRepository.deleteAll).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
      );
      expect(result).toBeDefined();
    });

    it('应该抛出 NotFoundException 当用户不存在时', async () => {
      const command = new DeleteUserCommand(validUserId, validTenantId);

      userProfileRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('用户不存在');

      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.delete).not.toHaveBeenCalled();
      expect(refreshTokenRepository.deleteAll).not.toHaveBeenCalled();
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
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new DeleteUserCommand(validUserId, validTenantId);

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.delete.mockResolvedValue(undefined);
      refreshTokenRepository.deleteAll.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'deactivate').mockImplementation(() => {});
      const mockEvents = [{ type: 'UserDeletedEvent' }];
      jest
        .spyOn(mockUser, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
