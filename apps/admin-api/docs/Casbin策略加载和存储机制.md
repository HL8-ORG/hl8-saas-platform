# Casbin 策略加载和存储机制

## 概述

本文档详细阐述 Casbin 授权系统中权限策略的加载和存储机制，包括系统启动时的策略加载流程、内存存储机制、数据库持久化机制以及策略变更时的同步机制。

### 重要说明

> **Casbin 定位**：Casbin 是一个**权限解析引擎**，负责根据模型配置和策略规则进行权限检查，不负责用户和角色的业务数据管理。

> **本系统实现方式**：
>
> - ❌ **不支持使用 `policy.csv` 文件实现持久化**：虽然 Casbin 支持通过 CSV 文件存储策略，但本系统不采用此方式。
> - ✅ **使用数据库持久化**：所有权限策略数据存储在 PostgreSQL 数据库的 `casbin_rule` 表中，通过 `TypeORMAdapter` 实现策略的加载和持久化。
> - ✅ **用户和角色管理**：具体的用户信息由 `users` 模块维护，角色信息由 `roles` 模块维护。Casbin 仅负责权限策略的解析和检查，不管理用户和角色的业务数据。

> **数据流向**：
>
> ```
> Users 模块 → 用户业务数据（users 表）
> Roles 模块 → 角色业务数据（roles 表）
> Permissions 模块 → 权限业务数据（permissions 表）
> AuthZ 模块 → 权限策略数据（casbin_rule 表）→ Casbin 解析引擎 → 权限检查
> ```

## 目录

