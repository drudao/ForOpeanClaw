# 浏览器历史记录备份工具 — 需求分析与设计思路

## 📋 需求概述

**用户需求：**
> 做一个备份浏览器历史记录的程序，后端 Spring Boot，前端 Vue，只需要一个页面可以查询和删除备份的数据。点击查询时列表显示历史记录，点击列表可以跳转到对应页面。

## 🧠 思考流程

### 1. 技术选型分析

| 维度 | 选择 | 理由 |
|------|------|------|
| 后端框架 | Spring Boot 3.4 + JPA | 快速开发 REST API，内置数据库支持 |
| 数据库 | H2 (嵌入式) | 零配置，数据持久化为本地文件，无需安装数据库 |
| 浏览器数据读取 | SQLite JDBC | Chrome 历史记录使用 SQLite 存储 |
| 前端框架 | Vue 3 + Vite | 轻量、快速开发 SPA |
| HTTP 客户端 | Axios | 与 Vue 配合良好，支持 Promise |
| 构建工具 | Maven / npm | 标准生态工具 |

### 2. 架构设计

```
┌─────────────┐     HTTP/REST     ┌──────────────┐
│  Vue 前端    │ ──────────────── │ Spring Boot  │
│  (localhost  │                  │  后端 API     │
│   :5173)     │ ◀─────────────── │ (localhost    │
└─────────────┘                   │  :8080)       │
                                  └──────┬───────┘
                                         │
                                  ┌──────▼───────┐
                                  │  H2 数据库    │
                                  │ (history-    │
                                  │  backup.mv)  │
                                  └──────────────┘

浏览器历史记录流程：
  Chrome SQLite ──→ 复制文件 ──→ SQLite JDBC 读取 ──→ 存入 H2 ──→ REST API 查询
```

### 3. 数据流分析

1. **备份流程：** 用户点击"立即备份" → POST /api/history/backup → 后台读取 Chrome 的 SQLite 历史数据库 → 去重后存入 H2
2. **查询流程：** 用户输入关键词/日期 → GET /api/history → JPA 分页查询 → 返回 JSON
3. **删除流程：** 用户点击删除 → DELETE /api/history/{id} → 从 H2 中移除
4. **跳转流程：** 用户点击标题/URL → `target="_blank"` 在新标签打开原页面

### 4. Chrome 历史数据库解析要点

- Chrome 历史文件位置：`%LOCALAPPDATA%\Google\Chrome\User Data\Default\History`
- Chrome 运行时文件被锁定，需要先**复制副本**再读取
- 时间戳格式：以 1601-01-01 UTC 为起点的微秒数，需转换为标准时间
- SQLite 表 `urls` 中包含：`url`、`title`、`last_visit_time` 字段

### 5. API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/history | 查询历史（支持 keyword、startDate、endDate、page、size） |
| DELETE | /api/history/{id} | 删除单条记录 |
| POST | /api/history/backup | 手动触发备份 |
| GET | /api/history/stats | 获取统计数据 |
| POST | /api/history/wechat/send | 发送截图到公众号草稿 |

### 6. 微信公众平台集成

**新增功能：选中记录 → 截图 → 发送到公众号**

1. **前端多选：** 每行增加复选框，支持全选/单选
2. **html2canvas 截图：** 点击「发送选中到公众号」按钮后，html2canvas 捕获表格区域生成 PNG 截图
3. **后端调用微信 API：** WeChatService 接收 base64 图片 → 上传为永久素材 → 创建图文草稿
4. **草稿内容：** 截图图片 + 选中记录的表格详情

#### 微信 API 调用流程

```
POST /api/history/wechat/send (前端 → 后端)
  ↓
WeChatService.sendScreenshotToWeChat()
  ↓
cgi-bin/token?grant_type=client_credential (获取 access_token)
  ↓
cgi-bin/material/add_material?type=image (上传永久图片)
  ↓
cgi-bin/draft/add (创建图文草稿)
  ↓
返回 article_id → 前端显示成功
```

#### 前端组件变更

| 组件 | 变更 |
|------|------|
| 表格行 | 新增复选框列 (col-cb) |
| 头部操作栏 | 新增「发送选中到公众号」按钮 |
| 搜索栏 | 新增「全选」复选框 |
| 样式 | 新增 .btn-wechat (微信绿)、.selected 行高亮 |

#### 安全性注意

- AppID 和 AppSecret 存储在 application.yml 和本地配置文件中
- access_token 内存缓存，过期自动续期
- API 调用仅允许后端发起，前端不直接接触微信凭证

### 7. 前端页面设计

单页面应用，三个功能区域：
1. **顶部：** 标题 + 总记录数 + "立即备份"按钮
2. **中部：** 查询条件（关键词搜索 + 时间范围选择 + 查询/清空按钮）
3. **底部：** 分页表格（序号、标题、URL、访问时间、浏览器、操作列）

每个 URL/标题都是可点击的链接，点击在新标签页打开。

## ✅ 运行说明

### 启动后端
```bash
cd browser-history-backup
mvn spring-boot:run
```

### 启动前端
```bash
cd browser-history-backup/frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173` 即可使用。

---

*文档生成时间：2026-07-05*
