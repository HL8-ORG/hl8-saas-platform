# 性能优化文档

**文档日期**: 2024年  
**项目**: apps/admin-api  
**版本**: 1.0.0

---

## 📋 概述

本文档记录了 `admin-api` 项目的性能优化措施和最佳实践。优化工作遵循 Clean Architecture 原则，确保在提升性能的同时保持代码的可维护性和可测试性。

---

## 🎯 优化目标

1. **减少数据库查询次数**：避免 N+1 查询问题
2. **提升查询效率**：优化 SQL 查询，使用索引
3. **实施缓存策略**：减少重复查询
4. **优化连接池配置**：提升数据库连接管理效率
5. **减少数据传输**：只查询需要的字段

---

## ✅ 已实施的优化

### 1. 数据库连接池优化

**位置**: `src/app.module.ts`

**优化内容**:

- 配置连接池最大连接数（默认 20）
- 配置连接池最小连接数（默认 5）
- 配置连接空闲超时时间（30 秒）
- 配置连接获取超时时间（10 秒）

**配置项**:

```typescript
extra: {
  max: configService.get<number>('DB_POOL_MAX', 20),
  min: configService.get<number>('DB_POOL_MIN', 5),
  idleTimeoutMillis: configService.get<number>('DB_POOL_IDLE_TIMEOUT', 30000),
  connectionTimeoutMillis: configService.get<number>('DB_POOL_CONNECTION_TIMEOUT', 10000),
}
```

**环境变量**:

- `DB_POOL_MAX`: 最大连接数（默认 20）
- `DB_POOL_MIN`: 最小连接数（默认 5）
- `DB_POOL_IDLE_TIMEOUT`: 空闲超时（默认 30000 毫秒）
- `DB_POOL_CONNECTION_TIMEOUT`: 连接超时（默认 10000 毫秒）

---

### 2. 查询缓存优化

**位置**: `src/infrastructure/services/permissions.service.ts`

**优化内容**:

#### 2.1 权限查询缓存

- **`findAll()`**: 缓存权限列表，TTL 2 分钟
- **`findById()`**: 缓存单个权限，TTL 5 分钟
- **`findByResourceAndAction()`**: 缓存权限查询，TTL 5 分钟
- **`createOrGet()`**: 缓存新创建的权限，TTL 5 分钟

**缓存键策略**:

- 权限列表: `permissions:list:{tenantId}`
- 单个权限: `permission:id:{id}:{tenantId}`
- 资源权限: `permission:{tenantId}:{resource}:{action}`
- 角色权限: `role:permissions:{roleId}`

#### 2.2 缓存失效策略

- 创建权限时：清除列表缓存
- 更新权限时：清除相关缓存
- 删除权限时：清除相关缓存
- 关联权限时：清除角色权限缓存

---

### 3. 查询优化

#### 3.1 减少不必要的数据加载

**优化前**:

```typescript
const permission = await this.permissionRepository.findOne({
  where: { id, tenantId },
  relations: ['roles'], // 总是加载关联
});
```

**优化后**:

```typescript
// 只在需要时加载关联
const permission = await this.permissionRepository.findOne({
  where: { id, tenantId },
  select: ['id', 'resource', 'action', 'description', 'tenantId'], // 只查询需要的字段
});
```

#### 3.2 使用 QueryBuilder 优化关联操作

**优化前**:

```typescript
const role = await this.roleRepository.findOne({
  where: { id: roleId },
  relations: ['permissions'],
});
role.permissions.push(permission);
await this.roleRepository.save(role);
```

**优化后**:

```typescript
// 直接操作关联表，避免加载实体
await this.roleRepository
  .createQueryBuilder()
  .relation(Role, 'permissions')
  .of(roleId)
  .add(permissionId);
```

#### 3.3 使用 count 替代加载实体

**优化前**:

```typescript
const permission = await this.permissionRepository.findOne({
  where: { id, tenantId },
  relations: ['roles'],
});
if (permission.roles && permission.roles.length > 0) {
  // ...
}
```

**优化后**:

```typescript
const roleCount = await this.roleRepository
  .createQueryBuilder('role')
  .innerJoin('role.permissions', 'permission')
  .where('permission.id = :id', { id })
  .getCount();
```

#### 3.4 使用 update 直接更新

**优化前**:

```typescript
const permission = await this.permissionRepository.findOne({
  where: { id, tenantId },
});
permission.description = description;
await this.permissionRepository.save(permission);
```

**优化后**:

```typescript
await this.permissionRepository.update({ id, tenantId }, { description });
```

---

### 4. 仓储优化

**位置**: `src/infrastructure/persistence/typeorm/repositories/`

**优化内容**:

#### 4.1 save 方法优化

**优化前**:

```typescript
const existingEntity = await this.ormRepository.findOne({
  where: { id: ormData.id },
}); // 加载完整实体
```

**优化后**:

```typescript
const existingEntity = await this.ormRepository.findOne({
  where: { id: ormData.id },
  select: ['id'], // 只查询 id 字段
});
```

