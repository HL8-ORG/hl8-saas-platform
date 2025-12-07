# apps/admin-api 架构重构评估报告

## 执行摘要

本报告评估了将 `apps/admin-api` 从当前的传统 NestJS 分层架构重构为 **DDD（领域驱动设计）+ Clean Architecture（整洁架构）+ CQRS（命令查询职责分离）+ EDA（事件驱动架构）** 混合架构的可行性、风险和收益。

**核心结论**：

- ✅ **技术可行性**：高。目标架构与现有技术栈（NestJS + TypeScript + PostgreSQL）兼容
- ⚠️ **实施复杂度**：中高。需要重构核心业务逻辑，但可以渐进式迁移
- ✅ **长期收益**：高。显著提升代码可维护性、可测试性和可扩展性
- ⚠️ **短期成本**：中。需要 2-3 个月的重构周期和团队学习成本

**建议**：采用渐进式重构策略，优先重构核心业务领域（认证、用户、角色），逐步扩展到其他模块。

---

## 1. 当前架构分析

### 1.1 架构概览

当前 `apps/fastify-api` 和 `apps/admin-api` 采用传统的 **三层架构**：

```
┌─────────────────────────────────────────┐
│         Controller Layer                │
│  (HTTP 请求处理、参数验证、响应格式化)    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  (业务逻辑、数据验证、事务管理)          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Repository/Entity Layer            │
│  (数据访问、ORM 映射、数据库操作)         │
└─────────────────────────────────────────┘
```

### 1.2 目录结构分析

```
apps/fastify-api/src/
├── modules/              # 功能模块（按功能划分）
│   ├── auth/            # 认证模块
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── dtos/
│   ├── users/           # 用户模块
│   ├── roles/           # 角色模块
│   └── ...
├── entities/            # 数据库实体（TypeORM）
├── common/              # 公共组件（守卫、拦截器、中间件）
└── config/              # 配置管理
```

### 1.3 架构特点

**优点**：

- ✅ 结构清晰，易于理解
- ✅ NestJS 框架支持良好
- ✅ 快速开发，适合中小型项目
- ✅ 多租户支持已实现（通过中间件和租户上下文）

**局限性**：

- ❌ **业务逻辑与基础设施耦合**：Service 层直接依赖 TypeORM Repository，难以替换数据访问层
- ❌ **缺乏领域模型**：实体（Entity）仅作为数据模型，不包含业务逻辑
- ❌ **命令查询未分离**：同一 Service 方法既处理写操作又处理读操作
- ❌ **缺乏事件机制**：业务操作之间缺乏解耦，难以实现异步处理和跨模块协作
- ❌ **测试困难**：Service 层依赖数据库，单元测试需要 Mock 大量依赖
- ❌ **扩展性受限**：新增功能需要修改多个 Service，容易产生代码重复

### 1.4 具体问题示例

#### 问题 1：业务逻辑分散

**示例**：`AuthService.signup()` 方法（786 行）

```typescript
async signup(signupDto: SignupDto, req?: FastifyRequest) {
  // 1. 租户解析逻辑（基础设施关注点）
  const tenantId = await this.resolveTenantId(req);

  // 2. 业务验证（领域逻辑）
  const existingUser = await this.userRepository.findOne({...});
  if (existingUser) throw new ConflictException(...);

  // 3. 密码哈希（领域逻辑）
  const hashedPassword = await this.hashData(password);

  // 4. 实体创建（数据模型操作）
  const newUser = this.userRepository.create({...});

  // 5. 验证码生成（领域逻辑）
  const verificationCode = Math.floor(...).toString();

  // 6. 邮件发送（基础设施关注点）
  await this.mailService.sendEmail({...});

  // 7. 数据持久化（基础设施关注点）
  await this.userRepository.save(newUser);
}
```

**问题**：

- 业务逻辑、基础设施关注点、数据访问混合在一起
- 难以单独测试业务逻辑
- 邮件发送失败时的错误处理逻辑复杂

#### 问题 2：缺乏领域事件

**场景**：用户注册后需要：

1. 发送验证邮件
2. 记录审计日志
3. 触发欢迎流程
4. 更新统计信息

**当前实现**：所有逻辑都在 `signup()` 方法中同步执行，导致：

- 方法职责过重
- 难以扩展（新增步骤需要修改核心方法）
- 错误处理复杂（邮件失败是否回滚？）

#### 问题 3：命令查询未分离

**示例**：`UsersService.getAllUsers()` 和 `UsersService.updateUserById()`

```typescript
// 查询操作（读）
async getAllUsers(page: number, limit: number) {
  // 直接查询数据库，返回 DTO
}

// 命令操作（写）
async updateUserById(userId: string, updateUserDto: UpdateUserDto) {
  // 更新数据库，返回更新后的实体
}
```

**问题**：

- 读操作和写操作使用相同的数据模型
- 无法针对读操作优化（如使用只读副本、缓存策略）
- 写操作的副作用（如发送事件）可能影响读性能

#### 问题 4：贫血模型（Anemic Domain Model）

**当前实现**：实体只是数据容器，业务逻辑在服务层

```typescript
// ❌ 贫血模型 - 实体只有数据，没有行为
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  isEmailVerified: boolean;

  @Column()
  isActive: boolean;
  // 只有属性，没有业务方法
}

// 业务逻辑在服务层（错误）
@Injectable()
export class AuthService {
  async verifyEmail(user: User, code: string) {
    // 业务规则在服务层（错误）
    if (user.isEmailVerified) {
      throw new ConflictException('Email already verified');
    }
    // 直接修改属性（错误）
    user.isEmailVerified = true;
    await this.userRepository.save(user);
  }
}
```

