# 产品模板视图开发文档

## 概述

现有的前端项目已经为你提供了开发框架，你首先阅读理解文件`product.template.views.xml`，作为开发规范，然后，自动生成完整的产品模板管理页面。该过程展示了如何将声明式的视图配置转换为功能完整的 React 组件。

## XML 配置文件结构

### 文件位置

```
apps/hl8-admin/docs/product.template.views.xml
```

### 配置内容

XML 文件定义了产品模板的四种视图模式：

1. **表单视图** (`product_template_view_form`) - 用于创建和编辑
2. **树形视图** (`product_template_view_tree`) - 列表展示
3. **看板视图** (`product_template_view_kanban`) - 卡片式展示
4. **搜索视图** (`product_template_view_search`) - 筛选和排序

### 关键字段映射

| XML 字段            | 前端实现            | 说明                              |
| ------------------- | ------------------- | --------------------------------- |
| `name`              | `name`              | 产品模板名称                      |
| `code`              | `code`              | 产品模板编码                      |
| `tagIds`            | `tagIds`            | 标签 ID 列表                      |
| `type`              | `type`              | 产品类型（product/service/consu） |
| `categoryId`        | `categoryId`        | 类别 ID                           |
| `image`             | `image`             | 图片 URL                          |
| `canSale`           | `canSale`           | 是否可销售                        |
| `canPurchase`       | `canPurchase`       | 是否可采购                        |
| `active`            | `active`            | 激活状态                          |
| `attributeLineIds`  | `attributeLineIds`  | 属性行 ID 列表                    |
| `productVariantIds` | `productVariantIds` | 产品变体 ID 列表                  |
| `description`       | `description`       | 描述信息                          |

## 开发流程

### 第一阶段：数据结构定义

#### 1.1 创建 Schema 定义

**文件**: `src/features/product-templates/data/schema.ts`

```typescript
// 定义产品模板的 TypeScript 类型
const productTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: productTemplateTypeSchema,
  // ... 其他字段
})
```

**关键点**:

- 使用 Zod 进行类型验证
- 定义枚举类型（status, type）
- 支持可选字段

#### 1.2 创建数据配置

**文件**: `src/features/product-templates/data/data.ts`

- 定义状态选项和颜色映射
- 定义类型选项和颜色映射
- 为 UI 组件提供配置数据

### 第二阶段：服务层实现

#### 2.1 API 服务定义

**文件**: `src/lib/services/product-template.service.ts`

```typescript
export const productTemplateService = {
  async getProductTemplateList(params?: PageProductTemplatesParams),
  async createProductTemplate(data: CreateProductTemplateRequest),
  async updateProductTemplate(data: UpdateProductTemplateRequest),
  async deleteProductTemplate(id: string),
}
```

**关键点**:

- 定义后端接口类型
- 实现 CRUD 操作
- 支持分页和筛选参数

#### 2.2 数据适配器

**文件**: `src/lib/adapters/product-template.adapter.ts`

- 将后端数据格式转换为前端格式
- 处理状态值映射（ENABLED/DISABLED → active/inactive）
- 处理日期格式转换

### 第三阶段：组件开发

#### 3.1 主视图组件

**文件**: `src/features/product-templates/index.tsx`

**功能**:

- 数据获取和状态管理
- 视图模式切换（表格/看板）
- 集成所有子组件

**关键实现**:

```typescript
// 支持模拟数据（开发环境）
const useMockData =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA !== 'false'

// 视图切换
const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
```

#### 3.2 表格视图组件

**文件**: `src/features/product-templates/components/product-templates-table.tsx`

**功能**:

- 使用 TanStack Table 实现数据表格
- 支持排序、筛选、分页
- 集成工具栏和批量操作

**列定义**: `product-templates-columns.tsx`

- 选择列（复选框）
- 编码列（固定左侧）
- 名称列
- 类型列（带颜色标签）
- 类别列
- 状态列（带颜色标签）
- 图片列
- 操作列（编辑/删除）

