import { Logger } from '@hl8/logger';
import { MailService } from '@hl8/mail';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { TENANT_CONTEXT_KEY } from '../../common/constants/tenant.constants';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { User } from '../../entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { SignupDto } from './dtos/signup.dto';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

/**
 * 认证服务单元测试
 *
 * 测试认证服务的核心业务逻辑，包括注册、登录、令牌刷新和登出功能。
 *
 * @describe AuthService
 */
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;
  let logger: jest.Mocked<Logger>;

  const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    fullName: 'Test User',
    role: 'USER',
    tenantId: mockTenantId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockRefreshToken: RefreshToken = {
    id: 'token-1',
    token: 'hashed-refresh-token',
    userId: 'user-1',
    tenantId: mockTenantId,
    deviceInfo: 'Test Device',
    ipAddress: '127.0.0.1',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as RefreshToken;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockRefreshTokenRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const mockMailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockRequest = {
      [TENANT_CONTEXT_KEY]: mockTenantId,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    mailService = module.get(MailService);
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    logger = module.get(Logger);

    // 设置默认配置值
    configService.get.mockImplementation((key: string) => {
      const defaults: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_EXPIRY: '15m',
        JWT_REFRESH_EXPIRY: '30d',
      };
      return defaults[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test User',
    };

    it('应该成功注册新用户', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      // Mock bcrypt.hash
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.signup(signupDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: signupDto.email, tenantId: mockTenantId },
      });
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('message', 'User registered successfully');
      expect(result.user).toHaveProperty('id', mockUser.id);
      expect(result.user).toHaveProperty('email', mockUser.email);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('当邮箱已存在时应该抛出 ConflictException', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('应该成功登录并返回令牌', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);
      refreshTokenRepository.find.mockResolvedValue([]);
      refreshTokenRepository.createQueryBuilder.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      } as any);

      const result = await service.login(loginDto, 'Device', '127.0.0.1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email, tenantId: mockTenantId },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
    });

    it('当用户不存在时应该抛出 UnauthorizedException', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('dummy-hash');
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('当密码错误时应该抛出 UnauthorizedException', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('当用户未激活时应该抛出 UnauthorizedException', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const userId = 'user-1';
    const refreshToken = 'refresh-token';

    it('应该成功刷新令牌', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      refreshTokenRepository.find.mockResolvedValue([mockRefreshToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh-token');

      const result = await service.refreshToken(userId, refreshToken);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, tenantId: mockTenantId },
      });
      expect(refreshTokenRepository.find).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          tenantId: mockUser.tenantId,
          expiresAt: expect.any(Object),
        },
      });
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(refreshTokenRepository.update).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
    });

    it('当用户不存在时应该抛出 ForbiddenException', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(userId, refreshToken)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('当用户未激活时应该抛出 ForbiddenException', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken(userId, refreshToken)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('当刷新令牌无效时应该抛出 UnauthorizedException', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      refreshTokenRepository.find.mockResolvedValue([mockRefreshToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshToken(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    const userId = 'user-1';

    it('应该成功登出（单设备）', async () => {
      const refreshToken = 'refresh-token';
      refreshTokenRepository.find.mockResolvedValue([mockRefreshToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      refreshTokenRepository.delete.mockResolvedValue(undefined as any);

      const result = await service.logout(userId, refreshToken);

      expect(refreshTokenRepository.find).toHaveBeenCalledWith({
        where: { userId, tenantId: mockTenantId },
      });
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith(
        mockRefreshToken.id,
      );
      expect(result).toHaveProperty('message', 'Logged out successfully');
    });

    it('应该成功登出（全设备）', async () => {
      refreshTokenRepository.delete.mockResolvedValue(undefined as any);

      const result = await service.logout(userId);

      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        userId,
        tenantId: mockTenantId,
      });
      expect(result).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('getMe', () => {
    const userId = 'user-1';

    it('应该返回用户信息', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getMe(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, tenantId: mockTenantId },
      });
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('fullName', mockUser.fullName);
      expect(result).toHaveProperty('role', mockUser.role);
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getMe(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('hashData', () => {
    it('应该成功哈希数据', async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-data');

      const result = await service.hashData('test-data');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith('test-data', 'salt');
      expect(result).toBe('hashed-data');
    });
  });

  describe('generateTokens', () => {
    it('应该生成访问令牌和刷新令牌', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.generateTokens(mockUser);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      // 验证 payload 包含 tenantId
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          role: mockUser.role,
          email: mockUser.email,
          tenantId: mockUser.tenantId,
        }),
        expect.any(Object),
      );
      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
    });
  });
});