**问题**：

- ❌ **业务逻辑分散**：业务规则分散在多个服务方法中，难以维护
- ❌ **缺乏封装**：实体属性可以直接修改，违反业务不变量
- ❌ **难以测试**：测试业务逻辑需要 Mock 数据库和服务依赖
- ❌ **代码重复**：相同的业务规则在多个服务中重复实现
- ❌ **违反 DDD 原则**：实体应该是"活"的对象，包含数据和行为

**示例**：验证邮箱的业务规则在多个地方重复

```typescript
// AuthService.verifyEmail()
if (user.isEmailVerified) {
  throw new ConflictException('Email already verified');
}

// AuthService.resendVerification()
if (user.isEmailVerified) {
  throw new ConflictException('Email already verified');
}

// UsersService.updateUser()
if (!user.isEmailVerified) {
  throw new ForbiddenException('Email not verified');
}
// 业务规则重复，难以维护
```

---

## 2. 目标架构设计

### 2.1 架构层次（Clean Architecture）

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│  (Controllers, DTOs, HTTP 适配器)                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  (Use Cases - 用例是核心, Commands/Queries 是实现细节)   │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Use Cases   │  │ Commands/    │                    │
│  │  (用例)      │  │ Queries      │                    │
│  │              │  │ (CQRS实现)  │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Domain Layer                         │
│  (Entities, Value Objects, Domain Services, Events)      │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Aggregates  │  │   Events     │                    │
│  │  (聚合根)    │  │  (领域事件)  │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                Infrastructure Layer                     │
│  (Repositories, Event Bus, External Services)           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 目录结构设计

```
apps/admin-api/src/
├── presentation/                    # 表现层
│   ├── controllers/
│   │   ├── auth/
│   │   │   └── auth.controller.ts
│   │   └── users/
│   ├── dtos/
│   │   ├── commands/                # 命令 DTO
│   │   └── queries/                 # 查询 DTO
│   └── mappers/                     # DTO ↔ Domain 映射
│
├── application/                     # 应用层（用例层）
│   ├── auth/                        # 认证用例
│   │   ├── use-cases/              # 用例实现
│   │   │   ├── signup.use-case.ts  # 用户注册用例
│   │   │   ├── login.use-case.ts   # 用户登录用例
│   │   │   ├── refresh-token.use-case.ts
│   │   │   └── verify-email.use-case.ts
│   │   ├── commands/               # 命令（CQRS 实现细节）
│   │   │   │   ├── signup.command.ts
│   │   │   │   └── login.command.ts
│   │   ├── queries/                # 查询（CQRS 实现细节）
│   │   │   └── get-me.query.ts
│   │   └── dtos/                   # 用例输入/输出 DTO
│   │       ├── signup.input.dto.ts
│   │       └── signup.output.dto.ts
│   ├── users/                      # 用户用例
│   │   ├── use-cases/
│   │   │   ├── get-users.use-case.ts
│   │   │   ├── get-user-by-id.use-case.ts
│   │   │   ├── update-user.use-case.ts
│   │   │   └── delete-user.use-case.ts
│   │   ├── commands/
│   │   ├── queries/
│   │   └── dtos/
│   ├── roles/                      # 角色用例
│   │   └── use-cases/
│   └── shared/                     # 共享应用层组件
│       ├── interfaces/            # 用例接口定义
│       │   └── use-case.interface.ts
│       └── events/                # 应用层事件处理
│           └── handlers/
│
├── domain/                          # 领域层
│   ├── auth/                        # 认证领域
│   │   ├── entities/
│   │   │   └── user.aggregate.ts   # 用户聚合根
│   │   ├── value-objects/
│   │   │   ├── email.vo.ts
│   │   │   └── password.vo.ts
│   │   ├── services/
│   │   │   └── password-hasher.service.ts
│   │   ├── events/
│   │   │   ├── user-registered.event.ts
│   │   │   └── email-verified.event.ts
│   │   └── repositories/
│   │       └── user.repository.interface.ts
│   ├── users/                       # 用户领域
│   ├── roles/                       # 角色领域
│   └── shared/                      # 共享领域
│       ├── events/
│       │   └── domain-event.base.ts
│       └── value-objects/
│
└── infrastructure/                  # 基础设施层
    ├── persistence/
    │   ├── typeorm/
    │   │   ├── repositories/
    │   │   │   └── user.repository.ts
    │   │   └── entities/
    │   │       └── user.entity.ts   # 仅用于 ORM 映射
    │   └── mappers/
    │       └── user.mapper.ts       # Domain ↔ ORM 映射
    ├── events/
    │   ├── event-bus.ts             # 事件总线实现
    │   └── handlers/                # 基础设施层事件处理
    │       └── email-handler.ts
    └── external/
        └── mail/
```

### 2.3 核心概念

#### 2.3.1 领域驱动设计（DDD）

**核心原则：充血模型（Rich Domain Model）**

领域层实体必须遵循**充血模型**开发，而非贫血模型：