#### 3.3 看板视图组件

**文件**: `src/features/product-templates/components/product-templates-kanban.tsx`

**布局**:

- 响应式网格布局（sm:2列, lg:3列, xl:4列）
- 卡片结构：左侧图片（w-28），右侧内容
- 显示：名称、编码、类型、状态、类别、标签

**实现要点**:

```typescript
// 符合 XML 配置的布局
<div className="flex gap-4">
  <div className="w-28"> {/* 图片区域 */}
  <div className="flex-1"> {/* 内容区域 */}
</div>
```

#### 3.4 对话框组件

**添加/编辑对话框**: `product-templates-action-dialog.tsx`

- 表单验证（使用 react-hook-form + zod）
- 字段映射：名称、编码、类型、类别、图片、可销售、可采购、激活状态、描述

**删除对话框**: `product-templates-delete-dialog.tsx`

- 安全删除确认（需要输入编码）

**批量删除对话框**: `product-templates-multi-delete-dialog.tsx`

- 批量操作确认

### 第四阶段：路由配置

#### 4.1 路由文件

**文件**: `src/routes/product-templates/index.tsx`

```typescript
const productTemplatesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  type: z.array(...).optional().catch([]),
  active: z.array(...).optional().catch([]),
  name: z.string().optional().catch(''),
  code: z.string().optional().catch(''),
})

export const Route = createFileRoute('/product-templates/')({
  validateSearch: productTemplatesSearchSchema,
  component: ProductTemplates,
})
```

**关键点**:

- 路由路径：`/product-templates/`（无需认证）
- 搜索参数验证
- 支持类型和状态筛选

### 第五阶段：辅助功能

#### 5.1 Context Provider

**文件**: `src/features/product-templates/components/product-templates-provider.tsx`

- 管理对话框状态
- 管理当前选中行
- 提供刷新函数

#### 5.2 操作按钮

**主要按钮**: `product-templates-primary-buttons.tsx`

- 添加产品模板按钮

**行操作**: `data-table-row-actions.tsx`

- 编辑、删除操作菜单

**批量操作**: `data-table-bulk-actions.tsx`

- 批量删除功能

#### 5.3 模拟数据

**文件**: `src/features/product-templates/data/mock-data.ts`

- 12 条示例数据
- 支持分页和筛选
- 开发环境自动启用

## 文件组织结构

```
src/features/product-templates/
├── index.tsx                          # 主视图组件
├── data/
│   ├── schema.ts                      # 数据类型定义
│   ├── data.ts                       # UI 配置数据
│   └── mock-data.ts                  # 模拟数据
├── components/
│   ├── product-templates-provider.tsx  # Context Provider
│   ├── product-templates-table.tsx    # 表格视图
│   ├── product-templates-kanban.tsx   # 看板视图
│   ├── product-templates-columns.tsx  # 表格列定义
│   ├── product-templates-action-dialog.tsx    # 添加/编辑对话框
│   ├── product-templates-delete-dialog.tsx   # 删除对话框
│   ├── product-templates-multi-delete-dialog.tsx  # 批量删除
│   ├── product-templates-dialogs.tsx  # 对话框容器
│   ├── product-templates-primary-buttons.tsx  # 主要按钮
│   ├── data-table-row-actions.tsx     # 行操作
│   └── data-table-bulk-actions.tsx   # 批量操作

src/lib/
├── services/
│   └── product-template.service.ts    # API 服务
└── adapters/
    └── product-template.adapter.ts    # 数据适配器

src/routes/
└── product-templates/
    └── index.tsx                      # 路由配置
```

## 关键实现细节

### 1. 视图模式切换

```typescript
const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

// 切换按钮
<div className="bg-muted inline-flex rounded-lg p-1">
  <Button onClick={() => setViewMode('table')}>表格</Button>
  <Button onClick={() => setViewMode('kanban')}>看板</Button>
</div>

// 条件渲染
{viewMode === 'table' ? (
  <ProductTemplatesTable ... />
) : (
  <ProductTemplatesKanban data={productTemplates} />
)}
```

