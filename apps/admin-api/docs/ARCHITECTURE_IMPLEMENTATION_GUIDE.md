# 架构重构实现指南

## 📋 目录

1. [架构概述](#架构概述)
2. [目录结构](#目录结构)
3. [核心概念](#核心概念)
4. [使用指南](#使用指南)
5. [集成说明](#集成说明)

## 架构概述

本项目采用 **DDD + Clean Architecture + CQRS + EDA** 混合架构，将应用程序分为四个清晰的层次：

1. **表现层（Presentation Layer）** - HTTP 请求处理
2. **应用层（Application Layer）** - 用例协调
3. **领域层（Domain Layer）** - 业务逻辑核心
4. **基础设施层（Infrastructure Layer）** - 技术实现

## 目录结构

```
src/
├── presentation/          # 表现层
│   ├── controllers/      # 控制器
│   ├── dtos/            # HTTP DTO
│   └── mappers/         # HTTP DTO 映射器
├── application/          # 应用层
│   ├── auth/
│   │   ├── use-cases/   # 用例实现
│   │   ├── dtos/        # 应用层 DTO
│   │   └── auth.module.ts  # 模块配置
│   └── shared/
│       └── interfaces/   # 服务接口
├── domain/              # 领域层
│   ├── auth/
│   │   ├── entities/    # 聚合根
│   │   ├── value-objects/  # 值对象
│   │   ├── events/      # 领域事件
│   │   └── repositories/  # 仓储接口
│   └── shared/
│       ├── events/      # 共享事件
│       └── value-objects/  # 共享值对象
└── infrastructure/       # 基础设施层
    ├── persistence/     # 持久化实现
    ├── services/        # 服务实现
    └── events/          # 事件处理
```

## 核心概念

### 值对象（Value Objects）

值对象是不可变的，包含业务规则和验证逻辑。

```typescript
// 示例：邮箱值对象
const email = new Email('user@example.com');
// 自动验证格式，如果无效会抛出异常
```

### 聚合根（Aggregate Root）

聚合根是领域模型的入口点，包含业务逻辑和领域事件。

```typescript
// 创建用户聚合根
const user = User.create(
  email,
  passwordHash,
  fullName,
  UserRole.USER,
  tenantId,
);

// 执行业务操作
user.verifyEmail('123456');

// 获取领域事件
const events = user.getDomainEvents();
```

### 用例（Use Cases）

用例封装了应用层的业务流程。

```typescript
// 执行用例
const result = await signupUseCase.execute({
  email: 'user@example.com',
  password: 'Password123!',
  fullName: 'John Doe',
});
```

### 领域事件（Domain Events）

领域事件用于解耦模块，支持异步处理。

```typescript
// 事件会自动发布
user.verifyEmail('123456');
// 发布 EmailVerifiedEvent，事件处理器会自动处理
```

## 使用指南

### 1. 创建新用例

1. 在 `application/{domain}/use-cases/` 创建用例文件
2. 实现 `IUseCase` 接口
3. 在模块中注册用例

### 2. 创建新聚合根

1. 在 `domain/{domain}/entities/` 创建聚合根
2. 定义业务方法
3. 发布领域事件

### 3. 创建新值对象

1. 在 `domain/{domain}/value-objects/` 创建值对象
2. 包含验证逻辑
3. 实现 `equals()` 和 `toString()` 方法

## 集成说明

### 更新 app.module.ts

新的认证模块已创建在 `application/auth/auth.module.ts`。

**选项1：替换现有模块（推荐用于测试）**

```typescript
// 注释掉旧的模块
// import { AuthModule } from './modules/auth/auth.module';

// 使用新模块
import { AuthModule } from './application/auth/auth.module';
```

**选项2：并行运行（推荐用于生产）**

可以保持两个模块并行，逐步迁移。

### 模块配置

新模块已完整配置所有依赖注入：

- ✅ 所有用例
- ✅ 所有服务实现
- ✅ 所有仓储实现
- ✅ 所有事件处理器

事件总线已在 `app.module.ts` 中配置为全局提供者，所有模块都可以使用。

## 重要提示

1. **ULID 使用**：所有 ID 使用 ULID 替代 UUID
2. **依赖注入**：所有服务通过接口注入
3. **事件处理**：领域事件自动由事件处理器处理
4. **测试覆盖**：每个组件都需要单元测试

## 下一步

1. 更新 `app.module.ts` 使用新模块（或并行运行）
2. 运行测试验证功能
3. 继续重构其他领域（用户、角色、权限、租户）

---

**架构重构已完成！系统已准备好进行下一阶段工作！** 🚀