| 特征         | 充血模型（Rich Domain Model）✅ | 贫血模型（Anemic Domain Model）❌ |
| ------------ | ------------------------------- | --------------------------------- |
| 业务逻辑位置 | 实体内部                        | 服务层                            |
| 实体职责     | 包含数据和业务行为              | 仅包含数据（Getter/Setter）       |
| 业务规则     | 封装在实体方法中                | 分散在服务层                      |
| 可测试性     | 高（业务逻辑独立）              | 低（需要 Mock 依赖）              |
| 可维护性     | 高（业务规则内聚）              | 低（业务规则分散）                |

**设计原则**：

- ✅ **业务逻辑在实体内部**：所有业务规则、验证、状态转换都应在聚合根或实体方法中
- ✅ **实体是"活"的对象**：实体不仅存储数据，还包含操作数据的行为
- ✅ **避免 Getter/Setter 滥用**：使用有意义的业务方法替代简单的属性访问
- ❌ **禁止贫血模型**：实体不应只是数据容器，业务逻辑不应放在服务层

**聚合根（Aggregate Root）- 充血模型示例**

```typescript
// domain/auth/entities/user.aggregate.ts
/**
 * 用户聚合根 - 充血模型示例
 *
 * 特点：
 * 1. 业务逻辑封装在实体内部（而非服务层）
 * 2. 使用有意义的业务方法（而非 Getter/Setter）
 * 3. 维护业务不变量（Invariants）
 * 4. 发布领域事件
 */
export class UserAggregate {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private passwordHash: PasswordHash,
    private fullName: string,
    private tenantId: TenantId,
    private isEmailVerified: boolean,
    private isActive: boolean,
    private emailVerificationCode: VerificationCode | null,
    private emailVerificationExpiresAt: Date | null,
    private domainEvents: DomainEvent[] = [],
  ) {}

  // ========== 工厂方法 ==========

  /**
   * 创建新用户（业务逻辑在实体内部）
   */
  static create(props: CreateUserProps): UserAggregate {
    // 业务规则：验证输入
    const email = Email.create(props.email);
    const passwordHash = PasswordHash.hash(props.password);
    const tenantId = TenantId.create(props.tenantId);

    // 生成验证码（业务逻辑）
    const verificationCode = VerificationCode.generate();
    const expiresAt = VerificationCode.calculateExpiry();

    const user = new UserAggregate(
      UserId.generate(),
      email,
      passwordHash,
      props.fullName,
      tenantId,
      false, // 新用户默认未验证
      true, // 新用户默认激活
      verificationCode,
      expiresAt,
    );

    // 发布领域事件（业务行为）
    user.addDomainEvent(
      new UserRegisteredEvent(
        user.id.getValue(),
        user.email.getValue(),
        user.tenantId.getValue(),
        verificationCode.getValue(),
      ),
    );

    return user;
  }

  // ========== 业务方法（充血模型核心） ==========

  /**
   * 验证邮箱（业务逻辑在实体内部）
   */
  verifyEmail(code: string): void {
    // 业务规则：已验证的用户不能再次验证
    if (this.isEmailVerified) {
      throw new EmailAlreadyVerifiedError();
    }

    // 业务规则：验证码必须存在且未过期
    if (!this.emailVerificationCode || !this.emailVerificationExpiresAt) {
      throw new VerificationCodeNotFoundError();
    }

    if (this.emailVerificationExpiresAt < new Date()) {
      throw new VerificationCodeExpiredError();
    }

    // 业务规则：验证码必须匹配
    if (!this.emailVerificationCode.matches(code)) {
      throw new InvalidVerificationCodeError();
    }

    // 状态转换（业务行为）
    this.isEmailVerified = true;
    this.emailVerificationCode = null;
    this.emailVerificationExpiresAt = null;

    // 发布领域事件
    this.addDomainEvent(
      new EmailVerifiedEvent(this.id.getValue(), this.email.getValue()),
    );
  }

  /**
   * 重新发送验证码（业务逻辑在实体内部）
   */
  resendVerificationCode(): void {
    // 业务规则：已验证的用户不需要验证码
    if (this.isEmailVerified) {
      throw new EmailAlreadyVerifiedError();
    }

    // 业务规则：生成新的验证码
    this.emailVerificationCode = VerificationCode.generate();
    this.emailVerificationExpiresAt = VerificationCode.calculateExpiry();

    // 发布领域事件
    this.addDomainEvent(
      new VerificationCodeResentEvent(
        this.id.getValue(),
        this.email.getValue(),
        this.emailVerificationCode.getValue(),
      ),
    );
  }

  /**
   * 更新密码（业务逻辑在实体内部）
   */
  changePassword(oldPassword: string, newPassword: string): void {
    // 业务规则：验证旧密码
    if (!this.passwordHash.matches(oldPassword)) {
      throw new InvalidPasswordError();
    }

    // 业务规则：新密码不能与旧密码相同
    if (this.passwordHash.matches(newPassword)) {
      throw new PasswordUnchangedError();
    }

    // 状态转换（业务行为）
    this.passwordHash = PasswordHash.hash(newPassword);

    // 发布领域事件
    this.addDomainEvent(new PasswordChangedEvent(this.id.getValue()));
  }

  /**
   * 停用用户（业务逻辑在实体内部）
   */
  deactivate(): void {
    // 业务规则：已停用的用户不能再次停用
    if (!this.isActive) {
      throw new UserAlreadyInactiveError();
    }

    // 状态转换（业务行为）
    this.isActive = false;

    // 发布领域事件
    this.addDomainEvent(
      new UserDeactivatedEvent(this.id.getValue(), this.email.getValue()),
    );
  }

  /**
   * 激活用户（业务逻辑在实体内部）
   */
  activate(): void {
    // 业务规则：已激活的用户不能再次激活
    if (this.isActive) {
      throw new UserAlreadyActiveError();
    }

    // 状态转换（业务行为）
    this.isActive = true;

    // 发布领域事件
    this.addDomainEvent(
      new UserActivatedEvent(this.id.getValue(), this.email.getValue()),
    );
  }

  /**
   * 更新个人信息（业务逻辑在实体内部）
   */
  updateProfile(fullName: string): void {
    // 业务规则：验证输入
    if (!fullName || fullName.trim().length === 0) {
      throw new InvalidFullNameError();
    }

    if (fullName.length > 100) {
      throw new FullNameTooLongError();
    }

    // 状态转换（业务行为）
    this.fullName = fullName.trim();

    // 发布领域事件
    this.addDomainEvent(
      new ProfileUpdatedEvent(this.id.getValue(), this.fullName),
    );
  }

  // ========== 查询方法（只读访问） ==========

  getId(): UserId {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getFullName(): string {
    return this.fullName;
  }

  getTenantId(): TenantId {
    return this.tenantId;
  }

  isEmailVerified(): boolean {
    return this.isEmailVerified;
  }

  isActive(): boolean {
    return this.isActive;
  }

  getVerificationCode(): VerificationCode | null {
    return this.emailVerificationCode;
  }

  // ========== 领域事件管理 ==========

  getUncommittedEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  markEventsAsCommitted(): void {
    this.domainEvents = [];
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
}
```

