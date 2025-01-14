import axios, { AxiosInstance, AxiosResponse } from "axios";
import type { Type } from "./types";

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

  /**
   * 是否启用类型生成功能
   * 默认在开发环境下启用，生产环境下禁用
   */
  enableTypeGeneration?: boolean;
}

// 全局缓存，确保在多个实例间共享
class TypeCache {
  private cache: Map<string, { hash: string; timestamp: number }>;
  private maxItems: number;

  constructor(maxItems: number = 100) {
    this.cache = new Map();
    this.maxItems = maxItems;
  }

  get(key: string): string | undefined {
    const item = this.cache.get(key);
    if (item) {
      // 更新访问时间
      item.timestamp = Date.now();
      return item.hash;
    }
    return undefined;
  }

  set(key: string, hash: string): void {
    // 如果达到最大数量，删除最旧的项
    if (this.cache.size >= this.maxItems) {
      const entries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );
      this.cache.delete(entries[0][0]); // 删除最旧的一项
    }

    this.cache.set(key, {
      hash,
      timestamp: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// 创建全局缓存实例
const globalTypeCache = new TypeCache(100);

export class EasyTs {
  private static instance: EasyTs;
  private axios: AxiosInstance = axios.create();
  private outputDir: string = "EasyTsApi";
  private enableTypeGeneration: boolean =
    process.env.NODE_ENV === "development";

  constructor(config: EasyTsConfig = {}) {
    // 如果已经有实例了，返回该实例
    if (EasyTs.instance) {
      Object.assign(EasyTs.instance, {
        axios: config.axios || EasyTs.instance.axios,
        outputDir: config.outputDir || EasyTs.instance.outputDir,
        enableTypeGeneration:
          config.enableTypeGeneration ?? EasyTs.instance.enableTypeGeneration,
      });
      return EasyTs.instance;
    }

    // 初始化实例属性
    this.axios = config.axios || this.axios;
    this.outputDir = config.outputDir || this.outputDir;
    this.enableTypeGeneration =
      config.enableTypeGeneration ?? this.enableTypeGeneration;

    // 保存实例
    EasyTs.instance = this;
  }

  /**
   * 计算数据的哈希值，用于检测变化
   */
  private calculateHash(data: any): string {
    const normalizeData = (obj: any): any => {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(normalizeData);
      }

      return Object.keys(obj)
        .sort()
        .reduce((result: any, key: string) => {
          result[key] = normalizeData(obj[key]);
          return result;
        }, {});
    };

    return JSON.stringify(normalizeData(data));
  }

  /**
   * 检查数据是否发生变化
   */
  private hasDataChanged(interfaceName: string, newData: any): boolean {
    const newHash = this.calculateHash(newData);
    const oldHash = globalTypeCache.get(interfaceName);

    if (oldHash !== newHash) {
      globalTypeCache.set(interfaceName, newHash);
      console.log(
        `[EasyTs] Cache miss for ${interfaceName}, regenerating types`
      );
      return true;
    }

    console.log(
      `[EasyTs] Cache hit for ${interfaceName}, skipping type generation`
    );
    return false;
  }

  /**
   * 从API路径生成接口名称（用作文件名）
   */
  private generateInterfaceName(url: string, method: string = "get"): string {
    // 移除查询参数
    const cleanUrl = url.split("?")[0];

    // 分割路径并过滤空值
    const parts = cleanUrl.split("/").filter(Boolean);

    // 替换动态参数为通用标识符
    const processedParts = parts.map((part) => {
      if (part.includes("${") || part.startsWith(":") || /^\d+$/.test(part)) {
        return "ById";
      }
      return part;
    });

    // 只取最后两个有意义的部分
    const meaningfulParts = processedParts.filter(
      (part) => !["api", "v1", "v2", "v3"].includes(part.toLowerCase())
    );

    const lastParts = meaningfulParts.slice(-2);

    // 驼峰命名转换
    const name = lastParts
      .map((part) => {
        const words = part.split(/(?=[A-Z])/).map((word) => word.toLowerCase());
        const allWords = words.flatMap((word) => word.split("-"));
        return allWords
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join("");
      })
      .join("");

    return `${name}${method.toUpperCase()}`;
  }

  /**
   * 生成TypeScript接口定义
   */
  private generateTypeDefinition(data: any, interfaceName: string): string {
    const seen = new Set();
    let interfaces: string[] = [];

    const generateType = (value: any, name: string): string => {
      if (seen.has(value)) return "any";
      if (value === null) return "null";
      if (Array.isArray(value)) {
        if (value.length === 0) return "any[]";
        const itemType = generateType(value[0], `${name}Item`);
        return `${itemType}[]`;
      }

      switch (typeof value) {
        case "string":
          return "string";
        case "number":
          return "number";
        case "boolean":
          return "boolean";
        case "object": {
          seen.add(value);
          const subInterfaceName = name.charAt(0).toUpperCase() + name.slice(1);

          if (Object.keys(value).length > 0) {
            const properties = Object.entries(value)
              .map(([key, val]) => {
                const propType = generateType(val, key);
                return `  ${key}: ${propType};`;
              })
              .join("\n");

            if (name !== "data") {
              interfaces.push(
                `export interface ${subInterfaceName} {\n${properties}\n}`
              );
              return subInterfaceName;
            } else {
              return `{\n${properties}\n}`;
            }
          }
          return "{}";
        }
        default:
          return "any";
      }
    };

    const mainInterface = `export interface Data ${generateType(data, "data")}`;
    return [...interfaces, mainInterface].join("\n\n");
  }

  /**
   * 保存类型定义
   */
  private async saveTypeDefinition(
    interfaceName: string,
    typeDefinition: string
  ): Promise<void> {
    try {
      const response = await fetch("/__easyts_save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interfaceName,
          content: typeDefinition,
          outputDir: this.outputDir,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save type definition");
      }
    } catch (error) {
      console.error("Error saving type definition:", error);
      throw error;
    }
  }

  /**
   * 根据传入的数据生成 TypeScript 接口定义
   */
  public generateInterface(data: any, interfaceName?: string): string {
    const name = interfaceName || "IGeneratedInterface";
    return this.generateTypeDefinition(data, name);
  }

  /**
   * 开始监听API响应
   */
  public start(): void {
    // 如果类型生成被禁用，直接返回
    if (!this.enableTypeGeneration) {
      console.log("[EasyTs] Type generation is disabled");
      return;
    }

    this.axios.interceptors.response.use(
      async (response: AxiosResponse) => {
        try {
          const interfaceName = this.generateInterfaceName(
            response.config.url || "",
            response.config.method || "get"
          );

          // 检查数据是否发生变化
          if (this.hasDataChanged(interfaceName, response.data)) {
            const typeDefinition = this.generateTypeDefinition(
              response.data,
              interfaceName
            );
            await this.saveTypeDefinition(interfaceName, typeDefinition);
            console.log(
              `[EasyTs] Updated type definition for ${interfaceName}`
            );
          }
        } catch (error) {
          console.error("EasyTs: Error generating type definition:", error);
        }
        return response;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * 获取axios实例
   */
  public getAxiosInstance(): AxiosInstance {
    return this.axios;
  }

  /**
   * 直接获取数据的类型定义
   */
  public type<T>(data: T): Type<T> {
    return {} as Type<T>;
  }
}

// 创建一个全局的单例实例
const globalInstance = new EasyTs();

/**
 * 创建或获取 EasyTs 实例
 */
export const createEasyTs = (config?: EasyTsConfig): EasyTs => {
  return new EasyTs(config); // 会返回同一个实例
};

/**
 * 直接生成接口定义
 */
export function getInterface(data: any): string {
  return globalInstance.generateInterface(data); // 使用全局实例
}

/**
 * 将接口定义字符串转换为可用的类型定义文件
 */
export async function createTypeDefinition(
  interfaceString: string,
  fileName: string = "types"
): Promise<string> {
  // 检查是否为开发环境
  if (process.env.NODE_ENV !== "development") {
    console.warn(
      "[EasyTs] createTypeDefinition is only available in development mode"
    );
    return "";
  }

  try {
    const response = await fetch("/__easyts_save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interfaceName: fileName,
        content: interfaceString,
        outputDir: "types",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create type definition");
    }

    return `types/${fileName}.d.ts`;
  } catch (error) {
    console.error("Error creating type definition:", error);
    throw error;
  }
}

/**
 * 快速从数据生成类型定义并保存到当前目录
 */
export async function createTypeInCurrentDir(
  data: any,
  fileName: string,
  filePath: string
): Promise<string> {
  // 检查是否为开发环境
  if (process.env.NODE_ENV !== "development") {
    console.warn(
      "[EasyTs] createTypeInCurrentDir is only available in development mode"
    );
    return "";
  }

  const interfaceString = getInterface(data);

  try {
    const fileUrl = new URL(filePath);
    const relativePath = fileUrl.pathname;

    const response = await fetch("/__easyts_save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interfaceName: fileName,
        content: interfaceString,
        outputDir: ".",
        createInCurrentDir: true,
        currentFilePath: relativePath,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create type definition");
    }

    const result = await response.json();
    return result.path;
  } catch (error) {
    console.error("Error creating type definition:", error);
    throw error;
  }
}
