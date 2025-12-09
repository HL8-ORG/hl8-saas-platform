/**
 * 用例接口
 *
 * 定义所有业务用例的统一接口，遵循单一职责原则。
 * 每个用例代表一个独立的业务操作，如用户注册、用户登录等。
 *
 * @template TInput 输入参数类型
 * @template TOutput 输出结果类型
 *
 * @interface IUseCase
 * @description Clean Architecture 中的应用层用例接口，所有业务用例都应实现此接口
 */
export interface IUseCase<TInput, TOutput> {
  /**
   * 执行用例
   *
   * 执行具体的业务逻辑，接收输入参数并返回输出结果。
   * 用例方法应该是纯函数，不产生副作用（除了通过领域事件）。
   *
   * @param {TInput} input - 用例输入参数
   * @returns {Promise<TOutput>} 用例执行结果
   * @throws {Error} 当业务规则违反时抛出相应异常
   *
   * @example
   * ```typescript
   * class SignupUseCase implements IUseCase<SignupInputDto, SignupOutputDto> {
   *   async execute(input: SignupInputDto): Promise<SignupOutputDto> {
   *     // 业务逻辑实现
   *   }
   * }
   * ```
   */
  execute(input: TInput): Promise<TOutput>;
}
