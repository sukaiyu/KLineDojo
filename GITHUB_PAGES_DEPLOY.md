# GitHub Pages 部署指南

本项目已经配置支持 GitHub Pages 部署，以下是详细的部署步骤：

## 前置要求

1. 确保你已经有 GitHub 账号
2. 项目已经推送到 GitHub 仓库
3. 仓库名称应该是 `KLineDojo`（如果不同，需要修改配置）

## 配置说明

### 1. Vite 配置
项目已经配置了 `vite.config.ts` 中的 `base: '/KLineDojo/'`，这是 GitHub Pages 需要的基础路径。

如果你的仓库名称不同，请修改：
```typescript
base: '/你的仓库名称/',
```

### 2. 构建配置
项目使用标准构建流程：
```bash
npm run build
```

## 部署方法

### 方法一：手动部署

1. 构建项目：
```bash
npm run build
```

2. 在 GitHub 仓库中设置 GitHub Pages：
   - 进入仓库 Settings
   - 找到 Pages 部分
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main"
   - Folder 选择 "/root"

3. 推送代码到 GitHub：
```bash
git add .
git commit -m "Update for GitHub Pages deployment"
git push origin main
```

### 方法二：使用部署脚本

1. 确保脚本有执行权限：
```bash
chmod +x deploy.sh
```

2. 运行部署脚本：
```bash
./deploy.sh
```

### 方法三：GitHub Actions 自动部署

1. 在项目根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

2. 提交并推送，GitHub Actions 会自动部署

## 重要注意事项

### 1. 路径配置
- 确保 `vite.config.ts` 中的 `base` 路径与仓库名称一致
- 如果使用自定义域名，需要相应调整

### 2. 数据文件
项目使用了大量的股票数据文件（在 `public/data/` 目录下）：
- 这些文件会自动包含在构建中
- 确保 GitHub 仓库没有文件大小限制问题

### 3. 路由处理
React Router 的 HashRouter 模式已经配置，适合 GitHub Pages：
```tsx
<HashRouter>
  {/* 路由配置 */}
</HashRouter>
```

## 部署后访问

部署成功后，可以通过以下地址访问：
```
https://你的用户名.github.io/KLineDojo/
```

## 故障排除

### 1. 404 错误
- 检查 `vite.config.ts` 中的 `base` 配置
- 确认 GitHub Pages 设置正确

### 2. 资源加载失败
- 检查资源路径是否正确
- 确认所有文件都在 `dist` 目录中

### 3. 白屏问题
- 检查浏览器控制台错误
- 确认 JavaScript 文件正确加载

## 本地预览

部署前可以使用以下命令预览：
```bash
npm run preview
```

## 更新部署

每次更新代码后：
1. 提交并推送到 GitHub
2. 重新构建（如果是手动部署）
3. 等待 GitHub Pages 更新（通常需要几分钟）

## 性能优化

- 项目已经配置了代码分割
- 图片和资源文件已优化
- 可以考虑使用 CDN 加速静态资源

## 域名配置（可选）

如果需要使用自定义域名：
1. 在仓库根目录创建 `CNAME` 文件
2. 在域名提供商处配置 DNS
3. 在 GitHub Pages 设置中添加自定义域名

---

部署完成后，你的 K线交易训练游戏就可以在线访问了！