**充血模型 vs 贫血模型对比**：

```typescript
// ❌ 贫血模型（错误示例）- 业务逻辑在服务层
class UserEntity {
  public id: string;
  public email: string;
  public isEmailVerified: boolean;
  // 只有数据，没有行为
}

class UserService {
  verifyEmail(user: UserEntity, code: string) {
    // 业务逻辑在服务层（错误）
    if (user.isEmailVerified) {
      throw new Error('Already verified');
    }
    user.isEmailVerified = true; // 直接修改属性
  }
}

// ✅ 充血模型（正确示例）- 业务逻辑在实体内部
class UserAggregate {
  private isEmailVerified: boolean;

  verifyEmail(code: string): void {
    // 业务逻辑在实体内部（正确）
    if (this.isEmailVerified) {
      throw new EmailAlreadyVerifiedError();
    }
    // 验证逻辑...
    this.isEmailVerified = true; // 通过业务方法修改状态
    this.addDomainEvent(new EmailVerifiedEvent(...));
  }
}
```

**值对象（Value Object）- 充血模型示例**

值对象同样遵循充血模型，包含验证逻辑和业务行为：

```typescript
// domain/auth/value-objects/email.vo.ts
/**
 * 邮箱值对象 - 充血模型
 *
 * 特点：
 * 1. 不可变（Immutable）
 * 2. 自验证（Self-validating）
 * 3. 包含业务逻辑（如域名验证、格式验证）
 */
export class Email {
  private constructor(private readonly value: string) {
    // 业务规则：创建时自动验证
    if (!this.isValid(value)) {
      throw new InvalidEmailError(value);
    }
  }

  static create(value: string): Email {
    return new Email(value);
  }

  getValue(): string {
    return this.value;
  }

  /**
   * 业务方法：检查是否为特定域名
   */
  isFromDomain(domain: string): boolean {
    return this.value.toLowerCase().endsWith(`@${domain.toLowerCase()}`);
  }

  /**
   * 业务方法：获取域名部分
   */
  getDomain(): string {
    const parts = this.value.split('@');
    return parts.length === 2 ? parts[1] : '';
  }

  /**
   * 业务方法：获取用户名部分
   */
  getLocalPart(): string {
    const parts = this.value.split('@');
    return parts.length === 2 ? parts[0] : '';
  }

  /**
   * 业务方法：验证邮箱格式（业务逻辑在值对象内部）
   */
  private isValid(email: string): boolean {
    if (!email || email.trim().length === 0) {
      return false;
    }

    // RFC 5322 简化验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // 业务规则：长度限制
    if (email.length > 100) {
      return false;
    }

    // 业务规则：不允许某些特殊字符
    const forbiddenChars = /[<>{}[\]\\]/;
    if (forbiddenChars.test(email)) {
      return false;
    }

    return true;
  }

  /**
   * 值对象相等性比较（业务逻辑）
   */
  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}

// domain/auth/value-objects/password-hash.vo.ts
/**
 * 密码哈希值对象 - 充血模型
 */
export class PasswordHash {
  private constructor(private readonly value: string) {}

  static hash(plainPassword: string): PasswordHash {
    // 业务规则：密码强度验证
    if (!this.isStrong(plainPassword)) {
      throw new WeakPasswordError();
    }

    // 业务逻辑：哈希密码
    const hashed = bcrypt.hashSync(plainPassword, 12);
    return new PasswordHash(hashed);
  }

  /**
   * 业务方法：验证密码（业务逻辑在值对象内部）
   */
  matches(plainPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, this.value);
  }

  getValue(): string {
    return this.value;
  }

  /**
   * 业务规则：密码强度验证（业务逻辑）
   */
  private static isStrong(password: string): boolean {
    // 至少 8 位
    if (password.length < 8) {
      return false;
    }

    // 至少包含一个大写字母
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // 至少包含一个小写字母
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // 至少包含一个数字
    if (!/[0-9]/.test(password)) {
      return false;
    }

    return true;
  }
}
```

