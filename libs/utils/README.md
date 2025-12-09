# @hl8/utils

通用工具函数库，为 NestJS 应用提供常用的工具函数和类型定义。

## 📦 安装

在 monorepo 中，该包已通过 workspace 协议自动链接。如需在其他项目中使用：

```bash
pnpm add @hl8/utils
```

## 🚀 快速开始

```typescript
import {
  getEnvString,
  UlidGenerator,
  getClientIpAndPort,
  buildTree,
} from '@hl8/utils';

// 获取环境变量
const dbHost = getEnvString('DB_HOST', 'localhost');

// 生成 ULID
const id = UlidGenerator.generate();

// 获取客户端 IP
const { ip, port } = getClientIpAndPort(request);

// 构建树形结构
const tree = buildTree(items, 'pid', 'id');
```

## 📚 API 文档

### 环境变量工具 (`env.ts`)

提供环境变量读取和运行时环境判断功能。

#### `isMainCluster`

判断当前进程是否为主集群实例（实例编号为 0 或未设置）。

```typescript
import { isMainCluster } from '@hl8/utils';

if (isMainCluster) {
  // 只在主集群实例中执行
}
```

#### `isMainProcess`

判断当前进程是否为主进程（集群主进程或主集群实例）。

```typescript
import { isMainProcess } from '@hl8/utils';

if (isMainProcess) {
  // 只在主进程中执行
}
```

#### `isDevEnvironment`

判断当前运行环境是否为开发环境。

```typescript
import { isDevEnvironment } from '@hl8/utils';

if (isDevEnvironment) {
  // 开发环境特定逻辑
}
```

#### `getEnvBoolean(key, defaultValue)`

从环境变量中获取布尔值。

**参数：**

- `key: string` - 环境变量键名
- `defaultValue: boolean` - 默认值

**返回：** `boolean`

**示例：**

```typescript
import { getEnvBoolean } from '@hl8/utils';

const enabled = getEnvBoolean('FEATURE_ENABLED', false);
// 环境变量值为 'true' 时返回 true，否则返回 false
```

#### `getEnvString(key, defaultValue)`

从环境变量中获取字符串值。

**参数：**

- `key: string` - 环境变量键名
- `defaultValue: string` - 默认值

**返回：** `string`

**示例：**

```typescript
import { getEnvString } from '@hl8/utils';

const host = getEnvString('DB_HOST', 'localhost');
```

#### `getEnvNumber(key, defaultValue)`

从环境变量中获取数字值。

**参数：**

- `key: string` - 环境变量键名
- `defaultValue: number` - 默认值

**返回：** `number`

**示例：**

```typescript
import { getEnvNumber } from '@hl8/utils';

const port = getEnvNumber('APP_PORT', 3000);
```

#### `getEnvArray<T>(key, defaultValue?)`

从环境变量中获取数组值（以逗号分隔）。

**参数：**

- `key: string` - 环境变量键名
- `defaultValue?: T[]` - 默认值数组（可选，默认为空数组）

**返回：** `T[]`

**示例：**

```typescript
import { getEnvArray } from '@hl8/utils';

// 环境变量: CORS_ORIGIN=http://localhost:3000,http://localhost:3001
const origins = getEnvArray('CORS_ORIGIN', ['http://localhost:3000']);
// 返回: ['http://localhost:3000', 'http://localhost:3001']
```

#### `getAppName()`

从主模块路径中提取应用名称。

**返回：** `string` - 应用名称，如果无法确定则返回 'base-system'

**示例：**

```typescript
import { getAppName } from '@hl8/utils';

const appName = getAppName();
// 如果主模块路径为 'apps/user-api/src/main.ts'，则返回 'user-api'
```

#### `getConfigPath(filename)`

根据应用名称和运行环境获取配置文件的完整路径。

**参数：**

- `filename: string` - 配置文件名

**返回：** `string` - 配置文件的完整路径

**示例：**

```typescript
import { getConfigPath } from '@hl8/utils';

const configPath = getConfigPath('database.json');
// 开发环境: 'apps/base-system/src/resources/database.json'
// 生产环境: 'dist/apps/base-system/src/resources/database.json'
```

### ID 生成工具 (`id.util.ts`)

提供 ULID（Universally Unique Lexicographically Sortable Identifier）生成功能。

#### `UlidGenerator`

