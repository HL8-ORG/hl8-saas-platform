# 单元测试待办清单

本文档列出了 `apps/admin-api` 项目中尚未编写单元测试的代码模块。

## 一、Query/Command Handlers（27个文件，0个测试）

Handlers 是 CQRS 模式的查询和命令处理器，负责将 Query/Command 转换为 Use Case 调用。

### 1.1 Auth Handlers（6个）

- [ ] `src/application/auth/queries/handlers/get-me.handler.ts`
- [ ] `src/application/auth/commands/handlers/signup.handler.ts`
- [ ] `src/application/auth/commands/handlers/login.handler.ts`
- [ ] `src/application/auth/commands/handlers/logout.handler.ts`
- [ ] `src/application/auth/commands/handlers/refresh-token.handler.ts`
- [ ] `src/application/auth/commands/handlers/verify-email.handler.ts`
- [ ] `src/application/auth/commands/handlers/resend-verification.handler.ts`

### 1.2 Users Handlers（5个）

- [ ] `src/application/users/queries/handlers/get-users.handler.ts`
- [ ] `src/application/users/queries/handlers/get-profile.handler.ts`
- [ ] `src/application/users/queries/handlers/get-user-by-id.handler.ts`
- [ ] `src/application/users/commands/handlers/update-user.handler.ts`
- [ ] `src/application/users/commands/handlers/update-profile.handler.ts`
- [ ] `src/application/users/commands/handlers/delete-user.handler.ts`

### 1.3 Roles Handlers（3个）

- [ ] `src/application/roles/queries/handlers/get-roles.handler.ts`
- [ ] `src/application/roles/queries/handlers/get-role-by-id.handler.ts`
- [ ] `src/application/roles/queries/handlers/get-role-permissions.handler.ts`
- [ ] `src/application/roles/commands/handlers/create-role.handler.ts`
- [ ] `src/application/roles/commands/handlers/grant-role-permission.handler.ts`
- [ ] `src/application/roles/commands/handlers/delete-role.handler.ts`

### 1.4 Permissions Handlers（2个）

- [ ] `src/application/permissions/queries/handlers/get-permissions.handler.ts`
- [ ] `src/application/permissions/commands/handlers/create-permission.handler.ts`

### 1.5 Tenants Handlers（5个）

- [ ] `src/application/tenants/queries/handlers/get-tenants.handler.ts`
- [ ] `src/application/tenants/queries/handlers/get-tenant-by-id.handler.ts`
- [ ] `src/application/tenants/queries/handlers/get-tenant-by-domain.handler.ts`
- [ ] `src/application/tenants/commands/handlers/create-tenant.handler.ts`
- [ ] `src/application/tenants/commands/handlers/update-tenant.handler.ts`
- [ ] `src/application/tenants/commands/handlers/delete-tenant.handler.ts`

## 二、Interface Mappers（4个文件，0个测试）

Interface Mappers 负责 HTTP 层 DTO 和应用层 DTO 之间的映射转换。

- [ ] `src/interface/mappers/auth.mapper.ts`
- [ ] `src/interface/mappers/users.mapper.ts`
- [ ] `src/interface/mappers/roles.mapper.ts`
- [ ] `src/interface/mappers/tenants.mapper.ts`

## 三、Infrastructure Services（1个文件，0个测试）

- [ ] `src/infrastructure/services/refresh-token-repository.service.ts`

## 测试优先级建议

### 高优先级

1. **RefreshTokenRepositoryService** - 核心安全功能，必须测试
2. **Auth Handlers** - 认证相关，安全关键
3. **Interface Mappers** - 数据转换逻辑，容易出错

### 中优先级

4. **Users Handlers** - 用户管理功能
5. **Roles Handlers** - 权限管理功能

### 低优先级

6. **Permissions Handlers** - 权限查询功能
7. **Tenants Handlers** - 租户管理功能

## 测试策略

### Handlers 测试策略

- Mock Use Cases
- 验证 Query/Command 正确传递给 Use Case
- 验证返回的 DTO 格式正确
- 测试错误处理（如 NotFoundException）

### Mappers 测试策略

- 测试 HTTP DTO 到应用层 DTO 的转换
- 测试边界情况（null、undefined、空字符串等）
- 测试请求对象参数的提取（如 tenantId）

### RefreshTokenRepositoryService 测试策略

- Mock TypeORM Repository
- Mock IPasswordHasher
- 测试所有 CRUD 操作
- 测试令牌验证逻辑
- 测试过期令牌清理逻辑

## 已完成测试统计

- ✅ Use Cases: 已完成
- ✅ Controllers: 已完成
- ✅ Infrastructure Repositories: 已完成
- ✅ Infrastructure Mappers: 已完成
- ✅ Infrastructure Services (部分): 4/5 完成
- ✅ Cache Store: 已完成
- ✅ Guards: 已完成
- ⏳ Handlers: 0/27 完成
- ⏳ Interface Mappers: 0/4 完成
- ⏳ RefreshTokenRepositoryService: 0/1 完成

## 下一步行动

建议按照优先级顺序开始编写测试：

1. 先完成 `RefreshTokenRepositoryService` 的测试
2. 然后完成 `Interface Mappers` 的测试
3. 最后完成 `Handlers` 的测试
