---
title: "个人学术博客"
description: "基于 Node.js + Nunjucks 静态构建的个人学术博客，已部署到 GitHub Pages"
tags: ["Node.js", "Nunjucks", "Markdown", "GitHub Pages"]
order: 1
featured: true
links:
  github: "https://github.com/NPU-HanhanWang/NPU-HanhanWang.github.io"
  demo: "https://NPU-HanhanWang.github.io"
---

# 个人学术博客

## 项目概述

一个基于 GitHub Pages 的纯静态个人学术博客。使用 **Node.js + Nunjucks** 构建流水线：所有内容以 Markdown 编写，构建时渲染为 HTML 静态文件，无需后端服务。

## 功能特性

- **静态站点生成**：`build.js` 扫描 `content/` 目录，通过 Nunjucks 模板渲染为 `public/` 静态站点
- **Markdown 渲染**：课程笔记、项目文档、博客文章均使用 Markdown 编写，支持代码高亮、LaTeX 公式与 Mermaid 图表
- **课程管理**：多课程、多章节的笔记组织，侧边栏章节导航与上一章/下一章切换
- **项目展示**：项目卡片 + 详情页 + 子页面渲染
- **双语支持**：`.zh.md` / `.en.md` 双语文档结构
- **暗色模式**：亮/暗主题切换，跟随系统偏好
- **响应式设计**：适配桌面端、平板和移动端
- **SEO 完善**：自动生成 sitemap.xml，含 robots.txt 与 Open Graph 标签

## 技术栈

| 技术 | 用途 |
|------|------|
| Node.js | 构建脚本运行时 |
| Nunjucks | 模板引擎，页面渲染 |
| gray-matter + marked | Markdown 解析与 HTML 渲染 |
| highlight.js | 代码语法高亮 |
| HTML5 / CSS3 | 页面结构与样式 |
| JavaScript (ES6+) | 暗色模式、移动端导航等交互 |
| GitHub Pages | 托管与部署 |

## 项目结构

```
/
├── build.js             # 静态站点构建脚本
├── templates/           # Nunjucks 页面模板
├── static/              # CSS / JS / 图片等静态资源
├── content/             # Markdown 内容文件
│   ├── home.zh.md       # 首页
│   ├── about.zh.md      # 关于页
│   ├── courses/         # 课程笔记
│   ├── projects/        # 项目
│   ├── blog/            # 博客文章
│   ├── courses.json     # 课程元数据
│   └── projects.json    # 项目元数据
└── public/              # 构建输出（部署目录）
```

## 本地开发

```bash
npm install     # 安装依赖
npm run build   # 构建到 public/
npx serve public/   # 本地预览
```
