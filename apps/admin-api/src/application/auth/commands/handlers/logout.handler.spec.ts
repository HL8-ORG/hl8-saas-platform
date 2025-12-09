import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IRefreshTokenRepository } from '../../../shared/interfaces/refresh-token-repository.interface';
import { LogoutCommand } from '../logout.command';
import { LogoutHandler } from './logout.handler';

/**
 * 登出命令处理器单元测试
 *
 * 测试 LogoutHandler 的所有场景。
 *
 * @describe LogoutHandler
 */
describe('LogoutHandler', () => {
  let handler: LogoutHandler;
  let userRepository: jest.Mocked<IUserRepository>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRefreshToken = 'refresh-token';
  const validTokenId = 'token-id';
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutHandler,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    handler = module.get<LogoutHandler>(LogoutHandler);
    userRepository = module.get('IUserRepository');
    refreshTokenRepository = module.get('IRefreshTokenRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该成功登出（带刷新令牌）', async () => {
      const command = new LogoutCommand(validUserId, validRefreshToken);
      (command as any).tenantId = validTenantId;

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

      userRepository.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.findAndVerifyToken.mockResolvedValue(validTokenId);
      refreshTokenRepository.delete.mockResolvedValue(undefined);

      const result = await handler.execute(command);

      expect(userRepository.findById).toHaveBeenCalled();
      expect(refreshTokenRepository.findAndVerifyToken).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
        validRefreshToken,
      );
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith(validTokenId);
      expect(result.message).toBe('登出成功');
    });

    it('应该成功登出（不带刷新令牌，删除所有令牌）', async () => {
      const command = new LogoutCommand(validUserId);
      (command as any).tenantId = validTenantId;

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

      userRepository.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.deleteAll.mockResolvedValue(undefined);

      const result = await handler.execute(command);

      expect(userRepository.findById).toHaveBeenCalled();
      expect(refreshTokenRepository.deleteAll).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
      );
      expect(refreshTokenRepository.findAndVerifyToken).not.toHaveBeenCalled();
      expect(result.message).toBe('登出成功');
    });

    it('应该成功登出（用户不存在）', async () => {
      const command = new LogoutCommand(validUserId);
      (command as any).tenantId = validTenantId;

      userRepository.findById.mockResolvedValue(null);

      const result = await handler.execute(command);

      expect(userRepository.findById).toHaveBeenCalled();
      expect(refreshTokenRepository.deleteAll).not.toHaveBeenCalled();
      expect(result.message).toBe('登出成功');
    });

    it('应该处理刷新令牌验证失败的情况', async () => {
      const command = new LogoutCommand(validUserId, validRefreshToken);
      (command as any).tenantId = validTenantId;

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

      userRepository.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.findAndVerifyToken.mockResolvedValue(null);

      const result = await handler.execute(command);

      expect(refreshTokenRepository.findAndVerifyToken).toHaveBeenCalled();
      expect(refreshTokenRepository.delete).not.toHaveBeenCalled();
      expect(result.message).toBe('登出成功');
    });
  });
});
