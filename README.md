# EasyTs

一个为 TypeScript 项目设计的智能类型生成工具，可以自动拦截 API 响应并生成对应的 TypeScript 接口定义，极大提升开发效率。

## ✨ 特性

- 🚀 自动拦截 API 响应并生成 TypeScript 接口定义
- 📁 智能的类型文件管理系统
- 🔄 智能命名转换和类型推导
- 🔌 零侵入性集成
- 💪 完全类型安全
- 🎯 支持多种类型生成方式

## 📦 安装

```bash
npm install @kiko-yd/easyts
```

## 🔨 核心功能

### 1. createEasyTs

创建 EasyTs 实例，用于自动拦截 API 响应并生成类型定义。

```typescript
import { createEasyTs } from "@kiko-yd/easyts";

// 基本使用
const easyTs = createEasyTs();
easyTs.start();

// 高级配置
const easyTs = createEasyTs({
  outputDir: "types/api", // 自定义输出目录
  axios: customAxios, // 自定义 axios 实例
});
```

使用场景：

- 在项目入口文件中初始化，自动监听所有 API 请求
- 需要自定义类型文件存储位置
- 使用自定义的 axios 实例时

### 2. createTypeInCurrentDir

在当前文件目录下快速生成类型定义文件。

```typescript
import { createTypeInCurrentDir } from "@kiko-yd/easyts";

// 基本使用
const data = await fetchData();
await createTypeInCurrentDir(data, "UserTypes", import.meta.url);

// 导入生成的类型
import type { IGeneratedInterface } from "./UserTypes";
```

参数说明：

- `data: any` - 需要生成类型的数据
- `fileName: string` - 类型文件名（无需扩展名）
- `filePath: string` - 当前文件路径（使用 import.meta.url）

使用场景：

- 需要在组件/模块同级目录管理类型定义
- 快速为已有数据生成类型定义
- 希望类型文件与业务代码紧密关联

### 3. createTypeDefinition

将接口定义字符串保存为类型定义文件。

```typescript
import { createTypeDefinition } from "@kiko-yd/easyts";

// 基本使用
const interfaceString = `
export interface UserData {
  id: number;
  name: string;
  age: number;
}`;

await createTypeDefinition(interfaceString, "UserTypes");
// 生成文件：types/UserTypes.d.ts
```

参数说明：

- `interfaceString: string` - 接口定义字符串
- `fileName?: string` - 可选的文件名，默认为 "types"

使用场景：

- 已有接口定义需要保存为文件
- 需要将多个接口合并到一个文件
- 手动编写的接口需要规范化存储

### 4. getInterface

直接从数据生成 TypeScript 接口定义字符串。

```typescript
import { getInterface } from "@kiko-yd/easyts";

const data = {
  user: {
    name: "张三",
    age: 25,
    hobbies: ["读书", "游戏"],
  },
  status: "active",
};

const interfaceString = getInterface(data);
console.log(interfaceString);
```

输出示例：

```typescript
export interface IGeneratedInterface {
  user: {
    name: string;
    age: number;
    hobbies: string[];
  };
  status: string;
}
```

使用场景：

- 需要快速查看数据结构
- 临时生成接口定义
- 作为其他类型生成函数的基础

## ⚙️ Vite 插件配置

在 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from "vite";
import { vitePluginEasyTs } from "@kiko-yd/easyts/vite-plugin-easyts";

export default defineConfig({
  plugins: [
    // ... 其他插件
    vitePluginEasyTs(),
  ],
});
```

## 🌰 最佳实践

### 1. API 请求类型生成

```typescript
// api/user.ts
import { createEasyTs } from "@kiko-yd/easyts";

const easyTs = createEasyTs();
const axios = easyTs.getAxiosInstance();

// 自动生成类型并使用
export async function getUserInfo() {
  const response = await axios.get("/api/user/info");
  return response.data; // 类型会自动生成到 src/EasyTsApi/UserInfoResponse.ts
}
```

### 2. 组件数据类型生成

```typescript
// components/UserCard.vue
import { createTypeInCurrentDir } from "@kiko-yd/easyts";

// 生成类型
const mockData = {
  title: "用户卡片",
  user: { name: "张三", avatar: "url" },
};

await createTypeInCurrentDir(mockData, "UserCardTypes", import.meta.url);

// 使用生成的类型
import type { IGeneratedInterface as UserCardProps } from "./UserCardTypes";
```

## 📝 注意事项

1. 确保项目中有 `src` 目录且具有写入权限
2. `createTypeInCurrentDir` 必须使用 `import.meta.url` 作为第三个参数
3. 生成的类型文件建议加入版本控制
4. 使用自定义 axios 实例时，确保在 `start()` 前完成配置
5. 类型文件名避免使用特殊字符

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT

```

```
