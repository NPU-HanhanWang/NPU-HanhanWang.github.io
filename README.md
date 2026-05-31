```markdown
# 📚 韩涵的知识库

> **零维护静态站点** — 只需在 `content/` 目录添加 Markdown 文件，构建脚本会自动生成所有内容。无需手动维护任何列表。

## ✨ 特性

- 📝 **Markdown 驱动** — 用 Markdown 写内容，自动渲染为 HTML
- 🌐 **双语支持** — `.en.md` + `.zh.md` 文件配对，一键切换语言
- 🤖 **自动扫描** — 扫描 `content/` 目录，自动发现课程、项目、博客文章
- 📂 **零手动列表** — 所有索引都从文件系统自动生成
- 🌓 **暗色模式** — 跟随系统偏好或手动切换，记住你的选择
- 📱 **响应式设计** — 完美适配桌面端、平板和手机
- 📶 **阅读进度条** — 在内容页面顶部显示阅读进度
- 🔗 **GitHub Pages 就绪** — 推送到 `main` 分支后通过 GitHub Actions 自动部署

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 构建站点
npm run build

# 3. 本地预览
npm run preview
# 或：npx serve public/
# 或：python3 -m http.server -d public/

# 4. 清理构建输出
npm run clean
```

构建后的站点在 `public/` 目录 — 在浏览器中打开 `public/index.html`，或使用上面的预览命令。

## 📁 项目结构

```
.
├── content/                  # ✏️ 你的 Markdown 内容（只需编辑这里）
│   ├── home.md               #   → 首页
│   ├── about.md              #   → 关于页面
│   ├── courses/              #   → 课程栏目
│   │   └── my-course/        #     每个课程是一个文件夹
│   │       ├── index.en.md   #       课程首页（英文）
│   │       ├── index.zh.md   #       课程首页（中文）
│   │       ├── chapter-01.en.md
│   │       └── chapter-01.zh.md
│   ├── projects/             #   → 项目栏目
│   │   └── my-project/       #     每个项目是一个文件夹
│   │       ├── index.en.md
│   │       └── index.zh.md
│   ├── blog/                 #   → 博客栏目
│   │   ├── my-post.en.md
│   │   └── my-post.zh.md
│   ├── courses.json          #   可选：课程元数据扩展
│   └── projects.json         #   可选：项目元数据扩展
├── templates/                # Nunjucks HTML 模板
├── static/                   # 静态资源（CSS、JS、图片）
│   ├── css/style.css
│   └── js/main.js
├── build.js                  # 构建脚本
├── public/                   # 生成的站点（git 忽略）
├── package.json
└── .github/workflows/deploy.yml
```

## 📝 内容规范

### 双语内容

创建配对的 `.en.md` 和 `.zh.md` 文件：

```
content/courses/计算机视觉/index.en.md
content/courses/计算机视觉/index.zh.md
```

站点会自动检测双语内容并启用语言切换功能。

### 单语内容

如果只需要一种语言，直接使用普通的 `.md` 文件即可：

```
content/home.md
content/about.md
```

### Frontmatter（可选）

你可以在任何 `.md` 文件头部添加 YAML frontmatter：

```yaml
---
title: "我的自定义标题"
description: "简短描述"
order: 1
tags:
  - Python
  - 深度学习
date: 2024-03-15
featured: true
links:
  github: https://github.com/user/repo
  demo: https://example.com
---
```

所有 frontmatter 字段都是可选的 — 构建脚本会从文件内容中推导出合理的默认值。

### 排序规则

章节和列表项的排序优先级：
1. frontmatter 中的 `order` 字段（如果存在）
2. 文件名中的数字前缀（如 `01-简介.md` 在 `02-进阶.md` 之前）
3. 字母顺序（兜底排序）

### 课程结构

```
content/courses/<课程名>/
├── index.en.md              # 课程首页（概览）
├── index.zh.md
├── 第01章.en.md              # 章节文件
├── 第01章.zh.md
├── 第02章.en.md
└── 第02章.zh.md
```

### 项目结构

```
content/projects/<项目名>/
├── index.en.md              # 项目首页
├── index.zh.md
├── 技术方案.en.md            # 可选子页面
└── 成果展示.zh.md
```

## 🚢 部署

### GitHub Pages（自动部署）

推送到 `main` 分支 — GitHub Actions 会自动构建并部署到 GitHub Pages。

1. 进入仓库的 **Settings → Pages**
2. 将 **Source** 设置为 **GitHub Actions**

### 手动部署

```bash
npm run build
# 将 public/ 目录部署到你的托管服务
```

### 自定义 Base URL

如果你的站点从子目录（如 `https://user.github.io/my-project/`）提供访问，请在构建时设置 `BASE_URL` 环境变量：

```bash
BASE_URL=/my-project npm run build
```

这会为所有资源路径和链接添加 `/my-project` 前缀。

## 🛠️ 配置

编辑 `build.js` 开头的 `SITE_CONFIG` 对象进行自定义：

- `baseUrl` — 基础 URL 路径（或使用 `BASE_URL` 环境变量）
- `title` — 站点标题
- `description` — 站点描述
- `nav` — 导航链接
- `footer` — 页脚文字和社交链接

## 🛠️ 技术栈

| 技术                                                        | 用途                 |
| ----------------------------------------------------------- | -------------------- |
| [marked](https://marked.js.org)                             | Markdown → HTML 渲染 |
| [gray-matter](https://github.com/jonschlinkert/gray-matter) | Frontmatter 解析     |
| [Nunjucks](https://mozilla.github.io/nunjucks/)             | HTML 模板引擎        |
| [GitHub Pages](https://pages.github.com)                    | 托管服务             |
| [GitHub Actions](https://github.com/features/actions)       | CI/CD 自动部署       |

## 📄 许可证

MIT License
```