#### 2.3.2 应用层用例（Use Cases）

**设计原则**：

- **用例（Use Case）是应用层的核心**：每个用例代表一个完整的业务操作，是应用层的主要组织单位
- **CQRS 是实现细节**：命令（Command）和查询（Query）可以作为用例的实现方式，但不是必需的
- **简单场景**：可以直接实现用例接口，无需引入 CQRS
- **复杂场景**：可以使用 CQRS 模式，将用例拆分为命令处理器和查询处理器

**用例接口定义**

```typescript
// application/shared/interfaces/use-case.interface.ts
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}
```

**命令用例（写操作）**

```typescript
// application/auth/use-cases/signup.use-case.ts
export class SignupUseCase implements UseCase<SignupInput, SignupOutput> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly tenantResolver: ITenantResolver,
  ) {}

  async execute(input: SignupInput): Promise<SignupOutput> {
    // 1. 解析租户
    const tenantId = await this.tenantResolver.resolve(input.tenantId);

    // 2. 检查用户是否存在
    const existingUser = await this.userRepository.findByEmail(
      input.email,
      tenantId,
    );
    if (existingUser) {
      throw new UserAlreadyExistsError(input.email);
    }

    // 3. 创建聚合根（包含业务逻辑）
    const user = UserAggregate.create({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      tenantId: tenantId.getValue(),
    });

    // 4. 持久化
    await this.userRepository.save(user);

    // 5. 发布领域事件
    const events = user.getUncommittedEvents();
    await this.eventBus.publishAll(events);
    user.markEventsAsCommitted();

    return {
      userId: user.getId(),
      email: user.getEmail().getValue(),
    };
  }
}

// application/auth/dtos/signup.input.dto.ts
export class SignupInput {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly fullName: string,
    public readonly tenantId?: string,
  ) {}
}

// application/auth/dtos/signup.output.dto.ts
export class SignupOutput {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
```

**查询用例（读操作）**

```typescript
// application/users/use-cases/get-users.use-case.ts
export class GetUsersUseCase implements UseCase<GetUsersInput, GetUsersOutput> {
  constructor(
    private readonly userReadRepository: IUserReadRepository, // 只读仓库
  ) {}

  async execute(input: GetUsersInput): Promise<GetUsersOutput> {
    // 使用优化的只读查询（可能使用缓存、只读副本等）
    return await this.userReadRepository.findPaginated(
      input.tenantId,
      input.page,
      input.limit,
    );
  }
}

// application/users/dtos/get-users.input.dto.ts
export class GetUsersInput {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly tenantId: string,
  ) {}
}
```

**说明**：

- **用例（Use Case）**是应用层的核心，代表一个完整的业务操作
- **CQRS 的命令/查询**可以作为用例的实现方式，但不是必需的
- 用例接口统一了输入/输出，便于测试和替换实现
- 可以根据需要选择使用 CQRS 模式（复杂场景）或直接实现用例（简单场景）

#### 2.3.3 事件驱动架构（EDA）

**领域事件**

```typescript
// domain/auth/events/user-registered.event.ts
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    super();
  }
}
```

**事件处理器**

```typescript
// infrastructure/events/handlers/email-handler.ts
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredEmailHandler implements IEventHandler<UserRegisteredEvent> {
  constructor(private readonly mailService: MailService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // 发送验证邮件（异步，不阻塞主流程）
    await this.mailService.sendVerificationEmail({
      userId: event.userId,
      email: event.email,
    });
  }
}

// infrastructure/events/handlers/audit-handler.ts
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredAuditHandler implements IEventHandler<UserRegisteredEvent> {
  constructor(private readonly auditService: AuditService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // 记录审计日志
    await this.auditService.log({
      action: 'USER_REGISTERED',
      userId: event.userId,
      tenantId: event.tenantId,
      timestamp: event.occurredOn,
    });
  }
}
```

---

## 3. 架构问题解决分析

### 3.1 当前问题 vs 目标架构解决方案

| 当前问题                            | 目标架构解决方案                  | 收益                                         |
| ----------------------------------- | --------------------------------- | -------------------------------------------- |
| 业务逻辑与基础设施耦合              | Clean Architecture 分层，依赖倒置 | 业务逻辑可独立测试，易于替换基础设施         |
| **贫血模型（Anemic Domain Model）** | **充血模型（Rich Domain Model）** | **业务规则内聚在实体内部，易于理解和维护**   |
| 缺乏领域模型                        | DDD 聚合根和值对象                | 业务规则内聚，代码更易理解                   |
| 业务逻辑分散在服务层                | 业务逻辑封装在领域实体内部        | 业务规则集中管理，减少重复代码               |
| 命令查询未分离                      | CQRS 分离读写模型                 | 读操作可优化（缓存、只读副本），写操作可扩展 |
| 缺乏事件机制                        | EDA 领域事件                      | 模块解耦，支持异步处理，易于扩展             |
| 测试困难                            | 依赖注入 + 接口抽象               | 单元测试无需 Mock 数据库                     |
| 扩展性受限                          | 事件驱动 + 插件化架构             | 新增功能通过事件处理器扩展，无需修改核心代码 |

### 3.2 具体改进示例

#### 改进 1：用户注册流程重构

**重构前**（`AuthService.signup()`）：

