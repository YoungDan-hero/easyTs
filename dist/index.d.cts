import { AxiosInstance } from 'axios';

interface EasyTsConfig {
    /**
     * 输出目录，相对于项目的src目录
     * 默认为 'EasyTsApi'，最终会生成在 src/EasyTsApi 目录下
     */
    outputDir?: string;
    /**
     * 可选的 axios 实例
     * 如果不提供，将创建一个新的实例
     */
    axios?: AxiosInstance;
}
type Type<T> = {
    [K in keyof T]: T[K] extends Array<infer U> ? Array<Type<U>> : T[K] extends object ? Type<T[K]> : T[K];
};
/**
 * 用于重写接口中特定字段类型的工具类型
 * @template T 原始接口类型
 * @template K 要重写的字段名
 * @template R 新的字段类型
 */
type OverrideField<T, K extends keyof T, R> = Omit<T, K> & {
    [P in K]: R;
};
/**
 * 用于扩展接口中特定字段类型的工具类型（联合类型）
 * @template T 原始接口类型
 * @template K 要扩展的字段名
 * @template R 要添加的类型
 */
type ExtendField<T, K extends keyof T, R> = Omit<T, K> & {
    [P in K]: T[P] | R;
};
/**
 * 类型重写示例：
 *
 * // 原始生成的接口
 * interface UserData {
 *   id: number;
 *   name: string;
 * }
 *
 * // 重写 id 字段类型
 * type UserDataWithStringId = OverrideField<UserData, 'id', string>;
 *
 * // 扩展 id 字段类型（支持 number 和 string）
 * type UserDataWithExtendedId = ExtendField<UserData, 'id', string>;
 */
declare class EasyTs {
    private axios;
    private typeCache;
    private outputDir;
    constructor(config?: EasyTsConfig);
    /**
     * 计算数据的哈希值，用于检测变化
     */
    private calculateHash;
    /**
     * 检查数据是否发生变化
     */
    private hasDataChanged;
    /**
     * 从API路径生成接口名称（用作文件名）
     * @param url API路径
     * @param method 请求方法
     * @returns 生成的接口名称
     */
    private generateInterfaceName;
    /**
     * 根据传入的数据生成 TypeScript 接口定义
     * @param data 要生成接口的数据
     * @param interfaceName 可选的接口名称，如果不提供将生成默认名称
     * @returns 生成的 TypeScript 接口定义字符串
     */
    generateInterface(data: any, interfaceName?: string): string;
    /**
     * 生成TypeScript接口定义
     */
    private generateTypeDefinition;
    /**
     * 保存类型定义
     */
    private saveTypeDefinition;
    /**
     * 开始监听API响应
     */
    start(): void;
    /**
     * 强制更新指定接口的类型定义
     * @param url 接口地址
     * @param method 请求方法
     * @param data 接口返回数据
     */
    forceUpdate(url: string, method: string | undefined, data: any): Promise<void>;
    /**
     * 获取axios实例
     */
    getAxiosInstance(): AxiosInstance;
    /**
     * 直接获取数据的类型定义
     * @template T 数据类型
     * @param data 要生成类型的数据
     * @returns 类型接口
     */
    type<T>(data: T): Type<T>;
}
/**
 * 直接生成接口定义
 * @param data 要生成接口的数据
 * @returns 接口定义字符串
 */
declare function getInterface(data: any): string;
declare const createEasyTs: (config?: EasyTsConfig) => EasyTs;
/**
 * 将接口定义字符串转换为可用的类型定义文件
 * @param interfaceString 接口定义字符串
 * @param fileName 文件名（可选，默认为 'types'）
 * @returns Promise<string> 返回生成的类型文件路径
 */
declare function createTypeDefinition(interfaceString: string, fileName?: string): Promise<string>;
/**
 * 快速从数据生成类型定义并保存到当前目录
 * @param data 要生成类型的数据
 * @param fileName 保存的文件名（不需要扩展名）
 * @param filePath 当前文件的路径（使用 import.meta.url）
 * @returns Promise<string> 返回生成的类型文件路径
 */
declare function createTypeInCurrentDir(data: any, fileName: string, filePath: string): Promise<string>;

export { ExtendField, OverrideField, Type, createEasyTs, createTypeDefinition, createTypeInCurrentDir, getInterface };
