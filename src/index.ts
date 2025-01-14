// 将原文件拆分为两个主要部分：类型工具和运行时功能

// 类型工具导出
export type { Type } from "./types";
export type { OverrideField } from "./types";
export type { ExtendField } from "./types";
export type { ModifyFields } from "./types";

// 运行时功能
import { EasyTs } from "./core";
export { createEasyTs } from "./core";
export { getInterface } from "./core";
export { createTypeDefinition } from "./core";
export { createTypeInCurrentDir } from "./core";

// 导出默认实例
export default EasyTs;
