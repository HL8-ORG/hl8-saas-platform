import { describe, expect, it } from '@jest/globals';
import {
  EVENT_API_KEY_VALIDATED,
  EVENT_API_ROUTE_COLLECTED,
  EVENT_OPERATION_LOG_CREATED,
} from './event-emitter-token.constant';

/**
 * 事件发射器令牌常量单元测试
 *
 * @description 验证所有事件名称常量的值是否正确
 */
describe('event-emitter-token.constant', () => {
  describe('EVENT_API_ROUTE_COLLECTED', () => {
    it('应该是 "api:route.collected"', () => {
      expect(EVENT_API_ROUTE_COLLECTED).toBe('api:route.collected');
    });

    it('应该是字符串类型', () => {
      expect(typeof EVENT_API_ROUTE_COLLECTED).toBe('string');
    });

    it('应该符合事件命名规范（使用冒号分隔命名空间）', () => {
      expect(EVENT_API_ROUTE_COLLECTED).toMatch(/^[a-z]+:[a-z.]+$/);
    });
  });

  describe('EVENT_OPERATION_LOG_CREATED', () => {
    it('应该是 "audit:operation.logged"', () => {
      expect(EVENT_OPERATION_LOG_CREATED).toBe('audit:operation.logged');
    });

    it('应该是字符串类型', () => {
      expect(typeof EVENT_OPERATION_LOG_CREATED).toBe('string');
    });

    it('应该符合事件命名规范（使用冒号分隔命名空间）', () => {
      expect(EVENT_OPERATION_LOG_CREATED).toMatch(/^[a-z]+:[a-z.]+$/);
    });
  });

  describe('EVENT_API_KEY_VALIDATED', () => {
    it('应该是 "auth:api-key.validated"', () => {
      expect(EVENT_API_KEY_VALIDATED).toBe('auth:api-key.validated');
    });

    it('应该是字符串类型', () => {
      expect(typeof EVENT_API_KEY_VALIDATED).toBe('string');
    });

    it('应该符合事件命名规范（使用冒号分隔命名空间）', () => {
      expect(EVENT_API_KEY_VALIDATED).toMatch(/^[a-z]+:[a-z.-]+$/);
    });
  });

  describe('事件名称唯一性', () => {
    it('所有事件名称应该互不相同', () => {
      const eventNames = [
        EVENT_API_ROUTE_COLLECTED,
        EVENT_OPERATION_LOG_CREATED,
        EVENT_API_KEY_VALIDATED,
      ];
      const uniqueNames = new Set(eventNames);
      expect(uniqueNames.size).toBe(eventNames.length);
    });
  });

  describe('事件命名空间', () => {
    it('应该包含不同的命名空间前缀', () => {
      const namespaces = [
        EVENT_API_ROUTE_COLLECTED.split(':')[0],
        EVENT_OPERATION_LOG_CREATED.split(':')[0],
        EVENT_API_KEY_VALIDATED.split(':')[0],
      ];
      expect(namespaces).toContain('api');
      expect(namespaces).toContain('audit');
      expect(namespaces).toContain('auth');
    });
  });
});
