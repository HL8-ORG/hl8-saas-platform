/**
 * 资源组枚举
 *
 * 定义系统中的资源组，用于权限管理的资源分类。
 */
export enum ResourceGroup {
  /** 用户资源组 */
  USER = 'user',
  /** 角色资源组 */
  ROLE = 'role',
}

/**
 * 资源枚举
 *
 * 定义系统中的具体资源，用于权限控制。
 */
export enum Resource {
  /** 用户列表 */
  USERS_LIST = 'users_list',
  /** 用户角色 */
  USER_ROLES = 'user_roles',
  /** 用户权限 */
  USER_PERMISSIONS = 'user_permissions',
  /** 角色列表 */
  ROLES_LIST = 'roles_list',
  /** 角色权限 */
  ROLE_PERMISSIONS = 'role_permissions',
}

/**
 * 资源元数据接口
 *
 * 用于描述资源的详细信息，包括显示名称和描述。
 */
export interface ResourceMeta {
  /** 资源名称 */
  name: ResourceGroup | Resource;
  /** 显示名称 */
  displayName?: string;
  /** 描述 */
  description?: string;
  /** 是否为资源组 */
  isGroup: boolean;
  /** 子资源列表 */
  children?: ResourceMeta[];
}

/**
 * 资源元数据列表
 *
 * 定义所有资源的元数据信息，用于权限管理界面展示。
 */
export const Resources: ResourceMeta[] = [
  {
    name: ResourceGroup.USER,
    displayName: '用户',
    description: '用户管理相关资源',
    isGroup: true,
    children: [
      {
        name: Resource.USERS_LIST,
        displayName: '用户列表',
        description: '查看用户列表',
        isGroup: false,
      },
      {
        name: Resource.USER_ROLES,
        displayName: '用户角色',
        description: '管理用户的角色分配',
        isGroup: false,
      },
      {
        name: Resource.USER_PERMISSIONS,
        displayName: '用户权限',
        description: '查看用户的权限',
        isGroup: false,
      },
    ],
  },
  {
    name: ResourceGroup.ROLE,
    displayName: '角色',
    description: '角色管理相关资源',
    isGroup: true,
    children: [
      {
        name: Resource.ROLES_LIST,
        displayName: '角色列表',
        description: '查看角色列表',
        isGroup: false,
      },
      {
        name: Resource.ROLE_PERMISSIONS,
        displayName: '角色权限',
        description: '管理角色的权限分配',
        isGroup: false,
      },
    ],
  },
];
