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
npm install @kiko-yd/easyts
```

## 🔨 使用方法

### 1. 配置 Vite

在你的 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vitePluginEasyTs } from "@kiko-yd/easyts/vite-plugin-easyts";

export default defineConfig({
  plugins: [vue(), vitePluginEasyTs()],
});
```

### 2. 在代码中使用

```typescript
import { createEasyTs } from "@kiko-yd/easyts";

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

### 3. 直接生成类型定义

除了自动拦截 API 响应外，EasyTs 还提供了两种方式直接从数据生成 TypeScript 类型：

#### 方式一：获取字符串形式的接口定义

```typescript
const easyTs = createEasyTs();
const userInterface = easyTs.generateInterface(userData, "IUser");
```

#### 方式二：直接获取类型定义（推荐）

```typescript
import { createEasyTs, Type } from "@kiko-yd/easyts";

const easyTs = createEasyTs();

// 示例1：API 响应数据类型
async function fetchUserData() {
  const res = await axios.get("/api/user");
  const userData = ref<Type<typeof res.data>>();
  userData.value = res.data;
}

// 示例2：普通数据类型
const orderData = {
  orderId: "ORDER001",
  customer: {
    name: "张三",
    contact: {
      email: "zhangsan@example.com",
      phone: "13800138000",
    },
  },
  products: [
    {
      id: 1,
      name: "商品1",
      price: 99.9,
    },
  ],
  totalAmount: 99.9,
};

// 直接在 ref 中使用
const order = ref<Type<typeof orderData>>();

// 在函数参数中使用
function processOrder(data: Type<typeof orderData>) {
  // ...
}
```

`Type` 的特点：

- 使用方式极其简单：`Type<typeof yourData>`
- 自动处理嵌套对象和数组
- 完整保留原始数据的类型信息
- 可以与 Vue 的 ref/reactive 完美配合
- 支持在任何需要类型定义的地方使用

generateInterface 方法支持：

- 自动生成嵌套接口
- 智能处理数组类型
- 自动处理循环引用
- 生成清晰的类型层次结构

**参数说明：**

- `data: any` - 要生成接口的数据对象
- `interfaceName?: string` - 可选的接口名称，如果不提供则默认为 "IGeneratedInterface"

### 4. 类型文件生成

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

### 5. 使用生成的类型

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
