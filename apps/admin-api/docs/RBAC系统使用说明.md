# RBAC 系统使用说明

## 概述

本项目已实现基于 Casbin 的完整 RBAC（基于角色的访问控制）系统，参考了官方示例 `samples/nest-authz-example` 的最佳实践，并进行了以下改进：

- ✅ **数据库持久化**：使用 TypeORM Adapter 替代文件存储
- ✅ **完整的 CRUD 接口**：提供角色和权限管理的完整 REST API
- ✅ **类型安全**：完善的 TypeScript 类型定义
- ✅ **权限控制**：所有接口都使用权限守卫保护

## 系统架构

### 核心组件

#### 角色模块（RolesModule）

1. **Role 实体**：存储角色信息（名称、描述等）
2. **RolesService**：角色管理服务，实现 RBAC 核心逻辑
3. **RolesController**：角色管理 REST API
4. **UserRolesController**：用户角色管理 REST API

#### 权限模块（PermissionsModule）

1. **Permission 实体**：存储权限信息（资源、操作、描述等），提供权限的元数据管理
2. **PermissionsService**：权限管理服务，管理权限实体的 CRUD 操作
3. **PermissionsController**：权限管理 REST API
4. **UserPermissionsController**：用户权限查询 REST API

#### 共享组件

1. **CasbinRule 实体**：存储 Casbin 策略规则（角色-权限、用户-角色关系），用于权限检查
2. **AuthZModule**：全局授权模块，提供 Casbin 集成

### 双重存储机制

系统采用双重存储机制，同时使用 Permission 实体和 Casbin 策略：

- **Permission 实体**：用于权限的元数据管理（描述、租户等）和权限-角色的关联关系
- **Casbin 策略**：用于高效的权限检查（内存缓存，性能优异）

这种设计的优势：

- ✅ 权限元数据可管理（描述、租户等）
- ✅ 权限检查高性能（Casbin 内存缓存）
- ✅ 数据一致性（通过服务层同步）

### 数据流

```
用户请求 → AuthGuard (JWT 认证) → AuthZGuard (权限检查) → 控制器
                                              ↓
                                      Casbin Enforcer
                                              ↓
                                      TypeORM Adapter
                                              ↓
                                      PostgreSQL 数据库
```

## API 接口

### 1. 权限管理

#### 查询所有权限

```http
GET /api/v1/permissions?tenantId=tenant-1
Authorization: Bearer <token>
```

**权限要求**：`read:any role_permissions`

**响应示例**：

