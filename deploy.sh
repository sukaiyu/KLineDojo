#!/bin/bash

# GitHub Pages 部署脚本
# 使用方法: ./deploy.sh

echo "开始构建和部署到 GitHub Pages..."

# 构建项目
echo "正在构建项目..."
npm run build

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo "构建失败，请检查错误信息"
    exit 1
fi

# 进入构建目录
cd dist

# 初始化 git 仓库（如果还没有）
git init
git add .
git commit -m "Deploy to GitHub Pages"

# 推送到 gh-pages 分支
echo "正在推送到 gh-pages 分支..."
git push -f git@github.com:sukaiyu/KLineDojo.git main:gh-pages

# 返回上级目录
cd ..

echo "部署完成！"
echo "访问 https://sukaiyu.github.io/KLineDojo/ 查看应用"
