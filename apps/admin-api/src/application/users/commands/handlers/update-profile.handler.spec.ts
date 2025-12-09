import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IUserProfileRepository } from '../../../../domain/users/repositories/user-profile.repository.interface';
import type { ITenantResolver } from '../../../shared/interfaces/tenant-resolver.interface';
import { UpdateProfileCommand } from '../update-profile.command';
import { UpdateProfileHandler } from './update-profile.handler';

/**
 * 更新个人资料命令处理器单元测试
 *
 * 测试 UpdateProfileHandler 的所有场景。
 *
 * @describe UpdateProfileHandler
 */
describe('UpdateProfileHandler', () => {
  let handler: UpdateProfileHandler;
  let userProfileRepository: jest.Mocked<IUserProfileRepository>;
  let tenantResolver: jest.Mocked<ITenantResolver>;
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

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfileHandler,
        {
          provide: 'IUserProfileRepository',
          useValue: mockUserProfileRepository,
        },
        {
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<UpdateProfileHandler>(UpdateProfileHandler);
    userProfileRepository = module.get('IUserProfileRepository');
    tenantResolver = module.get('ITenantResolver');
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
    it('应该成功更新个人资料', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Old Name',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateProfileCommand(validUserId, 'New Name');

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      const updateProfileSpy = jest.spyOn(mockUser, 'updateProfile');
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(updateProfileSpy).toHaveBeenCalledWith('New Name');
      expect(userProfileRepository.save).toHaveBeenCalled();
      expect(result.fullName).toBe('New Name');
    });

    it('应该抛出 NotFoundException 当用户不存在时', async () => {
      const command = new UpdateProfileCommand(validUserId, 'New Name');

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userProfileRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('用户不存在');

      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.save).not.toHaveBeenCalled();
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

      const command = new UpdateProfileCommand(validUserId, 'New Name');

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'updateProfile').mockImplementation(() => {});
      const mockEvents = [{ type: 'ProfileUpdatedEvent' }];
      jest
        .spyOn(mockUser, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