```json
[
  {
    "id": "uuid",
    "resource": "user",
    "action": "read:any",
    "description": "读取任何用户",
    "tenantId": "tenant_default",
    "roles": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 创建权限

```http
POST /api/v1/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "resource": "user",
  "action": "read:any",
  "description": "读取任何用户",
  "tenantId": "tenant_default"
}
```

**权限要求**：`create:any role`

**说明**：如果权限已存在（相同的 resource + action + tenantId），则返回现有权限。

#### 更新权限描述

```http
PUT /api/v1/permissions/:id/description
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "更新后的描述"
}
```

**权限要求**：`update:any role_permissions`

#### 删除权限

```http
DELETE /api/v1/permissions/:id
Authorization: Bearer <token>
```

**权限要求**：`delete:any role_permissions`

**限制**：只能删除未被任何角色使用的权限。

### 2. 角色管理

#### 查询所有角色

```http
GET /api/v1/roles
Authorization: Bearer <token>
```

**权限要求**：`read:any roles_list`

**响应示例**：

```json
[
  {
    "id": "uuid",
    "name": "admin",
    "displayName": "管理员",
    "description": "系统管理员角色",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 创建角色

```http
POST /api/v1/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "manager",
  "displayName": "经理",
  "description": "部门经理角色"
}
```

**权限要求**：`create:any role`

**响应示例**：

```json
{
  "id": "uuid",
  "name": "manager",
  "displayName": "经理",
  "description": "部门经理角色",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 查询角色的权限

```http
GET /api/v1/roles/:id/permissions
Authorization: Bearer <token>
```

**权限要求**：`read:any role_permissions`

**响应示例**（简化格式）：

```json
[
  ["user", "read:any"],
  ["user", "create:any"],
  ["role", "read:any"]
]
```

#### 查询角色的权限（包含完整信息）

```http
GET /api/v1/roles/:id/permissions/details
Authorization: Bearer <token>
```

**权限要求**：`read:any role_permissions`

**响应示例**（完整格式）：

```json
[
  {
    "id": "uuid",
    "resource": "user",
    "action": "read:any",
    "description": "读取任何用户",
    "tenantId": "tenant_default",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 为角色授予权限

```http
POST /api/v1/roles/:id/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "operation": "read:any",
  "resource": "user",
  "description": "读取任何用户（可选）"
}
```

**权限要求**：`create:any role_permissions`

**说明**：

- 同时更新 Permission 实体和 Casbin 策略
- 如果权限不存在，会自动创建
- `description` 字段可选，用于权限的元数据管理

**响应示例**：

```json
{
  "success": true
}
```

### 3. 用户角色管理

#### 查询用户的角色

```http
GET /api/v1/users/:id/roles
Authorization: Bearer <token>
```

**权限要求**：

- `read:own user_roles`：用户可以查看自己的角色
- `read:any user_roles`：管理员可以查看任何用户的角色

**响应示例**：

```json
["admin", "user"]
```

#### 为用户分配角色

```http
POST /api/v1/users/:id/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleName": "manager"
}
```

**权限要求**：`create:any user_roles`

**响应示例**：

```json
{
  "success": true
}
```

#### 取消用户的角色分配

```http
DELETE /api/v1/users/:id/roles/:roleId
Authorization: Bearer <token>
```

**权限要求**：`delete:any user_roles`

**响应示例**：

```json
{
  "success": true
}
```

### 4. 用户权限查询

#### 查询用户的权限

```http
GET /api/v1/users/:id/permissions
Authorization: Bearer <token>
```

**权限要求**：

- `read:own user_permissions`：用户可以查看自己的权限
- `read:any user_permissions`：管理员可以查看任何用户的权限

**响应示例**：

```json
[
  ["user", "read:any"],
  ["user", "create:any"],
  ["role", "read:any"]
]
```

**特殊说明**：

- root 用户返回 `["*"]`，表示拥有所有权限

## 使用示例

### 1. 初始化系统角色和权限

```typescript
// 在应用启动时或通过管理脚本执行
import { RolesService } from './modules/roles/services/roles.service';

async function initRoles() {
  // 创建角色
  await rolesService.addRole({
    name: 'admin',
    displayName: '管理员',
    description: '系统管理员，拥有所有权限',
  });

  await rolesService.addRole({
    name: 'user',
    displayName: '普通用户',
    description: '普通用户，拥有基本权限',
  });

  // 为 admin 角色授予权限
  await rolesService.grantPermission('admin', 'read:any', 'user');
  await rolesService.grantPermission('admin', 'create:any', 'user');
  await rolesService.grantPermission('admin', 'update:any', 'user');
  await rolesService.grantPermission('admin', 'delete:any', 'user');
  await rolesService.grantPermission('admin', 'read:any', 'role');
  await rolesService.grantPermission('admin', 'create:any', 'role');

  // 为 user 角色授予权限
  await rolesService.grantPermission('user', 'read:own', 'user');
  await rolesService.grantPermission('user', 'update:own', 'user');

  // 为用户分配角色
  await rolesService.assignUser('user-id-1', 'admin');
  await rolesService.assignUser('user-id-2', 'user');
}
```

### 2. 在控制器中使用权限控制

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthZGuard, UsePermissions } from '@/modules/authz';
import { AuthActionVerb, AuthPossession } from '@/modules/authz/types';
import { Resource } from '@/modules/roles/resources';

@Controller('users')
export class UserController {
  @Get()
  @UseGuards(AuthGuard, AuthZGuard)
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.USERS_LIST,
    possession: AuthPossession.ANY,
  })
  async findAll() {
    // 只有具有 read:any users_list 权限的用户才能访问
    return this.userService.findAll();
  }

  @Get('me')
  @UseGuards(AuthGuard, AuthZGuard)
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.USER_ROLES,
    possession: AuthPossession.OWN,
  })
  async getMe(@GetUser('sub') userId: string) {
    // 只能访问自己的信息
    return this.userService.findById(userId);
  }
}
```

### 3. 使用服务进行权限检查

```typescript
import { Injectable } from '@nestjs/common';
import { AuthZRBACService } from '@/modules/authz/services/authz-rbac.service';

