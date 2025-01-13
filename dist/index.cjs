"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  createEasyTs: () => createEasyTs,
  createTypeDefinition: () => createTypeDefinition,
  createTypeInCurrentDir: () => createTypeInCurrentDir,
  getInterface: () => getInterface
});
module.exports = __toCommonJS(src_exports);
var import_axios = __toESM(require("axios"), 1);
var EasyTs = class {
  constructor(config = {}) {
    this.typeCache = /* @__PURE__ */ new Map();
    this.axios = config.axios || import_axios.default.create();
    this.outputDir = config.outputDir || "EasyTsApi";
  }
  /**
   * 计算数据的哈希值，用于检测变化
   */
  calculateHash(data) {
    return JSON.stringify(data);
  }
  /**
   * 检查数据是否发生变化
   */
  hasDataChanged(interfaceName, newData) {
    const newHash = this.calculateHash(newData);
    const oldHash = this.typeCache.get(interfaceName);
    if (oldHash !== newHash) {
      this.typeCache.set(interfaceName, newHash);
      return true;
    }
    return false;
  }
  /**
   * 从API路径生成接口名称（用作文件名）
   * @param url API路径
   * @param method 请求方法
   * @returns 生成的接口名称
   */
  generateInterfaceName(url, method = "get") {
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split("/").filter(Boolean);
    const processedParts = parts.map((part) => {
      if (part.includes("${") || part.startsWith(":") || /^\d+$/.test(part)) {
        return "ById";
      }
      return part;
    });
    const meaningfulParts = processedParts.filter(
      (part) => !["api", "v1", "v2", "v3"].includes(part.toLowerCase())
    );
    const lastParts = meaningfulParts.slice(-2);
    const name = lastParts.map((part) => {
      const words = part.split(/(?=[A-Z])/).map((word) => word.toLowerCase());
      const allWords = words.flatMap((word) => word.split("-"));
      return allWords.map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join("");
    }).join("");
    return `${name}${method.toUpperCase()}`;
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
          const subInterfaceName = name.charAt(0).toUpperCase() + name.slice(1);
          if (Object.keys(value).length > 0) {
            const properties = Object.entries(value).map(([key, val]) => {
              const propType = generateType(
                val,
                key
                // 直接使用字段名作为子接口的名称基础
              );
              return `  ${key}: ${propType};`;
            }).join("\n");
            if (name !== "data") {
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
    const mainInterface = `export interface Data ${generateType(data, "data")}`;
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
            response.config.url || "",
            response.config.method || "get"
          );
          if (!this.typeCache.has(interfaceName) || this.hasDataChanged(interfaceName, response.data)) {
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
   * 强制更新指定接口的类型定义
   * @param url 接口地址
   * @param method 请求方法
   * @param data 接口返回数据
   */
  async forceUpdate(url, method = "get", data) {
    try {
      const interfaceName = this.generateInterfaceName(url, method);
      const typeDefinition = this.generateTypeDefinition(data, interfaceName);
      await this.saveTypeDefinition(interfaceName, typeDefinition);
      this.typeCache.set(interfaceName, this.calculateHash(data));
      console.log(
        `[EasyTs] Force updated type definition for ${interfaceName}`
      );
    } catch (error) {
      console.error("EasyTs: Error force updating type definition:", error);
      throw error;
    }
  }
  /**
   * 获取axios实例
   */
  getAxiosInstance() {
    return this.axios;
  }
  /**
   * 直接获取数据的类型定义
   * @template T 数据类型
   * @param data 要生成类型的数据
   * @returns 类型接口
   */
  type(data) {
    return {};
  }
};
function getInterface(data) {
  const easyTs = new EasyTs();
  return easyTs.generateInterface(data);
}
var createEasyTs = (config) => {
  return new EasyTs(config);
};
async function createTypeDefinition(interfaceString, fileName = "types") {
  try {
    const response = await fetch("/__easyts_save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        interfaceName: fileName,
        content: interfaceString,
        outputDir: "types"
      })
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
async function createTypeInCurrentDir(data, fileName, filePath) {
  const interfaceString = getInterface(data);
  try {
    const fileUrl = new URL(filePath);
    const relativePath = fileUrl.pathname;
    const response = await fetch("/__easyts_save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        interfaceName: fileName,
        content: interfaceString,
        outputDir: ".",
        createInCurrentDir: true,
        currentFilePath: relativePath
      })
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createEasyTs,
  createTypeDefinition,
  createTypeInCurrentDir,
  getInterface
});
//# sourceMappingURL=index.cjs.map