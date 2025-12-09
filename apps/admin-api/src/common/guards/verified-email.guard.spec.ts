import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { FastifyRequest } from 'fastify';
import { Repository } from 'typeorm';
import { User } from '../../infrastructure/persistence/typeorm/entities/user.entity';
import { VerifiedEmailGuard } from './verified-email.guard';

/**
 * 邮箱验证守卫单元测试
 *
 * 测试邮箱验证守卫的逻辑，确保只有已验证邮箱的用户才能访问受保护的端点。
 *
 * @describe VerifiedEmailGuard
 */
describe('VerifiedEmailGuard', () => {
  let guard: VerifiedEmailGuard;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: 'hashed-password',
    role: 'USER' as any,
    isActive: true,
    isEmailVerified: true,
    refreshToken: null,
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUnverifiedUser: User = {
    ...mockUser,
    isEmailVerified: false,
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifiedEmailGuard,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    guard = module.get<VerifiedEmailGuard>(VerifiedEmailGuard);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: FastifyRequest & {
      user?: {
        sub?: string;
        [key: string]: unknown;
      };
    };

    beforeEach(() => {
      mockRequest = {
        headers: {},
        ip: '127.0.0.1',
        user: {
          sub: 'user-1',
        },
      } as unknown as FastifyRequest & {
        user?: {
          sub?: string;
          [key: string]: unknown;
        };
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it('当用户邮箱已验证时应该允许通过', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: ['id', 'isEmailVerified'],
      });
    });

    it('当用户邮箱未验证时应该抛出 UnauthorizedException', async () => {
      userRepository.findOne.mockResolvedValue(mockUnverifiedUser);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        '邮箱未验证，请先验证邮箱',
      );
    });

    it('当用户未认证时应该抛出 UnauthorizedException', async () => {
      mockRequest.user = undefined;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        '用户未认证',
      );
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('当用户 ID 不存在时应该抛出 UnauthorizedException', async () => {
      mockRequest.user = {};

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        '用户未认证',
      );
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('当用户不存在时应该抛出 UnauthorizedException', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        '用户不存在',
      );
    });

    it('应该从 JWT 载荷中提取用户 ID', async () => {
      mockRequest.user = {
        sub: 'custom-user-id',
      };
      userRepository.findOne.mockResolvedValue(mockUser);

      await guard.canActivate(mockExecutionContext);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'custom-user-id' },
        select: ['id', 'isEmailVerified'],
      });
    });

    it('应该只查询必要的字段', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await guard.canActivate(mockExecutionContext);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: ['id', 'isEmailVerified'],
      });
    });

    it('应该正确处理数据库查询错误', async () => {
      userRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
