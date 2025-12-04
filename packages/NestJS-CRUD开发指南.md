# NestJS 菜单模块 CRUD 接口开发指南

> 基于博客园文章《NestJS菜单模块CRUD接口开发指南（deepseek）》整理

## 📋 目录

1. [概述](#概述)
2. [NestJS 接口开发通用公式](#nestjs-接口开发通用公式)
3. [快速生成模板](#快速生成模板)
4. [完整开发流程](#完整开发流程)
5. [最佳实践](#最佳实践)
6. [项目结构参考](#项目结构参考)

---

## 概述

本指南详细介绍了在 NestJS 中开发菜单模块（或任何资源模块）的 CRUD（创建、读取、更新、删除）接口的步骤和最佳实践。

---

## 🎯 NestJS 接口开发通用公式

### 开发流程公式

```
1. 设计数据结构 → 实体类（Entity/Interface）
2. 定义数据格式 → DTO（Data Transfer Object）
3. 实现业务逻辑 → Service
4. 暴露 API 接口 → Controller
5. 配置模块依赖 → Module
6. 添加文档注释 → Swagger 装饰器
7. 设置权限控制 → Guards & Decorators
```

### 模块结构公式

```
src/
├── modules/
│   └── [模块名]/
│       ├── [模块名].module.ts      # 模块定义
│       ├── [模块名].controller.ts  # 控制器
│       ├── [模块名].service.ts     # 服务层
│       ├── dto/
│       │   ├── create-[模块名].dto.ts
│       │   ├── update-[模块名].dto.ts
│       │   └── query-[模块名].dto.ts
│       └── entities/
│           └── [模块名].entity.ts
```

---

## 快速生成模板

### 方法一：使用 Nest CLI（推荐）

NestJS 提供了强大的命令行工具，可以快速生成模块骨架代码：

```bash
# 生成完整资源模块（包含 CRUD）
nest g resource 模块名

# 或分别生成各个部分
nest g module 模块名
nest g controller 模块名
nest g service 模块名
nest g dto 模块名
```

**示例：**

```bash
# 生成菜单模块
nest g resource menu

# 选择 REST API
# 选择 Y 生成 CRUD entry points
```

### 方法二：手动创建模板

如果需要更多控制，可以手动创建文件结构：

```typescript
// generate-module.ts - 代码生成工具示例
function generateModule(moduleName: string) {
  const templates = {
    controller: `
import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ${moduleName}Service } from './${moduleName.toLowerCase()}.service';
import { Create${moduleName}Dto } from './dto/create-${moduleName.toLowerCase()}.dto';
import { Update${moduleName}Dto } from './dto/update-${moduleName.toLowerCase()}.dto';

@Controller('${moduleName.toLowerCase()}s')
export class ${moduleName}Controller {
  constructor(private readonly ${moduleName.toLowerCase()}Service: ${moduleName}Service) {}
}
    `,
    service: `
import { Injectable } from '@nestjs/common';
import { Create${moduleName}Dto } from './dto/create-${moduleName.toLowerCase()}.dto';
import { Update${moduleName}Dto } from './dto/update-${moduleName.toLowerCase()}.dto';

@Injectable()
export class ${moduleName}Service {
  // 业务逻辑实现
}
    `,
  };
  return templates;
}
```

---

## 完整开发流程

### 步骤 1: 设计数据结构（Entity/Interface）

定义数据实体结构：

```typescript
// interfaces/menu.interface.ts 或 entities/menu.entity.ts
/**
 * 菜单实体接口
 */
export interface Menu {
  id: string;
  name: string; // 菜单名称
  path: string; // 路由路径
  icon?: string; // 图标
  parentId?: string; // 父菜单ID
  order: number; // 排序
  isVisible: boolean; // 是否可见
  createdAt: Date;
  updatedAt: Date;
}
```

### 步骤 2: 定义数据格式（DTO）

创建数据传输对象，用于验证和类型检查：

```typescript
// dto/create-menu.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

/**
 * 创建菜单的 DTO
 */
export class CreateMenuDto {
  @ApiProperty({ description: '菜单名称', example: '用户管理' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '路由路径', example: '/users' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ description: '图标', required: false, example: 'user' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: '父菜单ID', required: false })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ description: '排序', example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ description: '是否可见', example: true })
  @IsBoolean()
  isVisible: boolean;
}
```

```typescript
// dto/update-menu.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateMenuDto } from './create-menu.dto';

/**
 * 更新菜单的 DTO（继承自 CreateMenuDto，所有字段可选）
 */
export class UpdateMenuDto extends PartialType(CreateMenuDto) {}
```

```typescript
// dto/query-menu.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 查询菜单的 DTO
 */
export class QueryMenuDto {
  @ApiPropertyOptional({ description: '菜单名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
```

### 步骤 3: 实现业务逻辑（Service）

```typescript
// services/menu.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';
import { QueryMenuDto } from '../dto/query-menu.dto';
import { Menu } from '../interfaces/menu.interface';

@Injectable()
export class MenuService {
  private menus: Menu[] = []; // 实际项目中应使用数据库

  /**
   * 创建菜单
   * @param createMenuDto 创建菜单的 DTO
   * @returns 创建的菜单对象
   */
  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    // 检查菜单名称是否已存在
    const existingMenu = this.menus.find((m) => m.name === createMenuDto.name);
    if (existingMenu) {
      throw new BadRequestException('菜单名称已存在');
    }

    const menu: Menu = {
      id: this.generateId(),
      ...createMenuDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.menus.push(menu);
    return menu;
  }

  /**
   * 查询所有菜单（支持分页和搜索）
   * @param queryDto 查询参数
   * @returns 菜单列表
   */
  async findAll(
    queryDto: QueryMenuDto,
  ): Promise<{ data: Menu[]; total: number }> {
    let filteredMenus = [...this.menus];

    // 按名称搜索
    if (queryDto.name) {
      filteredMenus = filteredMenus.filter((m) =>
        m.name.includes(queryDto.name),
      );
    }

    // 分页
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: filteredMenus.slice(start, end),
      total: filteredMenus.length,
    };
  }

  /**
   * 根据ID查询菜单
   * @param id 菜单ID
   * @returns 菜单对象
   * @throws NotFoundException 如果菜单不存在
   */
  async findOne(id: string): Promise<Menu> {
    const menu = this.menus.find((m) => m.id === id);
    if (!menu) {
      throw new NotFoundException(`菜单 ID ${id} 不存在`);
    }
    return menu;
  }

  /**
   * 更新菜单
   * @param id 菜单ID
   * @param updateMenuDto 更新菜单的 DTO
   * @returns 更新后的菜单对象
   */
  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.findOne(id);

    // 如果更新名称，检查是否与其他菜单冲突
    if (updateMenuDto.name && updateMenuDto.name !== menu.name) {
      const existingMenu = this.menus.find(
        (m) => m.name === updateMenuDto.name && m.id !== id,
      );
      if (existingMenu) {
        throw new BadRequestException('菜单名称已存在');
      }
    }

    Object.assign(menu, updateMenuDto, { updatedAt: new Date() });
    return menu;
  }

  /**
   * 删除菜单
   * @param id 菜单ID
   * @returns 删除结果
   */
  async remove(id: string): Promise<void> {
    const index = this.menus.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new NotFoundException(`菜单 ID ${id} 不存在`);
    }
    this.menus.splice(index, 1);
  }

  /**
   * 生成唯一ID（示例，实际应使用 UUID 等）
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
```

### 步骤 4: 暴露 API 接口（Controller）

```typescript
// controllers/menu.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { MenuService } from '../services/menu.service';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';
import { QueryMenuDto } from '../dto/query-menu.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  AuthZGuard,
  UsePermissions,
  AuthActionVerb,
  AuthPossession,
} from 'nest-authz';
import { Resource } from '../resources';

/**
 * 菜单控制器
 * 提供菜单的 CRUD 操作接口
 */
@ApiTags('Menu')
@ApiBearerAuth()
@Controller('menus')
@UseGuards(AuthGuard(), AuthZGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 创建菜单
   */
  @Post()
  @UsePermissions({
    action: AuthActionVerb.CREATE,
    resource: ResourceGroup.MENU,
    possession: AuthPossession.ANY,
  })
  @ApiOperation({ summary: '创建菜单' })
  @ApiResponse({ status: 201, description: '菜单创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  /**
   * 查询菜单列表
   */
  @Get()
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: ResourceGroup.MENU,
    possession: AuthPossession.ANY,
  })
  @ApiOperation({ summary: '获取菜单列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() queryDto: QueryMenuDto) {
    return this.menuService.findAll(queryDto);
  }

  /**
   * 查询单个菜单
   */
  @Get(':id')
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: ResourceGroup.MENU,
    possession: AuthPossession.ANY,
  })
  @ApiOperation({ summary: '获取菜单详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '菜单不存在' })
  async findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  /**
   * 更新菜单
   */
  @Put(':id')
  @UsePermissions({
    action: AuthActionVerb.UPDATE,
    resource: ResourceGroup.MENU,
    possession: AuthPossession.ANY,
  })
  @ApiOperation({ summary: '更新菜单' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '菜单不存在' })
  async update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(id, updateMenuDto);
  }

  /**
   * 删除菜单
   */
  @Delete(':id')
  @UsePermissions({
    action: AuthActionVerb.DELETE,
    resource: ResourceGroup.MENU,
    possession: AuthPossession.ANY,
  })
  @ApiOperation({ summary: '删除菜单' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '菜单不存在' })
  async remove(@Param('id') id: string) {
    await this.menuService.remove(id);
    return { message: '菜单删除成功' };
  }
}
```

### 步骤 5: 配置模块依赖（Module）

```typescript
// menu.module.ts
import { Module } from '@nestjs/common';
import { MenuController } from './controllers/menu.controller';
import { MenuService } from './services/menu.service';

/**
 * 菜单模块
 * 提供菜单相关的功能
 */
@Module({
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService], // 如果其他模块需要使用 MenuService
})
export class MenuModule {}
```

然后在 `app.module.ts` 中导入：

```typescript
import { MenuModule } from './modules/menu/menu.module';

@Module({
  imports: [
    // ... 其他模块
    MenuModule,
  ],
  // ...
})
export class AppModule {}
```

### 步骤 6: 添加文档注释（Swagger）

使用 Swagger 装饰器增强 API 文档：

- `@ApiTags()` - 为控制器分组
- `@ApiOperation()` - 描述操作
- `@ApiProperty()` - 描述属性
- `@ApiResponse()` - 描述响应
- `@ApiBearerAuth()` - 标识需要认证

### 步骤 7: 设置权限控制（Guards & Decorators）

使用 `nest-authz` 进行权限控制：

```typescript
@UseGuards(AuthGuard(), AuthZGuard)
@UsePermissions({
  action: AuthActionVerb.CREATE,
  resource: ResourceGroup.MENU,
  possession: AuthPossession.ANY,
})
```

---

## 最佳实践

### 1. 代码组织

- ✅ 使用模块化结构，每个功能模块独立
- ✅ DTO 单独目录管理
- ✅ 服务层处理业务逻辑，控制器只负责路由
- ✅ 使用接口定义实体类型

### 2. 错误处理

```typescript
// 使用 NestJS 内置异常
throw new NotFoundException('资源不存在');
throw new BadRequestException('参数错误');
throw new UnauthorizedException('未授权');
```

### 3. 数据验证

使用 `class-validator` 和 `class-transformer`：

```typescript
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}
```

### 4. 分页查询

```typescript
// 统一的分页响应格式
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 5. 日志记录

```typescript
import { Logger } from '@nestjs/common';

export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  async create(dto: CreateMenuDto) {
    this.logger.log(`创建菜单: ${dto.name}`);
    // ...
  }
}
```

---

## 项目结构参考

基于当前项目的实际结构：

```
src/
├── app.module.ts              # 根模块
├── config.module.ts           # 配置模块
├── main.ts                    # 应用入口
├── resources.ts               # 资源定义
├── fake-data.ts              # 模拟数据
├── interfaces/               # 接口定义
│   ├── core-rbac.interface.ts
│   ├── jwt.interface.ts
│   └── index.ts
├── dto/                      # 数据传输对象
│   ├── login.input.ts
│   ├── register.input.ts
│   ├── create-role.input.ts
│   ├── add-role-permission.input.ts
│   └── assign-user-role.input.ts
├── services/                 # 服务层
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── role.service.ts
│   ├── jwt.strategy.ts
│   ├── config.service.ts
│   └── index.ts
└── controllers/             # 控制器层
    ├── app.controller.ts
    ├── auth.controller.ts
    ├── user.controller.ts
    ├── role.controller.ts
    ├── user-role.controller.ts
    └── user-permission.controller.ts
```

### 推荐的模块化结构

如果要添加新模块（如菜单模块），建议结构：

```
src/
├── modules/
│   └── menu/
│       ├── menu.module.ts
│       ├── menu.controller.ts
│       ├── menu.service.ts
│       ├── dto/
│       │   ├── create-menu.dto.ts
│       │   ├── update-menu.dto.ts
│       │   └── query-menu.dto.ts
│       └── interfaces/
│           └── menu.interface.ts
```

---

## 总结

遵循以上公式和最佳实践，可以快速、规范地开发 NestJS CRUD 接口：

1. ✅ **标准化流程**：从实体定义到接口暴露的完整流程
2. ✅ **代码生成**：使用 CLI 工具提高开发效率
3. ✅ **类型安全**：使用 TypeScript 和 DTO 确保类型安全
4. ✅ **权限控制**：集成 nest-authz 实现细粒度权限管理
5. ✅ **API 文档**：使用 Swagger 自动生成接口文档
6. ✅ **错误处理**：统一的异常处理机制

---

## 相关资源

- [NestJS 官方文档](https://docs.nestjs.com/)
- [NestJS CLI 命令参考](https://docs.nestjs.com/cli/overview)
- [class-validator 文档](https://github.com/typestack/class-validator)
- [Swagger/OpenAPI 文档](https://docs.nestjs.com/openapi/introduction)

---

_文档创建时间：2025-01-29_  
_基于项目：nest-authz-example_
