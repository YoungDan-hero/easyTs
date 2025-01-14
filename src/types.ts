/**
 * 基础类型定义
 */
export type Type<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? Array<Type<U>>
    : T[K] extends object
    ? Type<T[K]>
    : T[K];
};

/**
 * 用于重写接口中特定字段类型的工具类型
 * @template T 原始接口类型
 * @template K 要重写的字段名
 * @template R 新的字段类型
 */
export type OverrideField<T, K extends keyof T, R> = Omit<T, K> & {
  [P in K]: R;
};

/**
 * 用于扩展接口中特定字段类型的工具类型（联合类型）
 * @template T 原始接口类型
 * @template K 要扩展的字段名
 * @template R 要添加的类型
 */
export type ExtendField<T, K extends keyof T, R> = Omit<T, K> & {
  [P in K]: T[P] | R;
};

/**
 * 用于一次性修改多个字段类型的工具类型
 * @template T 原始接口类型
 * @template M 要修改的字段及其新类型的映射
 */
export type ModifyFields<T, M extends { [K in keyof M]: any }> = Omit<
  T,
  keyof M
> & {
  [K in keyof M]: M[K];
};
