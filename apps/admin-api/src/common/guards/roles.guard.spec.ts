import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard, UserRole } from './roles.guard';

/**
 * 角色守卫单元测试
 *
 * 测试基于角色的访问控制守卫逻辑。
 *
 * @describe RolesGuard
 */
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: {
      user?: { role?: UserRole | string; [key: string]: unknown };
    };

    beforeEach(() => {
      mockRequest = {};

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it('当没有角色要求时应该允许通过', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('当用户角色匹配要求时应该允许通过', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockRequest.user = { role: UserRole.ADMIN };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('当用户角色在允许列表中时应该允许通过', () => {
      reflector.getAllAndOverride.mockReturnValue([
        UserRole.USER,
        UserRole.ADMIN,
      ]);
      mockRequest.user = { role: UserRole.USER };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('当用户不存在时应该抛出 UnauthorizedException', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockRequest.user = undefined;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('当用户角色不存在时应该抛出 ForbiddenException', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockRequest.user = {};

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('当用户角色不匹配时应该抛出 ForbiddenException', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockRequest.user = { role: UserRole.USER };

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('应该支持字符串类型的角色', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockRequest.user = { role: 'ADMIN' };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('应该从路由元数据中获取角色要求', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      mockRequest.user = { role: UserRole.ADMIN };

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });
  });
});
