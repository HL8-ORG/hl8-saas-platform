import { describe, expect, it } from '@jest/globals';

import { buildTree } from './tree.util.js';

describe('buildTree', () => {
  describe('基本功能', () => {
    it('应该将扁平列表转换为树形结构', () => {
      const items = [
        { id: 1, name: 'Parent', pid: 0 },
        { id: 2, name: 'Child', pid: 1 },
      ];

      const tree = buildTree(items);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(1);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children?.[0].id).toBe(2);
    });

    it('应该处理多个根节点', () => {
      const items = [
        { id: 1, name: 'Root 1', pid: 0 },
        { id: 2, name: 'Root 2', pid: 0 },
        { id: 3, name: 'Child 1', pid: 1 },
        { id: 4, name: 'Child 2', pid: 2 },
      ];

      const tree = buildTree(items);

      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe(1);
      expect(tree[1].id).toBe(2);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[1].children).toHaveLength(1);
    });

    it('应该处理多层嵌套', () => {
      const items = [
        { id: 1, name: 'Level 1', pid: 0 },
        { id: 2, name: 'Level 2', pid: 1 },
        { id: 3, name: 'Level 3', pid: 2 },
      ];

      const tree = buildTree(items);

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children?.[0].children).toHaveLength(1);
      expect(tree[0].children?.[0].children?.[0].id).toBe(3);
    });
  });

  describe('自定义字段名', () => {
    it('应该支持自定义父节点字段名', () => {
      const items = [
        { id: 1, name: 'Parent', parentId: 0 },
        { id: 2, name: 'Child', parentId: 1 },
      ];

      const tree = buildTree(items, 'parentId', 'id');

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(1);
    });

    it('应该支持自定义 ID 字段名', () => {
      const items = [
        { key: 1, name: 'Parent', pid: 0 },
        { key: 2, name: 'Child', pid: 1 },
      ];

      const tree = buildTree(items, 'pid', 'key');

      expect(tree).toHaveLength(1);
      expect(tree[0].key).toBe(1);
      expect(tree[0].children?.[0].key).toBe(2);
    });

    it('应该支持字符串类型的 ID', () => {
      const items = [
        { id: 'a', name: 'Parent', pid: '0' },
        { id: 'b', name: 'Child', pid: 'a' },
      ];

      const tree = buildTree(items, 'pid', 'id');

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('a');
      expect(tree[0].children?.[0].id).toBe('b');
    });
  });

  describe('排序功能', () => {
    it('应该按排序字段对根节点排序', () => {
      const items = [
        { id: 1, name: 'Second', pid: 0, sort: 2 },
        { id: 2, name: 'First', pid: 0, sort: 1 },
        { id: 3, name: 'Third', pid: 0, sort: 3 },
      ];

      const tree = buildTree(items, 'pid', 'id', 'sort');

      expect(tree).toHaveLength(3);
      expect(tree[0].id).toBe(2); // First
      expect(tree[1].id).toBe(1); // Second
      expect(tree[2].id).toBe(3); // Third
    });

    it('应该按排序字段对子节点排序', () => {
      const items = [
        { id: 1, name: 'Parent', pid: 0, sort: 1 },
        { id: 2, name: 'Child 2', pid: 1, sort: 2 },
        { id: 3, name: 'Child 1', pid: 1, sort: 1 },
      ];

      const tree = buildTree(items, 'pid', 'id', 'sort');

      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children?.[0].id).toBe(3); // Child 1
      expect(tree[0].children?.[1].id).toBe(2); // Child 2
    });

    it('应该处理负数排序值', () => {
      const items = [
        { id: 1, name: 'Second', pid: 0, sort: 0 },
        { id: 2, name: 'First', pid: 0, sort: -1 },
      ];

      const tree = buildTree(items, 'pid', 'id', 'sort');

      expect(tree[0].id).toBe(2); // First (sort: -1)
      expect(tree[1].id).toBe(1); // Second (sort: 0)
    });
  });

  describe('边界情况', () => {
    it('应该处理空数组', () => {
      const tree = buildTree([]);
      expect(tree).toHaveLength(0);
    });

    it('应该处理只有根节点的数组', () => {
      const items = [
        { id: 1, name: 'Root 1', pid: 0 },
        { id: 2, name: 'Root 2', pid: 0 },
      ];

      const tree = buildTree(items);

      expect(tree).toHaveLength(2);
      expect(tree[0].children).toEqual([]);
      expect(tree[1].children).toEqual([]);
    });

    it('应该处理父节点 ID 为字符串 "0" 的情况', () => {
      const items = [
        { id: 1, name: 'Parent', pid: '0' },
        { id: 2, name: 'Child', pid: 1 },
      ];

      const tree = buildTree(items);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(1);
    });

    it('应该处理数字 0 和字符串 "0" 作为根节点标识', () => {
      const items = [
        { id: 1, name: 'Root 1', pid: 0 },
        { id: 2, name: 'Root 2', pid: '0' },
      ];

      const tree = buildTree(items);

      expect(tree).toHaveLength(2);
    });

    it('应该处理找不到父节点的情况（输出错误但不中断）', () => {
      const originalError = console.error;
      let errorCalled = false;
      let errorArgs: unknown[] = [];

      // 模拟 console.error
      console.error = (...args: unknown[]) => {
        errorCalled = true;
        errorArgs = args;
      };

      const items = [
        { id: 1, name: 'Orphan', pid: 999 }, // 父节点不存在
        { id: 2, name: 'Root', pid: 0 },
      ];

      const tree = buildTree(items);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(2);
      expect(errorCalled).toBe(true);
      expect(errorArgs[0]).toBe('Parent node not found for ID:');
      expect(errorArgs[1]).toBe(999);

      // 恢复原始 console.error
      console.error = originalError;
    });

    it('应该保留原始数据的所有属性', () => {
      const items = [
        {
          id: 1,
          name: 'Parent',
          pid: 0,
          extra: 'data',
          nested: { key: 'value' },
        },
        { id: 2, name: 'Child', pid: 1, extra: 'child-data' },
      ];

      const tree = buildTree(items);

      expect(tree[0].extra).toBe('data');
      expect(tree[0].nested).toEqual({ key: 'value' });
      expect(tree[0].children?.[0].extra).toBe('child-data');
    });
  });

  describe('复杂场景', () => {
    it('应该处理大型树结构', () => {
      const items: Array<{ id: number; name: string; pid: number }> = [];
      // 创建 100 个节点，每个节点有 10 个子节点
      for (let i = 0; i < 10; i++) {
        items.push({ id: i + 1, name: `Root ${i + 1}`, pid: 0 });
        for (let j = 0; j < 10; j++) {
          items.push({
            id: (i + 1) * 100 + j + 1,
            name: `Child ${j + 1}`,
            pid: i + 1,
          });
        }
      }

      const tree = buildTree(items);

      expect(tree).toHaveLength(10);
      tree.forEach((root) => {
        expect(root.children).toHaveLength(10);
      });
    });

    it('应该正确处理混合类型的 ID', () => {
      const items = [
        { id: 'root-1', name: 'Root', pid: 0 },
        { id: 2, name: 'Child', pid: 'root-1' },
      ];

      // 注意：这个场景可能会失败，因为 Map 的键类型不一致
      // 但函数应该能够处理
      const tree = buildTree(items, 'pid', 'id');

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('root-1');
    });
  });
});
