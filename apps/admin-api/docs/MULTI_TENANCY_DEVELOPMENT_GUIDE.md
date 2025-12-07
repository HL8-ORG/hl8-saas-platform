# 多租户系统开发指南

## 目录

- [概述](#概述)
- [架构设计](#架构设计)
- [核心概念](#核心概念)
- [配置说明](#配置说明)
- [开发指南](#开发指南)
- [API 使用](#api-使用)
- [权限系统集成](#权限系统集成)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 概述

本系统采用**共享数据库 + 行级软隔离**的多租户架构，通过 `tenantId` 字段实现数据隔离。所有业务数据都通过 `tenantId` 进行过滤，确保不同租户之间的数据完全隔离。

### 核心特性

- ✅ **数据隔离**：通过 `tenantId` 实现行级数据隔离
- ✅ **权限隔离**：Casbin 权限系统支持多租户，每个租户的权限策略独立
- ✅ **自动上下文管理**：通过中间件自动提取和验证租户ID
- ✅ **配置化初始化**：支持通过环境变量配置默认租户和默认角色
- ✅ **灵活的角色权限**：支持租户级别的角色和权限管理

## 架构设计

### 数据模型

```
┌─────────────┐
│   Tenant    │ (租户表)
│  - id       │
│  - name     │
│  - domain   │ (唯一)
│  - isActive │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐      ┌──────────────┐      ┌─────────────┐
│    User     │      │     Role     │      │ Permission  │
│  - id       │      │  - id        │      │  - id        │
│  - tenantId │◄─────┤  - tenantId  │◄─────┤  - tenantId │
│  - email    │      │  - name      │      │  - resource  │
│  - ...      │      │  - ...       │      │  - action    │
└─────────────┘      └──────────────┘      └─────────────┘
```

### 请求流程

```
客户端请求
    │
    ├─► TenantMiddleware (提取 tenantId)
    │   ├─ 从 JWT payload 提取
    │   ├─ 从 X-Tenant-Id 请求头提取
    │   └─ 验证 UUID 格式
    │
    ├─► AuthGuard (JWT 验证)
    │   └─ 验证 tenantId 一致性
    │
    ├─► AuthZGuard (权限检查)
    │   └─ enforce(username, tenantId, resource, action)
    │
    └─► Controller → Service
        └─ 所有查询自动过滤 tenantId
```

## 核心概念

### 1. 租户（Tenant）

租户是数据隔离的基本单位。每个租户拥有：

- 独立的用户集合
- 独立的角色和权限配置
- 独立的数据记录

**租户标识**：

- `id`: UUID 格式的唯一标识符
- `domain`: 可选的域名标识（用于子域名路由）

### 2. 租户上下文（Tenant Context）

租户上下文通过以下方式传递：

1. **JWT Payload**（推荐）

   ```json
   {
     "sub": "user-id",
     "email": "user@example.com",
     "tenantId": "tenant-uuid"
   }
   ```

2. **请求头**（用于服务间调用）

   ```
   X-Tenant-Id: tenant-uuid
   ```

3. **请求对象**（中间件注入）
   ```typescript
   request[TENANT_CONTEXT_KEY] = tenantId;
   ```

### 3. 数据隔离机制

所有实体都包含 `tenantId` 字段：

```typescript
@Entity('users')
export class User {
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
```

所有查询自动过滤：

```typescript
// Service 层自动添加 tenantId 过滤
const user = await this.userRepository.findOne({
  where: { id: userId, tenantId: this.getCurrentTenantId() },
});
```

## 配置说明

### 环境变量

在 `.env` 文件中配置：

```env
# 多租户配置
DEFAULT_TENANT_DOMAIN=default      # 默认租户域名
DEFAULT_USER_ROLE=USER              # 新用户默认角色 (USER/ADMIN/ROOT)
```

### 配置说明

- **DEFAULT_TENANT_DOMAIN**:
  - 默认值：`default`
  - 应用启动时会自动创建该租户（如果不存在）
  - 用户注册时，如果没有提供租户ID，会使用该默认租户

- **DEFAULT_USER_ROLE**:
  - 默认值：`USER`
  - 可选值：`USER`、`ADMIN`、`ROOT`
  - 新注册用户的默认角色

### 初始化流程

应用启动时（`TenantsInitService.onModuleInit()`）：

1. 检查默认租户是否存在（根据 `DEFAULT_TENANT_DOMAIN`）
2. 如果不存在，自动创建：
   - 名称：`默认租户`
   - 域名：配置的 `DEFAULT_TENANT_DOMAIN`
   - 状态：`isActive = true`

## 开发指南

### 1. 创建租户感知的实体

```typescript
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('your_entity')
export class YourEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 添加租户ID字段
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  @Index() // 添加索引提升查询性能
  tenantId: string;

  // 添加租户关联（可选，用于级联查询）
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // 其他业务字段...
}
```

### 2. 创建租户感知的 Service

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { FastifyRequest } from 'fastify';
import { TENANT_CONTEXT_KEY } from '../common/constants/tenant.constants';

@Injectable()
export class YourService {
  constructor(
    @InjectRepository(YourEntity)
    private readonly repository: Repository<YourEntity>,
    @Inject(REQUEST) private readonly request: FastifyRequest,
  ) {}

  /**
   * 获取当前租户 ID
   */
  private getCurrentTenantId(): string {
    const tenantId = (this.request as any)[TENANT_CONTEXT_KEY];
    if (!tenantId) {
      throw new BadRequestException('租户上下文缺失');
    }
    return tenantId;
  }

  /**
   * 查询方法 - 自动过滤租户
   */
  async findAll(): Promise<YourEntity[]> {
    const tenantId = this.getCurrentTenantId();
    return this.repository.find({
      where: { tenantId },
    });
  }

  /**
   * 创建方法 - 自动设置租户ID
   */
  async create(data: CreateDto): Promise<YourEntity> {
    const tenantId = this.getCurrentTenantId();
    const entity = this.repository.create({
      ...data,
      tenantId, // 自动设置租户ID
    });
    return this.repository.save(entity);
  }

  /**
   * 更新方法 - 确保只能更新当前租户的数据
   */
  async update(id: string, data: UpdateDto): Promise<YourEntity> {
    const tenantId = this.getCurrentTenantId();
    const entity = await this.repository.findOne({
      where: { id, tenantId }, // 同时过滤ID和租户ID
    });

    if (!entity) {
      throw new NotFoundException('资源不存在');
    }

    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  /**
   * 删除方法 - 确保只能删除当前租户的数据
   */
  async delete(id: string): Promise<void> {
    const tenantId = this.getCurrentTenantId();
    const result = await this.repository.delete({ id, tenantId });

    if (result.affected === 0) {
      throw new NotFoundException('资源不存在');
    }
  }
}
```

### 3. 创建公共接口（不需要租户上下文）

对于注册、登录等公共接口，使用 `@PublicTenant()` 装饰器：

```typescript
import { PublicTenant } from '../common/decorators/tenant.decorator';

@Controller('auth')
export class AuthController {
  @PublicTenant() // 标记为公共接口，不需要租户上下文
  @Post('/signup')
  async signup(@Body() signupDto: SignupDto, @Req() req: FastifyRequest) {
    // signup 方法会自动处理租户ID（从请求头或使用默认租户）
    return this.authService.signup(signupDto, req);
  }
}
```

### 4. 数据库迁移

创建迁移文件添加 `tenant_id` 字段：

```typescript
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddTenantIdToYourEntity1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查表是否存在
    const table = await queryRunner.getTable('your_entity');
    if (!table) {
      return;
    }

    // 添加 tenant_id 字段
    await queryRunner.addColumn(
      'your_entity',
      new TableColumn({
        name: 'tenant_id',
        type: 'uuid',
        isNullable: true, // 初始为可空，后续可以更新现有数据
      }),
    );

    // 添加索引
    await queryRunner.createIndex(
      'your_entity',
      new TableIndex({
        name: 'IDX_your_entity_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    // 添加外键（可选）
    await queryRunner.createForeignKey(
      'your_entity',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作
    await queryRunner.dropColumn('your_entity', 'tenant_id');
  }
}
```

## API 使用

### 租户管理 API

#### 创建租户

```http
POST /api/v1/tenants
Content-Type: application/json

{
  "name": "示例租户",
  "domain": "example",
  "isActive": true
}
```

**响应**：

```json
{
  "id": "tenant-uuid",
  "name": "示例租户",
  "domain": "example",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### 查询租户列表

```http
GET /api/v1/tenants
Authorization: Bearer <token>
```

#### 查询单个租户

```http
GET /api/v1/tenants/:id
Authorization: Bearer <token>
```

### 用户注册（公共接口）

```http
POST /api/v1/auth/signup
Content-Type: application/json
X-Tenant-Id: tenant-uuid  # 可选，如果不提供则使用默认租户

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "张三"
}
```

### 用户登录

登录后，JWT 中会包含 `tenantId`：

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**：

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "张三",
    "role": "USER",
    "tenantId": "tenant-uuid"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

## 权限系统集成

### Casbin 多租户支持

Casbin 模型已配置支持多租户：

```conf
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _
g2 = _, _

[matchers]
m = g(r.sub, p.sub, r.dom) && g2(r.obj, p.obj) && r.act == p.act && r.dom == p.dom || r.sub == "root"
```

**策略格式**：

```
p, role_name, tenant_id, resource, action
g, user_id, role_name, tenant_id
```

**示例策略**：

```
p, admin, tenant-123, user, read:any
p, admin, tenant-123, user, write:any
p, editor, tenant-123, article, read:any
p, editor, tenant-123, article, write:own
g, user-456, admin, tenant-123
g, user-789, editor, tenant-123
```

### 权限检查流程

```typescript
// AuthZGuard 自动处理多租户
@UseGuards(AuthGuard, AuthZGuard)
@UsePermissions({
  action: AuthActionVerb.READ,
  resource: Resource.USER,
  possession: AuthPossession.ANY,
})
async getUsers() {
  // 权限检查：enforce(userId, tenantId, 'user', 'read:any')
  // 只检查当前租户的权限策略
  return this.usersService.findAll();
}
```

### 角色权限管理

#### 为角色分配权限

```typescript
// RolesService.grantPermission()
await this.rolesService.grantPermission(
  'admin', // 角色名称
  'read:any', // 操作
  'user', // 资源
  '读取用户权限', // 描述（可选）
);

// 内部实现：
// 1. 创建或获取 Permission 实体（自动关联 tenantId）
// 2. 在 Casbin 中添加策略：p, admin, tenantId, user, read:any
```

#### 为用户分配角色

```typescript
// RolesService.assignUser()
await this.rolesService.assignUser(
  'user-id', // 用户ID
  'admin', // 角色名称
);

// 内部实现：
// 在 Casbin 中添加分组策略：g, user-id, admin, tenantId
```

#### 查询用户权限

```typescript
// UserPermissionsController.findUserPermissions()
const permissions = await this.authzService.getImplicitPermissionsForUser(
  userId,
  tenantId,
);

// 返回格式：[[subject, domain, resource, action], ...]
// 例如：[['admin', 'tenant-123', 'user', 'read:any']]
```

## 最佳实践

### 1. 始终使用租户上下文

✅ **正确**：

```typescript
const tenantId = this.getCurrentTenantId();
const users = await this.userRepository.find({ where: { tenantId } });
```

❌ **错误**：

```typescript
// 缺少租户过滤，可能泄露其他租户的数据
const users = await this.userRepository.find();
```

### 2. 公共接口使用 @PublicTenant()

✅ **正确**：

```typescript
@PublicTenant()
@Post('/signup')
async signup(@Body() dto: SignupDto, @Req() req: FastifyRequest) {
  // 方法内部会处理租户ID（从请求头或使用默认租户）
  return this.service.signup(dto, req);
}
```

### 3. 权限检查自动包含租户ID

✅ **正确**：

```typescript
// AuthZGuard 会自动从请求上下文获取 tenantId
@UseGuards(AuthGuard, AuthZGuard)
@UsePermissions({
  action: AuthActionVerb.READ,
  resource: Resource.USER,
})
async getUsers() {
  // 权限检查：enforce(userId, tenantId, 'user', 'read:any')
  return this.service.findAll();
}
```

### 4. 数据库查询始终包含租户过滤

✅ **正确**：

```typescript
// 查询
const entity = await this.repository.findOne({
  where: { id, tenantId: this.getCurrentTenantId() },
});

// 更新
await this.repository.update(
  { id, tenantId: this.getCurrentTenantId() },
  { ...data },
);

// 删除
await this.repository.delete({
  id,
  tenantId: this.getCurrentTenantId(),
});
```

### 5. 唯一性约束考虑租户

✅ **正确**：

```typescript
@Entity('roles')
@Unique(['tenantId', 'name']) // 租户内唯一
export class Role {
  @Column()
  name: string;

  @Column()
  tenantId: string;
}
```

❌ **错误**：

```typescript
@Entity('roles')
@Unique(['name']) // 全局唯一，不支持多租户
export class Role {
  @Column()
  name: string;
}
```

### 6. 测试时模拟租户上下文

```typescript
describe('YourService', () => {
  const mockRequest = {
    [TENANT_CONTEXT_KEY]: 'test-tenant-id',
  } as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });
});
```

## 常见问题

### Q1: 如何创建新租户？

**A**: 使用租户管理 API：

```http
POST /api/v1/tenants
{
  "name": "新租户",
  "domain": "new-tenant",
  "isActive": true
}
```

或者通过脚本：

```typescript
// scripts/create-tenant.ts
const tenant = await tenantsService.create({
  name: '新租户',
  domain: 'new-tenant',
  isActive: true,
});
```

### Q2: 用户注册时如何指定租户？

**A**: 有两种方式：

1. **通过请求头**（推荐）：

   ```http
   POST /api/v1/auth/signup
   X-Tenant-Id: tenant-uuid
   ```

2. **使用默认租户**：
   如果不提供 `X-Tenant-Id`，系统会使用配置的 `DEFAULT_TENANT_DOMAIN` 对应的租户。

### Q3: 如何在不同租户间切换？

**A**: 通过不同的 JWT token。每个租户的用户登录后会获得包含对应 `tenantId` 的 token。切换租户需要重新登录。

### Q4: 如何查询跨租户的数据？

**A**: 系统设计上不支持跨租户查询，这是多租户隔离的核心要求。如果需要跨租户操作，应该：

1. 使用超级管理员账户（如果有）
2. 通过独立的服务或脚本处理
3. 重新设计业务逻辑，避免跨租户需求

### Q5: 权限策略如何迁移到新租户？

**A**: 可以编写迁移脚本：

```typescript
// 从源租户复制权限策略到目标租户
const sourcePolicies = await authzService.getFilteredPolicy(1, sourceTenantId);
const targetPolicies = sourcePolicies.map((p) => [
  p[0], // role_name
  targetTenantId, // 新租户ID
  p[2], // resource
  p[3], // action
]);
await authzService.addPolicies(targetPolicies);
```

### Q6: 如何处理租户删除？

**A**: 当前实现中，删除租户需要：

1. 先删除该租户下的所有用户数据
2. 删除该租户的权限策略
3. 最后删除租户记录

建议使用软删除（`isActive = false`）而不是物理删除。

### Q7: 性能优化建议

**A**:

1. **索引优化**：确保所有 `tenant_id` 字段都有索引
2. **查询优化**：始终将 `tenantId` 作为查询条件的第一位
3. **缓存策略**：可以考虑缓存租户的权限策略（注意缓存失效）

## 相关文档

- [多租户技术方案](./MULTI_TENANCY_TECHNICAL_PLAN.md)
- [Casbin 权限系统文档](https://casbin.org/docs/en/overview)
- [TypeORM 文档](https://typeorm.io/)

## 更新日志

- **2025-01-07**: 初始版本，支持基础多租户功能
- **2025-01-07**: 集成 Casbin 多租户支持
- **2025-01-07**: 添加配置化初始化和默认租户支持
