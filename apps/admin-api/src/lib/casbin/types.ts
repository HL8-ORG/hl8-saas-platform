/**
 * 授权动作动词枚举。
 *
 * 定义了基本的 CRUD 操作类型，用于权限控制。
 */
export enum AuthActionVerb {
  /** 创建操作 */
  CREATE = 'create',
  /** 更新操作 */
  UPDATE = 'update',
  /** 删除操作 */
  DELETE = 'delete',
  /** 读取操作 */
  READ = 'read',
}

/**
 * 自定义授权动作动词类型。
 *
 * 允许扩展标准的动作动词，支持自定义操作类型。
 */
export type CustomAuthActionVerb = string;

/**
 * 授权资源类型。
 *
 * 可以是字符串（资源标识符）或对象（包含资源信息的对象）。
 * 例如：'user' 或 { type: 'user', id: '123' }
 */
export type AuthResource = string | Record<string, any>;

/**
 * 授权用户类型。
 *
 * 可以是字符串（用户名）或对象（包含用户信息的对象）。
 * 例如：'alice' 或 { username: 'alice', id: '123' }
 */
export type AuthUser = string | Record<string, any>;

/**
 * 授权拥有权枚举。
 *
 * 定义了资源的所有权类型，用于区分对资源的访问范围。
 */
export enum AuthPossession {
  /** 任何资源（不限制所有权） */
  ANY = 'any',
  /** 仅自己的资源 */
  OWN = 'own',
  /** 自己的或任何资源 */
  OWN_ANY = 'own|any',
}

/**
 * 授权动作枚举。
 *
 * 组合了动作动词和拥有权，形成完整的权限动作标识。
 * 格式：`动作:拥有权`，例如 'read:any'、'write:own'
 */
export enum AuthAction {
  /** 创建任何资源 */
  CREATE_ANY = 'create:any',
  /** 创建自己的资源 */
  CREATE_OWN = 'create:own',

  /** 更新任何资源 */
  UPDATE_ANY = 'update:any',
  /** 更新自己的资源 */
  UPDATE_OWN = 'update:own',

  /** 删除任何资源 */
  DELETE_ANY = 'delete:any',
  /** 删除自己的资源 */
  DELETE_OWN = 'delete:own',

  /** 读取任何资源 */
  READ_ANY = 'read:any',
  /** 读取自己的资源 */
  READ_OWN = 'read:own',
}

/**
 * 批量审批策略枚举。
 *
 * 定义了在批量权限检查时的审批策略。
 */
export enum BatchApproval {
  /** 任意一个通过即可（OR 逻辑） */
  ANY = 'any',
  /** 全部通过才可（AND 逻辑） */
  ALL = 'all',
}
