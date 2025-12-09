/**
 * 值对象基类
 *
 * 所有值对象的抽象基类，采用 Clean Architecture 的值对象模式。
 * 值对象是没有唯一标识符的不可变对象，通过值相等性进行比较。
 *
 * **设计原则**：
 * - 值对象是不可变的，属性通过构造函数初始化
 * - 值对象通过值相等性进行比较，而不是引用
 * - 支持泛型，允许不同类型的属性定义
 *
 * @template Props - 值对象属性的类型
 * @abstract
 * @class ValueObject
 * @description 值对象的抽象基类
 */
export abstract class ValueObject<Props> {
  /**
   * 值对象属性
   *
   * 存储值对象的所有属性数据。
   *
   * @protected
   * @type {Props}
   */
  protected props: Props;

  /**
   * 构造函数
   *
   * 初始化值对象属性。
   *
   * @protected
   * @param {Props} props - 值对象属性对象
   */
  protected constructor(props: Props) {
    this.props = props;
  }
}
