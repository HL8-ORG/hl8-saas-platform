/**
 * 实体基类
 *
 * 所有领域实体的抽象基类，采用 Clean Architecture 的实体模式。
 * 封装实体的属性，提供统一的实体结构。
 *
 * **设计原则**：
 * - 实体是不可变的，属性通过构造函数初始化
 * - 属性通过 getter 方法访问，确保封装性
 * - 支持泛型，允许不同类型的属性定义
 *
 * @template Props - 实体属性的类型
 * @abstract
 * @class Entity
 * @description 领域实体的抽象基类
 */
export abstract class Entity<Props> {
  /**
   * 实体属性
   *
   * 存储实体的所有属性数据。
   *
   * @protected
   * @type {Props}
   */
  protected props: Props;

  /**
   * 构造函数
   *
   * 初始化实体属性。
   *
   * @protected
   * @param {Props} props - 实体属性对象
   */
  protected constructor(props: Props) {
    this.props = props;
  }
}
