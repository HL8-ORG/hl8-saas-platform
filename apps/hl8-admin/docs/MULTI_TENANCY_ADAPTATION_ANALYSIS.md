# 前端多租户适配性分析报告

## 概述

本文档分析了 `apps/hl8-admin` 前端应用与后端多租户能力的适配情况，并提供了详细的改造方案。

## 当前状态分析

### ✅ 已适配的部分

1. **API 客户端配置**
   - ✅ 使用 `axios` 进行 API 调用
   - ✅ 配置了请求/响应拦截器
   - ✅ 支持自动令牌刷新
   - ✅ 使用 `withCredentials: true` 支持 Cookie 传输

2. **认证流程**
   - ✅ 支持用户注册、登录、登出
   - ✅ 支持令牌刷新机制
   - ✅ 使用 HttpOnly Cookie 存储令牌（后端管理）

### ❌ 需要适配的部分

1. **租户ID传递**
   - ❌ 请求拦截器中未添加 `X-Tenant-Id` 请求头
   - ❌ 注册时未传递租户ID（可选，后端会使用默认租户）

2. **用户数据结构**
   - ❌ `AuthUser` 接口中缺少 `tenantId` 字段
   - ❌ 登录响应中未提取和存储 `tenantId`

3. **租户管理功能**
   - ❌ 缺少租户选择/切换功能
   - ❌ 缺少租户管理页面（创建、查询、更新租户）

4. **JWT 解析**
   - ❌ 未从 JWT payload 中提取 `tenantId`（如果后端返回）

## 适配方案

### 1. 更新用户数据结构

**文件**: `apps/hl8-admin/src/stores/auth-store.ts`

```typescript
export interface AuthUser extends SignInResponseData {
  id: string
  email: string
  username: string
  nickName?: string
  avatar?: string | null
  isEmailVerified: boolean
  emailVerifiedAt?: string
  createdAt: string
  updatedAt: string
  profile?: unknown
  // 新增：租户ID
  tenantId?: string
}
```

**文件**: `apps/hl8-admin/src/lib/services/auth.service.ts`

```typescript
export interface SignInResponseData {
  id: string
  email: string
  username: string
  nickName?: string
  avatar?: string | null
  isEmailVerified: boolean
  emailVerifiedAt?: string
  createdAt: string
  updatedAt: string
  profile?: unknown
  // 新增：租户ID
  tenantId?: string
}
```

### 2. 更新 API 客户端 - 添加租户ID支持

**文件**: `apps/hl8-admin/src/lib/api-client.ts`

在请求拦截器中添加租户ID：