- 786 行代码，职责混杂
- 同步执行所有操作
- 难以测试和扩展

**重构后**：

```typescript
// 1. 控制器（表现层）- 调用用例
@Controller('auth')
export class AuthController {
  constructor(private readonly signupUseCase: SignupUseCase) {}

  @Post('/signup')
  async signup(@Body() dto: SignupDto) {
    const input = new SignupInput(
      dto.email,
      dto.password,
      dto.fullName,
      dto.tenantId,
    );
    const output = await this.signupUseCase.execute(input);
    return output;
  }
}

// 2. 用例（应用层）- 协调领域对象和基础设施
export class SignupUseCase implements UseCase<SignupInput, SignupOutput> {
  async execute(input: SignupInput) {
    const user = UserAggregate.create({...});  // 领域逻辑
    await this.userRepository.save(user);      // 持久化
    await this.eventBus.publishAll(user.getUncommittedEvents()); // 发布事件
    return new SignupOutput(user.getId(), user.getEmail().getValue());
  }
}

// 3. 领域聚合（领域层）- 包含业务规则
class UserAggregate {
  static create(props) {
    // 业务规则验证
    // 生成验证码
    // 发布 UserRegisteredEvent
  }
}

// 4. 事件处理器（基础设施层）- 处理副作用
@EventsHandler(UserRegisteredEvent)
class EmailHandler {
  async handle(event) {
    // 发送邮件（异步，失败不影响主流程）
  }
}
```

**收益**：

- ✅ **职责清晰**：表现层（控制器）→ 应用层（用例）→ 领域层（聚合）→ 基础设施层（仓储、事件）
- ✅ **易于测试**：可单独测试用例和聚合根的业务逻辑，无需 Mock 数据库
- ✅ **易于扩展**：新增步骤只需添加事件处理器，无需修改用例
- ✅ **容错性**：邮件发送失败不影响用户注册（事件异步处理）
- ✅ **符合 Clean Architecture**：用例是应用层的核心，依赖倒置原则确保业务逻辑独立

---

## 4. 迁移可行性分析

### 4.1 技术栈兼容性

| 技术组件   | 当前使用 | 目标架构支持                       | 兼容性 |
| ---------- | -------- | ---------------------------------- | ------ |
| NestJS     | ✅       | ✅ 完全支持（CQRS 模块、事件总线） | ✅ 高  |
| TypeScript | ✅       | ✅ 完全支持（类型系统优势）        | ✅ 高  |
| TypeORM    | ✅       | ✅ 可作为基础设施层实现            | ✅ 高  |
| PostgreSQL | ✅       | ✅ 支持读写分离、事件存储          | ✅ 高  |
| Redis      | ✅       | ✅ 事件总线、缓存                  | ✅ 高  |
| Fastify    | ✅       | ✅ 表现层适配器                    | ✅ 高  |

**结论**：✅ **完全兼容**，无需更换技术栈。

### 4.2 迁移策略

#### 策略 1：渐进式重构（推荐）

**阶段 1：基础设施准备**（1-2 周）

- 搭建 Clean Architecture 目录结构
- 实现事件总线基础设施
- 实现 CQRS 基础框架（可使用 `@nestjs/cqrs`）

**阶段 2：核心领域重构**（3-4 周）

- 重构认证领域（Auth）
  - 用户注册、登录、令牌刷新
- 重构用户领域（Users）
  - 用户查询、更新、删除

**阶段 3：扩展领域重构**（2-3 周）

- 重构角色领域（Roles）
- 重构权限领域（Permissions）
- 重构租户领域（Tenants）

**阶段 4：优化和测试**（1-2 周）

- 性能优化（查询优化、缓存策略）
- 完善测试覆盖
- 文档更新

**总周期**：7-11 周（约 2-3 个月）

#### 策略 2：并行开发（高风险）

- 新建 `apps/admin-api-v2`，完全重构
- 两套系统并行运行
- 逐步迁移流量

**不推荐原因**：

- 维护成本高
- 数据同步复杂
- 资源浪费

### 4.3 风险评估

| 风险项       | 风险等级 | 影响             | 缓解措施                       |
| ------------ | -------- | ---------------- | ------------------------------ |
| 团队学习曲线 | 🟡 中    | 开发速度暂时下降 | 提供培训、代码审查、渐进式迁移 |
| 重构周期长   | 🟡 中    | 新功能开发延迟   | 分阶段重构，保持功能迭代       |
| 性能下降     | 🟢 低    | 响应时间增加     | 优化查询、使用缓存、读写分离   |
| 数据迁移     | 🟢 低    | 数据一致性       | 使用事务、事件溯源（可选）     |
| 测试覆盖不足 | 🟡 中    | 回归问题         | 重构同时补充测试               |

---

## 5. 技术选型建议

### 5.1 CQRS 框架

**选项 1：@nestjs/cqrs**（推荐）

- ✅ 官方支持，与 NestJS 深度集成
- ✅ 类型安全，支持 TypeScript
- ✅ 文档完善，社区活跃
- ⚠️ 功能相对基础，需要自行扩展

**选项 2：自研轻量级框架**

- ✅ 完全可控，按需定制
- ⚠️ 开发成本高，需要充分测试

**建议**：使用 `@nestjs/cqrs`，在此基础上扩展事件总线功能。

### 5.2 事件总线

**选项 1：@nestjs/cqrs EventBus**

