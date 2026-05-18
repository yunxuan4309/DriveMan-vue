# DriveMan

基于 **Vue 3 + Element Plus** 的前端项目基础框架。

## 技术栈

| 类别 | 技术 |
|---|---|
| 构建工具 | Vite 6 |
| 框架 | Vue 3（组合式 API + `<script setup>`） |
| UI 组件库 | Element Plus（中文国际化） |
| 路由 | Vue Router 4（懒加载） |
| 状态管理 | Pinia |
| HTTP 请求 | Axios（拦截器封装） |
| 样式 | SCSS（全局变量自动注入） |
| 代码规范 | ESLint 9 + Prettier |

## 目录结构

```
src/
├── views/           页面视图
├── components/      公共组件
├── router/          路由配置
├── stores/          Pinia 状态管理
├── api/             接口请求封装
├── utils/           工具函数
├── styles/          全局样式与 SCSS 变量
└── assets/          静态资源
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产包
npm run build

# 预览生产构建
npm run preview
```

## 代码规范

```bash
# ESLint 检查并自动修复
npm run lint

# Prettier 格式化
npm run format
```

## 环境变量

项目使用 Vite 的环境变量机制，在项目根目录创建 `.env` 文件：

```env
VITE_API_BASE_URL=/api
```

所有 `VITE_` 开头的变量会自动暴露给客户端代码，通过 `import.meta.env` 访问。

## 项目配置

- **路径别名**: `@` 指向 `src/` 目录
- **SCSS 变量**: 全局自动注入 `src/styles/variables.scss`，所有组件中可直接使用
- **Axios 封装**: `src/api/request.js` 已包含请求/响应拦截器，统一错误处理
