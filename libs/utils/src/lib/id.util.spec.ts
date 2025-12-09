import { describe, expect, it } from '@jest/globals';

import { UlidGenerator } from './id.util.js';

describe('UlidGenerator', () => {
  describe('generate', () => {
    it('应该生成一个字符串', () => {
      const id = UlidGenerator.generate();
      expect(typeof id).toBe('string');
    });

    it('生成的 ID 长度应为 26 个字符', () => {
      const id = UlidGenerator.generate();
      expect(id.length).toBe(26);
    });

    it('每次生成的 ID 应该不同', () => {
      const id1 = UlidGenerator.generate();
      const id2 = UlidGenerator.generate();
      expect(id1).not.toBe(id2);
    });

    it('生成的 ID 应该只包含大写字母和数字', () => {
      const id = UlidGenerator.generate();
      expect(id).toMatch(/^[A-Z0-9]+$/);
    });

    it('生成的 ID 不应该包含易混淆字符（O, I, L, U）', () => {
      const id = UlidGenerator.generate();
      // ULID 使用 Crockford 的 Base32 编码，不包含 O, I, L, U（但包含 0 和 1）
      // 字符集：0123456789ABCDEFGHJKMNPQRSTVWXYZ
      expect(id).not.toMatch(/[OILU]/);
    });

    it('连续生成的 ID 应该按字典序排序（时间戳有序）', async () => {
      const ids: string[] = [];
      for (let i = 0; i < 10; i++) {
        ids.push(UlidGenerator.generate());
        // 添加小延迟以确保时间戳不同
        if (i < 9) {
          await new Promise((resolve) => setTimeout(resolve, 2));
        }
      }

      // 验证 ID 按字典序排序（时间戳部分递增）
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i] > ids[i - 1]).toBe(true);
      }
    });

    it('生成的 ID 应该符合 ULID 格式', () => {
      const id = UlidGenerator.generate();
      // ULID 格式：26 个字符，使用 Crockford Base32 编码
      // 字符集：0123456789ABCDEFGHJKMNPQRSTVWXYZ（不包含 I, L, O, U）
      // 注意：包含 0 和 1，但不包含 O, I, L, U
      expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(id).not.toMatch(/[OILU]/);
    });

    it('批量生成应该产生唯一 ID', () => {
      const ids = new Set<string>();
      const count = 100;

      for (let i = 0; i < count; i++) {
        ids.add(UlidGenerator.generate());
      }

      expect(ids.size).toBe(count);
    });
  });
});
