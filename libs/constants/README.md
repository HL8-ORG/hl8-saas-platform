# @hl8/constants

NestJS 应用常量模块，提供统一的常量定义，包括 API Key 认证、缓存、事件、REST API 等相关常量。

## 安装

```bash
pnpm add @hl8/constants
```

## 功能特性

- ✅ **API Key 认证常量**：定义 API Key 认证策略、来源等枚举和元数据键
- ✅ **缓存常量**：统一管理缓存键前缀，避免键名冲突
- ✅ **事件常量**：定义事件发射器的事件名称
- ✅ **REST API 常量**：HTTP 响应、请求头等 REST 相关常量
- ✅ **TypeScript 支持**：完整的类型定义和智能提示
- ✅ **零依赖**：不依赖任何外部库

## 使用示例

### API Key 认证常量

```typescript
import {
  ApiKeyAuthStrategy,
  ApiKeyAuthSource,
  API_KEY_AUTH_OPTIONS,
} from '@hl8/constants';

// 使用认证策略枚举
const strategy = ApiKeyAuthStrategy.ApiKey; // 'api-key'
const signedStrategy = ApiKeyAuthStrategy.SignedRequest; // 'signed-request'

// 使用认证来源枚举
const source = ApiKeyAuthSource.Header; // 'header'
const querySource = ApiKeyAuthSource.Query; // 'query'

// 使用元数据键（用于装饰器）
Reflect.defineMetadata(API_KEY_AUTH_OPTIONS, options, target);
```

### 缓存常量

```typescript
import { CacheConstant } from '@hl8/constants';

// 系统级缓存前缀
const systemKey = `${CacheConstant.SYSTEM}config`; // 'hl8:config'

// 通用缓存键
const cacheKey = `${CacheConstant.CACHE_PREFIX}data:${id}`; // 'hl8:cache:data:123'

// 认证令牌缓存键
const tokenKey = `${CacheConstant.AUTH_TOKEN_PREFIX}${userId}`; // 'hl8:cache:user:123'
```

### 事件常量

```typescript
import {
  EVENT_API_ROUTE_COLLECTED,
  EVENT_OPERATION_LOG_CREATED,
  EVENT_API_KEY_VALIDATED,
} from '@hl8/constants';

// 监听 API 路由收集完成事件
eventEmitter.on(EVENT_API_ROUTE_COLLECTED, (routes) => {
  console.log('API 路由已收集:', routes);
});

// 监听操作日志创建事件
eventEmitter.on(EVENT_OPERATION_LOG_CREATED, (log) => {
  console.log('操作日志已创建:', log);
});

// 监听 API Key 验证事件
eventEmitter.on(EVENT_API_KEY_VALIDATED, (result) => {
  console.log('API Key 验证完成:', result);
});
```

### REST API 常量

```typescript
import {
  RESPONSE_SUCCESS_CODE,
  RESPONSE_SUCCESS_MSG,
  X_REQUEST_ID,
  USER_AGENT,
  PATH,
  METHOD,
  SWAGGER_API_OPERATION,
} from '@hl8/constants';

// 统一响应格式
const response = {
  code: RESPONSE_SUCCESS_CODE, // 200
  message: RESPONSE_SUCCESS_MSG, // 'success'
  data: result,
};

// 获取请求 ID
const requestId = request.headers[X_REQUEST_ID]; // 'x-request-id'

// 获取用户代理
const userAgent = request.headers[USER_AGENT]; // 'user-agent'

// 在装饰器中使用
@SetMetadata(PATH, '/api/users')
@SetMetadata(METHOD, 'GET')
@SetMetadata(SWAGGER_API_OPERATION, { summary: '获取用户列表' })
async getUsers() {
  // ...
}
```

## API 文档

### API Key 认证常量

#### `API_KEY_AUTH_OPTIONS`

API Key 认证选项元数据键（Symbol），用于在装饰器中标识 API Key 认证选项。

**类型**: `symbol`

#### `ApiKeyAuthStrategy`

API Key 认证策略枚举。

**值**:

- `ApiKey = 'api-key'` - 简单 API Key 认证策略
- `SignedRequest = 'signed-request'` - 签名请求认证策略

#### `ApiKeyAuthSource`

API Key 认证来源枚举。

**值**:

- `Header = 'header'` - 从请求头获取
- `Query = 'query'` - 从查询参数获取

### 缓存常量

#### `CacheConstant`

缓存前缀常量对象。

**属性**:

- `SYSTEM: 'hl8:'` - 系统级缓存前缀
- `CACHE_PREFIX: 'hl8:cache:'` - 通用缓存前缀
- `AUTH_TOKEN_PREFIX: 'hl8:cache:user:'` - 认证令牌缓存前缀

### 事件常量

#### `EVENT_API_ROUTE_COLLECTED`

API 路由收集完成事件名称。

**值**: `'api:route.collected'`

#### `EVENT_OPERATION_LOG_CREATED`

操作日志创建事件名称。

**值**: `'audit:operation.logged'`

#### `EVENT_API_KEY_VALIDATED`

API Key 验证完成事件名称。

**值**: `'auth:api-key.validated'`

### REST API 常量

#### `RESPONSE_SUCCESS_CODE`

响应成功状态码。

**值**: `200`

#### `RESPONSE_SUCCESS_MSG`

响应成功消息。

**值**: `'success'`

#### `X_REQUEST_ID`

请求 ID 请求头键名。

**值**: `'x-request-id'`

#### `USER_AGENT`

用户代理请求头键名。

**值**: `'user-agent'`

#### `PATH`

路径常量键名，用于元数据。

**值**: `'path'`

#### `FUNCTION`

函数常量键名，用于元数据。

**值**: `'function'`

#### `METHOD`

HTTP 方法常量键名，用于元数据。

**值**: `'method'`

#### `SWAGGER_API_OPERATION`

Swagger API 操作元数据键。

**值**: `'swagger/apiOperation'`

## 开发

### 构建

```bash
pnpm build
```

### 测试

```bash
# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:cov

# 监听模式运行测试
pnpm test:watch
```

### 代码检查

```bash
# 运行 ESLint
pnpm lint

# 类型检查
pnpm type-check
```

## 许可证

MIT
