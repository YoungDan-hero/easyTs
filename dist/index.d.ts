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
}
declare const createEasyTs: (config?: EasyTsConfig) => EasyTs;

export { createEasyTs };