ULID 生成器类。

**静态方法：**

##### `UlidGenerator.generate()`

生成一个新的 ULID。

**返回：** `string` - 新的 ULID 字符串

**示例：**

```typescript
import { UlidGenerator } from '@hl8/utils';

const id = UlidGenerator.generate();
// 返回类似: '01ARZ3NDEKTSV4RRFFQ69G5FAV'
```

**特性：**

- 全局唯一标识符
- 按字典序可排序（时间戳有序）
- 128 位编码，26 个字符
- 不包含易混淆字符（如 0/O, 1/I）

### IP 地址工具 (`ip.util.ts`)

提供从 HTTP 请求中提取客户端 IP 地址和端口的功能。

#### `getClientIpAndPort(request)`

从请求中提取客户端的真实 IP 地址和端口号，支持代理环境。

**参数：**

- `request: FastifyRequest | IncomingMessage` - Fastify 请求对象或 Node.js HTTP 请求对象

**返回：** `{ ip: string; port: number | null }` - 包含 IP 和端口的对象

**示例：**

```typescript
import { getClientIpAndPort } from '@hl8/utils';
import { FastifyRequest } from 'fastify';

app.get('/api/user', (request: FastifyRequest) => {
  const { ip, port } = getClientIpAndPort(request);
  console.log(`Client IP: ${ip}, Port: ${port}`);
});
```

**IP 获取优先级：**
函数会按以下顺序检查请求头以获取真实 IP：

1. `x-forwarded-for`
2. `x-real-ip`
3. `proxy-client-ip`
4. `wl-proxy-client-ip`
5. `http_client_ip`
6. `http_x_forwarded_for`
7. `socket.remoteAddress`（如果以上都不存在）

**注意：** 如果 `x-forwarded-for` 包含多个 IP（逗号分隔），函数会取第一个 IP。

### 树形结构工具 (`tree.util.ts`)

提供将扁平列表转换为树形结构的功能。

#### `buildTree<T>(items, parentIdField?, idField?, orderField?)`

将扁平列表转换为树形结构。

**参数：**

- `items: T[]` - 要转换成树形结构的原始列表
- `parentIdField?: keyof T` - 父节点字段名称（默认 `'pid'`）
- `idField?: keyof T` - 唯一主键字段名称（默认 `'id'`）
- `orderField?: keyof T` - 排序字段名称（可选）

**返回：** `TreeNode<T>[]` - 树形结构数组

**类型定义：**

```typescript
type TreeNode<T> = T & {
  children?: TreeNode<T>[];
};
```

**示例：**

```typescript
import { buildTree } from '@hl8/utils';

const items = [
  { id: 1, name: 'Parent', pid: 0, sort: 1 },
  { id: 2, name: 'Child 1', pid: 1, sort: 1 },
  { id: 3, name: 'Child 2', pid: 1, sort: 2 },
  { id: 4, name: 'Root 2', pid: 0, sort: 2 },
];

const tree = buildTree(items, 'pid', 'id', 'sort');
// 返回:
// [
//   {
//     id: 1,
//     name: 'Parent',
//     pid: 0,
//     sort: 1,
//     children: [
//       { id: 2, name: 'Child 1', pid: 1, sort: 1 },
//       { id: 3, name: 'Child 2', pid: 1, sort: 2 }
//     ]
//   },
//   {
//     id: 4,
//     name: 'Root 2',
//     pid: 0,
//     sort: 2
//   }
// ]
```

**注意事项：**

- 父节点 ID 为 `0` 或 `'0'` 的节点会被视为根节点
- 如果指定了 `orderField`，根节点和子节点都会按该字段排序
- 如果某个节点的父节点不存在，会在控制台输出错误信息，但不会中断处理

### 类型工具 (`type.util.ts`)

提供 TypeScript 类型工具函数。

#### `RecordNamePaths<T>`

提取记录类型中所有键的路径（包括嵌套对象的路径）。

**类型参数：**

- `T` - 记录类型

**示例：**

```typescript
import type { RecordNamePaths } from '@hl8/utils';

type Example = {
  a: string;
  b: {
    c: number;
    d: boolean;
  };
};

type Paths = RecordNamePaths<Example>;
// 结果: "a" | "b" | "b.c" | "b.d"
```

**使用场景：**
常用于配置类型或表单字段路径的类型安全访问。