```typescript
import { useAuthStore } from '@/stores/auth-store'

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从认证状态中获取租户ID
    const authState = useAuthStore.getState().auth
    const tenantId = authState.user?.tenantId

    // 如果存在租户ID，添加到请求头
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId
    }

    // 开发环境下输出请求信息以便调试
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        headers: config.headers,
        tenantId, // 显示租户ID
      })
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

### 3. 更新登录响应处理

**文件**: `apps/hl8-admin/src/lib/services/auth.service.ts`

在 `signIn` 方法中提取 `tenantId`：

```typescript
async signIn(data: SignInRequest): Promise<SignInResponse> {
  const response = await apiClient.post<{
    success: boolean
    data: {
      user: {
        id: string
        email: string
        fullName: string
        role: string
        isEmailVerified?: boolean
        tenantId?: string // 后端返回的租户ID
      }
      accessToken: string
      refreshToken: string
    }
    meta?: unknown
  }>(
    '/auth/login',
    {
      email: data.identifier,
      password: data.password,
    },
    {
      skipDataExtraction: true,
    }
  )

  const backendUser = response.data.data.user
  const userData: SignInResponseData = {
    id: backendUser.id,
    email: backendUser.email || '',
    username: backendUser.fullName || backendUser.email || '',
    nickName: backendUser.fullName || undefined,
    avatar: null,
    isEmailVerified: backendUser.isEmailVerified ?? false,
    tenantId: backendUser.tenantId, // 提取租户ID
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return {
    message: '登录成功',
    data: userData,
    tokens: {
      access_token: '',
      refresh_token: '',
      session_token: '',
      session_refresh_time: new Date().toISOString(),
    },
  }
}
```

### 4. 更新注册功能 - 支持租户ID传递（可选）

**文件**: `apps/hl8-admin/src/lib/services/auth.service.ts`

```typescript
export interface RegisterRequest {
  email: string
  password: string
  // 新增：可选的租户ID（如果不提供，后端会使用默认租户）
  tenantId?: string
}

async register(data: RegisterRequest): Promise<ApiResponse> {
  const response = await apiClient.post<ApiResponse>(
    '/auth/signup',
    {
      email: data.email,
      password: data.password,
      fullName: data.email,
    },
    {
      skipDataExtraction: true,
      // 如果提供了租户ID，通过请求头传递
      headers: data.tenantId
        ? { 'X-Tenant-Id': data.tenantId }
        : undefined,
    }
  )
  return response.data as ApiResponse
}
```

**文件**: `apps/hl8-admin/src/features/auth/sign-up/components/sign-up-form.tsx`

如果需要支持租户选择，可以添加租户选择器：

```typescript
// 可选：添加租户选择功能
const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>()

async function onSubmit(data: z.infer<typeof formSchema>) {
  setIsLoading(true)
  try {
    await authService.register({
      email: data.email,
      password: data.password,
      tenantId: selectedTenantId, // 传递选中的租户ID
    })
    // ...
  } catch (error) {
    handleServerError(error)
  } finally {
    setIsLoading(false)
  }
}
```

### 5. 创建租户管理服务

**新建文件**: `apps/hl8-admin/src/lib/services/tenant.service.ts`

```typescript
import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'

/**
 * 租户信息
 */
export interface Tenant {
  id: string
  name: string
  domain: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 创建租户请求
 */
export interface CreateTenantRequest {
  name: string
  domain?: string
  isActive?: boolean
}

/**
 * 更新租户请求
 */
export interface UpdateTenantRequest {
  name?: string
  domain?: string
  isActive?: boolean
}

/**
 * 租户列表响应
 */
export interface TenantListResponseData {
  tenants: Tenant[]
  total: number
}

/**
 * 租户服务
 * 提供租户相关的 API 调用
 */
export const tenantService = {
  /**
   * 获取所有租户
   */
  async getAllTenants(): Promise<ApiResponse<Tenant[]>> {
    const response = await apiClient.get<{
      success: boolean
      data: Tenant[]
      meta?: unknown
    }>('/tenants')
    return {
      message: '获取成功',
      data: response.data,
    } as ApiResponse<Tenant[]>
  },

  /**
   * 根据ID获取租户
   */
  async getTenantById(id: string): Promise<ApiResponse<Tenant>> {
    const response = await apiClient.get<{
      success: boolean
      data: Tenant
      meta?: unknown
    }>(`/tenants/${id}`)
    return {
      message: '获取成功',
      data: response.data,
    } as ApiResponse<Tenant>
  },

  /**
   * 创建租户
   */
  async createTenant(data: CreateTenantRequest): Promise<ApiResponse<Tenant>> {
    const response = await apiClient.post<{
      success: boolean
      data: Tenant
      meta?: unknown
    }>('/tenants', data)
    return {
      message: '创建成功',
      data: response.data,
    } as ApiResponse<Tenant>
  },

  /**
   * 更新租户
   */
  async updateTenant(
    id: string,
    data: UpdateTenantRequest
  ): Promise<ApiResponse<Tenant>> {
    const response = await apiClient.put<{
      success: boolean
      data: Tenant
      meta?: unknown
    }>(`/tenants/${id}`, data)
    return {
      message: '更新成功',
      data: response.data,
    } as ApiResponse<Tenant>
  },

  /**
   * 删除租户
   */
  async deleteTenant(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<{
      success: boolean
      data: null
      meta?: unknown
    }>(`/tenants/${id}`)
    return {
      message: '删除成功',
      data: null,
    } as ApiResponse<null>
  },
}
```

### 6. 创建租户选择组件（可选）

**新建文件**: `apps/hl8-admin/src/components/tenant-selector.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { tenantService } from '@/lib/services/tenant.service'
import type { Tenant } from '@/lib/services/tenant.service'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

/**
 * 租户选择器组件
 * 用于切换当前租户上下文
 */
export function TenantSelector() {
  const { user, setUser } = useAuthStore()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    try {
      setLoading(true)
      const response = await tenantService.getAllTenants()
      setTenants(response.data || [])
    } catch (error) {
      console.error('加载租户列表失败:', error)
      toast.error('加载租户列表失败')
    } finally {
      setLoading(false)
    }
  }

  function handleTenantChange(tenantId: string) {
    if (!user) return

    // 更新用户信息中的租户ID
    // 注意：切换租户后需要重新登录，因为JWT中包含租户ID
    toast.warning('切换租户需要重新登录')
    // 可以跳转到登录页，或者调用后端API切换租户
  }

  if (!user) return null

  const currentTenant = tenants.find((t) => t.id === user.tenantId)

  return (
    <Select
      value={user.tenantId || ''}
      onValueChange={handleTenantChange}
      disabled={loading}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="选择租户" />
      </SelectTrigger>
      <SelectContent>
        {tenants.map((tenant) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            {tenant.name} {tenant.domain && `(${tenant.domain})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### 7. 更新用户信息获取

**文件**: `apps/hl8-admin/src/lib/services/user.service.ts`

确保 `getUserInfo` 方法返回的数据包含 `tenantId`：

```typescript
export interface UserInfoResponseData {
  id: string
  email: string
  fullName: string
  role: string
  isEmailVerified: boolean
  tenantId?: string // 确保包含租户ID
  // ... 其他字段
}
```

## 实施优先级

### 高优先级（必须实现）

1. ✅ **更新用户数据结构** - 添加 `tenantId` 字段
2. ✅ **更新 API 客户端** - 在请求拦截器中添加 `X-Tenant-Id` 请求头
3. ✅ **更新登录响应处理** - 提取并存储 `tenantId`

### 中优先级（建议实现）

4. ⚠️ **创建租户管理服务** - 支持租户的 CRUD 操作
5. ⚠️ **更新注册功能** - 支持传递租户ID（可选）

### 低优先级（可选实现）

6. 💡 **租户选择组件** - 允许用户切换租户（需要后端支持）
7. 💡 **租户管理页面** - 完整的租户管理UI

## 注意事项

### 1. 租户切换限制

**重要**：由于 JWT 中包含 `tenantId`，切换租户需要重新登录。前端无法直接切换租户，因为：

- JWT 是后端签发的，包含租户ID
- 切换租户需要新的 JWT token
- 必须通过登录流程获取新 token

**解决方案**：

- 如果用户有多个租户的访问权限，后端可以提供"切换租户"API，返回新的 JWT
- 或者前端提供"切换租户"功能，自动跳转到登录页并预填充租户信息

### 2. 注册时的租户选择

注册时可以选择租户（通过 `X-Tenant-Id` 请求头），但通常：

- 新用户注册时不需要选择租户
- 后端会自动使用默认租户
- 只有管理员创建用户时才需要指定租户

### 3. 权限检查

前端不需要进行权限检查，因为：

- 权限检查由后端 `AuthZGuard` 完成
- 前端只需要确保传递正确的租户ID
- 如果权限不足，后端会返回 403 错误

## 测试清单

实施完成后，需要测试以下场景：

- [ ] 用户注册时，后端能正确获取租户ID（从请求头或使用默认租户）
- [ ] 用户登录后，前端能正确提取和存储 `tenantId`
- [ ] 所有 API 请求都自动携带 `X-Tenant-Id` 请求头
- [ ] 切换用户后，租户ID正确更新
- [ ] 租户管理功能正常工作（如果实现）

## 相关文档

- [后端多租户开发指南](../../fastify-api/docs/MULTI_TENANCY_DEVELOPMENT_GUIDE.md)
- [后端多租户技术方案](../../fastify-api/docs/MULTI_TENANCY_TECHNICAL_PLAN.md)

## 总结

前端需要的主要改动：

1. **数据结构更新**：在用户数据中添加 `tenantId` 字段
2. **API 客户端更新**：在请求拦截器中自动添加 `X-Tenant-Id` 请求头
3. **登录流程更新**：提取并存储 `tenantId`
4. **租户管理功能**：创建租户管理服务和UI（可选）

这些改动相对简单，主要是数据传递和存储的调整，不会影响现有的业务逻辑。
