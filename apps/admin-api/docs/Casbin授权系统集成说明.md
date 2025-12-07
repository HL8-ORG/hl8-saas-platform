# Casbin 授权系统集成说明

## 概述

本项目已集成 Casbin 授权系统，使用 TypeORM Adapter 实现数据库持久化，替代文件存储方式。授权系统基于 RBAC（基于角色的访问控制）模型，支持多租户和资源所有权控制。

## 架构设计

### 核心组件

1. **AuthZModule**: Casbin 授权模块，提供全局授权功能
2. **AuthZGuard**: 权限守卫，用于路由级别的权限检查
3. **TypeORM Adapter**: 数据库适配器，将策略存储到 PostgreSQL 数据库
4. **CasbinRule 实体**: 数据库实体，存储 Casbin 策略规则

### 数据流

```
请求 → AuthGuard (JWT 认证) → AuthZGuard (权限检查) → 控制器
                                    ↓
                            Casbin Enforcer
                                    ↓
                            TypeORM Adapter
                                    ↓
                            PostgreSQL 数据库
```

## 配置说明

### 1. 数据库实体

**CasbinRule 实体**已添加到 TypeORM 配置中：

```typescript
entities: [User, RefreshToken, CasbinRule];
```

数据库表结构：

- `id`: 主键
- `ptype`: 策略类型（p = policy, g = role, g2 = resource group）
- `v0` - `v6`: 策略参数（根据模型定义使用）

### 2. AuthZModule 配置

在 `AppModule` 中配置：

```typescript
AuthZModule.register({
  imports: [ConfigModule],
  enforcerProvider: {
    provide: AUTHZ_ENFORCER,
    useFactory: async (
      configService: ConfigService,
      dataSource: DataSource,
    ) => {
      // 使用 TypeORM Adapter
      const adapter = await TypeORMAdapter.newAdapter(
        { connection: dataSource },
        { customCasbinRuleEntity: CasbinRule },
      );

      // 创建 Enforcer
      const modelPath = 'src/modules/authz/model.conf';
      const enforcer = await casbin.newEnforcer(modelPath, adapter);

      // 从数据库加载策略
      await enforcer.loadPolicy();

      return enforcer;
    },
    inject: [ConfigService, DataSource],
  },
  userFromContext: (context) => {
    // 从 JWT payload 提取用户 ID
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user?.sub || user?.id || user?.username || null;
  },
});
```

### 3. Casbin 模型配置

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

**说明**：

- `sub`: 主体（用户 ID）
- `dom`: 域（多租户支持，可选）
- `obj`: 对象（资源）
- `act`: 动作（操作）

## 使用方法

### 1. 在控制器中使用权限守卫

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthZGuard, UsePermissions } from '@/modules/authz';
import { AuthActionVerb, AuthPossession } from '@/modules/authz/types';
import { AuthGuard } from '@/common/guards/auth.guard';

@Controller('users')
export class UserController {
  @Get()
  @UseGuards(AuthGuard, AuthZGuard)
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: 'user',
    possession: AuthPossession.ANY,
  })
  async findAll() {
    // 只有具有 read:any user 权限的用户才能访问
    return this.userService.findAll();
  }

  @Get('me')
  @UseGuards(AuthGuard, AuthZGuard)
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: 'user',
    possession: AuthPossession.OWN,
  })
  async getMe(@GetUser('sub') userId: string) {
    // 只能访问自己的信息
    return this.userService.findById(userId);
  }
}
```

### 2. 权限动作类型

```typescript
enum AuthActionVerb {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
}

enum AuthPossession {
  ANY = 'any', // 任何资源
  OWN = 'own', // 仅自己的资源
  OWN_ANY = 'own|any', // 自己的或任何资源
}
```

### 3. 使用服务进行权限检查

```typescript
import { AuthZRBACService } from '@/modules/authz';

@Injectable()
export class UserService {
  constructor(private rbacService: AuthZRBACService) {}