## 💡 使用示例

### 在 NestJS 配置模块中使用

```typescript
import { registerAs } from '@nestjs/config';
import { getEnvNumber, getEnvString, getEnvBoolean } from '@hl8/utils';

export const AppConfig = registerAs('app', () => ({
  port: getEnvNumber('APP_PORT', 9528),
  host: getEnvString('APP_HOST', '0.0.0.0'),
  debug: getEnvBoolean('APP_DEBUG', false),
}));
```

### 在控制器中使用 IP 工具

```typescript
import { Controller, Get } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { getClientIpAndPort } from '@hl8/utils';

@Controller('api')
export class ApiController {
  @Get('info')
  getInfo(@Req() request: FastifyRequest) {
    const { ip, port } = getClientIpAndPort(request);
    return { clientIp: ip, clientPort: port };
  }
}
```

### 生成唯一 ID

```typescript
import { UlidGenerator } from '@hl8/utils';

// 在实体中使用
@Entity()
export class User {
  @PrimaryColumn()
  id: string = UlidGenerator.generate();

  // ... 其他字段
}
```

### 构建菜单树

```typescript
import { buildTree } from '@hl8/utils';

const menus = [
  { id: 1, name: '系统管理', pid: 0, sort: 1 },
  { id: 2, name: '用户管理', pid: 1, sort: 1 },
  { id: 3, name: '角色管理', pid: 1, sort: 2 },
  { id: 4, name: '业务管理', pid: 0, sort: 2 },
];

const menuTree = buildTree(menus, 'pid', 'id', 'sort');
```

## 🧪 测试

运行测试：

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:cov

# 监听模式运行测试
pnpm test:watch
```

**注意：** 当前项目缺少单元测试文件，建议为每个工具函数添加对应的测试用例。

## 🛠️ 开发

### 项目结构

```
libs/utils/
├── src/
│   ├── lib/
│   │   ├── env.ts          # 环境变量工具
│   │   ├── id.util.ts      # ID 生成工具
│   │   ├── ip.util.ts      # IP 地址工具
│   │   ├── tree.util.ts    # 树形结构工具
│   │   └── type.util.ts    # 类型工具
│   └── index.ts            # 导出入口
├── dist/                   # 编译输出
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

### 构建

```bash
# 构建项目
pnpm build

# 监听模式构建
pnpm dev

# 类型检查
pnpm type-check
```

### 代码规范

```bash
# 格式化代码
pnpm format

# 检查代码规范
pnpm lint:check

# 自动修复代码规范问题
pnpm lint
```

### 添加新工具函数

1. 在 `src/lib/` 目录下创建新的工具文件
2. 编写函数并添加完整的 TSDoc 注释（中文）
3. 在 `src/index.ts` 中导出新函数
4. 编写对应的单元测试（`*.spec.ts`）
5. 更新本 README 文档

**示例：**

````typescript
// src/lib/string.util.ts

/**
 * 字符串工具函数集合
 *
 * @description 提供常用的字符串处理函数
 */

/**
 * 首字母大写
 *
 * @description 将字符串的首字母转换为大写
 *
 * @param str - 输入字符串
 * @returns 返回首字母大写的字符串
 *
 * @example
 * ```typescript
 * capitalize('hello') // 返回 'Hello'
 * ```
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
````

然后在 `src/index.ts` 中导出：

```typescript
export * from './lib/string.util';
```

## 📋 依赖

### 运行时依赖

- `fastify` (^5.6.2) - 用于 IP 工具的类型定义
- `ulid` (^3.0.1) - ULID 生成库

### 开发依赖

- TypeScript 5.9.3+
- Jest 30.2.0+ - 测试框架
- ESLint - 代码规范检查

## 🔗 相关项目

- `@hl8/config` - 配置模块（依赖本包）
- `@hl8/infra` - 基础设施模块（依赖本包）

## 📝 版本历史

- **1.0.0** - 初始版本
  - 环境变量工具
  - ULID 生成器
  - IP 地址提取工具
  - 树形结构构建工具
  - TypeScript 类型工具

## 🤝 贡献

在添加新功能或修复问题时，请确保：

1. 遵循项目的代码规范
2. 添加完整的 TSDoc 中文注释
3. 编写对应的单元测试
4. 更新本 README 文档
5. 通过所有测试和代码检查

## 📄 许可证

MIT
