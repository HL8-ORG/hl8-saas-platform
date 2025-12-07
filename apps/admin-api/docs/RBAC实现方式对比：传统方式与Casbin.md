# RBAC 实现方式对比：传统方式与 Casbin

## 概述

本文档阐述基于角色的访问控制（RBAC）的两种实现方式：

1. **传统方式**：通过 `users`、`roles`、`permissions` 模块独立实现 RBAC
2. **Casbin 方式**：引入 Casbin 权限解析引擎，提供更灵活的 RBAC 配置

通过对比分析，说明虽然可以通过传统方式实现 RBAC，但引入 Casbin 后可以更加灵活地配置和管理权限系统。

## 目录

- [传统 RBAC 实现方式](#传统-rbac-实现方式)
- [Casbin RBAC 实现方式](#casbin-rbac-实现方式)
- [两种方式对比](#两种方式对比)
- [本系统的实现方式](#本系统的实现方式)
- [最佳实践建议](#最佳实践建议)
- [总结](#总结)

## 传统 RBAC 实现方式

### 1. 数据模型

传统 RBAC 实现通常需要以下数据表：

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  -- 其他用户信息
);

-- 角色表
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  description TEXT
);

-- 权限表
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  resource VARCHAR(100),  -- 资源标识，如 'user', 'role'
  action VARCHAR(50),     -- 操作类型，如 'read:any', 'write:own'
  description TEXT
);

-- 用户-角色关联表
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

-- 角色-权限关联表
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

### 2. 权限检查实现

#### 方式 1：SQL 查询方式

```typescript
/**
 * 检查用户是否有某个权限
 *
 * 需要编写复杂的 SQL 查询，涉及多表关联
 */
async hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const result = await this.dataSource
    .createQueryBuilder()
    .select('COUNT(*)', 'count')
    .from(User, 'u')
    .innerJoin('u.roles', 'r')
    .innerJoin('r.permissions', 'p')
    .where('u.id = :userId', { userId })
    .andWhere('p.resource = :resource', { resource })
    .andWhere('p.action = :action', { action })
    .getRawOne();

  return parseInt(result.count) > 0;
}
```

#### 方式 2：ORM 查询方式

```typescript
/**
 * 检查用户是否有某个权限
 *
 * 通过 ORM 查询，代码更清晰但性能可能较差
 */
async hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['roles', 'roles.permissions'],
  });

  if (!user) {
    return false;
  }

  // 遍历用户的所有角色和权限
  for (const role of user.roles) {
    for (const permission of role.permissions) {
      if (permission.resource === resource && permission.action === action) {
        return true;
      }
    }
  }

  return false;
}
```

### 3. 传统方式的局限性

#### 3.1 角色继承

如果需要实现角色继承（如 `admin` 角色继承 `user` 角色的所有权限），需要：

```typescript
/**
 * 实现角色继承需要递归查询
 */
async hasPermissionWithInheritance(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const user = await this.getUserWithRoles(userId);

  // 需要递归查询角色继承关系
  const allRoles = await this.getAllInheritedRoles(user.roles);

  // 然后查询所有角色的权限
  for (const role of allRoles) {
    const permissions = await this.getRolePermissions(role.id);
    if (permissions.some(p => p.resource === resource && p.action === action)) {
      return true;
    }
  }

  return false;
}
```

**问题**：

- 需要额外的 `role_inheritance` 表存储角色继承关系
- 需要递归查询，性能较差
- 代码复杂度高

#### 3.2 资源继承

如果需要实现资源继承（如 `users_list` 资源继承 `user` 资源的所有权限），需要：

```typescript
/**
 * 实现资源继承需要额外的资源层级表
 */
async hasPermissionWithResourceInheritance(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // 需要查询资源继承关系
  const resourceHierarchy = await this.getResourceHierarchy(resource);

  // 检查用户是否有任何层级资源的权限
  for (const res of resourceHierarchy) {
    if (await this.hasPermission(userId, res, action)) {
      return true;
    }
  }

  return false;
}
```

**问题**：

- 需要额外的 `resource_hierarchy` 表
- 需要递归查询资源层级
- 代码复杂度进一步增加

#### 3.3 多租户支持

如果需要支持多租户（不同租户的权限隔离），需要：

```typescript
/**
 * 多租户权限检查
 */
async hasPermissionWithTenant(
  userId: string,
  tenantId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // 需要在所有查询中添加 tenantId 条件
  const user = await this.userRepository.findOne({
    where: { id: userId, tenantId },
    relations: ['roles', 'roles.permissions'],
  });

  // 还需要检查角色和权限是否属于同一租户
  // ...
}
```

**问题**：

- 需要在所有表中添加 `tenant_id` 字段
- 所有查询都需要添加租户过滤条件
- 容易遗漏租户检查，导致数据泄露

#### 3.4 特殊规则

如果需要实现特殊规则（如 `root` 用户拥有所有权限），需要：

```typescript
/**
 * 特殊规则需要硬编码
 */
async hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // 硬编码特殊规则
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (user.email === 'root' || user.id === 'root') {
    return true; // root 用户拥有所有权限
  }

  // 正常的权限检查逻辑
  // ...
}
```

**问题**：

- 特殊规则需要硬编码
- 难以维护和扩展
- 规则分散在代码各处

#### 3.5 性能问题

传统方式的性能问题：

1. **数据库查询次数多**：每次权限检查可能需要多次数据库查询
2. **无法利用缓存**：权限检查逻辑复杂，难以有效缓存
3. **N+1 查询问题**：查询用户权限时可能产生 N+1 查询

### 4. 传统方式总结

**优点**：

- ✅ 实现简单直观
- ✅ 数据模型清晰
- ✅ 易于理解和维护（对于简单场景）

**缺点**：

- ❌ 复杂场景实现困难（角色继承、资源继承）
- ❌ 性能较差（多次数据库查询）
- ❌ 代码复杂度高（需要处理各种边界情况）
- ❌ 难以扩展（添加新功能需要修改大量代码）
- ❌ 特殊规则难以维护（硬编码）

## Casbin RBAC 实现方式

### 1. 数据模型

Casbin 使用统一的数据表存储策略规则：

```sql
-- Casbin 策略表（统一存储所有策略规则）
CREATE TABLE casbin_rule (
  id SERIAL PRIMARY KEY,
  ptype VARCHAR(255),  -- 策略类型：p（权限策略）、g（角色继承）、g2（资源继承）
  v0 VARCHAR(255),     -- 第一个参数
  v1 VARCHAR(255),     -- 第二个参数
  v2 VARCHAR(255),     -- 第三个参数
  v3 VARCHAR(255),     -- 第四个参数（用于多租户）
  v4 VARCHAR(255),
  v5 VARCHAR(255),
  v6 VARCHAR(255)
);
```

**策略规则示例**：

```
-- 权限策略：角色 superuser 在 tenant1 域中对 user 资源有 read:any 权限
p, superuser, tenant1, user, read:any

-- 角色继承：用户 alice 在 tenant1 域中拥有 superuser 角色
g, alice, superuser, tenant1

-- 资源继承：users_list 资源继承 user 资源
g2, users_list, user
```

### 2. 模型配置（model.conf）

Casbin 通过模型配置文件定义权限检查的规则：

```conf
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _    # 角色继承：用户 -> 角色 -> 域
g2 = _, _      # 资源继承：资源列表 -> 资源类型

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && g2(r.obj, p.obj) && r.act == p.act && r.dom == p.dom || r.sub == "root"
```

**匹配器解析**：

- `g(r.sub, p.sub, r.dom)`：检查用户是否拥有角色（支持角色继承）
- `g2(r.obj, p.obj)`：检查资源是否匹配（支持资源继承）
- `r.act == p.act`：检查操作是否匹配
- `r.dom == p.dom`：检查域是否匹配（多租户隔离）
- `r.sub == "root"`：root 用户拥有所有权限（特殊规则）

### 3. 权限检查实现

```typescript
/**
 * Casbin 权限检查
 *
 * 简单、高效、灵活
 */
async hasPermission(
  userId: string,
  tenantId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // 一行代码完成权限检查
  // Casbin 会自动处理：
  // - 角色继承
  // - 资源继承
  // - 多租户隔离
  // - 特殊规则（root 用户）
  return await this.enforcer.enforce(userId, tenantId, resource, action);
}
```

### 4. Casbin 方式的优势

#### 4.1 灵活的匹配规则

通过 `model.conf` 可以定义复杂的权限检查逻辑：

```conf
[matchers]
# 示例 1：支持角色继承
m = g(r.sub, p.sub, r.dom) && r.obj == p.obj && r.act == p.act

# 示例 2：支持资源继承
m = g(r.sub, p.sub) && g2(r.obj, p.obj) && r.act == p.act

# 示例 3：支持多租户
m = g(r.sub, p.sub, r.dom) && r.obj == p.obj && r.act == p.act && r.dom == p.dom

# 示例 4：支持特殊规则
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act || r.sub == "root"
```

**优势**：

- ✅ 规则集中管理（在 `model.conf` 中）
- ✅ 易于修改和扩展
- ✅ 不需要修改代码

#### 4.2 角色继承

Casbin 通过 `g` 策略自动支持角色继承：

```
# 角色继承策略
g, admin, user          # admin 角色继承 user 角色
g, superuser, admin     # superuser 角色继承 admin 角色

# 权限策略
p, user, read:any       # user 角色有 read:any 权限
p, admin, write:any     # admin 角色有 write:any 权限

# 用户角色
g, alice, superuser     # alice 拥有 superuser 角色

# 结果：alice 自动拥有 user、admin、superuser 的所有权限
```

**优势**：

- ✅ 自动处理角色继承
- ✅ 无需递归查询
- ✅ 性能优异（内存中匹配）

#### 4.3 资源继承

Casbin 通过 `g2` 策略支持资源继承：

```
# 资源继承策略
g2, users_list, user           # users_list 继承 user
g2, user_roles, user          # user_roles 继承 user
g2, user_permissions, user   # user_permissions 继承 user

# 权限策略
p, admin, user, read:any      # admin 对 user 有 read:any 权限

# 结果：admin 自动对 users_list、user_roles、user_permissions 也有 read:any 权限
```

**优势**：

- ✅ 自动处理资源继承
- ✅ 减少策略规则数量
- ✅ 易于维护

#### 4.4 多租户支持

Casbin 通过 `domain` 参数支持多租户：

```typescript
// 权限检查时传入租户 ID
await enforcer.enforce('alice', 'tenant1', 'user', 'read:any');

// Casbin 自动匹配同一租户的策略
// p, admin, tenant1, user, read:any  ✓ 匹配
// p, admin, tenant2, user, read:any  ✗ 不匹配（不同租户）
```

**优势**：

- ✅ 自动处理租户隔离
- ✅ 无需在每个表中添加 `tenant_id`
- ✅ 防止跨租户数据泄露

#### 4.5 特殊规则

Casbin 在匹配器中支持特殊规则：

```conf
[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act || r.sub == "root"
```

**优势**：

- ✅ 特殊规则集中管理
- ✅ 易于维护和扩展
- ✅ 不需要硬编码

#### 4.6 性能优势

Casbin 的性能优势：

1. **内存存储**：策略加载到内存，权限检查速度快（毫秒级）
2. **批量检查**：支持批量权限检查，减少数据库查询
3. **缓存友好**：策略数据在内存中，天然支持缓存

```typescript
// 批量权限检查
const requests = [
  ['alice', 'tenant1', 'user', 'read:any'],
  ['alice', 'tenant1', 'role', 'read:any'],
  ['alice', 'tenant1', 'permission', 'read:any'],
];
const results = await enforcer.batchEnforce(requests);
// 一次调用检查多个权限，性能优异
```

### 5. Casbin 方式总结

**优点**：

- ✅ 灵活的匹配规则（通过 `model.conf` 配置）
- ✅ 自动支持角色继承（`g` 策略）
- ✅ 自动支持资源继承（`g2` 策略）
- ✅ 内置多租户支持（`domain` 参数）
- ✅ 特殊规则易于维护（在匹配器中定义）
- ✅ 性能优异（内存中匹配）
- ✅ 代码简洁（一行代码完成权限检查）
- ✅ 易于扩展（修改 `model.conf` 即可）

**缺点**：

- ❌ 需要学习 Casbin 的概念和配置
- ❌ 策略规则格式需要理解
- ❌ 调试相对复杂（需要理解匹配器逻辑）

## 两种方式对比

### 功能对比表

| 功能特性       | 传统方式          | Casbin 方式            |
| -------------- | ----------------- | ---------------------- |
| **基础 RBAC**  | ✅ 支持           | ✅ 支持                |
| **角色继承**   | ❌ 需要手动实现   | ✅ 自动支持（g 策略）  |
| **资源继承**   | ❌ 需要手动实现   | ✅ 自动支持（g2 策略） |
| **多租户支持** | ❌ 需要手动实现   | ✅ 内置支持（domain）  |
| **特殊规则**   | ❌ 需要硬编码     | ✅ 配置化（匹配器）    |
| **性能**       | ⚠️ 多次数据库查询 | ✅ 内存中匹配          |
| **代码复杂度** | ❌ 高             | ✅ 低                  |
| **可维护性**   | ⚠️ 中等           | ✅ 高                  |
| **可扩展性**   | ❌ 低             | ✅ 高                  |

### 代码复杂度对比

#### 传统方式：检查用户权限（包含角色继承）

```typescript
async hasPermission(
  userId: string,
  tenantId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // 1. 查询用户
  const user = await this.userRepository.findOne({
    where: { id: userId, tenantId },
    relations: ['roles'],
  });

  if (!user) return false;

  // 2. 查询角色继承关系（递归）
  const allRoles = await this.getAllInheritedRoles(user.roles, tenantId);

  // 3. 查询所有角色的权限
  const roleIds = allRoles.map(r => r.id);
  const permissions = await this.permissionRepository
    .createQueryBuilder('p')
    .innerJoin('p.roles', 'r')
    .where('r.id IN (:...roleIds)', { roleIds })
    .andWhere('p.tenant_id = :tenantId', { tenantId })
    .andWhere('p.resource = :resource', { resource })
    .andWhere('p.action = :action', { action })
    .getMany();

  // 4. 检查资源继承
  const resourceHierarchy = await this.getResourceHierarchy(resource);
  for (const res of resourceHierarchy) {
    const hasPerm = permissions.some(p => p.resource === res);
    if (hasPerm) return true;
  }

  // 5. 特殊规则（硬编码）
  if (user.email === 'root') return true;

  return false;
}
```

**代码行数**：~40 行  
**数据库查询**：3-5 次  
**复杂度**：高

#### Casbin 方式：检查用户权限

```typescript
async hasPermission(
  userId: string,
  tenantId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // 一行代码完成所有检查：
  // - 角色继承
  // - 资源继承
  // - 多租户隔离
  // - 特殊规则（root 用户）
  return await this.enforcer.enforce(userId, tenantId, resource, action);
}
```

**代码行数**：1 行  
**数据库查询**：0 次（内存中匹配）  
**复杂度**：低

### 性能对比

| 场景                      | 传统方式               | Casbin 方式       |
| ------------------------- | ---------------------- | ----------------- |
| **单次权限检查**          | 10-50ms（数据库查询）  | <1ms（内存匹配）  |
| **批量权限检查（100次）** | 1-5s（多次数据库查询） | <10ms（批量匹配） |
| **角色继承查询**          | 50-200ms（递归查询）   | <1ms（自动处理）  |
| **资源继承查询**          | 50-200ms（递归查询）   | <1ms（自动处理）  |

## 本系统的实现方式

### 1. 混合架构

本系统采用**混合架构**，结合了传统方式和 Casbin 方式的优势：

```
┌─────────────────────────────────────────────────────────┐
│              业务数据层（传统方式）                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐          │
│  │ users    │  │ roles    │  │ permissions  │          │
│  │ 表       │  │ 表       │  │ 表           │          │
│  └──────────┘  └──────────┘  └──────────────┘          │
│       │              │                │                  │
│       └──────────────┼────────────────┘                 │
│                      │                                   │
│              role_permissions 表（关联表）                │
└─────────────────────────────────────────────────────────┘
                        │
                        │ 同步
                        ↓
┌─────────────────────────────────────────────────────────┐
│              策略层（Casbin 方式）                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │         casbin_rule 表                           │  │
│  │  - p 策略：权限策略                              │  │
│  │  - g 策略：角色继承                              │  │
│  │  - g2 策略：资源继承                             │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ↓                                 │
│              Casbin Enforcer（内存中）                    │
│                        │                                 │
│                        ↓                                 │
│              权限检查（快速、灵活）                        │
└─────────────────────────────────────────────────────────┘
```

### 2. 数据同步机制

从 `RolesService` 的代码可以看到，系统在分配权限时同时更新两处：

```typescript
/**
 * 为角色授予权限
 *
 * 同时更新 Permission 实体和 Casbin 策略
 */
async grantPermission(
  roleName: string,
  operation: string,
  resource: string,
  description?: string,
): Promise<boolean> {
  const role = await this.roleRepository.findOne({
    where: { name: roleName },
  });

  // 1. 更新 Permission 实体（业务数据）
  const permission = await this.permissionsService.createOrGet({
    resource,
    action: operation,
    description,
  });

  await this.permissionsService.assignPermissionToRole(
    role.id,
    permission.id,
  );

  // 2. 更新 Casbin 策略（用于权限检查）
  return await this.authzService.addPermissionForUser(
    role.name,
    resource,
    operation,
  );
}
```

### 3. 职责划分

| 模块                     | 职责               | 数据表                                    | 用途                    |
| ------------------------ | ------------------ | ----------------------------------------- | ----------------------- |
| **Users 模块**           | 用户业务数据管理   | `users` 表                                | 用户基本信息、状态等    |
| **Roles 模块**           | 角色业务数据管理   | `roles` 表                                | 角色基本信息、描述等    |
| **Permissions 模块**     | 权限业务数据管理   | `permissions` 表<br>`role_permissions` 表 | 权限定义、角色-权限关联 |
| **AuthZ 模块（Casbin）** | 权限策略解析和检查 | `casbin_rule` 表                          | 权限检查逻辑、策略规则  |

### 4. 工作流程

```
1. 管理员通过 Permissions 模块创建权限
   ↓
   permissions 表（业务数据）

2. 管理员通过 Roles 模块为角色分配权限
   ↓
   role_permissions 表（业务关联）
   ↓
   同步到 Casbin 策略
   ↓
   casbin_rule 表（策略规则）

3. 管理员通过 Roles 模块为用户分配角色
   ↓
   同步到 Casbin 策略
   ↓
   casbin_rule 表（g 策略）

4. 用户访问资源时，AuthZGuard 调用 Casbin 检查权限
   ↓
   Casbin Enforcer（内存中匹配）
   ↓
   返回权限检查结果
```

### 5. 优势总结

本系统的混合架构结合了两种方式的优势：

**传统方式的优势**：

- ✅ 业务数据清晰（users、roles、permissions 表）
- ✅ 易于理解和维护
- ✅ 支持权限的元数据（描述、创建时间等）

**Casbin 方式的优势**：

- ✅ 灵活的权限检查逻辑（通过 `model.conf` 配置）
- ✅ 自动支持角色继承、资源继承
- ✅ 内置多租户支持
- ✅ 性能优异（内存中匹配）
- ✅ 代码简洁

## 最佳实践建议

### 1. 何时使用传统方式

适合使用传统方式的场景：

- ✅ 简单的 RBAC 需求（无角色继承、资源继承）
- ✅ 权限规则固定，不需要频繁变更
- ✅ 团队不熟悉 Casbin
- ✅ 系统规模较小

### 2. 何时使用 Casbin 方式

适合使用 Casbin 方式的场景：

- ✅ 复杂的 RBAC 需求（角色继承、资源继承）
- ✅ 需要多租户支持
- ✅ 权限规则需要灵活配置
- ✅ 对性能要求较高
- ✅ 需要支持特殊规则（如 root 用户）

### 3. 混合架构建议

本系统采用的混合架构适合以下场景：

- ✅ 需要业务数据管理（用户、角色、权限的 CRUD）
- ✅ 需要灵活的权限检查逻辑
- ✅ 需要高性能的权限检查
- ✅ 需要支持复杂的权限场景

**实现要点**：

1. 业务数据由传统模块管理（users、roles、permissions）
2. 权限检查由 Casbin 执行
3. 数据同步机制确保两者一致

## 总结

### 核心观点

1. **可以通过 users、roles、permissions 模块独立实现 RBAC**
   - ✅ 技术上可行
   - ⚠️ 但需要大量手动实现
   - ⚠️ 复杂场景（角色继承、资源继承）实现困难
   - ⚠️ 性能较差（多次数据库查询）

2. **引入 Casbin 后可以更加灵活地配置 RBAC**
   - ✅ 通过 `model.conf` 灵活配置权限检查规则
   - ✅ 自动支持角色继承（g 策略）
   - ✅ 自动支持资源继承（g2 策略）
   - ✅ 内置多租户支持（domain 参数）
   - ✅ 性能优异（内存中匹配）
   - ✅ 代码简洁（一行代码完成权限检查）

### 推荐方案

对于本系统，推荐采用**混合架构**：

- **业务数据层**：使用传统方式管理（users、roles、permissions 模块）
- **策略层**：使用 Casbin 进行权限检查
- **数据同步**：确保业务数据和策略数据一致

这种架构既保证了业务数据的清晰管理，又获得了 Casbin 的灵活性和性能优势。

## 相关文档

- [Casbin 授权系统集成说明](./Casbin授权系统集成说明.md)
- [Casbin 策略加载和存储机制](./Casbin策略加载和存储机制.md)
- [RBAC 系统使用说明](./RBAC系统使用说明.md)
- [Casbin 官方文档](https://casbin.org/docs/zh-CN/overview)