  async canUserAccessResource(
    userId: string,
    resource: string,
    action: string,
  ) {
    return await this.rbacService.hasPermissionForUser(
      userId,
      resource,
      action,
    );
  }
}
```

## 策略管理

### 初始化策略数据

首次部署时，需要初始化策略数据。可以通过以下方式：

#### 方式一：使用迁移脚本

创建数据库迁移脚本，插入初始策略：

```typescript
// migrations/xxxxx-init-casbin-policies.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCasbinPolicies1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 插入策略
    await queryRunner.query(`
      INSERT INTO casbin_rule (ptype, v0, v1, v2, v3) VALUES
      ('p', 'admin', '', 'user', 'read:any'),
      ('p', 'admin', '', 'user', 'create:any'),
      ('p', 'admin', '', 'user', 'update:any'),
      ('p', 'admin', '', 'user', 'delete:any'),
      ('p', 'user', '', 'user', 'read:own'),
      ('p', 'user', '', 'user', 'update:own');
    `);

    // 插入角色关系
    await queryRunner.query(`
      INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES
      ('g', 'user-id-1', 'admin', ''),
      ('g', 'user-id-2', 'user', '');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM casbin_rule`);
  }
}
```

#### 方式二：使用管理服务

```typescript
import { AuthZRBACService } from '@/modules/authz';

@Injectable()
export class PolicyInitService {
  constructor(private rbacService: AuthZRBACService) {}

  async initPolicies() {
    // 为角色添加权限
    await this.rbacService.addPermissionForUser('admin', 'user', 'read:any');
    await this.rbacService.addPermissionForUser('admin', 'user', 'create:any');
    await this.rbacService.addPermissionForUser('user', 'user', 'read:own');

    // 为用户分配角色
    await this.rbacService.addRoleForUser('user-id-1', 'admin');
    await this.rbacService.addRoleForUser('user-id-2', 'user');
  }
}
```

### 策略格式说明

#### 策略规则 (p)

格式：`p, sub, dom, obj, act`

示例：

- `p, admin, , user, read:any` - 管理员可以读取任何用户
- `p, user, , user, read:own` - 普通用户只能读取自己的信息

#### 角色关系 (g)

格式：`g, user, role, domain`

示例：

- `g, user-id-1, admin, ` - 用户 user-id-1 拥有 admin 角色

#### 资源分组 (g2)

格式：`g2, resource, group`

示例：

- `g2, users_list, user` - users_list 属于 user 资源组

## 最佳实践

### 1. 权限粒度

- **粗粒度**：按资源类型（如 `user`、`order`）
- **细粒度**：按具体资源（如 `user:123`、`order:456`）

建议：根据业务需求选择合适的粒度，平衡安全性和性能。

### 2. 角色设计

- **系统角色**：`admin`、`user`、`guest`
- **业务角色**：`manager`、`editor`、`viewer`

建议：使用 RBAC 模型，通过角色分配权限，而不是直接为用户分配权限。

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

### 4. 性能优化

- 使用 `loadFilteredPolicy` 加载部分策略（适用于多租户场景）
- 定期清理无效策略
- 监控策略表大小

## 常见问题

### Q1: 如何添加新权限？

A: 使用 `AuthZRBACService`：

```typescript
await this.rbacService.addPermissionForUser('role', 'resource', 'action');
```

### Q2: 如何为用户分配角色？

A:

```typescript
await this.rbacService.addRoleForUser('user-id', 'role-name');
```

### Q3: 策略修改后不生效？

A: 需要重新加载策略：

```typescript
await enforcer.loadPolicy();
```

### Q4: 如何支持多租户？

A: 在模型中使用 `dom` 字段，在策略中指定域：

```typescript
// 策略
p, admin, tenant-1, user, read:any

// 检查时指定域
await enforcer.enforce('user-id', 'tenant-1', 'user', 'read:any');
```

## 迁移指南

### 从文件存储迁移到数据库

1. **备份现有策略文件** (`policy.csv`)

2. **运行数据库迁移**，创建 `casbin_rule` 表

3. **导入策略数据**：

```typescript
// 读取 CSV 文件并导入到数据库
const policies = parseCSV('policy.csv');
for (const policy of policies) {
  await this.rbacService.addPolicy(...policy);
}
```

4. **验证策略**：确保数据库中的策略与文件一致

5. **移除文件依赖**：删除 `policy.csv`，确保只使用数据库

## 相关文件

- 模型配置：`src/modules/authz/model.conf`
- 授权模块：`src/modules/authz/authz.module.ts`
- 权限守卫：`src/modules/authz/authz.guard.ts`
- 权限装饰器：`src/modules/authz/decorators/use-permissions.decorator.ts`
- TypeORM Adapter：`src/typeorm-adapter/`
- CasbinRule 实体：`src/typeorm-adapter/casbinRule.ts`

## 参考资源

- [Casbin 官方文档](https://casbin.org/)
- [Node-Casbin 文档](https://github.com/casbin/node-casbin)
- [TypeORM Adapter 文档](https://github.com/node-casbin/typeorm-adapter)
