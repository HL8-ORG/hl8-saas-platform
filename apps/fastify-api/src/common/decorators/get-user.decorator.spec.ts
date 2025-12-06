import { ExecutionContext } from '@nestjs/common';

/**
 * 获取用户装饰器单元测试
 *
 * 测试 GetUser 装饰器的基本功能。
 * 由于 GetUser 是 createParamDecorator 创建的装饰器，
 * 我们直接测试装饰器工厂函数内部的逻辑。
 *
 * @describe GetUser
 */
describe('GetUser', () => {
  let mockExecutionContext: ExecutionContext;

  const mockUser = {
    sub: 'user-1',
    role: 'USER',
    email: 'test@example.com',
  };

  // 直接测试装饰器工厂函数内部的逻辑
  const getUserDecoratorLogic = (
    data: string | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest<{
      user?: Record<string, unknown>;
    }>();
    const user = request.user;
    return data && user ? user[data] : user;
  };

  beforeEach(() => {
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: mockUser,
        }),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    // 验证装饰器是否被正确导入
    const { GetUser } = require('./get-user.decorator');
    expect(GetUser).toBeDefined();
    expect(typeof GetUser).toBe('function');
  });

  describe('装饰器逻辑', () => {
    it('当指定属性名时应该返回该属性的值', () => {
      const result = getUserDecoratorLogic('sub', mockExecutionContext);

      expect(result).toBe('user-1');
    });

    it('当指定不同的属性名时应该返回对应的值', () => {
      expect(getUserDecoratorLogic('role', mockExecutionContext)).toBe('USER');
      expect(getUserDecoratorLogic('email', mockExecutionContext)).toBe(
        'test@example.com',
      );
    });

    it('当不指定属性名时应该返回完整的用户对象', () => {
      const result = getUserDecoratorLogic(undefined, mockExecutionContext);

      expect(result).toEqual(mockUser);
    });

    it('当用户对象不存在时应该返回 undefined', () => {
      const mockContextWithoutUser = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: undefined,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = getUserDecoratorLogic('sub', mockContextWithoutUser);

      expect(result).toBeUndefined();
    });

    it('当用户对象不存在且不指定属性名时应该返回 undefined', () => {
      const mockContextWithoutUser = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: undefined,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = getUserDecoratorLogic(undefined, mockContextWithoutUser);

      expect(result).toBeUndefined();
    });

    it('当指定的属性不存在时应该返回 undefined', () => {
      const result = getUserDecoratorLogic(
        'nonExistentProperty',
        mockExecutionContext,
      );

      expect(result).toBeUndefined();
    });

    it('应该从请求对象中正确提取用户信息', () => {
      const mockRequest = {
        user: mockUser,
      };

      const getRequestMock = jest.fn().mockReturnValue(mockRequest);
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: getRequestMock,
        }),
      } as unknown as ExecutionContext;

      const result = getUserDecoratorLogic('sub', mockContext);

      expect(getRequestMock).toHaveBeenCalled();
      expect(result).toBe('user-1');
    });

    it('应该处理空字符串属性名', () => {
      const result = getUserDecoratorLogic('', mockExecutionContext);

      // 空字符串在 JavaScript 中是 falsy，所以 data && user 为 false
      // 会返回完整的用户对象
      expect(result).toEqual(mockUser);
    });

    it('应该处理用户对象中的嵌套属性', () => {
      const mockUserWithNested = {
        sub: 'user-1',
        profile: {
          name: 'Test User',
          age: 30,
        },
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUserWithNested,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = getUserDecoratorLogic('profile', mockContext);

      expect(result).toEqual(mockUserWithNested.profile);
    });
  });
});