@Injectable()
export class UserService {
  constructor(private rbacService: AuthZRBACService) {}

  async canUserAccessResource(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    return await this.rbacService.hasPermissionForUser(
      userId,
      resource,
      action,
    );
  }

  async getUserRoles(userId: string): Promise<string[]> {
    return await this.rbacService.getRolesForUser(userId);
  }
}
```

## 权限模型

### Casbin 模型配置

模型文件：`src/modules/authz/model.conf`

```conf
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _
g2 = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && g2(r.obj, p.obj) && r.act == p.act && r.dom == p.dom || r.sub == "root"
```

### 策略格式

#### 策略规则 (p)

格式：`p, role, domain, resource, action`

示例：

- `p, admin, , user, read:any` - admin 角色可以读取任何用户
- `p, user, , user, read:own` - user 角色只能读取自己的信息

#### 角色关系 (g)

格式：`g, user_id, role, domain`

示例：

- `g, user-id-1, admin, ` - 用户 user-id-1 拥有 admin 角色

#### 资源分组 (g2)

格式：`g2, resource, group`

示例：

- `g2, users_list, user` - users_list 属于 user 资源组

## 资源定义

系统定义了以下资源：

### 资源组 (ResourceGroup)

- `USER`: 用户资源组
- `ROLE`: 角色资源组

### 具体资源 (Resource)

- `USERS_LIST`: 用户列表
- `USER_ROLES`: 用户角色
- `USER_PERMISSIONS`: 用户权限
- `ROLES_LIST`: 角色列表
- `ROLE_PERMISSIONS`: 角色权限

## 最佳实践

### 1. 角色设计

- **系统角色**：`admin`、`user`、`guest`
- **业务角色**：`manager`、`editor`、`viewer`

建议：

- 使用有意义的角色名称
- 为角色添加清晰的描述
- 避免创建过多细粒度的角色

### 2. 权限粒度

- **粗粒度**：按资源类型（如 `user`、`order`）
- **细粒度**：按具体资源（如 `user:123`、`order:456`）

建议：

- 根据业务需求选择合适的粒度
- 平衡安全性和性能
- 使用资源分组简化管理

### 3. 权限缓存

Casbin Enforcer 在内存中缓存策略，修改策略后需要：

```typescript
// 重新加载策略
await enforcer.loadPolicy();

// 或者只加载特定策略
await enforcer.loadFilteredPolicy({
  ptype: 'p',
  v0: 'admin',
});
```

### 4. 错误处理

所有接口都包含完善的错误处理：

- `400 Bad Request`：请求参数错误
- `401 Unauthorized`：未认证或权限不足
- `404 Not Found`：资源不存在
- `409 Conflict`：资源冲突（如角色已存在）

## 数据库表结构

### roles 表

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### permissions 表

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  tenant_id VARCHAR(50) DEFAULT 'tenant_default',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource, action, tenant_id)
);
```

### role_permissions 表

角色和权限的多对多关联表（由 TypeORM 自动创建）：

