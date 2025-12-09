import { describe, expect, it } from '@jest/globals';

import type { RecordNamePaths } from './type.util.js';

describe('RecordNamePaths', () => {
  /**
   * 类型工具主要是编译时类型检查，这里通过实际使用场景来验证类型正确性
   */

  it('应该能够提取简单对象的键路径', () => {
    type Simple = {
      a: string;
      b: number;
      c: boolean;
    };

    // 类型检查：这些路径应该是有效的
    const validPaths: RecordNamePaths<Simple>[] = ['a', 'b', 'c'];
    expect(validPaths).toHaveLength(3);
  });

  it('应该能够提取嵌套对象的键路径', () => {
    type Nested = {
      a: string;
      b: {
        c: number;
        d: boolean;
      };
    };

    // 类型检查：这些路径应该是有效的
    const validPaths: RecordNamePaths<Nested>[] = ['a', 'b', 'b.c', 'b.d'];
    expect(validPaths).toHaveLength(4);
  });

  it('应该能够处理深层嵌套对象', () => {
    type DeepNested = {
      level1: {
        level2: {
          level3: string;
        };
      };
    };

    // 类型检查：这些路径应该是有效的
    const validPaths: RecordNamePaths<DeepNested>[] = [
      'level1',
      'level1.level2',
      'level1.level2.level3',
    ];
    expect(validPaths).toHaveLength(3);
  });

  it('应该能够处理混合类型的嵌套', () => {
    type Mixed = {
      name: string;
      age: number;
      address: {
        street: string;
        city: string;
        zip: number;
      };
      tags: string[];
    };

    // 类型检查：这些路径应该是有效的
    const validPaths: RecordNamePaths<Mixed>[] = [
      'name',
      'age',
      'address',
      'address.street',
      'address.city',
      'address.zip',
      'tags',
    ];
    expect(validPaths).toHaveLength(7);
  });

  it('应该能够处理多个嵌套层级', () => {
    type MultiLevel = {
      a: string;
      b: {
        c: number;
        d: {
          e: boolean;
          f: {
            g: string;
          };
        };
      };
    };

    // 类型检查：这些路径应该是有效的
    const validPaths: RecordNamePaths<MultiLevel>[] = [
      'a',
      'b',
      'b.c',
      'b.d',
      'b.d.e',
      'b.d.f',
      'b.d.f.g',
    ];
    expect(validPaths).toHaveLength(7);
  });

  it('应该能够处理空对象类型', () => {
    type Empty = Record<string, never>;

    // 空对象的路径应该是 never
    type Paths = RecordNamePaths<Empty>;
    // 这个测试主要是验证类型不会报错
    const _typeCheck: Paths = '' as never;
    expect(_typeCheck).toBeDefined();
  });

  it('应该能够处理包含可选属性的对象', () => {
    type WithOptional = {
      required: string;
      optional?: {
        nested: number;
      };
    };

    // 类型检查：这些路径应该是有效的
    const validPaths: RecordNamePaths<WithOptional>[] = [
      'required',
      'optional',
      'optional.nested',
    ];
    expect(validPaths).toHaveLength(3);
  });
});