- [架构概览](#架构概览)
- [模型配置文件（model.conf）](#模型配置文件modelconf)
- [策略加载机制](#策略加载机制)
- [策略存储机制](#策略存储机制)
- [策略变更同步](#策略变更同步)
- [系统启动流程](#系统启动流程)
- [多实例部署注意事项](#多实例部署注意事项)
- [最佳实践](#最佳实践)

## 架构概览

Casbin 采用**双层存储架构**：

```
┌─────────────────────────────────────────────────────────┐
│                    Casbin Enforcer                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │           内存中的 Model 对象                      │  │
│  │  (策略规则存储在内存中，用于快速权限检查)            │  │
│  └───────────────────────────────────────────────────┘  │
│                        ↕                                │
│                    Adapter                              │
│              (TypeORM Adapter)                          │
│                        ↕                                │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL 数据库                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │            casbin_rule 表                          │  │
│  │  (策略规则持久化存储，保证数据安全)                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 核心组件

1. **Enforcer（策略执行器）**
   - 负责权限检查的核心组件
   - 维护内存中的策略模型（Model）
   - 提供策略管理 API

2. **Adapter（适配器）**
   - 连接 Enforcer 和数据库的桥梁
   - 负责策略的加载和持久化
   - 本系统使用 `TypeORMAdapter`

3. **Model（模型）**
   - 内存中的策略数据结构
   - 包含所有策略规则（p、g、g2 等）
   - 用于快速权限检查

4. **Database（数据库）**
   - 策略规则的持久化存储
   - 使用 `casbin_rule` 表存储
   - 保证数据安全和可恢复性

5. **Model Configuration（模型配置文件）**
   - 定义权限模型的结构和规则
   - 文件位置：`src/modules/authz/model.conf`
   - 系统启动时加载，定义权限检查的行为

6. **Permissions Module（权限管理模块）**
   - 管理权限的业务数据（`permissions` 表）
   - 管理权限与角色的关联关系（`role_permissions` 表）
   - 提供权限的 CRUD 操作和用户权限查询
   - 与 Casbin 配合使用，但职责不同

## 模型配置文件（model.conf）

### 1. 文件作用

`model.conf` 是 Casbin 的**核心配置文件**，定义了权限模型的结构、匹配规则和效果。该文件在系统启动时被加载，用于创建 Enforcer 实例。

**文件位置**：`apps/fastify-api/src/modules/authz/model.conf`

**使用位置**：在 `app.module.ts` 中创建 Enforcer 时使用：

```typescript
// apps/fastify-api/src/app.module.ts

const modelPath = 'src/modules/authz/model.conf';
const enforcer = await casbin.newEnforcer(modelPath, adapter);
```

### 2. 文件内容

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

### 3. 各部分详解

#### [request_definition] - 请求定义

```
r = sub, dom, obj, act
```

**作用**：定义权限检查请求的格式和参数含义。

**参数说明**：

- `sub`：主体（Subject），通常是用户 ID 或用户名
- `dom`：域（Domain），用于多租户场景，表示租户或组织
- `obj`：对象（Object），资源或实体，如 `user`、`role`、`permission`
- `act`：操作（Action），对资源的操作，如 `read:any`、`write:own`、`delete:any`

**示例请求**：

```typescript
await enforcer.enforce('alice', 'tenant1', 'user', 'read:any');
// 对应：r.sub='alice', r.dom='tenant1', r.obj='user', r.act='read:any'
```

#### [policy_definition] - 策略定义

```
p = sub, dom, obj, act
```

**作用**：定义策略规则的格式，必须与请求定义对应。

**参数说明**：与请求定义相同，表示策略规则中的各个字段。

**示例策略**：

```
p, superuser, user, read:any
p, manager, user_roles, read:any
p, guest, user, read:own
```

#### [role_definition] - 角色定义

```
g = _, _, _    # 角色继承：用户 -> 角色 -> 域
g2 = _, _      # 资源继承：资源列表 -> 资源类型
```

**作用**：定义角色继承关系和资源继承关系。

**g 策略（角色继承）**：

- 格式：`g, 用户, 角色, 域`
- 含义：用户在指定域中拥有指定角色
- 示例：`g, alice, superuser, tenant1` 表示 alice 在 tenant1 域中拥有 superuser 角色

**g2 策略（资源继承）**：

- 格式：`g2, 资源列表, 资源类型`
- 含义：资源列表继承资源类型的权限
- 示例：`g2, users_list, user` 表示 users_list 资源列表继承 user 资源类型的权限

**示例策略**：

```
g, alice, superuser,
g, bob, guest,
g, tom, manager,
g2, users_list, user,
g2, user_roles, user,
g2, roles_list, role,
```

#### [policy_effect] - 策略效果

```
e = some(where (p.eft == allow))
```

**作用**：定义当策略匹配时的效果判断规则。

**说明**：

- `some(where (p.eft == allow))`：只要有一条策略允许（`allow`），则允许访问
- 这是最常见的策略效果，表示"允许优先"原则

**其他常见效果**：

- `e = some(where (p.eft == allow))`：允许优先（OR 逻辑）
- `e = !some(where (p.eft == deny))`：拒绝优先（除非明确拒绝）
- `e = some(where (p.eft == allow)) && !some(where (p.eft == deny))`：允许且不拒绝

#### [matchers] - 匹配器

```
m = g(r.sub, p.sub, r.dom) && g2(r.obj, p.obj) && r.act == p.act && r.dom == p.dom || r.sub == "root"
```

**作用**：定义权限检查的匹配逻辑，这是 Casbin 的核心。

**匹配逻辑解析**：

1. **`g(r.sub, p.sub, r.dom)`**
   - 检查请求中的用户（`r.sub`）是否在请求的域（`r.dom`）中拥有策略中的角色（`p.sub`）
   - 例如：检查 `alice` 在 `tenant1` 域中是否拥有 `superuser` 角色

2. **`g2(r.obj, p.obj)`**
   - 检查请求中的对象（`r.obj`）是否匹配策略中的对象（`p.obj`），或通过资源继承关系匹配
   - 例如：检查 `users_list` 是否继承自 `user` 资源类型

3. **`r.act == p.act`**
   - 检查请求中的操作（`r.act`）是否与策略中的操作（`p.act`）完全匹配
   - 例如：`read:any` 必须完全匹配 `read:any`

4. **`r.dom == p.dom`**
   - 检查请求中的域（`r.dom`）是否与策略中的域（`p.dom`）匹配
   - 用于多租户场景的域隔离

5. **`r.sub == "root"`**
   - 特殊规则：root 用户拥有所有权限
   - 这是一个超级管理员的后门，用于系统维护

**完整匹配流程**：

```
请求：enforce('alice', 'tenant1', 'user', 'read:any')

1. 检查 g('alice', 'superuser', 'tenant1') 是否存在
   → 如果存在，继续；否则匹配失败

2. 检查 g2('user', 'user') 是否匹配
   → 直接匹配或通过继承关系匹配

3. 检查 r.act == p.act
   → 'read:any' == 'read:any' ✓

4. 检查 r.dom == p.dom
   → 'tenant1' == 'tenant1' ✓

5. 如果所有条件都满足，返回 true
   或者如果 r.sub == 'root'，直接返回 true
```

### 4. 与数据库的关系

`model.conf` 和数据库策略数据的关系：

```
┌─────────────────────────────────────────────────┐
│          model.conf (模型定义)                   │
│  - 定义策略格式和匹配规则                         │
│  - 静态配置文件                                   │
│  - 系统启动时加载                                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      数据库策略数据 (casbin_rule 表)              │
│  - 存储具体的策略规则                            │
│  - 动态数据，可增删改                            │
│  - 系统运行时加载到内存                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           权限检查流程                            │
│  1. 根据 model.conf 解析请求                     │
│  2. 根据 model.conf 的匹配器匹配策略              │
│  3. 根据 model.conf 的效果规则判断结果            │
└─────────────────────────────────────────────────┘
```

**关键点**：

- `model.conf` 定义**如何匹配**（规则）
- 数据库存储**匹配什么**（数据）
- 两者结合才能完成权限检查

### 5. 修改 model.conf 的影响

⚠️ **重要提示**：修改 `model.conf` 会影响整个权限系统的行为！

**影响范围**：

- 所有权限检查的逻辑
- 策略规则的格式要求
- 角色继承和资源继承的匹配方式

**修改建议**：

1. **开发环境先测试**：在开发环境充分测试后再应用到生产环境
2. **版本控制**：将 `model.conf` 纳入版本控制，记录每次修改的原因
3. **向后兼容**：修改时考虑与现有策略数据的兼容性
4. **文档更新**：修改后及时更新相关文档

**示例：修改请求定义的影响**

如果修改请求定义为：

```
r = sub, obj, act  # 移除 dom 参数
```

那么：

- 所有策略规则也需要相应修改（移除域参数）
- 匹配器中的 `r.dom` 和 `p.dom` 需要移除
- 多租户功能将失效

### 6. 文件使用状态

✅ **已被系统使用**：在 `app.module.ts` 中，系统启动时通过以下代码加载：

```typescript
const modelPath = 'src/modules/authz/model.conf';
const enforcer = await casbin.newEnforcer(modelPath, adapter);
```

✅ **必需文件**：没有此文件，Casbin Enforcer 无法创建，系统无法启动。

## 策略加载机制

### 1. 系统启动时加载

系统启动时，在 `AppModule` 的 `enforcerProvider` 中执行策略加载：

```typescript
// apps/fastify-api/src/app.module.ts

enforcerProvider: {
  provide: AUTHZ_ENFORCER,
  useFactory: async (configService, dataSource, logger) => {
    // 1. 创建数据库适配器
    const adapter = await TypeORMAdapter.newAdapter(
      { connection: dataSource },
      { customCasbinRuleEntity: CasbinRule },
    );

    // 2. 创建 Enforcer，绑定模型文件和适配器
    const modelPath = 'src/modules/authz/model.conf';
    const enforcer = await casbin.newEnforcer(modelPath, adapter);

    // 3. 从数据库加载策略到内存
    await enforcer.loadPolicy();

    // 4. 检查策略数量并记录日志
    const policies = await enforcer.getPolicy();
    const groupingPolicies = await enforcer.getGroupingPolicy();
    const groupingPolicies2 = await enforcer.getNamedGroupingPolicy('g2');

    const totalPolicyCount =
      policies.length + groupingPolicies.length + groupingPolicies2.length;

    if (totalPolicyCount === 0) {
      logger.warn(
        '当前数据库没有权限策略数据，可能影响系统使用，请与系统管理员联系！',
        'AuthZModule',
      );
    } else {
      logger.log(
        `已从数据库加载 ${totalPolicyCount} 条权限策略规则`,
        'AuthZModule',
      );
    }

    return enforcer;
  },
}
```

### 2. 加载流程详解

#### 步骤 1：数据库查询

```typescript
// typeorm-adapter/adapter.ts

public async loadPolicy(model: Model) {
  // 从数据库查询所有策略规则
  const lines = await this.getRepository().find();

  // 遍历每条规则，加载到内存中的 Model
  for (const line of lines) {
    this.loadPolicyLine(line, model);
  }
}
```

#### 步骤 2：策略解析

```typescript
private loadPolicyLine(line: GenericCasbinRule, model: Model) {
  // 将数据库记录转换为 Casbin 策略格式
  const result =
    line.ptype +
    ', ' +
    [line.v0, line.v1, line.v2, line.v3, line.v4, line.v5, line.v6]
      .filter((n) => n)
      .map((n) => `"${n}"`)
      .join(', ');

  // 加载到内存中的 Model 对象
  Helper.loadPolicyLine(result, model);
}
```

#### 步骤 3：内存存储

策略被加载到 Enforcer 的 Model 对象中，存储在内存中：

- **p 策略**：权限策略（如 `p, superuser, user, read:any`）
- **g 策略**：角色继承策略（如 `g, alice, superuser`）
- **g2 策略**：资源继承策略（如 `g2, users_list, user`）

### 3. 策略类型说明

根据 `model.conf` 配置，系统支持以下策略类型：

| 策略类型 | 说明                      | 示例                           |
| -------- | ------------------------- | ------------------------------ |
| `p`      | 权限策略（Policy）        | `p, superuser, user, read:any` |
| `g`      | 角色继承策略（Grouping）  | `g, alice, superuser`          |
| `g2`     | 资源继承策略（Grouping2） | `g2, users_list, user`         |

## 策略存储机制

### 0. 关于 policy.csv 文件的说明

⚠️ **重要说明**：本系统**不支持使用 `policy.csv` 文件实现持久化**。

虽然 Casbin 支持通过 CSV 文件（`policy.csv`）存储策略规则，但本系统采用以下方式：

- ❌ **不使用 `policy.csv` 持久化**：项目中的 `policy.csv` 文件仅作为示例或文档参考，**不会被系统加载或使用**。
- ✅ **使用数据库持久化**：所有权限策略数据存储在 PostgreSQL 数据库的 `casbin_rule` 表中。
- ✅ **通过 TypeORMAdapter 管理**：策略的加载、添加、删除、更新都通过 `TypeORMAdapter` 与数据库交互。

**为什么使用数据库而不是文件？**

1. **数据一致性**：数据库支持事务，保证策略变更的原子性
2. **并发控制**：多实例部署时，数据库可以更好地处理并发访问
3. **查询和审计**：可以通过 SQL 查询策略数据，便于审计和调试
4. **可扩展性**：数据库更适合大规模策略数据的存储和管理

**policy.csv 文件的状态**：

- 文件位置：`apps/fastify-api/src/modules/authz/policy.csv`
- 文件状态：**仅作为示例或文档参考，系统不会读取此文件**
- 建议：可以保留作为参考，但不要依赖此文件进行策略管理

### 1. 双层存储架构

Casbin 采用**内存 + 数据库**的双层存储架构：

#### 内存存储（Model）

- **位置**：Enforcer 的 Model 对象中
- **用途**：快速权限检查
- **特点**：
  - 访问速度快（毫秒级）
  - 系统重启后丢失
  - 策略变更时实时更新

#### 数据库存储（casbin_rule 表）

- **位置**：PostgreSQL 数据库
- **用途**：持久化存储
- **特点**：
  - 数据持久化，系统重启后保留
  - 支持事务和并发控制
  - 可查询和审计

### 2. 数据库表结构

```sql
CREATE TABLE casbin_rule (
  id SERIAL PRIMARY KEY,
  ptype VARCHAR(255),  -- 策略类型：p, g, g2
  v0 VARCHAR(255),     -- 第一个参数
  v1 VARCHAR(255),     -- 第二个参数
  v2 VARCHAR(255),     -- 第三个参数
  v3 VARCHAR(255),     -- 第四个参数
  v4 VARCHAR(255),     -- 第五个参数
  v5 VARCHAR(255),     -- 第六个参数
  v6 VARCHAR(255)      -- 第七个参数
);
```

**示例数据**：

| id  | ptype | v0         | v1        | v2       | v3  | v4  | v5  | v6  |
| --- | ----- | ---------- | --------- | -------- | --- | --- | --- | --- |
| 1   | p     | superuser  | user      | read:any |     |     |     |     |
| 2   | g     | alice      | superuser |          |     |     |     |     |
| 3   | g2    | users_list | user      |          |     |     |     |     |

### 3. 存储映射关系

数据库记录与策略规则的映射关系：

```
数据库记录                    →    策略规则
─────────────────────────────────────────────────
ptype='p', v0='superuser',    →    p, superuser, user, read:any
v1='user', v2='read:any'

ptype='g', v0='alice',        →    g, alice, superuser
v1='superuser'

ptype='g2', v0='users_list',  →    g2, users_list, user
v1='user'
```

## 策略变更同步

### 1. 自动同步机制

当通过 Casbin API 修改策略时，系统会**自动同步**内存和数据库：

```typescript
// 添加策略
await authzService.addPolicy('admin', 'user', 'read:any');
// 1. 更新内存中的 Model（立即生效）
// 2. 通过 Adapter 保存到数据库（持久化）

// 删除策略
await authzService.removePolicy('admin', 'user', 'read:any');
// 1. 从内存中的 Model 移除（立即生效）
// 2. 通过 Adapter 从数据库删除（持久化）
```

### 2. 策略变更方法

#### 添加策略

```typescript
// typeorm-adapter/adapter.ts

public async addPolicy(sec: string, ptype: string, rule: string[]) {
  // 1. 创建数据库记录
  const line = this.savePolicyLine(ptype, rule);

  // 2. 保存到数据库
  await this.getRepository().save(line);

  // 注意：内存中的 Model 由 Casbin 自动更新
}
```

#### 删除策略

```typescript
public async removePolicy(sec: string, ptype: string, rule: string[]) {
  // 1. 创建查询条件
  const line = this.savePolicyLine(ptype, rule);

  // 2. 从数据库删除
  await this.getRepository().delete({ ...line });

  // 注意：内存中的 Model 由 Casbin 自动更新
}
```

#### 更新策略

```typescript
async updatePolicy(
  sec: string,
  ptype: string,
  oldRule: string[],
  newRule: string[],
): Promise<void> {
  // 1. 查找旧记录
  const oldLine = this.savePolicyLine(ptype, oldRule);
  const foundLine = await this.getRepository().findOneOrFail({
    where: { ptype, v0: oldLine.v0, v1: oldLine.v1, ... },
  });

  // 2. 更新为新记录
  const newLine = this.savePolicyLine(ptype, newRule);
  await this.getRepository().save(Object.assign(foundLine, newLine));

  // 注意：内存中的 Model 由 Casbin 自动更新
}
```

### 3. 同步时机

| 操作           | 内存更新 | 数据库更新 | 生效时间       |
| -------------- | -------- | ---------- | -------------- |
| `addPolicy`    | 立即     | 立即       | 立即生效       |
| `removePolicy` | 立即     | 立即       | 立即生效       |
| `updatePolicy` | 立即     | 立即       | 立即生效       |
| `loadPolicy`   | 重新加载 | 不更新     | 重新加载后生效 |

## 系统启动流程

### 完整启动流程

```
1. 应用启动
   ↓
2. 初始化数据库连接（TypeORM）
   ↓
3. 创建 TypeORMAdapter
   ├─ 连接数据库
   └─ 准备 CasbinRule 实体
   ↓
4. 创建 Casbin Enforcer
   ├─ 加载 model.conf（模型配置）
   └─ 绑定 Adapter（数据库适配器）
   ↓
5. 调用 loadPolicy()
   ├─ 从数据库查询所有策略
   ├─ 解析策略规则
   └─ 加载到内存中的 Model
   ↓
6. 检查策略数量
   ├─ 统计 p、g、g2 策略数量
   ├─ 如果为空：记录警告日志
   └─ 如果有数据：记录加载成功日志
   ↓
7. 返回 Enforcer 实例
   └─ 系统可以开始使用权限检查
```

### 启动日志示例

**成功加载**：

```
[AuthZModule] 已从数据库加载 15 条权限策略规则
```

**数据库为空**：

```
[AuthZModule] 警告: 当前数据库没有权限策略数据，可能影响系统使用，请与系统管理员联系！
```

## 多实例部署注意事项

### 1. 问题场景

在多实例部署环境中（如 Kubernetes、Docker Swarm），多个应用实例共享同一个数据库：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 实例 1       │     │ 实例 2       │     │ 实例 3       │
│ (内存策略)   │     │ (内存策略)   │     │ (内存策略)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌────────▼────────┐
                  │  共享数据库      │
                  │  (casbin_rule)  │
                  └─────────────────┘
```

**潜在问题**：

- 实例 A 修改策略后，实例 B 和 C 的内存策略未更新
- 导致权限检查不一致

### 2. 解决方案

#### 方案 1：定期重新加载（简单但不实时）

```typescript
// 在定时任务中定期重新加载策略
@Cron('*/5 * * * *') // 每 5 分钟
async reloadPolicies() {
  await this.enforcer.loadPolicy();
  this.logger.log('策略已重新加载', 'AuthZService');
}
```

**优点**：

- 实现简单
- 无需额外基础设施

**缺点**：

- 有延迟（最多 5 分钟）
- 增加数据库负载

#### 方案 2：事件通知机制（推荐）

使用消息队列（如 Redis Pub/Sub、RabbitMQ）通知策略变更：

```typescript
// 策略变更时发布事件
async addPolicy(...params: string[]) {
  const result = await this.enforcer.addPolicy(...params);

  if (result) {
    // 发布策略变更事件
    await this.eventBus.publish(
      new PolicyChangedEvent('add', params),
    );
  }

  return result;
}

// 监听策略变更事件
@OnEvent('policy.changed')
async handlePolicyChanged(event: PolicyChangedEvent) {
  // 重新加载策略
  await this.enforcer.loadPolicy();
  this.logger.log('策略已更新并重新加载', 'AuthZService');
}
```

**优点**：

- 实时同步
- 性能好

**缺点**：

- 需要消息队列基础设施
- 实现复杂度较高

#### 方案 3：使用 Casbin Watcher（官方推荐）

Casbin 提供了 Watcher 机制，用于多实例间的策略同步：

```typescript
import { Watcher } from 'casbin';

// 创建 Watcher（如 Redis Watcher）
const watcher = await newRedisWatcher('redis://localhost:6379');

// 绑定到 Enforcer
await enforcer.setWatcher(watcher);

// 策略变更时自动通知其他实例
await enforcer.addPolicy('admin', 'user', 'read:any');
// 其他实例会自动收到通知并更新内存策略
```

**优点**：

- 官方支持
- 自动同步
- 性能好

**缺点**：

- 需要额外的 Watcher 实现（如 Redis）

### 3. 推荐方案

对于本系统，建议：

1. **开发/测试环境**：使用方案 1（定期重新加载）
2. **生产环境**：使用方案 3（Casbin Watcher + Redis）

## 最佳实践

### 1. 策略初始化

- ✅ **系统启动时检查策略数量**，如果为空记录警告
- ✅ **不要自动从文件导入策略**，应由管理员通过 API 配置
- ✅ **提供管理界面**，方便管理员管理策略

### 2. 策略管理

- ✅ **使用事务**：批量操作时使用事务保证一致性
- ✅ **记录审计日志**：记录策略变更操作
- ✅ **定期备份**：定期备份 `casbin_rule` 表

### 3. 性能优化

- ✅ **策略加载在启动时完成**，避免运行时频繁加载
- ✅ **权限检查使用内存策略**，避免每次查询数据库
- ✅ **批量操作使用 `addPolicies`**，而不是多次 `addPolicy`

### 4. 监控和告警

- ✅ **监控策略数量**：如果策略数量异常变化，发送告警
- ✅ **监控加载时间**：如果加载时间过长，检查数据库性能
- ✅ **监控权限检查性能**：如果权限检查变慢，检查策略数量

### 5. 故障处理

- ✅ **数据库连接失败**：记录错误日志，系统启动失败
- ✅ **策略加载失败**：记录错误日志，系统启动失败
- ✅ **策略为空**：记录警告日志，系统可以启动但权限检查可能失败

### 6. 用户和角色管理

⚠️ **重要说明**：Casbin 是权限解析引擎，不负责用户和角色的业务数据管理。

**职责划分**：

- ✅ **Users 模块**：负责用户信息的业务数据管理
  - 用户基本信息（姓名、邮箱、密码等）
  - 用户状态（激活、禁用等）
  - 用户业务逻辑
- ✅ **Roles 模块**：负责角色信息的业务数据管理
  - 角色基本信息（名称、描述等）
  - 角色业务逻辑
- ✅ **Permissions 模块**：负责权限信息的业务数据管理
  - 权限业务数据（`permissions` 表）
  - 权限与角色的关联管理（`role_permissions` 表）
  - 权限的 CRUD 操作
  - 用户权限查询接口
- ✅ **AuthZ 模块（Casbin）**：仅负责权限策略的解析和检查
  - 权限策略的存储（`casbin_rule` 表）
  - 权限检查逻辑
  - 策略规则的管理

**数据流向**：

```
┌─────────────────┐
│  Users 模块      │ → users 表（用户业务数据）
└─────────────────┘

┌─────────────────┐
│  Roles 模块      │ → roles 表（角色业务数据）
└─────────────────┘

┌─────────────────┐
│  Permissions 模块│ → permissions 表（权限业务数据）
│                  │ → role_permissions 表（角色-权限关联）
└─────────────────┘

┌─────────────────┐
│  AuthZ 模块      │ → casbin_rule 表（权限策略数据）
│  (Casbin)       │ → 权限检查逻辑
└─────────────────┘
```

**Permissions 模块的作用**：

`Permissions` 模块是权限业务数据的管理模块，与 Casbin 的职责不同：

| 模块                     | 职责               | 数据表                                    | 用途                                                                  |
| ------------------------ | ------------------ | ----------------------------------------- | --------------------------------------------------------------------- |
| **Permissions 模块**     | 权限业务数据管理   | `permissions` 表<br>`role_permissions` 表 | 定义系统中的权限资源（resource + action）<br>管理权限与角色的业务关联 |
| **AuthZ 模块（Casbin）** | 权限策略解析和检查 | `casbin_rule` 表                          | 存储权限检查的策略规则<br>执行权限检查逻辑                            |

**关键区别**：

1. **Permissions 模块**：
   - 管理权限的**业务定义**（如：`resource='user'`, `action='read:any'`）
   - 提供权限的 CRUD 操作
   - 管理权限与角色的业务关联（多对多关系）
   - 提供用户权限查询接口（通过 Casbin 获取）

2. **AuthZ 模块（Casbin）**：
   - 管理权限的**策略规则**（如：`p, superuser, user, read:any`）
   - 执行权限检查逻辑
   - 不管理权限的业务定义，只管理策略规则

**数据关系**：

```
Permissions 模块（业务层）
  └─ permissions 表
      ├─ id: UUID
      ├─ resource: 'user'
      ├─ action: 'read:any'
      └─ description: '读取任何用户'

  └─ role_permissions 表（关联表）
      ├─ role_id → roles 表
      └─ permission_id → permissions 表

AuthZ 模块（策略层）
  └─ casbin_rule 表
      ├─ ptype: 'p'
      ├─ v0: 'superuser'  (角色名称，对应 roles 表)
      ├─ v1: 'user'       (资源，对应 permissions.resource)
      └─ v2: 'read:any'   (操作，对应 permissions.action)
```

**工作流程**：

1. **权限定义**：通过 `Permissions` 模块创建权限（`resource + action`）
2. **角色关联**：通过 `Permissions` 模块将权限分配给角色（业务关联）
3. **策略同步**：将角色-权限关联同步到 Casbin 策略（`casbin_rule` 表）
4. **权限检查**：通过 `AuthZ` 模块（Casbin）执行权限检查

**最佳实践**：

- ✅ **用户和角色数据由业务模块管理**：通过 `users` 和 `roles` 模块的 API 进行管理
- ✅ **权限业务数据由 Permissions 模块管理**：通过 `PermissionsService` 的 API 进行管理
- ✅ **权限策略由 AuthZ 模块管理**：通过 `AuthZService` 的 API 进行管理
- ✅ **权限检查时使用用户 ID**：权限检查时传入用户 ID（来自 `users` 表），而不是用户名
- ✅ **策略中的角色名称与 roles 表一致**：确保 Casbin 策略中的角色名称与 `roles` 表中的角色名称一致
- ✅ **策略中的资源/操作与 permissions 表一致**：确保 Casbin 策略中的资源（v1）和操作（v2）与 `permissions` 表中的 `resource` 和 `action` 一致

## 总结

### 核心机制

Casbin 的策略加载和存储机制采用**内存 + 数据库**的双层架构：

1. **启动时**：从数据库加载策略到内存
2. **运行时**：权限检查使用内存策略（快速）
3. **变更时**：同时更新内存和数据库（自动同步）
4. **多实例**：需要额外的同步机制（Watcher 或事件）

这种设计既保证了**性能**（内存访问），又保证了**数据安全**（数据库持久化），是 Casbin 的核心优势之一。

### 本系统实现要点

1. **Casbin 定位**：Casbin 是权限解析引擎，负责权限策略的解析和检查，不负责用户和角色的业务数据管理。

2. **持久化方式**：
   - ❌ **不使用 `policy.csv` 文件**：虽然 Casbin 支持 CSV 文件，但本系统不采用此方式
   - ✅ **使用数据库持久化**：所有权限策略存储在 `casbin_rule` 表中

3. **数据管理职责**：
   - **Users 模块**：管理用户业务数据（`users` 表）
   - **Roles 模块**：管理角色业务数据（`roles` 表）
   - **Permissions 模块**：管理权限业务数据（`permissions` 表）和权限-角色关联（`role_permissions` 表）
   - **AuthZ 模块（Casbin）**：管理权限策略数据（`casbin_rule` 表）和权限检查逻辑

4. **配置文件**：
   - **`model.conf`**：定义权限模型结构和匹配规则（必需）
   - **`policy.csv`**：仅作为示例参考，系统不使用（可选）

5. **模块职责划分**：
   - **Permissions 模块**：权限业务数据管理（`permissions` 表）
   - **AuthZ 模块（Casbin）**：权限策略解析和检查（`casbin_rule` 表）
   - 两者配合使用，但职责不同：Permissions 管理业务定义，Casbin 管理策略规则

## 相关文档

- [Casbin 授权系统集成说明](./Casbin授权系统集成说明.md)
- [RBAC 系统使用说明](./RBAC系统使用说明.md)
- [Casbin 官方文档](https://casbin.org/docs/zh-CN/overview)
