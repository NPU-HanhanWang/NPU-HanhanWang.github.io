# 个人学术博客

## 项目概述

一个基于 GitHub Pages 的纯静态个人学术博客，使用 HTML/CSS/JS 构建，无需任何构建工具或框架。

## 功能特性

- **中英双语切换**：所有界面文本和内容均支持中英文切换
- **Markdown 渲染**：课程笔记和项目文档使用 Markdown 编写，自动渲染为 HTML
- **课程管理**：支持多课程、多章节的笔记组织，侧边栏章节导航
- **项目展示**：项目卡片展示 + 详情页渲染
- **响应式设计**：适配桌面端、平板和移动端
- **Web Components**：使用自定义元素实现导航栏和页脚的跨页面复用

## 技术栈

| 技术 | 用途 |
|------|------|
| HTML5 | 页面结构 |
| CSS3 | 样式与响应式布局 |
| JavaScript (ES6+) | 交互逻辑、i18n、动态渲染 |
| marked.js | Markdown 解析与渲染 |
| Font Awesome | 图标库 |
| GitHub Pages | 托管与部署 |

## 项目结构

```
/
├── index.html          # 首页
├── courses.html        # 课程页面
├── projects.html       # 项目页面
├── css/style.css       # 全局样式
├── js/
│   ├── main.js         # 共享逻辑
│   └── md-renderer.js  # Markdown 渲染器
└── content/            # 内容文件
    ├── courses.json
    ├── projects.json
    ├── courses/
    └── projects/
```