### 2. 搜索和筛选

```typescript
// URL 参数同步
const search = route.useSearch() as {
  page?: number
  pageSize?: number
  name?: string
  code?: string
  type?: string[]
  active?: string[]
}

// 筛选转换
let backendType: 'product' | 'service' | 'consu' | undefined
if (typeFilter && typeFilter.length > 0) {
  backendType = typeFilter[0] as 'product' | 'service' | 'consu'
}
```

### 3. 模拟数据支持

```typescript
// 开发环境自动使用模拟数据
const useMockData = import.meta.env.DEV &&
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'

if (useMockData) {
  await new Promise((resolve) => setTimeout(resolve, 300)) // 模拟延迟
  const mockResponse = getMockProductTemplates({...})
  // 使用模拟数据
} else {
  // 调用真实 API
  const response = await productTemplateService.getProductTemplateList({...})
}
```

### 4. 类型安全

```typescript
// 使用类型断言处理自动生成的路由类型
// @ts-ignore - Route type will be generated by TanStack Router plugin
const route = getRouteApi('/product-templates/')

const search = route.useSearch() as {
  page?: number
  pageSize?: number
  // ...
}
```

## 开发最佳实践

### 1. 组件职责分离

- **主视图组件**: 数据获取、状态管理、视图切换
- **表格组件**: 表格展示、排序、筛选
- **看板组件**: 卡片展示、点击交互
- **对话框组件**: 表单处理、数据提交

### 2. 类型安全

- 使用 Zod 进行运行时类型验证
- 定义清晰的 TypeScript 接口
- 后端数据适配时进行类型转换

### 3. 用户体验

- 加载状态提示
- 错误处理
- 空状态展示
- 响应式设计

### 4. 代码复用

- Context Provider 管理共享状态
- 统一的对话框管理
- 可复用的操作按钮组件

### 5. 开发效率

- 模拟数据支持快速开发
- 环境变量控制功能开关
- 清晰的代码组织结构

## XML 到代码的映射关系

| XML 元素             | 前端实现                               | 说明       |
| -------------------- | -------------------------------------- | ---------- |
| `<form>`             | `product-templates-action-dialog.tsx`  | 表单对话框 |
| `<tree>`             | `product-templates-table.tsx`          | 表格视图   |
| `<kanban>`           | `product-templates-kanban.tsx`         | 看板视图   |
| `<search>`           | `product-templates-table.tsx` (工具栏) | 搜索和筛选 |
| `<field name="...">` | 表单字段 / 表格列                      | 字段映射   |
| `<filter>`           | `DataTableToolbar`                     | 筛选器     |
| `<order>`            | TanStack Table 排序                    | 排序功能   |

## 扩展建议

### 1. 表单视图增强

当前实现了基本的添加/编辑表单，可以扩展：

- 属性行管理（`attributeLineIds`）
- 产品变体管理（`productVariantIds`）
- 标签选择器（`tagIds`）
- 类别选择器（`categoryId`）

### 2. 搜索功能增强

- 高级搜索面板
- 保存搜索条件
- 搜索历史

### 3. 批量操作扩展

- 批量激活/停用
- 批量修改类别
- 批量导出

### 4. 数据导入导出

- Excel 导入
- CSV 导出
- 数据模板下载

## 总结

通过解析 XML 配置文件，我们成功创建了一个功能完整的产品模板管理页面，包括：

✅ 表格视图和看板视图切换
✅ 完整的 CRUD 操作
✅ 搜索、筛选、排序功能
✅ 批量操作支持
✅ 模拟数据支持
✅ 响应式设计
✅ 类型安全

该开发流程展示了如何将声明式配置转换为功能完整的 React 应用，为后续类似功能的开发提供了可复用的模式。
