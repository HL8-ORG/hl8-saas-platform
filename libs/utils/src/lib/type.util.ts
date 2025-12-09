/**
 * 类型工具函数集合
 *
 * @description 提供常用的 TypeScript 类型工具函数
 */

/**
 * 提取记录类型中所有键的路径
 *
 * @description 递归提取记录类型中所有键的路径，包括嵌套对象的路径
 *
 * @template T - 记录类型
 *
 * @example
 * ```typescript
 * type Example = {
 *   a: string;
 *   b: {
 *     c: number;
 *     d: boolean;
 *   };
 * };
 * type Paths = RecordNamePaths<Example>;
 * // 结果: "a" | "b" | "b.c" | "b.d"
 * ```
 */
export type RecordNamePaths<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T]: K extends string
          ? T[K] extends Record<string, unknown>
            ? K | `${K}.${RecordNamePaths<T[K]>}`
            : K
          : never;
      }[keyof T]
    : never;
