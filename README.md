# EasyTs

一个为 TypeScript 项目设计的智能类型生成工具，适用于 Vue3 + vite 项目，可以自动拦截 API 响应并生成对应的 TypeScript 接口定义，极大提升开发效率。

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

// 项目实例
import axios from "axios";
import { createEasyTs } from "@kiko-yd/easyts";
const TIMEOUT_DURATION: number = 150000;
const instance: AxiosInstance = axios.create({
  timeout: TIMEOUT_DURATION,
});

const easyTs = createEasyTs({
  outputDir: "Interface",
  axios: instance,
});

easyTs.start();

instance.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig<any>
  ): InternalAxiosRequestConfig<any> => {
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response: AxiosResponse): Promise<any> | AxiosResponse | any => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    return Promise.reject(error);
  }
);

export default instance;
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

### 5. 类型重写与扩展

EasyTs 提供了三个实用的类型工具，用于重写或扩展自动生成的接口类型：

```typescript
import type { OverrideField, ExtendField, ModifyFields } from "@kiko-yd/easyts";

// 假设自动生成的接口如下：
interface UserData {
  id: number;
  name: string;
  age: number;
  roles: string[];
  profile: {
    avatar: string;
    bio: string;
  };
}

// 1. 完全重写单个字段类型
type UserWithStringId = OverrideField<UserData, "id", string>;
// 结果：
// {
//   id: string;  // 类型被完全重写为 string
//   name: string;
//   age: number;
//   ...
// }

// 2. 扩展单个字段类型（联合类型）
type UserWithFlexibleId = ExtendField<UserData, "id", string>;
// 结果：
// {
//   id: number | string;  // 原类型与新类型的联合
//   name: string;
//   age: number;
//   ...
// }

// 3. 一次性修改多个字段类型（推荐）
type CustomUser = ModifyFields<
  UserData,
  {
    id: string; // 完全重写为string
    age: string | number; // 使用联合类型
    roles: number[]; // 修改数组元素类型
    profile: {
      // 重写嵌套对象类型
      avatar: string;
      bio: string;
      socialLinks: string[]; // 添加新字段
    };
  }
>;
```

使用场景：

- API 返回的字段类型需要适配多种格式
- 需要扩展某些字段的类型范围
- 需要完全重写特定字段的类型
- 处理后端返回类型与前端实际使用类型不完全匹配的情况
- 需要批量修改多个字段类型时，使用 `ModifyFields`

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
6. 使用类型重写工具时，确保字段名称完全匹配
7. 类型重写不会影响原始生成的类型文件，只在使用时生效

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT

```

```
