import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IJwtService } from '../../../shared/interfaces/jwt-service.interface';
import type { IRefreshTokenRepository } from '../../../shared/interfaces/refresh-token-repository.interface';
import { RefreshTokenCommand } from '../refresh-token.command';
import { RefreshTokenHandler } from './refresh-token.handler';

/**
 * 刷新令牌命令处理器单元测试
 *
 * 测试 RefreshTokenHandler 的所有场景。
 *
 * @describe RefreshTokenHandler
 */
describe('RefreshTokenHandler', () => {
  let handler: RefreshTokenHandler;
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<IJwtService>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRefreshToken = 'refresh-token';
  const validTokenId = 'token-id';
  const validNewAccessToken = 'new-access-token';
  const validNewRefreshToken = 'new-refresh-token';
  const validIpAddress = '127.0.0.1';
  const validUserAgent = 'Mozilla/5.0';
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

    const mockJwtService = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
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
        RefreshTokenHandler,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'IJwtService',
          useValue: mockJwtService,
        },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    handler = module.get<RefreshTokenHandler>(RefreshTokenHandler);
    userRepository = module.get('IUserRepository');
    jwtService = module.get('IJwtService');
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
    const command = new RefreshTokenCommand(
      validUserId,
      validRefreshToken,
      validIpAddress,
      validUserAgent,
    );

    beforeEach(() => {
      (command as any).tenantId = validTenantId;
    });

    it('应该成功刷新令牌', async () => {
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
      jwtService.signAccessToken.mockResolvedValue(validNewAccessToken);
      jwtService.signRefreshToken.mockResolvedValue(validNewRefreshToken);
      refreshTokenRepository.create.mockResolvedValue({
        id: 'new-token-id',
        token: validNewRefreshToken,
        userId: validUserId,
        tenantId: validTenantId,
        deviceInfo: validUserAgent,
        ipAddress: validIpAddress,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await handler.execute(command);

      expect(userRepository.findById).toHaveBeenCalled();
      expect(refreshTokenRepository.findAndVerifyToken).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
        validRefreshToken,
      );
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith(validTokenId);
      expect(jwtService.signAccessToken).toHaveBeenCalled();
      expect(jwtService.signRefreshToken).toHaveBeenCalled();
      expect(refreshTokenRepository.create).toHaveBeenCalled();
      expect(result.accessToken).toBe(validNewAccessToken);
      expect(result.refreshToken).toBe(validNewRefreshToken);
    });

    it('应该抛出 UnauthorizedException 当用户不存在时', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(handler.execute(command)).rejects.toThrow('用户不存在');

      expect(userRepository.findById).toHaveBeenCalled();
      expect(refreshTokenRepository.findAndVerifyToken).not.toHaveBeenCalled();
    });

    it('应该抛出 UnauthorizedException 当账号被禁用时', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: false,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.findById.mockResolvedValue(mockUser);

      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(handler.execute(command)).rejects.toThrow('账号已被禁用');

      expect(refreshTokenRepository.findAndVerifyToken).not.toHaveBeenCalled();
    });

    it('应该抛出 UnauthorizedException 当刷新令牌无效时', async () => {
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

      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(handler.execute(command)).rejects.toThrow('无效的刷新令牌');

      expect(refreshTokenRepository.findAndVerifyToken).toHaveBeenCalled();
      expect(jwtService.signAccessToken).not.toHaveBeenCalled();
    });
  });
});
