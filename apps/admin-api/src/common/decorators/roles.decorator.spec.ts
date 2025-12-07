import { SetMetadata } from '@nestjs/common';
import { Roles, ROLES_KEY } from './roles.decorator';

// Mock SetMetadata
jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    SetMetadata: jest.fn((key: string, value: unknown) => {
      // 返回一个装饰器函数，该函数会设置元数据
      return (target: any, propertyKey?: string | symbol) => {
        if (propertyKey) {
          Reflect.defineMetadata(key, value, target, propertyKey);
        } else {
          Reflect.defineMetadata(key, value, target);
        }
      };
    }),
  };
});

/**
 * 角色装饰器单元测试
 *
 * 测试 Roles 装饰器的基本功能，验证其是否正确设置角色元数据。
 *
 * @describe Roles
 */
describe('Roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(Roles).toBeDefined();
    expect(typeof Roles).toBe('function');
  });

  it('应该导出 ROLES_KEY 常量', () => {
    expect(ROLES_KEY).toBeDefined();
    expect(ROLES_KEY).toBe('roles');
  });

  it('应该返回一个装饰器函数', () => {
    const decorator = Roles('ADMIN');

    expect(typeof decorator).toBe('function');
  });

  it('应该调用 SetMetadata 并传入正确的键和角色数组', () => {
    Roles('ADMIN');

    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['ADMIN']);
    expect(SetMetadata).toHaveBeenCalledTimes(1);
  });

  it('应该正确处理多个角色参数', () => {
    Roles('ADMIN', 'MODERATOR', 'USER');

    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, [
      'ADMIN',
      'MODERATOR',
      'USER',
    ]);
  });

  it('应该正确处理空参数（空数组）', () => {
    Roles();

    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, []);
  });

  it('应该可以在类装饰器中使用并设置元数据', () => {
    const decorator = Roles('ADMIN');
    class TestController {}
    decorator(TestController);

    const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
    expect(metadata).toEqual(['ADMIN']);
  });

  it('应该可以在方法装饰器中使用并设置元数据', () => {
    const decorator = Roles('ADMIN');
    class TestController {
      testMethod() {}
    }
    decorator(TestController.prototype, 'testMethod', {
      value: TestController.prototype.testMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'testMethod',
    );
    expect(metadata).toEqual(['ADMIN']);
  });

  it('应该正确处理单个角色', () => {
    const decorator = Roles('ADMIN');
    class TestController {
      adminMethod() {}
    }
    decorator(TestController.prototype, 'adminMethod', {
      value: TestController.prototype.adminMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'adminMethod',
    );
    expect(metadata).toEqual(['ADMIN']);
  });

  it('应该正确处理多个角色', () => {
    const decorator = Roles('ADMIN', 'MODERATOR', 'USER');
    class TestController {
      multiRoleMethod() {}
    }
    decorator(TestController.prototype, 'multiRoleMethod', {
      value: TestController.prototype.multiRoleMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'multiRoleMethod',
    );
    expect(metadata).toEqual(['ADMIN', 'MODERATOR', 'USER']);
  });

  it('应该正确处理两个角色', () => {
    const decorator = Roles('ADMIN', 'MODERATOR');
    class TestController {
      twoRoleMethod() {}
    }
    decorator(TestController.prototype, 'twoRoleMethod', {
      value: TestController.prototype.twoRoleMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'twoRoleMethod',
    );
    expect(metadata).toEqual(['ADMIN', 'MODERATOR']);
  });

  it('应该正确处理空参数（空数组）', () => {
    const decorator = Roles();
    class TestController {
      emptyRoleMethod() {}
    }
    decorator(TestController.prototype, 'emptyRoleMethod', {
      value: TestController.prototype.emptyRoleMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'emptyRoleMethod',
    );
    expect(metadata).toEqual([]);
  });

  it('应该可以在多个方法上使用不同的角色', () => {
    const adminDecorator = Roles('ADMIN');
    const userDecorator = Roles('USER');
    class TestController {
      adminMethod() {}
      userMethod() {}
    }
    adminDecorator(TestController.prototype, 'adminMethod', {
      value: TestController.prototype.adminMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });
    userDecorator(TestController.prototype, 'userMethod', {
      value: TestController.prototype.userMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const adminMetadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'adminMethod',
    );
    const userMetadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'userMethod',
    );

    expect(adminMetadata).toEqual(['ADMIN']);
    expect(userMetadata).toEqual(['USER']);
  });

  it('应该正确处理角色名称的大小写', () => {
    const decorator = Roles('admin', 'Admin', 'ADMIN');
    class TestController {
      caseSensitiveMethod() {}
    }
    decorator(TestController.prototype, 'caseSensitiveMethod', {
      value: TestController.prototype.caseSensitiveMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'caseSensitiveMethod',
    );
    expect(metadata).toEqual(['admin', 'Admin', 'ADMIN']);
  });

  it('应该正确处理包含特殊字符的角色名称', () => {
    const decorator = Roles('ADMIN_USER', 'MODERATOR-ROLE', 'USER_ROLE_1');
    class TestController {
      specialCharMethod() {}
    }
    decorator(TestController.prototype, 'specialCharMethod', {
      value: TestController.prototype.specialCharMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'specialCharMethod',
    );
    expect(metadata).toEqual(['ADMIN_USER', 'MODERATOR-ROLE', 'USER_ROLE_1']);
  });

  it('应该正确处理重复的角色', () => {
    const decorator = Roles('ADMIN', 'ADMIN', 'USER');
    class TestController {
      duplicateRoleMethod() {}
    }
    decorator(TestController.prototype, 'duplicateRoleMethod', {
      value: TestController.prototype.duplicateRoleMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'duplicateRoleMethod',
    );
    expect(metadata).toEqual(['ADMIN', 'ADMIN', 'USER']);
  });

  it('应该可以在类和方法的组合中使用', () => {
    const classDecorator = Roles('ADMIN');
    const methodDecorator = Roles('MODERATOR');
    class TestController {
      method1() {}
      method2() {}
    }
    classDecorator(TestController);
    methodDecorator(TestController.prototype, 'method1', {
      value: TestController.prototype.method1,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const classMetadata = Reflect.getMetadata(ROLES_KEY, TestController);
    const method1Metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'method1',
    );
    const method2Metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype,
      'method2',
    );
    expect(classMetadata).toEqual(['ADMIN']);
    expect(method1Metadata).toEqual(['MODERATOR']);
    expect(method2Metadata).toBeUndefined();
  });
});
