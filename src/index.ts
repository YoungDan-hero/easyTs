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
   * 生成TypeScript接口定义
   */
  private generateTypeDefinition(data: any, interfaceName: string): string {
    const seen = new Set();

    const generateType = (value: any, name: string): string => {
      if (seen.has(value)) {
        return "any";
      }

      if (value === null) return "null";
      if (Array.isArray(value)) {
        if (value.length === 0) return "any[]";
        return `${generateType(value[0], name)}[]`;
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
          const properties = Object.entries(value)
            .map(
              ([key, val]) =>
                `  ${key}: ${generateType(
                  val,
                  `${name}${key.charAt(0).toUpperCase()}${key.slice(1)}`
                )};`
            )
            .join("\n");
          return `{\n${properties}\n}`;
        }
        default:
          return "any";
      }
    };

    return `export interface ${interfaceName} ${generateType(
      data,
      interfaceName
    )}`;
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
}

export const createEasyTs = (config?: EasyTsConfig): EasyTs => {
  return new EasyTs(config);
};
