import { SetMetadata } from '@nestjs/common';
import { Public, isPublic } from './public.decorator';

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
 * 公共路由装饰器单元测试
 *
 * 测试 Public 装饰器的基本功能，验证其是否正确设置元数据。
 *
 * @describe Public
 */
describe('Public', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(Public).toBeDefined();
    expect(typeof Public).toBe('function');
  });

  it('应该导出 isPublic 常量', () => {
    expect(isPublic).toBeDefined();
    expect(isPublic).toBe('isPublic');
  });

  it('应该返回一个装饰器函数', () => {
    const decorator = Public();

    expect(typeof decorator).toBe('function');
  });

  it('应该调用 SetMetadata 并传入正确的键和值', () => {
    Public();

    expect(SetMetadata).toHaveBeenCalledWith(isPublic, true);
    expect(SetMetadata).toHaveBeenCalledTimes(1);
  });

  it('应该可以在类装饰器中使用并设置元数据', () => {
    const decorator = Public();
    class TestController {}
    decorator(TestController);

    const metadata = Reflect.getMetadata(isPublic, TestController);
    expect(metadata).toBe(true);
  });

  it('应该可以在方法装饰器中使用并设置元数据', () => {
    const decorator = Public();
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
      isPublic,
      TestController.prototype,
      'testMethod',
    );
    expect(metadata).toBe(true);
  });

  it('应该正确设置元数据值为 true', () => {
    const decorator = Public();
    class TestController {
      publicMethod() {}
      privateMethod() {}
    }
    decorator(TestController.prototype, 'publicMethod', {
      value: TestController.prototype.publicMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const publicMetadata = Reflect.getMetadata(
      isPublic,
      TestController.prototype,
      'publicMethod',
    );
    const privateMetadata = Reflect.getMetadata(
      isPublic,
      TestController.prototype,
      'privateMethod',
    );

    expect(publicMetadata).toBe(true);
    expect(privateMetadata).toBeUndefined();
  });

  it('应该可以在多个方法上使用', () => {
    const decorator1 = Public();
    const decorator2 = Public();
    class TestController {
      method1() {}
      method2() {}
    }
    decorator1(TestController.prototype, 'method1', {
      value: TestController.prototype.method1,
      writable: true,
      enumerable: false,
      configurable: true,
    });
    decorator2(TestController.prototype, 'method2', {
      value: TestController.prototype.method2,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const metadata1 = Reflect.getMetadata(
      isPublic,
      TestController.prototype,
      'method1',
    );
    const metadata2 = Reflect.getMetadata(
      isPublic,
      TestController.prototype,
      'method2',
    );

    expect(metadata1).toBe(true);
    expect(metadata2).toBe(true);
  });

  it('应该可以在类和方法的组合中使用', () => {
    const classDecorator = Public();
    const methodDecorator = Public();
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

    const classMetadata = Reflect.getMetadata(isPublic, TestController);
    const method1Metadata = Reflect.getMetadata(
      isPublic,
      TestController.prototype,
      'method1',
    );
    const method2Metadata = Reflect.getMetadata(
      isPublic,
      TestController.prototype,
      'method2',
    );

    expect(classMetadata).toBe(true);
    expect(method1Metadata).toBe(true);
    expect(method2Metadata).toBeUndefined();
  });
});
