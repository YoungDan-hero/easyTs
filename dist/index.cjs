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
  createEasyTs: () => createEasyTs
});
module.exports = __toCommonJS(src_exports);
var import_axios = __toESM(require("axios"), 1);
var EasyTs = class {
  constructor(config = {}) {
    this.typeCache = /* @__PURE__ */ new Set();
    this.axios = config.axios || import_axios.default.create();
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
   * 生成TypeScript接口定义
   */
  generateTypeDefinition(data, interfaceName) {
    const seen = /* @__PURE__ */ new Set();
    const generateType = (value, name) => {
      if (seen.has(value)) {
        return "any";
      }
      if (value === null)
        return "null";
      if (Array.isArray(value)) {
        if (value.length === 0)
          return "any[]";
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
          const properties = Object.entries(value).map(
            ([key, val]) => `  ${key}: ${generateType(
              val,
              `${name}${key.charAt(0).toUpperCase()}${key.slice(1)}`
            )};`
          ).join("\n");
          return `{
${properties}
}`;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createEasyTs
});
//# sourceMappingURL=index.cjs.map