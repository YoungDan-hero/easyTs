// src/index.ts
import axios from "axios";
var EasyTs = class {
  constructor(config = {}) {
    this.typeCache = /* @__PURE__ */ new Set();
    this.axios = config.axios || axios.create();
    this.outputDir = config.outputDir || "EasyTsApi";
  }
  /**
   * 从API路径生成接口名称
   */
  generateInterfaceName(url) {
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split("/").filter(Boolean);
    const name = parts.map(
      (part) => part.split("-").map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join("")
    ).join("");
    return `I${name}Response`;
  }
  /**
   * 根据传入的数据生成 TypeScript 接口定义
   * @param data 要生成接口的数据
   * @param interfaceName 可选的接口名称，如果不提供将生成默认名称
   * @returns 生成的 TypeScript 接口定义字符串
   */
  generateInterface(data, interfaceName) {
    const name = interfaceName || "IGeneratedInterface";
    return this.generateTypeDefinition(data, name);
  }
  /**
   * 生成TypeScript接口定义
   */
  generateTypeDefinition(data, interfaceName) {
    const seen = /* @__PURE__ */ new Set();
    let interfaces = [];
    const generateType = (value, name) => {
      if (seen.has(value)) {
        return "any";
      }
      if (value === null)
        return "null";
      if (Array.isArray(value)) {
        if (value.length === 0)
          return "any[]";
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
          if (Object.keys(value).length > 0) {
            const properties = Object.entries(value).map(([key, val]) => {
              const propType = generateType(
                val,
                `${name}${key.charAt(0).toUpperCase()}${key.slice(1)}`
              );
              return `  ${key}: ${propType};`;
            }).join("\n");
            if (name !== interfaceName.replace(/^I/, "")) {
              interfaces.push(
                `export interface ${subInterfaceName} {
${properties}
}`
              );
              return subInterfaceName;
            } else {
              return `{
${properties}
}`;
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
    return [...interfaces, mainInterface].join("\n\n");
  }
  /**
   * 保存类型定义
   */
  async saveTypeDefinition(interfaceName, typeDefinition) {
    try {
      const response = await fetch("/__easyts_save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          interfaceName,
          content: typeDefinition,
          outputDir: this.outputDir
        })
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
  start() {
    this.axios.interceptors.response.use(
      async (response) => {
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
  getAxiosInstance() {
    return this.axios;
  }
};
var createEasyTs = (config) => {
  return new EasyTs(config);
};
export {
  createEasyTs
};
//# sourceMappingURL=index.js.map