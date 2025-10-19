# GitHub Pages 部署指南

## 方法一：使用 GitHub Actions（推荐）

### 1. 自动部署已配置

项目已配置 GitHub Actions 自动部署，工作流文件位于 `.github/workflows/deploy.yml`。

### 2. 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 Settings 标签
3. 在左侧菜单中找到 Pages
4. 在 Source 部分选择：
   - **Source**: GitHub Actions
5. 点击 Save

### 3. 自动部署流程

当你推送代码到 `main` 分支时，GitHub Actions 会自动：
1. 检出代码
2. 安装 Node.js 18
3. 安装项目依赖
4. 构建项目
5. 部署到 GitHub Pages

### 4. 访问网站

部署成功后，可以通过以下链接访问：
```
https://[你的用户名].github.io/KLineDojo/
```

## 方法二：手动部署

### 1. 构建项目

```bash
npm run build
```

### 2. 推送到 GitHub

```bash
git add .
git commit -m "Build for GitHub Pages"
git push origin main
```

### 3. 配置 GitHub Pages

1. 进入仓库的 Settings > Pages
2. 在 Source 部分选择：
   - Branch: `main`
   - Folder: `/dist`
3. 点击 Save

## GitHub Actions 工作流说明

### 工作流特性

- **触发条件**: 推送到 `main` 分支或手动触发
- **权限**: 自动配置必要的 GitHub Pages 权限
- **并发控制**: 避免多个部署同时进行
- **缓存**: 自动缓存 Node.js 依赖以加速构建

### 工作流步骤

1. **检出代码**: 使用 `actions/checkout@v4`
2. **设置 Node.js**: 使用 `actions/setup-node@v4`，版本 18
3. **安装依赖**: 使用 `npm ci` 快速安装
4. **配置 Pages**: 使用 `actions/configure-pages@v5`
5. **构建项目**: 使用 Vite 构建
6. **上传构建产物**: 使用 `actions/upload-pages-artifact@v3`
7. **部署到 Pages**: 使用 `actions/deploy-pages@v4`

## 配置文件详解

### vite.config.ts

```typescript
export default defineConfig({
  // ... 其他配置
  base: '/KLineDojo/', // GitHub Pages 需要的基础路径
  build: {
    outDir: 'dist', // 构建输出目录
    sourcemap: true, // 生成 source map
  },
})
```

### .github/workflows/deploy.yml

```yaml
name: Deploy Vite site to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5
      
      - name: Build with Vite
        run: npm run build
        env:
          VITE_GITHUB_PAGES: true
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 重要注意事项

### 1. 仓库配置

- 仓库名称必须与 `vite.config.ts` 中的 `base` 路径一致
- 如果仓库名称不同，需要修改 `base` 配置

### 2. 数据文件

项目包含大量股票数据文件（在 `public/data/` 目录）：
- 这些文件会自动包含在构建中
- 确保仓库大小不超过 GitHub 限制

### 3. 路由配置

项目使用 HashRouter 模式，适合 GitHub Pages：
```tsx
<HashRouter>
  {/* 应用组件 */}
</HashRouter>
```

## 故障排除

### 1. 部署失败

检查 GitHub Actions 日志：
1. 进入仓库的 Actions 标签
2. 查看最新的工作流运行
3. 检查错误信息

### 2. 404 错误

- 确认 `vite.config.ts` 中的 `base` 配置正确
- 检查 GitHub Pages 设置
- 确认仓库名称

### 3. 资源加载失败

- 检查构建产物是否正确上传
- 确认所有静态文件路径正确
- 查看浏览器控制台错误

### 4. 白屏问题

- 检查 JavaScript 文件是否正确加载
- 查看控制台错误信息
- 确认路由配置正确

## 本地预览

部署前可以使用以下命令预览：

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 更新部署

每次推送代码到 `main` 分支都会触发自动部署：

1. 提交更改：
```bash
git add .
git commit -m "Update content"
git push origin main
```

2. 等待 GitHub Actions 完成（通常需要 2-5 分钟）

3. 访问网站查看更新

## 性能优化

项目已配置以下优化：

- **代码分割**: Vite 自动进行代码分割
- **资源压缩**: 自动压缩 CSS、JS 和图片
- **缓存策略**: GitHub Pages 自动配置缓存
- **CDN**: GitHub 提供全球 CDN 加速

## 自定义域名（可选）

如果需要使用自定义域名：

1. 在仓库根目录创建 `CNAME` 文件：
```
yourdomain.com
```

2. 在域名提供商处配置 DNS：
```
CNAME -> [你的用户名].github.io
```

3. 在 GitHub Pages 设置中添加自定义域名

## 监控和分析

### GitHub Pages 统计

GitHub Pages 提供基本的访问统计：
1. 进入仓库的 Insights 标签
2. 查看 Traffic 页面

### Google Analytics（可选）

如果需要更详细的分析，可以添加 Google Analytics：
1. 在 `index.html` 中添加跟踪代码
2. 配置 GA4 属性

---

## 快速开始

1. **Fork 本仓库** 或创建新仓库
2. **启用 GitHub Pages**（Settings > Pages > GitHub Actions）
3. **推送代码**到 `main` 分支
4. **等待部署**完成
5. **访问网站**：`https://[你的用户名].github.io/KLineDojo/`

现在你的 K线交易训练游戏就可以在线访问了！🎉
