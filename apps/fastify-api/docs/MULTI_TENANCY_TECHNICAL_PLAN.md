# Fastify API 多租户支持技术方案

## 📋 目录

1. [概述](#概述)
2. [架构设计](#架构设计)
3. [技术实现方案](#技术实现方案)
4. [数据库设计](#数据库设计)
5. [代码实现](#代码实现)
6. [迁移策略](#迁移策略)
7. [安全考虑](#安全考虑)
8. [性能优化](#性能优化)
9. [测试策略](#测试策略)
10. [实施计划](#实施计划)

---

## 概述

### 目标

为 `apps/fastify-api` 项目增加多租户支持，实现以下目标：

- ✅ **共享数据库架构**：所有租户共享同一个 PostgreSQL 数据库
- ✅ **行级软隔离**：通过 `tenant_id` 字段实现租户数据隔离
- ✅ **自动过滤**：所有查询自动过滤当前租户的数据
- ✅ **透明集成**：对现有业务代码的侵入性最小
- ✅ **安全性**：确保租户数据完全隔离，防止数据泄露

### 技术约束

- 使用 **TypeORM** 作为 ORM 框架
- 使用 **Fastify** 作为 HTTP 服务器
- 使用 **PostgreSQL** 作为关系型数据库
- 遵循项目章程规范（中文注释、TSDoc、测试要求等）

---

## 架构设计

### 多租户架构模式

本项目采用 **共享数据库 + 行级隔离（Shared Database, Row-Level Isolation）** 模式：

```
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  tenants 表                       │  │
│  │  - id (UUID)                      │  │
│  │  - name                           │  │
│  │  - domain                         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  users 表                         │  │
│  │  - id (UUID)                      │  │
│  │  - tenant_id (UUID, FK) ← 隔离字段│  │
│  │  - email                          │  │
│  │  - ...                            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  其他业务表                        │  │
│  │  - tenant_id (UUID, FK) ← 隔离字段│  │
│  │  - ...                            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 租户上下文管理流程

```
HTTP Request
    ↓
[TenantMiddleware] 提取 tenantId
    ↓
[AuthGuard] 验证 JWT，附加 user 信息
    ↓
[TenantContext] 存储到 request.tenantId
    ↓
[TypeORM Repository] 自动过滤 tenantId
    ↓
Database Query (WHERE tenant_id = ?)
```

### 核心组件

1. **Tenant 实体**：租户信息表
2. **TenantMiddleware**：提取和验证租户 ID
3. **TenantContext**：请求级别的租户上下文
4. **TenantRepository**：自动注入 tenantId 的自定义 Repository
5. **TenantEntitySubscriber**：自动设置 tenantId 的实体订阅者

---

## 技术实现方案

### 1. 租户 ID 提取策略

租户 ID 可以从以下来源提取（按优先级）：

1. **JWT Payload**（推荐）：从 JWT token 的 `tenantId` 字段提取
2. **请求头**：从 `X-Tenant-Id` 请求头提取（用于服务间调用）
3. **子域名**：从请求的 `Host` 头提取子域名，映射到租户（可选）

**优先级顺序**：

```
JWT Payload > X-Tenant-Id Header > Subdomain Mapping
```

### 2. 数据隔离机制

#### 2.1 查询隔离

所有数据库查询自动添加 `WHERE tenant_id = ?` 条件：

```typescript
// 自动转换
repository.find();
// → SELECT * FROM users WHERE tenant_id = 'xxx'

repository.findOne({ where: { email: 'xxx' } });
// → SELECT * FROM users WHERE tenant_id = 'xxx' AND email = 'xxx'
```

#### 2.2 插入隔离

所有插入操作自动设置 `tenant_id` 字段：

```typescript
// 自动注入
repository.save({ email: 'xxx', password: 'xxx' });
// → INSERT INTO users (email, password, tenant_id) VALUES (?, ?, 'xxx')
```

#### 2.3 更新隔离

更新操作自动限制在当前租户范围内：

```typescript
// 自动限制
repository.update({ id: 'xxx' }, { email: 'new@example.com' });
// → UPDATE users SET email = ? WHERE id = ? AND tenant_id = 'xxx'
```

#### 2.4 删除隔离

删除操作自动限制在当前租户范围内：

```typescript
// 自动限制
repository.delete({ id: 'xxx' });
// → DELETE FROM users WHERE id = ? AND tenant_id = 'xxx'
```

### 3. 实现方式选择

#### 方案 A：自定义 Repository（推荐）

**优点**：

- 对现有代码侵入性小
- 类型安全
- 易于测试和维护

**缺点**：

- 需要为每个实体创建自定义 Repository
- 需要显式使用自定义 Repository

#### 方案 B：Entity Subscriber

**优点**：

- 完全透明，无需修改业务代码
- 自动处理所有实体

**缺点**：

- 难以控制哪些实体需要多租户
- 调试困难

#### 方案 C：QueryBuilder 拦截器

**优点**：

- 可以拦截所有查询
- 灵活性高

**缺点**：

- 实现复杂
- 可能影响性能

**最终选择**：**方案 A + 方案 B 混合**

- 使用 **Entity Subscriber** 自动设置 `tenant_id`（插入/更新）
- 使用 **自定义 Repository** 自动过滤查询（查询/删除）
- 提供 **装饰器** 标记需要多租户的实体

---

## 数据库设计

### 1. Tenant 实体

```typescript
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ unique: true, length: 255, nullable: true })
  domain?: string; // 子域名，如 'acme.example.com'

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 2. 业务实体改造

为需要多租户隔离的实体添加 `tenantId` 字段：

```typescript
@Entity('users')
export class User {
  // ... 现有字段 ...

  /**
   * 租户 ID
   *
   * 用于多租户数据隔离，所有查询和操作都会自动限制在当前租户范围内。
   *
   * @type {string}
   */
  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index() // 添加索引提升查询性能
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
```

### 3. 数据库索引

为所有 `tenant_id` 字段添加索引，提升查询性能：

```sql
-- 自动生成的索引（通过 @Index() 装饰器）
CREATE INDEX "IDX_users_tenant_id" ON "users" ("tenant_id");
CREATE INDEX "IDX_roles_tenant_id" ON "roles" ("tenant_id");
-- ... 其他表
```

### 4. 外键约束（可选）

为数据完整性考虑，可以添加外键约束：

```typescript
@ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'tenant_id' })
tenant: Tenant;
```

**注意**：外键约束可能影响性能，可根据实际情况决定是否启用。

---

## 代码实现

### 1. 目录结构

```
apps/fastify-api/src/
├── entities/
│   ├── tenant.entity.ts          # 新增：租户实体
│   ├── user.entity.ts            # 修改：添加 tenantId 字段
│   └── ...
├── common/
│   ├── decorators/
│   │   ├── tenant.decorator.ts   # 新增：租户装饰器
│   │   └── ...
│   ├── middleware/
│   │   ├── tenant.middleware.ts  # 新增：租户中间件
│   │   └── ...
│   ├── interceptors/
│   │   ├── tenant.interceptor.ts # 新增：租户拦截器（可选）
│   │   └── ...
│   └── ...
├── database/
│   ├── repositories/
│   │   ├── tenant.repository.ts  # 新增：租户 Repository
│   │   └── base-tenant.repository.ts # 新增：基础多租户 Repository
│   ├── subscribers/
│   │   ├── tenant.subscriber.ts # 新增：租户实体订阅者
│   │   └── ...
│   └── ...
└── modules/
    └── tenants/                  # 新增：租户管理模块
        ├── tenants.module.ts
        ├── tenants.service.ts
        └── tenants.controller.ts
```

### 2. 核心实现

#### 2.1 Tenant 实体

```typescript
// entities/tenant.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 租户实体
 *
 * 表示系统中的租户（组织/公司）信息。
 * 每个租户拥有独立的数据空间，通过 tenant_id 字段实现数据隔离。
 *
 * @class Tenant
 * @description 租户实体，映射到数据库 tenants 表
 */
@Entity('tenants')
export class Tenant {
  /**
   * 租户唯一标识符
   *
   * 使用 UUID 格式自动生成的主键。
   *
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 租户名称
   *
   * 租户的显示名称，必须唯一。
   *
   * @type {string}
   */
  @Column({ unique: true, length: 100 })
  name: string;

  /**
   * 租户域名
   *
   * 租户的子域名，用于基于域名的租户识别（可选）。
   * 例如：'acme' 对应 'acme.example.com'
   *
   * @type {string | undefined}
   */
  @Column({ unique: true, length: 255, nullable: true })
  @Index()
  domain?: string;

  /**
   * 是否激活
   *
   * 标识租户是否处于激活状态。
   * 非激活的租户无法访问系统。
   *
   * @type {boolean}
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * 创建时间
   *
   * 租户创建的时间戳。
   *
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 更新时间
   *
   * 租户最后更新的时间戳。
   *
   * @type {Date}
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### 2.2 租户装饰器

````typescript
// common/decorators/tenant.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * 多租户装饰器元数据键
 *
 * 用于标记需要多租户支持的控制器或路由。
 */
export const TENANT_METADATA_KEY = 'isTenantAware';

/**
 * 租户感知装饰器
 *
 * 标记控制器或路由方法需要多租户支持。
 * 被标记的路由会自动进行租户上下文验证和数据隔离。
 *
 * **使用场景**：
 * - 默认情况下，所有路由都需要租户上下文
 * - 对于不需要租户的路由（如租户注册、系统管理），使用 @PublicTenant() 跳过
 *
 * @decorator TenantAware
 * @example
 * ```typescript
 * @Controller('users')
 * @TenantAware() // 整个控制器需要租户支持
 * export class UsersController {
 *   @Get()
 *   async findAll() {
 *     // 自动过滤当前租户的数据
 *   }
 * }
 * ```
 */
export const TenantAware = () => SetMetadata(TENANT_METADATA_KEY, true);

/**
 * 公共租户路由装饰器
 *
 * 标记路由不需要租户上下文（如租户注册、系统管理接口）。
 *
 * @decorator PublicTenant
 * @example
 * ```typescript
 * @Controller('tenants')
 * export class TenantsController {
 *   @Post('register')
 *   @PublicTenant() // 租户注册不需要租户上下文
 *   async register() {
 *     // ...
 *   }
 * }
 * ```
 */
export const PublicTenant = () => SetMetadata(TENANT_METADATA_KEY, false);
````

#### 2.3 租户中间件

```typescript
// common/middleware/tenant.middleware.ts
import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Reflector } from '@nestjs/core';
import { TENANT_METADATA_KEY } from '../decorators/tenant.decorator';

/**
 * 租户上下文键
 *
 * 用于在请求对象中存储租户 ID。
 */
export const TENANT_CONTEXT_KEY = 'tenantId';

/**
 * 租户中间件
 *
 * 从请求中提取租户 ID 并验证其有效性。
 * 租户 ID 可以从以下来源提取（按优先级）：
 * 1. JWT Payload 中的 tenantId 字段（推荐）
 * 2. X-Tenant-Id 请求头（用于服务间调用）
 * 3. 子域名映射（可选，需要配置）
 *
 * **工作流程**：
 * 1. 检查路由是否标记为 @PublicTenant()，如果是则跳过
 * 2. 从 JWT payload（request.user.tenantId）提取租户 ID
 * 3. 如果 JWT 中没有，则从 X-Tenant-Id 请求头提取
 * 4. 验证租户 ID 是否存在且激活
 * 5. 将租户 ID 存储到 request.tenantId 供后续使用
 *
 * @class TenantMiddleware
 * @implements {NestMiddleware}
 * @description 租户上下文管理中间件
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  /**
   * 构造函数
   *
   * 注入反射器依赖，用于读取路由元数据。
   *
   * @param {Reflector} reflector - 反射器，用于读取路由元数据
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * 中间件处理方法
   *
   * 提取和验证租户 ID，并将其附加到请求对象。
   *
   * @param {FastifyRequest} req - Fastify 请求对象
   * @param {FastifyReply} reply - Fastify 响应对象
   * @param {() => void} next - 下一个中间件的回调函数
   * @throws {BadRequestException} 当租户 ID 缺失或无效时抛出
   * @throws {UnauthorizedException} 当租户不存在或未激活时抛出
   */
  use(req: FastifyRequest, reply: FastifyReply, next: () => void): void {
    // 检查路由是否标记为公共租户路由
    const isPublicTenant = this.reflector.get<boolean>(
      TENANT_METADATA_KEY,
      req.routeOptions?.config as any,
    );

    if (isPublicTenant === false) {
      // 公共租户路由，跳过租户验证
      return next();
    }

    // 提取租户 ID（优先级：JWT > Header）
    let tenantId: string | undefined;

    // 方法 1: 从 JWT payload 提取（推荐）
    const user = (req as any).user;
    if (user?.tenantId) {
      tenantId = user.tenantId;
    }

    // 方法 2: 从请求头提取（用于服务间调用）
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] as string | undefined;
    }

    // 方法 3: 从子域名提取（可选，需要实现域名映射逻辑）
    // if (!tenantId) {
    //   tenantId = this.extractTenantFromSubdomain(req);
    // }

    if (!tenantId) {
      throw new BadRequestException(
        '租户 ID 缺失，请在 JWT token 或 X-Tenant-Id 请求头中提供',
      );
    }

    // 验证租户 ID 格式（UUID）
    if (!this.isValidUUID(tenantId)) {
      throw new BadRequestException('无效的租户 ID 格式');
    }

    // 将租户 ID 附加到请求对象
    (req as any)[TENANT_CONTEXT_KEY] = tenantId;

    // 注意：这里不验证租户是否存在，因为需要数据库查询
    // 租户存在性验证应该在 Guard 或 Service 层进行

    next();
  }

  /**
   * 验证 UUID 格式
   *
   * @private
   * @param {string} value - 待验证的字符串
   * @returns {boolean} 如果是有效的 UUID 则返回 true
   */
  private isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
```

#### 2.4 租户实体订阅者

```typescript
// database/subscribers/tenant.subscriber.ts
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
import { TENANT_CONTEXT_KEY } from '../../common/middleware/tenant.middleware';

/**
 * 租户实体订阅者
 *
 * 自动为需要多租户的实体注入 tenant_id 字段。
 * 在实体插入和更新时，自动从请求上下文中提取租户 ID 并设置到实体。
 *
 * **工作原理**：
 * - 监听所有实体的 BeforeInsert 和 BeforeUpdate 事件
 * - 检查实体是否包含 tenantId 字段
 * - 如果 tenantId 未设置，则从 CLS 或请求上下文中提取并设置
 *
 * **注意事项**：
 * - 仅处理标记了 @TenantAware() 装饰器的实体
 * - 如果实体已有 tenantId，则不会覆盖
 * - 需要确保在请求上下文中设置了租户 ID
 *
 * @class TenantSubscriber
 * @implements {EntitySubscriberInterface}
 * @description 自动注入租户 ID 的实体订阅者
 */
@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  /**
   * 构造函数
   *
   * 注入数据源依赖，用于注册订阅者。
   *
   * @param {DataSource} dataSource - TypeORM 数据源
   */
  constructor(private readonly dataSource: DataSource) {
    // 注册订阅者到数据源
    dataSource.subscribers.push(this);
  }

  /**
   * 插入前事件处理
   *
   * 在实体插入数据库前，自动设置 tenant_id 字段。
   *
   * @param {InsertEvent<any>} event - 插入事件
   */
  beforeInsert(event: InsertEvent<any>): void {
    this.setTenantId(event.entity);
  }

  /**
   * 更新前事件处理
   *
   * 在实体更新数据库前，自动设置 tenant_id 字段（如果未设置）。
   *
   * @param {UpdateEvent<any>} event - 更新事件
   */
  beforeUpdate(event: UpdateEvent<any>): void {
    if (event.entity) {
      this.setTenantId(event.entity);
    }
  }

  /**
   * 设置租户 ID
   *
   * 从请求上下文中提取租户 ID 并设置到实体。
   *
   * @private
   * @param {any} entity - 实体对象
   */
  private setTenantId(entity: any): void {
    // 检查实体是否有 tenantId 字段
    if (!('tenantId' in entity)) {
      return;
    }

    // 如果 tenantId 已设置，则不覆盖
    if (entity.tenantId) {
      return;
    }

    // 从请求上下文中提取租户 ID
    // 注意：这里需要使用 CLS 或全局存储来获取请求上下文
    // 由于 TypeORM 的订阅者运行在数据库连接上下文中，无法直接访问请求对象
    // 需要使用 nestjs-cls 或类似的库来管理请求上下文

    // 临时方案：使用 AsyncLocalStorage（Node.js 内置）
    // 更好的方案：使用 nestjs-cls 库
    const tenantId = this.getTenantIdFromContext();

    if (tenantId) {
      entity.tenantId = tenantId;
    }
  }

  /**
   * 从上下文中获取租户 ID
   *
   * 从 AsyncLocalStorage 或 CLS 中提取当前请求的租户 ID。
   *
   * @private
   * @returns {string | undefined} 租户 ID，如果不存在则返回 undefined
   */
  private getTenantIdFromContext(): string | undefined {
    // 方案 1: 使用 AsyncLocalStorage（需要全局配置）
    // const store = tenantContextStore.getStore();
    // return store?.tenantId;

    // 方案 2: 使用 nestjs-cls（推荐）
    // 需要在模块中配置 ClsModule，然后在订阅者中注入 ClsService
    // 但由于订阅者是全局的，无法直接注入服务
    // 需要使用其他方式获取

    // 临时方案：从全局变量获取（不推荐，但可行）
    // 更好的方案：重构为使用 nestjs-cls 或自定义 Repository

    // 注意：这个实现需要根据实际选择的上下文管理方案调整
    return undefined;
  }
}
```

**注意**：由于 TypeORM 的 EntitySubscriber 运行在数据库连接上下文中，无法直接访问请求对象。建议使用以下方案之一：

1. **使用 nestjs-cls**：在订阅者中通过 ClsService 获取租户 ID
2. **使用自定义 Repository**：在 Repository 层设置 tenantId（推荐）
3. **使用 QueryBuilder 拦截器**：在查询构建时自动注入

#### 2.5 基础多租户 Repository

````typescript
// database/repositories/base-tenant.repository.ts
import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';
import { TENANT_CONTEXT_KEY } from '../../common/middleware/tenant.middleware';

/**
 * 基础多租户 Repository
 *
 * 提供自动租户过滤的 Repository 基类。
 * 所有继承此类的 Repository 会自动在查询中添加 tenant_id 过滤条件。
 *
 * **功能特性**：
 * - 自动过滤：所有查询自动添加 WHERE tenant_id = ?
 * - 自动注入：所有插入自动设置 tenant_id
 * - 自动限制：所有更新和删除自动限制在当前租户范围内
 *
 * **使用方式**：
 * ```typescript
 * @EntityRepository(User)
 * export class UserRepository extends BaseTenantRepository<User> {
 *   // 所有查询自动过滤 tenant_id
 *   async findByEmail(email: string): Promise<User | null> {
 *     return this.findOne({ where: { email } });
 *     // 自动转换为: WHERE email = ? AND tenant_id = ?
 *   }
 * }
 * ```
 *
 * @class BaseTenantRepository
 * @extends {Repository<T>}
 * @template T 实体类型
 */
export abstract class BaseTenantRepository<
  T extends { tenantId: string },
> extends Repository<T> {
  /**
   * 获取当前租户 ID
   *
   * 从请求上下文中提取当前租户 ID。
   * 如果无法获取租户 ID，则抛出异常。
   *
   * @protected
   * @returns {string} 当前租户 ID
   * @throws {BadRequestException} 当租户 ID 不存在时抛出
   */
  protected getCurrentTenantId(): string {
    // 方案 1: 使用 nestjs-cls（推荐）
    // const clsService = this.manager.connection.getRepository(ClsService);
    // return clsService.get(TENANT_CONTEXT_KEY);

    // 方案 2: 使用 AsyncLocalStorage
    // const store = tenantContextStore.getStore();
    // if (!store?.tenantId) {
    //   throw new BadRequestException('租户上下文缺失');
    // }
    // return store.tenantId;

    // 临时方案：从全局变量获取（需要重构）
    // 注意：这个实现需要根据实际选择的上下文管理方案调整
    throw new Error('需要实现租户上下文获取逻辑');
  }

  /**
   * 查找多个实体（自动过滤租户）
   *
   * 重写 find 方法，自动添加 tenant_id 过滤条件。
   *
   * @param {FindManyOptions<T>} options - 查找选项
   * @returns {Promise<T[]>} 实体数组
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const tenantId = this.getCurrentTenantId();
    const where = this.mergeTenantCondition(options?.where, tenantId);
    return super.find({ ...options, where });
  }

  /**
   * 查找一个实体（自动过滤租户）
   *
   * 重写 findOne 方法，自动添加 tenant_id 过滤条件。
   *
   * @param {FindOneOptions<T>} options - 查找选项
   * @returns {Promise<T | null>} 实体或 null
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const tenantId = this.getCurrentTenantId();
    const where = this.mergeTenantCondition(options?.where, tenantId);
    return super.findOne({ ...options, where });
  }

  /**
   * 保存实体（自动注入租户 ID）
   *
   * 重写 save 方法，自动设置 tenant_id 字段。
   *
   * @param {T | T[]} entity - 要保存的实体或实体数组
   * @returns {Promise<T | T[]>} 保存后的实体
   */
  async save(entity: T | T[]): Promise<T | T[]> {
    const tenantId = this.getCurrentTenantId();
    const entities = Array.isArray(entity) ? entity : [entity];

    // 为所有实体设置 tenantId
    entities.forEach((e) => {
      if (!e.tenantId) {
        e.tenantId = tenantId;
      }
    });

    return super.save(entities);
  }

  /**
   * 更新实体（自动限制租户范围）
   *
   * 重写 update 方法，自动添加 tenant_id 限制条件。
   *
   * @param {FindOptionsWhere<T>} criteria - 更新条件
   * @param {Partial<T>} partialEntity - 要更新的字段
   * @returns {Promise<UpdateResult>} 更新结果
   */
  async update(
    criteria: FindOptionsWhere<T>,
    partialEntity: Partial<T>,
  ): Promise<any> {
    const tenantId = this.getCurrentTenantId();
    const where = this.mergeTenantCondition(criteria, tenantId);
    return super.update(where, partialEntity);
  }

  /**
   * 删除实体（自动限制租户范围）
   *
   * 重写 delete 方法，自动添加 tenant_id 限制条件。
   *
   * @param {FindOptionsWhere<T>} criteria - 删除条件
   * @returns {Promise<DeleteResult>} 删除结果
   */
  async delete(criteria: FindOptionsWhere<T>): Promise<any> {
    const tenantId = this.getCurrentTenantId();
    const where = this.mergeTenantCondition(criteria, tenantId);
    return super.delete(where);
  }

  /**
   * 合并租户条件
   *
   * 将租户 ID 条件合并到现有的 WHERE 条件中。
   *
   * @private
   * @param {FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined} where - 现有 WHERE 条件
   * @param {string} tenantId - 租户 ID
   * @returns {FindOptionsWhere<T> | FindOptionsWhere<T>[]} 合并后的 WHERE 条件
   */
  private mergeTenantCondition(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined,
    tenantId: string,
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    const tenantCondition = { tenantId } as FindOptionsWhere<T>;

    if (!where) {
      return tenantCondition;
    }

    if (Array.isArray(where)) {
      return where.map((w) => ({ ...w, ...tenantCondition }));
    }

    return { ...where, ...tenantCondition };
  }
}
````

**注意**：由于 TypeORM 的 Repository 无法直接访问请求上下文，需要使用以下方案之一：

1. **使用 nestjs-cls**：在 Repository 中注入 ClsService
2. **使用自定义 DataSource**：在 DataSource 配置中注入上下文服务
3. **使用 Service 层封装**：在 Service 层处理租户过滤（推荐，更简单）

#### 2.6 推荐的实现方案：Service 层封装

由于 TypeORM 的 Repository 和 Subscriber 难以直接访问请求上下文，**推荐在 Service 层处理租户过滤**：

```typescript
// modules/users/users.service.ts
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { TENANT_CONTEXT_KEY } from '../../common/middleware/tenant.middleware';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(REQUEST) private readonly request: FastifyRequest,
  ) {}

  /**
   * 获取当前租户 ID
   *
   * @private
   * @returns {string} 当前租户 ID
   */
  private getCurrentTenantId(): string {
    const tenantId = (this.request as any)[TENANT_CONTEXT_KEY];
    if (!tenantId) {
      throw new BadRequestException('租户上下文缺失');
    }
    return tenantId;
  }

  /**
   * 查找所有用户（自动过滤租户）
   *
   * @returns {Promise<User[]>} 用户数组
   */
  async findAll(): Promise<User[]> {
    const tenantId = this.getCurrentTenantId();
    return this.userRepository.find({
      where: { tenantId },
    });
  }

  /**
   * 根据 ID 查找用户（自动过滤租户）
   *
   * @param {string} id - 用户 ID
   * @returns {Promise<User | null>} 用户或 null
   */
  async findOne(id: string): Promise<User | null> {
    const tenantId = this.getCurrentTenantId();
    return this.userRepository.findOne({
      where: { id, tenantId },
    });
  }

  /**
   * 创建用户（自动注入租户 ID）
   *
   * @param {Partial<User>} userData - 用户数据
   * @returns {Promise<User>} 创建的用户
   */
  async create(userData: Partial<User>): Promise<User> {
    const tenantId = this.getCurrentTenantId();
    const user = this.userRepository.create({
      ...userData,
      tenantId,
    });
    return this.userRepository.save(user);
  }

  /**
   * 更新用户（自动限制租户范围）
   *
   * @param {string} id - 用户 ID
   * @param {Partial<User>} userData - 要更新的字段
   * @returns {Promise<User>} 更新后的用户
   */
  async update(id: string, userData: Partial<User>): Promise<User> {
    const tenantId = this.getCurrentTenantId();
    const user = await this.findOne(id); // 自动过滤租户
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  /**
   * 删除用户（自动限制租户范围）
   *
   * @param {string} id - 用户 ID
   * @returns {Promise<void>}
   */
  async remove(id: string): Promise<void> {
    const tenantId = this.getCurrentTenantId();
    const result = await this.userRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
  }
}
```

### 3. 租户管理模块

```typescript
// modules/tenants/tenants.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../../entities/tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
```

```typescript
// modules/tenants/tenants.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * 查找所有租户
   *
   * @returns {Promise<Tenant[]>} 租户数组
   */
  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  /**
   * 根据 ID 查找租户
   *
   * @param {string} id - 租户 ID
   * @returns {Promise<Tenant | null>} 租户或 null
   */
  async findOne(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { id } });
  }

  /**
   * 验证租户是否存在且激活
   *
   * @param {string} id - 租户 ID
   * @returns {Promise<Tenant>} 租户实体
   * @throws {NotFoundException} 当租户不存在或未激活时抛出
   */
  async validateTenant(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (!tenant) {
      throw new NotFoundException(`租户 ${id} 不存在`);
    }
    if (!tenant.isActive) {
      throw new NotFoundException(`租户 ${id} 未激活`);
    }
    return tenant;
  }

  /**
   * 创建租户
   *
   * @param {Partial<Tenant>} tenantData - 租户数据
   * @returns {Promise<Tenant>} 创建的租户
   */
  async create(tenantData: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenantRepository.create(tenantData);
    return this.tenantRepository.save(tenant);
  }
}
```

```typescript
// modules/tenants/tenants.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from '../../entities/tenant.entity';
import { PublicTenant } from '../../common/decorators/tenant.decorator';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @PublicTenant() // 租户列表不需要租户上下文
  async findAll(): Promise<Tenant[]> {
    return this.tenantsService.findAll();
  }

  @Post('register')
  @PublicTenant() // 租户注册不需要租户上下文
  async register(@Body() tenantData: Partial<Tenant>): Promise<Tenant> {
    return this.tenantsService.create(tenantData);
  }
}
```

### 4. 应用模块配置

```typescript
// app.module.ts (修改)
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantsModule } from './modules/tenants/tenants.module';
import { Tenant } from './entities/tenant.entity';

