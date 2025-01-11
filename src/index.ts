import axios, { AxiosInstance, AxiosResponse } from "axios";

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

// 类型定义
export type Type<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? Array<Type<U>>
    : T[K] extends object
    ? Type<T[K]>
    : T[K];
};

class EasyTs {
  private axios: AxiosInstance;
  private typeCache: Set<string> = new Set();
  private outputDir: string;

  constructor(config: EasyTsConfig = {}) {
    this.axios = config.axios || axios.create();
    this.outputDir = config.outputDir || "EasyTsApi";
  }

  /**
   * 从API路径生成接口名称
   */
  private generateInterfaceName(url: string): string {
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split("/").filter(Boolean);
    const name = parts
      .map((part) =>
        part
          .split("-")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join("")
      )
      .join("");

    return `I${name}Response`;
  }

  /**
   * 根据传入的数据生成 TypeScript 接口定义
   * @param data 要生成接口的数据
   * @param interfaceName 可选的接口名称，如果不提供将生成默认名称
   * @returns 生成的 TypeScript 接口定义字符串
   */
  public generateInterface(data: any, interfaceName?: string): string {
    const name = interfaceName || "IGeneratedInterface";
    return this.generateTypeDefinition(data, name);
  }

  /**
   * 生成TypeScript接口定义
   */
  private generateTypeDefinition(data: any, interfaceName: string): string {
    const seen = new Set();
    let interfaces: string[] = [];

    const generateType = (value: any, name: string): string => {
      if (seen.has(value)) {
        return "any"; // 避免循环引用
      }

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
          return Number.isInteger(value) ? "number" : "number";
        case "boolean":
          return "boolean";
        case "object": {
          seen.add(value);
          const subInterfaceName = `I${name}`;

          // 为复杂对象生成子接口
          if (Object.keys(value).length > 0) {
            const properties = Object.entries(value)
              .map(([key, val]) => {
                const propType = generateType(
                  val,
                  `${name}${key.charAt(0).toUpperCase()}${key.slice(1)}`
                );
                return `  ${key}: ${propType};`;
              })
              .join("\n");

            // 只有当对象有属性时才生成子接口
            if (name !== interfaceName.replace(/^I/, "")) {
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

    const mainInterface = `export interface ${interfaceName} ${generateType(
      data,
      interfaceName.replace(/^I/, "")
    )}`;

    // 返回所有生成的接口定义，包括子接口
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
   * 开始监听API响应
   */
  public start(): void {
    this.axios.interceptors.response.use(
      async (response: AxiosResponse) => {
        try {
          const interfaceName = this.generateInterfaceName(
            response.config.url || ""
          );
          const typeDefinition = this.generateTypeDefinition(
            response.data,
            interfaceName
          );

          if (!this.typeCache.has(interfaceName)) {
            await this.saveTypeDefinition(interfaceName, typeDefinition);
            this.typeCache.add(interfaceName);
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
   * @template T 数据类型
   * @param data 要生成类型的数据
   * @returns 类型接口
   */
  public type<T>(data: T): Type<T> {
    return {} as Type<T>;
  }
}

/**
 * 直接生成接口定义
 * @param data 要生成接口的数据
 * @returns 接口定义字符串
 */
export function getInterface(data: any): string {
  const easyTs = new EasyTs();
  return easyTs.generateInterface(data);
}

export const createEasyTs = (config?: EasyTsConfig): EasyTs => {
  return new EasyTs(config);
};

/**
 * 将接口定义字符串转换为可用的类型定义文件
 * @param interfaceString 接口定义字符串
 * @param fileName 文件名（可选，默认为 'types'）
 * @returns Promise<string> 返回生成的类型文件路径
 */
export async function createTypeDefinition(
  interfaceString: string,
  fileName: string = "types"
): Promise<string> {
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
 * @param data 要生成类型的数据
 * @param fileName 保存的文件名（不需要扩展名）
 * @param filePath 当前文件的路径（使用 import.meta.url）
 * @returns Promise<string> 返回生成的类型文件路径
 */
export async function createTypeInCurrentDir(
  data: any,
  fileName: string,
  filePath: string
): Promise<string> {
  const interfaceString = getInterface(data);

  try {
    // 将 URL 转换为相对路径
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
