import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import type { IUserProfileRepository } from '../../../domain/users/repositories/user-profile.repository.interface';
import type { IEventBus } from '../../../infrastructure/events';
import type { IRefreshTokenRepository } from '../../shared/interfaces/refresh-token-repository.interface';
import { DeleteUserInputDto } from '../dtos/delete-user.input.dto';
import { DeleteUserUseCase } from './delete-user.use-case';

/**
 * 删除用户用例单元测试
 *
 * 测试删除用户用例的所有场景。
 *
 * @describe DeleteUserUseCase
 */
describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let userProfileRepository: jest.Mocked<IUserProfileRepository>;
  let eventBus: jest.Mocked<IEventBus>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserProfileRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    const mockRefreshTokenRepository = {
      deleteAll: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
      findByToken: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUserUseCase,
        {
          provide: 'IUserProfileRepository',
          useValue: mockUserProfileRepository,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteUserUseCase>(DeleteUserUseCase);
    userProfileRepository = module.get('IUserProfileRepository');
    eventBus = module.get('IEventBus');
    refreshTokenRepository = module.get('IRefreshTokenRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('应该删除用户并清除刷新令牌', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
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

      const input = new DeleteUserInputDto(validUserId, validTenantId);

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      mockUser.getUncommittedEvents = jest.fn().mockReturnValue([]);
      (eventBus.publishAll as jest.Mock).mockResolvedValue(undefined);
      refreshTokenRepository.deleteAll.mockResolvedValue(undefined);

      await useCase.execute(input);

      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.save).toHaveBeenCalled();
      expect(mockUser.isActive).toBe(false);
      expect(refreshTokenRepository.deleteAll).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
      );
    });

    it('应该处理用户不存在的情况', async () => {
      const input = new DeleteUserInputDto(validUserId, validTenantId);

      userProfileRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.save).not.toHaveBeenCalled();
      expect(refreshTokenRepository.deleteAll).not.toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
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

      const input = new DeleteUserInputDto(validUserId, validTenantId);
      const mockEvents = [{ type: 'UserDeactivatedEvent' }];

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      mockUser.getUncommittedEvents = jest.fn().mockReturnValue(mockEvents);
      (eventBus.publishAll as jest.Mock).mockResolvedValue(undefined);
      refreshTokenRepository.deleteAll.mockResolvedValue(undefined);

      await useCase.execute(input);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