@Module({
  imports: [
    // ... 现有导入 ...
    TypeOrmModule.forFeature([Tenant]), // 添加 Tenant 实体
    TenantsModule, // 添加租户管理模块
  ],
  // ... 其他配置 ...
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, TenantMiddleware) // 添加租户中间件
      .forRoutes('*');
  }
}
```

### 5. JWT Payload 扩展

在 JWT token 生成时添加 `tenantId` 字段：

```typescript
// modules/auth/auth.service.ts (修改)
async login(email: string, password: string) {
  // ... 验证用户 ...

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId, // 添加租户 ID
  };

  return {
    accessToken: this.jwtService.sign(payload),
    // ...
  };
}
```

---

## 迁移策略

### 1. 数据库迁移

#### 步骤 1：创建 tenants 表

```typescript
// migrations/XXXXXX-create-tenants-table.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTenantsTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'domain',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 创建索引
    await queryRunner.createIndex('tenants', {
      name: 'IDX_tenants_domain',
      columnNames: ['domain'],
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenants');
  }
}
```

#### 步骤 2：为现有表添加 tenant_id 字段

```typescript
// migrations/XXXXXX-add-tenant-id-to-users.ts
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddTenantIdToUsers1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 tenant_id 列
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'tenant_id',
        type: 'uuid',
        isNullable: true, // 暂时允许为空，用于数据迁移
      }),
    );

    // 创建索引
    await queryRunner.createIndex('users', {
      name: 'IDX_users_tenant_id',
      columnNames: ['tenant_id'],
    });

    // 创建外键约束（可选）
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('users', 'FK_users_tenant_id');
    await queryRunner.dropIndex('users', 'IDX_users_tenant_id');
    await queryRunner.dropColumn('users', 'tenant_id');
  }
}
```

#### 步骤 3：数据迁移脚本

为现有数据分配租户 ID：

```typescript
// migrations/XXXXXX-migrate-existing-data.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateExistingData1234567892 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建默认租户
    const defaultTenantResult = await queryRunner.query(`
      INSERT INTO tenants (id, name, domain, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), '默认租户', 'default', true, NOW(), NOW())
      RETURNING id
    `);
    const defaultTenantId = defaultTenantResult[0].id;

    // 2. 为所有现有用户分配默认租户
    await queryRunner.query(
      `
      UPDATE users
      SET tenant_id = $1
      WHERE tenant_id IS NULL
    `,
      [defaultTenantId],
    );

    // 3. 将 tenant_id 设置为非空
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN tenant_id SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：移除所有 tenant_id
    await queryRunner.query(`
      UPDATE users
      SET tenant_id = NULL
    `);
  }
}
```

### 2. 代码迁移

#### 步骤 1：添加 Tenant 实体

按照 [数据库设计](#数据库设计) 章节创建 Tenant 实体。

#### 步骤 2：修改现有实体

为需要多租户的实体添加 `tenantId` 字段：

```typescript
// entities/user.entity.ts (修改)
@Entity('users')
export class User {
  // ... 现有字段 ...

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
```

#### 步骤 3：修改 Service 层

按照 [推荐的实现方案](#推荐的实现方案service-层封装) 修改所有 Service，添加租户过滤逻辑。

#### 步骤 4：添加中间件

在 `AppModule` 中配置 `TenantMiddleware`。

#### 步骤 5：更新 JWT Payload

在认证服务中添加 `tenantId` 到 JWT payload。

---

## 安全考虑

### 1. 租户隔离验证

**风险**：恶意用户可能通过修改请求头或 JWT 来访问其他租户的数据。

**防护措施**：

- ✅ 在中间件中验证租户 ID 格式（UUID）
- ✅ 在 Guard 中验证租户是否存在且激活
- ✅ 所有数据库查询强制添加 `tenant_id` 过滤条件
- ✅ 使用参数化查询防止 SQL 注入

### 2. JWT Token 安全

**风险**：JWT token 被窃取后可能被用于访问其他租户。

**防护措施**：

- ✅ JWT token 包含 `tenantId`，服务端验证 token 中的 `tenantId` 与请求中的一致
- ✅ 使用 HTTPS 传输 JWT token
- ✅ 设置合理的 token 过期时间
- ✅ 实现 token 刷新机制

### 3. 数据泄露防护

**风险**：开发人员可能忘记添加租户过滤条件。

**防护措施**：

- ✅ 使用 TypeScript 类型系统强制要求 `tenantId` 字段
- ✅ 代码审查检查所有数据库查询
- ✅ 编写集成测试验证数据隔离
- ✅ 使用数据库行级安全策略（PostgreSQL RLS）作为最后防线

### 4. PostgreSQL 行级安全（可选）

作为额外的安全层，可以使用 PostgreSQL 的行级安全策略：

```sql
-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己租户的数据
CREATE POLICY tenant_isolation_policy ON users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- 在连接时设置租户 ID（需要在应用层实现）
SET app.current_tenant_id = 'xxx-xxx-xxx';
```

**注意**：此方案需要修改数据库连接配置，实现复杂度较高，建议作为可选的安全增强。

---

## 性能优化

### 1. 数据库索引

为所有 `tenant_id` 字段添加索引：

```typescript
@Column({ name: 'tenant_id', type: 'uuid' })
@Index() // 自动创建索引
tenantId: string;
```

### 2. 复合索引

对于经常一起查询的字段，创建复合索引：

```typescript
// 例如：经常按 tenant_id + email 查询
@Index(['tenantId', 'email'])
```

### 3. 查询优化

- 避免全表扫描，始终包含 `tenant_id` 条件
- 使用 `EXPLAIN ANALYZE` 分析查询计划
- 定期更新表统计信息：`ANALYZE table_name;`

### 4. 连接池配置

确保数据库连接池配置合理：

```typescript
// TypeORM 配置
{
  // ... 其他配置 ...
  extra: {
    max: 20, // 最大连接数
    min: 5,  // 最小连接数
    idleTimeoutMillis: 30000,
  },
}
```

---

## 测试策略

### 1. 单元测试

测试 Service 层的租户过滤逻辑：

```typescript
// modules/users/users.service.spec.ts
describe('UsersService', () => {
  it('应该只返回当前租户的用户', async () => {
    const tenantId = 'tenant-1';
    mockRequest[TENANT_CONTEXT_KEY] = tenantId;

    const users = await service.findAll();

    expect(users.every((u) => u.tenantId === tenantId)).toBe(true);
  });

  it('创建用户时应该自动设置 tenantId', async () => {
    const tenantId = 'tenant-1';
    mockRequest[TENANT_CONTEXT_KEY] = tenantId;

    const user = await service.create({ email: 'test@example.com' });

    expect(user.tenantId).toBe(tenantId);
  });
});
```

### 2. 集成测试

测试完整的请求流程：

```typescript
// tests/integration/tenant-isolation.e2e-spec.ts
describe('租户数据隔离 (e2e)', () => {
  it('租户 A 不应该访问租户 B 的数据', async () => {
    // 创建两个租户
    const tenantA = await createTenant('Tenant A');
    const tenantB = await createTenant('Tenant B');

    // 创建租户 A 的用户
    const userA = await createUser(tenantA.id, 'user-a@example.com');

    // 使用租户 B 的 token 尝试访问用户 A
    const tokenB = await getToken(tenantB.id);
    const response = await request(app.getHttpServer())
      .get(`/users/${userA.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404); // 应该返回 404，而不是 200

    expect(response.body.message).toContain('不存在');
  });
});
```

### 3. 性能测试

测试多租户场景下的查询性能：

```typescript
describe('多租户性能测试', () => {
  it('应该在大数据量下保持良好性能', async () => {
    // 创建 1000 个租户，每个租户 1000 条数据
    // 测试查询性能
  });
});
```

---

## 实施计划

### 阶段 1：基础架构（1-2 周）

- [ ] 创建 Tenant 实体和表
- [ ] 实现 TenantMiddleware
- [ ] 实现租户装饰器
- [ ] 创建租户管理模块
- [ ] 编写数据库迁移脚本

### 阶段 2：实体改造（2-3 周）

- [ ] 为 User 实体添加 `tenantId` 字段
- [ ] 为 Role 实体添加 `tenantId` 字段
- [ ] 为 Permission 实体添加 `tenantId` 字段
- [ ] 为其他业务实体添加 `tenantId` 字段
- [ ] 执行数据库迁移

### 阶段 3：Service 层改造（2-3 周）

- [ ] 修改 UsersService 添加租户过滤
- [ ] 修改 RolesService 添加租户过滤
- [ ] 修改 PermissionsService 添加租户过滤
- [ ] 修改其他业务 Service 添加租户过滤
- [ ] 更新 JWT Payload 包含 `tenantId`

### 阶段 4：测试和优化（1-2 周）

- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 性能测试和优化
- [ ] 安全审计

### 阶段 5：文档和部署（1 周）

- [ ] 更新 API 文档
- [ ] 编写迁移指南
- [ ] 部署到测试环境
- [ ] 生产环境部署

**总计**：约 7-11 周

---

## 总结

本技术方案采用 **共享数据库 + 行级隔离** 的多租户架构，通过以下机制实现数据隔离：

1. **租户上下文管理**：通过中间件从 JWT 或请求头提取租户 ID
2. **自动数据过滤**：在 Service 层自动添加 `tenant_id` 过滤条件
3. **自动数据注入**：在创建实体时自动设置 `tenant_id`
4. **安全验证**：在 Guard 层验证租户存在性和有效性

该方案具有以下优点：

- ✅ 实现简单，对现有代码侵入性小
- ✅ 性能良好，通过索引优化查询
- ✅ 安全性高，多层防护机制
- ✅ 易于维护，代码结构清晰

**注意事项**：

- 需要在所有数据库查询中显式添加租户过滤（或使用统一的 Repository 基类）
- 需要确保 JWT token 包含 `tenantId` 字段
- 建议使用 PostgreSQL 行级安全策略作为额外的安全层

---

## 参考资料

- [TypeORM 官方文档](https://typeorm.io/)
- [NestJS 官方文档](https://docs.nestjs.com/)
- [PostgreSQL 行级安全](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [多租户架构模式](https://docs.microsoft.com/en-us/azure/sql-database/saas-tenancy-app-design-patterns)