- ✅ 与 CQRS 集成良好
- ✅ 支持同步和异步事件
- ⚠️ 功能相对简单

**选项 2：Redis Pub/Sub**

- ✅ 支持分布式事件
- ✅ 高可用、高性能
- ⚠️ 需要额外基础设施

**选项 3：RabbitMQ / Kafka**

- ✅ 企业级消息队列
- ✅ 支持复杂路由、持久化
- ⚠️ 复杂度高，可能过度设计

**建议**：初期使用 `@nestjs/cqrs EventBus`，后续如需分布式事件再迁移到 Redis Pub/Sub。

### 5.3 依赖注入

**使用 NestJS 内置 DI 容器**

- ✅ 无需额外框架
- ✅ 类型安全
- ✅ 支持作用域管理

### 5.4 数据访问层

**Repository 模式 + TypeORM**

- ✅ 抽象数据访问
- ✅ 支持领域模型与 ORM 实体分离
- ✅ 易于测试（可 Mock Repository 接口）

---

## 6. 实施建议

### 6.1 重构优先级

**P0（核心领域，优先重构）**：

1. ✅ **认证领域（Auth）**
   - 用户注册、登录、令牌管理
   - 影响范围：所有用户操作
   - 业务价值：高

2. ✅ **用户领域（Users）**
   - 用户查询、更新、删除
   - 影响范围：用户管理功能
   - 业务价值：高

**P1（重要领域，第二阶段）**：3. ⚠️ **角色领域（Roles）**

- 角色管理、权限分配
- 影响范围：权限系统
- 业务价值：中高

4. ⚠️ **权限领域（Permissions）**
   - 权限查询、验证
   - 影响范围：授权系统
   - 业务价值：中高

**P2（支撑领域，第三阶段）**：5. ℹ️ **租户领域（Tenants）**

- 租户管理
- 影响范围：多租户功能
- 业务价值：中

### 6.2 代码迁移检查清单

**领域层**（必须遵循充血模型）：

- [ ] 定义聚合根（Aggregate Root）
  - [ ] **业务逻辑在实体内部**（非服务层）
  - [ ] 使用有意义的业务方法（非 Getter/Setter）
  - [ ] 维护业务不变量（Invariants）
  - [ ] 封装状态转换逻辑
- [ ] 定义值对象（Value Object）
  - [ ] **自验证逻辑在值对象内部**
  - [ ] 不可变（Immutable）
  - [ ] 包含业务方法（如验证、转换）
- [ ] 定义领域事件（Domain Event）
- [ ] 定义仓储接口（Repository Interface）
- [ ] 实现领域服务（Domain Service，仅用于跨聚合的业务逻辑）
- [ ] **禁止贫血模型**：实体不应只是数据容器

**应用层**：

- [ ] 识别用例（Use Cases）- 每个业务操作对应一个用例
- [ ] 定义用例接口（UseCase<Input, Output>）
- [ ] 实现用例（Use Case Implementation）
  - [ ] 命令用例（写操作，如注册、更新）
  - [ ] 查询用例（读操作，如查询列表、详情）
- [ ] 定义用例输入/输出 DTO
- [ ] （可选）使用 CQRS 模式实现复杂用例
  - [ ] 定义命令（Command）和命令处理器（Command Handler）
  - [ ] 定义查询（Query）和查询处理器（Query Handler）
- [ ] 实现应用层事件处理器（Event Handler，如需要）

**基础设施层**：

- [ ] 实现仓储（Repository Implementation）
- [ ] 实现 ORM 实体映射（Entity Mapping）
- [ ] 实现事件总线（Event Bus）
- [ ] 实现外部服务适配器（如邮件服务）

**表现层**：

- [ ] 重构控制器（Controller）- 注入并调用用例
- [ ] 定义 HTTP DTO（用于接收 HTTP 请求）
- [ ] 实现 DTO 映射器（HTTP DTO ↔ 用例 Input/Output）

**测试**：

- [ ] 聚合根单元测试（领域逻辑测试）
- [ ] 用例单元测试（应用逻辑测试，Mock 仓储和事件总线）
- [ ] 值对象单元测试
- [ ] 事件处理器测试（基础设施层）
- [ ] 控制器集成测试（测试用例调用）
- [ ] 端到端测试（完整业务流程）

### 6.3 团队培训计划

**Week 1：理论基础**

- DDD 核心概念（聚合、值对象、领域事件）
- **充血模型 vs 贫血模型**（重点）
  - 为什么业务逻辑应该在实体内部
  - 如何识别和避免贫血模型
  - 充血模型的设计原则和实践
- Clean Architecture 原则
- CQRS 模式
- EDA 模式

**Week 2：实践演练**

- 重构一个小模块（如健康检查）
- **充血模型实践**：
  - 将业务逻辑从服务层迁移到实体内部
  - 使用有意义的业务方法替代 Getter/Setter
  - 实现值对象的自验证逻辑
- 代码审查和讨论（重点关注是否遵循充血模型）
- 最佳实践总结

**Week 3：正式重构**

- 开始重构认证领域
- 每日站会讨论问题
- 持续改进

---

## 7. 成本效益分析

### 7.1 开发成本

| 项目         | 估算时间    | 说明                          |
| ------------ | ----------- | ----------------------------- |
| 基础设施搭建 | 1-2 周      | 目录结构、事件总线、CQRS 框架 |
| 核心领域重构 | 3-4 周      | Auth、Users 领域              |
| 扩展领域重构 | 2-3 周      | Roles、Permissions、Tenants   |
| 测试和优化   | 1-2 周      | 测试覆盖、性能优化            |
| **总计**     | **7-11 周** | 约 2-3 个月                   |

