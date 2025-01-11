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
type TypeFromData<T> = {
    [K in keyof T]: T[K] extends Array<infer U> ? Array<TypeFromData<U>> : T[K] extends object ? TypeFromData<T[K]> : T[K];
};
declare class EasyTs {
    private axios;
    private typeCache;
    private outputDir;
    constructor(config?: EasyTsConfig);
    /**
     * 从API路径生成接口名称
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
     * 获取axios实例
     */
    getAxiosInstance(): AxiosInstance;
    /**
     * 直接获取数据的类型定义
     * @template T 数据类型
     * @param data 要生成类型的数据
     * @returns 类型接口
     */
    type<T>(data: T): TypeFromData<T>;
}
type Type<T> = TypeFromData<T>;
declare const createEasyTs: (config?: EasyTsConfig) => EasyTs;

export { Type, TypeFromData, createEasyTs };