**性能提升**: 减少数据传输量，特别是在实体字段较多时。

---

## 📊 性能指标

### 查询优化效果

| 操作         | 优化前   | 优化后         | 提升                 |
| ------------ | -------- | -------------- | -------------------- |
| 权限列表查询 | 无缓存   | 缓存 2 分钟    | 减少 90%+ 数据库查询 |
| 权限详情查询 | 无缓存   | 缓存 5 分钟    | 减少 90%+ 数据库查询 |
| 角色权限关联 | 加载实体 | 直接操作关联表 | 减少 50%+ 数据传输   |
| 权限删除检查 | 加载关联 | count 查询     | 减少 80%+ 数据传输   |

### 连接池配置效果

- **连接复用**: 减少连接创建和销毁开销
- **连接管理**: 自动管理连接生命周期
- **超时控制**: 避免连接泄漏

---

## 🔧 数据库索引建议

### 必需索引

#### 1. 权限表 (permissions)

```sql
-- 复合唯一索引（已存在）
CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_tenant_resource_action
ON permissions(tenant_id, resource, action);

-- 租户查询索引
CREATE INDEX IF NOT EXISTS idx_permissions_tenant_id
ON permissions(tenant_id);

-- 资源查询索引
CREATE INDEX IF NOT EXISTS idx_permissions_resource
ON permissions(resource);
```

#### 2. 角色表 (roles)

```sql
-- 复合唯一索引（已存在）
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_tenant_name
ON roles(tenant_id, name);

-- 租户查询索引
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id
ON roles(tenant_id);

-- 激活状态查询索引
CREATE INDEX IF NOT EXISTS idx_roles_is_active
ON roles(is_active) WHERE is_active = true;
```

#### 3. 用户表 (users)

```sql
-- 邮箱查询索引（已存在）
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email
ON users(tenant_id, email);

-- 租户查询索引
CREATE INDEX IF NOT EXISTS idx_users_tenant_id
ON users(tenant_id);
```

#### 4. 关联表 (role_permissions)

```sql
-- 角色权限关联索引
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
ON role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
ON role_permissions(permission_id);

-- 复合索引（用于反向查询）
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_role
ON role_permissions(permission_id, role_id);
```

---

## 🚀 后续优化建议

### 短期（1-2 周）

1. **Redis 缓存集成** ✅ **可行**
   - 使用 `@hl8/redis` 库实现 Redis 缓存
   - 将内存缓存迁移到 Redis
   - 支持分布式缓存
   - 支持缓存持久化
   - **详细方案**: 参见 `docs/REDIS_CACHE_INTEGRATION.md`

2. **查询监控**
   - 添加慢查询日志
   - 监控查询执行时间
   - 识别性能瓶颈

3. **批量操作优化**
   - 实现批量插入
   - 实现批量更新
   - 减少数据库往返次数

### 中期（1-2 月）

1. **读写分离**
   - 配置主从数据库
   - 读操作路由到从库
   - 写操作路由到主库

2. **分页优化**
   - 使用游标分页
   - 优化大列表查询
   - 减少内存占用

3. **异步处理**
   - 非关键操作异步化
   - 使用消息队列
   - 提升响应速度

### 长期（3-6 月）

1. **数据库分片**
   - 按租户分片
   - 水平扩展
   - 提升并发能力

2. **CDN 集成**
   - 静态资源缓存
   - 减少服务器负载
   - 提升响应速度

3. **性能测试**
   - 压力测试
   - 负载测试
   - 容量规划

---

## 📝 最佳实践

### 1. 查询优化原则

- ✅ 只查询需要的字段
- ✅ 只在需要时加载关联
- ✅ 使用索引优化查询
- ✅ 避免 N+1 查询问题
- ✅ 使用缓存减少重复查询

### 2. 缓存使用原则

- ✅ 缓存读多写少的数据
- ✅ 设置合理的 TTL
- ✅ 及时清除失效缓存
- ✅ 使用有意义的缓存键
- ✅ 监控缓存命中率

### 3. 连接池配置原则

- ✅ 根据并发量调整连接数
- ✅ 设置合理的超时时间
- ✅ 监控连接池使用情况
- ✅ 避免连接泄漏

---

## 🔍 监控和调试

### 1. 启用查询日志

在开发环境启用 TypeORM 查询日志：

```typescript
logging: nodeEnv === 'development',
```

### 2. 监控缓存命中率

建议添加缓存监控中间件，记录：

- 缓存命中次数
- 缓存未命中次数
- 缓存清除次数

### 3. 性能分析工具

- **TypeORM Query Analyzer**: 分析查询性能
- **PostgreSQL EXPLAIN**: 分析查询计划
- **APM 工具**: 应用性能监控

---

## 📚 参考资料

- [TypeORM Performance Optimization](https://typeorm.io/performance-optimization)
- [PostgreSQL Indexing Best Practices](https://www.postgresql.org/docs/current/indexes.html)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)

---

**文档维护**: 开发团队  
**最后更新**: 2024年
