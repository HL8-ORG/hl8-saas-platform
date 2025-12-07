import { SetMetadata } from '@nestjs/common';
import {
  PublicTenant,
  TENANT_METADATA_KEY,
  TenantAware,
} from './tenant.decorator';

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
 * 租户装饰器单元测试
 *
 * 测试租户装饰器的基本功能，验证其是否正确设置元数据。
 *
 * @describe TenantAware and PublicTenant
 */
describe('Tenant Decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TenantAware', () => {
    it('应该被定义', () => {
      expect(TenantAware).toBeDefined();
      expect(typeof TenantAware).toBe('function');
    });

    it('应该导出 TENANT_METADATA_KEY 常量', () => {
      expect(TENANT_METADATA_KEY).toBeDefined();
      expect(TENANT_METADATA_KEY).toBe('isTenantAware');
    });

    it('应该返回一个装饰器函数', () => {
      const decorator = TenantAware();

      expect(typeof decorator).toBe('function');
    });

    it('应该调用 SetMetadata 并传入正确的键和值', () => {
      TenantAware();

      expect(SetMetadata).toHaveBeenCalledWith(TENANT_METADATA_KEY, true);
      expect(SetMetadata).toHaveBeenCalledTimes(1);
    });

    it('应该可以在类装饰器中使用并设置元数据', () => {
      const decorator = TenantAware();
      class TestController {}
      decorator(TestController);

      const metadata = Reflect.getMetadata(TENANT_METADATA_KEY, TestController);
      expect(metadata).toBe(true);
    });

    it('应该可以在方法装饰器中使用并设置元数据', () => {
      const decorator = TenantAware();
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
        TENANT_METADATA_KEY,
        TestController.prototype,
        'testMethod',
      );
      expect(metadata).toBe(true);
    });
  });

  describe('PublicTenant', () => {
    it('应该被定义', () => {
      expect(PublicTenant).toBeDefined();
      expect(typeof PublicTenant).toBe('function');
    });

    it('应该返回一个装饰器函数', () => {
      const decorator = PublicTenant();

      expect(typeof decorator).toBe('function');
    });

    it('应该调用 SetMetadata 并传入正确的键和值', () => {
      jest.clearAllMocks();
      PublicTenant();

      expect(SetMetadata).toHaveBeenCalledWith(TENANT_METADATA_KEY, false);
    });

    it('应该可以在类装饰器中使用并设置元数据', () => {
      const decorator = PublicTenant();
      class TestController {}
      decorator(TestController);

      const metadata = Reflect.getMetadata(TENANT_METADATA_KEY, TestController);
      expect(metadata).toBe(false);
    });

    it('应该可以在方法装饰器中使用并设置元数据', () => {
      const decorator = PublicTenant();
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
        TENANT_METADATA_KEY,
        TestController.prototype,
        'testMethod',
      );
      expect(metadata).toBe(false);
    });

    it('PublicTenant 应该覆盖 TenantAware', () => {
      const tenantAwareDecorator = TenantAware();
      const publicTenantDecorator = PublicTenant();
      class TestController {
        tenantMethod() {}
        publicMethod() {}
      }
      tenantAwareDecorator(TestController.prototype, 'tenantMethod', {
        value: TestController.prototype.tenantMethod,
        writable: true,
        enumerable: false,
        configurable: true,
      });
      publicTenantDecorator(TestController.prototype, 'publicMethod', {
        value: TestController.prototype.publicMethod,
        writable: true,
        enumerable: false,
        configurable: true,
      });

      const tenantMetadata = Reflect.getMetadata(
        TENANT_METADATA_KEY,
        TestController.prototype,
        'tenantMethod',
      );
      const publicMetadata = Reflect.getMetadata(
        TENANT_METADATA_KEY,
        TestController.prototype,
        'publicMethod',
      );

      expect(tenantMetadata).toBe(true);
      expect(publicMetadata).toBe(false);
    });
  });
});