```sql
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

### casbin_rule 表

由 TypeORM Adapter 自动创建，用于存储 Casbin 策略规则（用于权限检查）。

## 迁移指南

### 从文件存储迁移到数据库

1. **备份现有策略文件** (`policy.csv`)

2. **运行数据库迁移**，创建 `roles` 和 `casbin_rule` 表

3. **导入策略数据**：

```typescript
// 读取 CSV 文件并导入到数据库
const policies = parseCSV('policy.csv');
for (const policy of policies) {
  await rolesService.grantPermission(...);
}
```

4. **验证策略**：确保数据库中的策略与文件一致

5. **移除文件依赖**：删除 `policy.csv`，确保只使用数据库

## 测试建议

### 1. 单元测试

- 测试角色服务的 CRUD 操作
- 测试权限检查逻辑
- 测试用户-角色关联

### 2. 集成测试

- 测试完整的权限流程
- 测试 API 接口的权限控制
- 测试数据库持久化

### 3. E2E 测试

- 测试用户登录后的权限检查
- 测试不同角色的访问控制
- 测试权限变更后的实时生效

## Permission 实体的优势

### 1. 权限元数据管理

Permission 实体提供了权限的完整元数据：

- **描述**：说明权限的用途和范围
- **租户**：支持多租户场景下的权限隔离
- **关联关系**：通过多对多关系管理角色-权限关联

### 2. 双重存储机制

- **Permission 实体**：用于权限的元数据管理和权限-角色关联
- **Casbin 策略**：用于高效的权限检查（内存缓存）

### 3. 数据一致性

通过服务层确保 Permission 实体和 Casbin 策略的同步：

- 授予权限时：同时更新 Permission 实体和 Casbin 策略
- 撤销权限时：同时更新 Permission 实体和 Casbin 策略

### 4. 权限生命周期管理

- 可以查询所有权限（包括未被使用的权限）
- 可以更新权限描述
- 可以删除未被使用的权限

## 模块结构

### 角色模块（RolesModule）

```
src/modules/roles/
├── controllers/
│   ├── roles.controller.ts          # 角色管理 REST API
│   └── user-roles.controller.ts      # 用户角色管理 REST API
├── services/
│   └── roles.service.ts              # 角色管理服务
├── dtos/
│   ├── create-role.dto.ts            # 创建角色 DTO
│   ├── add-role-permission.dto.ts    # 添加角色权限 DTO
│   └── assign-user-role.dto.ts      # 分配用户角色 DTO
├── resources.ts                       # 资源定义
└── roles.module.ts                    # 角色模块定义
```

### 权限模块（PermissionsModule）

```
src/modules/permissions/
├── controllers/
│   ├── permissions.controller.ts     # 权限管理 REST API
│   └── user-permissions.controller.ts # 用户权限查询 REST API
├── services/
│   └── permissions.service.ts        # 权限管理服务
└── permissions.module.ts              # 权限模块定义
```

## 相关文件

### 实体

- 角色实体：`src/entities/role.entity.ts`
- 权限实体：`src/entities/permission.entity.ts`
- Casbin 规则实体：`src/typeorm-adapter/casbinRule.ts`

### 角色模块

- 角色服务：`src/modules/roles/services/roles.service.ts`
- 角色控制器：`src/modules/roles/controllers/roles.controller.ts`
- 用户角色控制器：`src/modules/roles/controllers/user-roles.controller.ts`
- 资源定义：`src/modules/roles/resources.ts`
- DTOs：`src/modules/roles/dtos/`
- 角色模块：`src/modules/roles/roles.module.ts`

### 权限模块

- 权限服务：`src/modules/permissions/services/permissions.service.ts`
- 权限控制器：`src/modules/permissions/controllers/permissions.controller.ts`
- 用户权限控制器：`src/modules/permissions/controllers/user-permissions.controller.ts`
- 权限模块：`src/modules/permissions/permissions.module.ts`

## 参考资源

- [Casbin 官方文档](https://casbin.org/)
- [Node-Casbin 文档](https://github.com/casbin/node-casbin)
- [TypeORM Adapter 文档](https://github.com/node-casbin/typeorm-adapter)
- [官方示例](samples/nest-authz-example)