**人力成本**：

- 2-3 名高级开发工程师
- 1 名架构师（部分时间）

### 7.2 长期收益

**代码质量提升**：

- ✅ 代码可维护性提升 50%+（业务逻辑集中，易于理解）
- ✅ 单元测试覆盖率提升至 80%+（领域逻辑可独立测试）
- ✅ Bug 率降低 30%+（类型安全、职责清晰）

**开发效率提升**：

- ✅ 新功能开发速度提升 30%+（事件驱动，易于扩展）
- ✅ 代码审查效率提升 40%+（结构清晰，易于理解）
- ✅ 重构成本降低 50%+（依赖倒置，易于替换）

**系统扩展性**：

- ✅ 支持微服务拆分（领域边界清晰）
- ✅ 支持读写分离（CQRS 天然支持）
- ✅ 支持事件溯源（可选，为未来扩展预留）

### 7.3 ROI 计算

**假设**：

- 开发成本：3 人 × 10 周 × 5 天 × 8 小时 = 1200 人时
- 人力成本：500 元/小时
- **总成本**：60 万元

**收益**（年度）：

- 开发效率提升节省：200 人时/年 × 500 元 = 10 万元
- Bug 修复成本降低：50 人时/年 × 500 元 = 2.5 万元
- 代码审查效率提升：100 人时/年 × 500 元 = 5 万元
- **年度收益**：17.5 万元

**投资回收期**：60 万 / 17.5 万 ≈ **3.4 年**

**注**：实际 ROI 取决于项目规模和团队规模，以上为示例计算。

---

## 8. 风险与挑战

### 8.1 技术风险

**风险 1：过度设计**

- **描述**：为简单场景引入复杂架构
- **缓解**：遵循 YAGNI 原则，只在必要时引入复杂模式

**风险 2：性能问题**

- **描述**：事件处理、CQRS 可能带来性能开销
- **缓解**：性能测试、优化查询、使用缓存

**风险 3：学习曲线**

- **描述**：团队需要时间适应新架构
- **缓解**：培训、代码审查、渐进式迁移

### 8.2 业务风险

**风险 1：重构周期长**

- **描述**：2-3 个月重构期间新功能开发可能延迟
- **缓解**：分阶段重构，保持功能迭代

**风险 2：回归问题**

- **描述**：重构可能引入新 Bug
- **缓解**：充分测试、代码审查、灰度发布

### 8.3 组织风险

**风险 1：团队抵触**

- **描述**：部分成员可能不适应新架构
- **缓解**：充分沟通、培训支持、展示收益

**风险 2：知识传承**

- **描述**：新架构需要文档和知识分享
- **缓解**：完善文档、代码审查、技术分享

---

## 9. 结论与建议

### 9.1 总体评估

**技术可行性**：✅ **高**

- 目标架构与现有技术栈完全兼容
- NestJS 生态提供良好支持
- 团队具备 TypeScript 和 NestJS 经验

**业务价值**：✅ **高**

- 显著提升代码质量和可维护性
- 支持未来扩展（微服务、事件溯源）
- 降低长期维护成本

**实施风险**：⚠️ **中**

- 需要 2-3 个月重构周期
- 团队需要学习新架构模式
- 需要充分测试和代码审查

### 9.2 最终建议

**建议采用渐进式重构策略**：

1. **立即开始**：
   - 搭建基础设施（事件总线、CQRS 框架）
   - 重构认证领域（Auth）作为试点

2. **第一阶段**（1-2 个月）：
   - 完成核心领域重构（Auth、Users）
   - 验证架构可行性
   - 总结经验，优化流程

3. **第二阶段**（1 个月）：
   - 扩展其他领域（Roles、Permissions、Tenants）
   - 完善测试和文档

4. **持续优化**：
   - 性能优化
   - 最佳实践总结
   - 团队培训

### 9.3 成功标准

**技术指标**：

- ✅ 单元测试覆盖率 ≥ 80%
- ✅ 集成测试通过率 100%
- ✅ API 响应时间不增加（或优化 10%+）
- ✅ 代码重复率 < 5%

**业务指标**：

- ✅ 新功能开发速度提升 30%+
- ✅ Bug 率降低 30%+
- ✅ 代码审查时间减少 40%+

**团队指标**：

- ✅ 团队成员掌握新架构模式
- ✅ 代码审查通过率 ≥ 90%
- ✅ 技术文档完善度 ≥ 80%

---

## 10. 附录

### 10.1 参考资源

**书籍**：

- 《领域驱动设计》（Eric Evans）
- 《实现领域驱动设计》（Vaughn Vernon）
- 《整洁架构》（Robert C. Martin）

**文档**：

- [NestJS CQRS 文档](https://docs.nestjs.com/recipes/cqrs)
- [DDD 模式参考](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Clean Architecture 指南](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### 10.2 示例代码库

建议参考以下开源项目：

- [NestJS CQRS 示例](https://github.com/nestjs/nest/tree/master/sample/19-auth-jwt)
- [TypeORM + DDD 示例](https://github.com/stemmlerjs/ddd-forum)

---

**报告编制日期**：2025-01-27  
**编制人**：AI Assistant  
**审核状态**：待审核
