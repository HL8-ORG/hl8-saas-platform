import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IJwtService } from '../../../shared/interfaces/jwt-service.interface';
import type { IPasswordHasher } from '../../../shared/interfaces/password-hasher.interface';
import type { IRefreshTokenRepository } from '../../../shared/interfaces/refresh-token-repository.interface';
import { LoginCommand } from '../login.command';
import { LoginHandler } from './login.handler';

/**
 * 登录命令处理器单元测试
 *
 * 测试 LoginHandler 的所有场景。
 *
 * @describe LoginHandler
 */
describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let jwtService: jest.Mocked<IJwtService>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;

  const validEmail = 'user@example.com';
  const validPassword = 'password123';
  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
  const validAccessToken = 'access-token';
  const validRefreshToken = 'refresh-token';
  const validIpAddress = '127.0.0.1';
  const validUserAgent = 'Mozilla/5.0';

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      emailExists: jest.fn(),
      delete: jest.fn(),
    };

    const mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
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
        LoginHandler,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'IPasswordHasher',
          useValue: mockPasswordHasher,
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

    handler = module.get<LoginHandler>(LoginHandler);
    userRepository = module.get('IUserRepository');
    passwordHasher = module.get('IPasswordHasher');
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
    const command = new LoginCommand(
      validEmail,
      validPassword,
      validIpAddress,
      validUserAgent,
    );

    beforeEach(() => {
      // 设置 tenantId
      (command as any).tenantId = validTenantId;
    });

    it('应该成功登录', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
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

      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordHasher.verify.mockResolvedValue(true);
      jwtService.signAccessToken.mockResolvedValue(validAccessToken);
      jwtService.signRefreshToken.mockResolvedValue(validRefreshToken);
      refreshTokenRepository.create.mockResolvedValue({
        id: 'token-id',
        token: validRefreshToken,
        userId: validUserId,
        tenantId: validTenantId,
        deviceInfo: validUserAgent,
        ipAddress: validIpAddress,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await handler.execute(command);

      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(passwordHasher.verify).toHaveBeenCalledWith(
        validPassword,
        validBcryptHash,
      );
      expect(jwtService.signAccessToken).toHaveBeenCalled();
      expect(jwtService.signRefreshToken).toHaveBeenCalled();
      expect(refreshTokenRepository.create).toHaveBeenCalled();
      expect(result.accessToken).toBe(validAccessToken);
      expect(result.refreshToken).toBe(validRefreshToken);
      expect(result.user).toMatchObject({
        id: validUserId,
        email: validEmail,
        fullName: 'Test User',
        role: UserRole.USER,
      });
    });

    it('应该抛出 UnauthorizedException 当用户不存在时', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(handler.execute(command)).rejects.toThrow('邮箱或密码错误');

      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(passwordHasher.verify).not.toHaveBeenCalled();
    });

    it('应该抛出 UnauthorizedException 当密码错误时', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
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

      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordHasher.verify.mockResolvedValue(false);

      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(handler.execute(command)).rejects.toThrow('邮箱或密码错误');

      expect(passwordHasher.verify).toHaveBeenCalled();
      expect(jwtService.signAccessToken).not.toHaveBeenCalled();
    });

    it('应该抛出 UnauthorizedException 当账号被禁用时', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
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

      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordHasher.verify.mockResolvedValue(true);

      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(handler.execute(command)).rejects.toThrow('账号已被禁用');

      expect(jwtService.signAccessToken).not.toHaveBeenCalled();
    });
  });
});
