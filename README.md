# EasyTs

一个为 Vue3 + TypeScript 项目设计的自动类型生成工具。它可以自动拦截 API 响应并生成对应的 TypeScript 接口定义，提高开发效率。

## ✨ 特性

- 🚀 自动拦截 API 响应并生成 TypeScript 接口定义
- 📁 自动在 src 目录下管理类型文件
- 🔄 智能命名转换
- 🔌 零侵入性集成
- 💪 完全类型安全

## 📦 安装

```bash
npm install easyts
```

## 🔨 使用方法

### 1. 配置 Vite

在你的 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vitePluginEasyTs } from "easyts/vite-plugin-easyts";

export default defineConfig({
  plugins: [vue(), vitePluginEasyTs()],
});
```

### 2. 在代码中使用

```typescript
import { createEasyTs } from "easyts";

// 基本使用
const easyTs = createEasyTs();
easyTs.start();

// 或者使用自定义配置
const easyTs = createEasyTs({
  // 自定义输出目录（相对于src目录）
  outputDir: "types/api",
  // 使用自定义的 axios 实例
  axios: yourAxiosInstance,
});

easyTs.start();
```

### 3. 类型文件生成

当你发起 API 请求时，EasyTs 会自动：

1. 拦截响应数据
2. 生成对应的 TypeScript 接口
3. 保存到指定目录（默认为 `src/EasyTsApi`）

例如，请求 `/api/user/info` 会生成：

```typescript
// src/EasyTsApi/UserInfoResponse.ts
export interface UserInfoResponse {
  id: number;
  name: string;
  email: string;
  // ... 根据实际响应自动生成
}
```

### 4. 使用生成的类型

```typescript
// 导入生成的类型
import { UserInfoResponse } from "./EasyTsApi";

// 在代码中使用
const getUserInfo = async (): Promise<UserInfoResponse> => {
  const response = await axios.get("/api/user/info");
  return response.data;
};
```

## ⚙️ 配置选项

| 选项      | 类型          | 默认值      | 说明                           |
| --------- | ------------- | ----------- | ------------------------------ |
| outputDir | string        | 'EasyTsApi' | 类型文件输出目录（相对于 src） |
| axios     | AxiosInstance | -           | 自定义的 axios 实例            |

```

## 📝 注意事项

1. 确保你的项目中有 `src` 目录
2. 确保 `src` 目录有写入权限
3. 建议将生成的类型目录添加到版本控制中
4. 如果使用自定义的 axios 实例，确保在调用 `start()` 之前完成所有配置

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT
```
