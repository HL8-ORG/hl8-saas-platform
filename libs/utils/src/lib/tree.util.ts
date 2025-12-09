/**
 * 树节点类型
 *
 * @description 定义树节点的数据结构，包含可选的子节点数组
 *
 * @template T - 原始数据类型
 */
type TreeNode<T> = T & {
  /** 子节点数组 */
  children?: TreeNode<T>[];
};

/**
 * 树节点数据约束
 *
 * @description 定义树节点数据的基本约束，要求对象必须包含字符串键
 * 使用 unknown 作为值类型，提供类型安全的同时保持灵活性
 *
 * @template T - 必须扩展 Record<string, unknown> 的对象类型
 */
type TreeNodeData = Record<string, unknown>;

/**
 * 生成树形结构
 *
 * @description 将扁平列表转换为树形结构，支持自定义父节点字段、ID 字段和排序字段
 *
 * @param items - 要转换成树形结构的原始列表
 * @param parentIdField - 父节点字段名称（默认 'pid'）
 * @param idField - 唯一主键字段名称（默认 'id'）
 * @param orderField - 排序字段名称（可选）
 * @returns 返回树形结构数组
 *
 * @remarks
 * 使用 `Record<string, unknown>` 替代 `Record<string, any>` 以提供更好的类型安全性。
 * `unknown` 类型要求在使用值之前进行类型检查，避免运行时错误。
 *
 * @example
 * ```typescript
 * const items = [
 *   { id: 1, name: 'Parent', pid: 0 },
 *   { id: 2, name: 'Child', pid: 1 }
 * ];
 * const tree = buildTree(items, 'pid', 'id', 'sort');
 * // 返回: [{ id: 1, name: 'Parent', pid: 0, children: [{ id: 2, name: 'Child', pid: 1 }] }]
 * ```
 */
/**
 * 类型守卫：检查值是否为有效的 Map 键类型
 *
 * @description 验证值是否为 string 或 number 类型，用于 Map 键的类型安全
 *
 * @param value - 要检查的值
 * @returns 如果值是 string 或 number 则返回 true
 */
function isValidMapKey(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

export function buildTree<T extends TreeNodeData>(
  items: T[],
  parentIdField: keyof T = 'pid' as keyof T,
  idField: keyof T = 'id' as keyof T,
  orderField?: keyof T,
): TreeNode<T>[] {
  const itemMap = new Map<string | number, TreeNode<T>>();
  const rootNodes: TreeNode<T>[] = [];

  items.forEach((item) => {
    const nodeId = item[idField];
    // 类型安全检查：确保 nodeId 是有效的 Map 键类型
    if (!isValidMapKey(nodeId)) {
      console.error('Invalid node ID type:', nodeId);
      return;
    }
    const node: TreeNode<T> = { ...item, children: [] };
    itemMap.set(nodeId, node);
  });

  items.forEach((item) => {
    const nodeId = item[idField];
    const parentId = item[parentIdField];
    // 类型安全检查：确保 nodeId 是有效的 Map 键类型
    if (!isValidMapKey(nodeId)) {
      console.error('Invalid node ID type:', nodeId);
      return;
    }
    const node = itemMap.get(nodeId);

    if (node) {
      // 处理父节点 ID：支持数字 0 或字符串 '0' 作为根节点标识
      if (parentId === 0 || parentId === '0') {
        rootNodes.push(node);
      } else {
        // 类型安全检查：确保 parentId 是有效的 Map 键类型
        if (!isValidMapKey(parentId)) {
          console.error('Invalid parent ID type:', parentId);
          return;
        }
        const parent = itemMap.get(parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(node);
        } else {
          console.error('Parent node not found for ID:', parentId);
        }
      }
    }
  });

  if (orderField) {
    rootNodes.sort((a, b) => {
      const aValue = a[orderField];
      const bValue = b[orderField];
      // 类型安全检查：确保值都是数字类型
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }
      return 0;
    });
    itemMap.forEach((node) => {
      node.children?.sort((a, b) => {
        const aValue = a[orderField];
        const bValue = b[orderField];
        // 类型安全检查：确保值都是数字类型
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return aValue - bValue;
        }
        return 0;
      });
    });
  }

  return rootNodes.map((rootNode) => {
    buildSubTree(rootNode);
    return rootNode;
  });
}

/**
 * 构建子树
 *
 * @description 递归构建子树结构（内部辅助函数）
 *
 * @param node - 树节点
 *
 * @template T - 必须扩展 TreeNodeData 的对象类型
 */
function buildSubTree<T extends TreeNodeData>(node: TreeNode<T>) {
  if (node.children) {
    node.children.forEach((child) => buildSubTree(child));
  }
}
