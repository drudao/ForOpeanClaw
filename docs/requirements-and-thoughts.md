# 浏览器历史记录备份工具 — 需求分析与设计思路

## 📋 需求概述

**用户需求：**
> 做一个备份浏览器历史记录的程序，后端 Spring Boot，前端 Vue，只需要一个页面可以查询和删除备份的数据。点击查询时列表显示历史记录，点击列表可以跳转到对应页面。

**v2.0 新增需求：**
> 1. 选中列表数据 → html2canvas 截图 → 发送到微信公众号草稿
> 2. 编写完整测试用例（JUnit 5 + Mockito）
> 3. 设计文档 + PPT 生成 → 邮件发送
> 4. 代码提交 GitHub

---

## 🧠 思考过程

### 1. 技术选型分析

| 维度 | 选择 | 理由 |
|------|------|------|
| 后端框架 | Spring Boot 3.4 + JPA | 快速开发 REST API，内置数据库支持 |
| 数据库 | H2 (嵌入式) | 零配置，数据持久化为本地文件，无需安装数据库 |
| 浏览器数据读取 | SQLite JDBC | Chrome 历史记录使用 SQLite 存储 |
| 前端框架 | Vue 3 + Vite | 轻量、快速开发 SPA |
| HTTP 客户端 | Axios | 与 Vue 配合良好，支持 Promise |
| 截图工具 | html2canvas | 前端 DOM → Canvas → base64 截图 |
| 微信对接 | 原生 HTTP 请求 | 直接调用微信 API |
| 测试框架 | JUnit 5 + Mockito + MockMvc | Spring Boot 标准测试栈 |
| PPT 生成 | pptxgenjs | Node.js 端生成 .pptx 文件 |
| 邮件发送 | Node.js net/tls | SMTP 直连 QQ 邮箱 |
| 构建工具 | Maven / npm | 标准生态工具 |

### 2. 架构设计

```
┌─────────────┐     HTML5 Canvas      ┌──────────────┐     ┌────────────────┐
│  Vue 3 前端  │  html2canvas 截图      │ Spring Boot │────→│ H2 数据库      │
│  (5173)     │ ────────────────────→ │  后端 API    │     │ history-backup │
│             │     REST (JSON)       │  (8080)      │     └────────────────┘
│  html2canvas │ ←──────────────────── │             │
│  Axios      │                       │             │────→│ 微信公众号 API  │
└─────────────┘                       └─────────────┘     │ 素材 + 草稿箱  │
                                                          └────────────────┘
        外部流程:
        PPT 生成: pptxgenjs → .pptx 文件
        邮件发送: Node tls → smtp.qq.com:465
        GitHub: git push → drudao/ForOpeanClaw
```

### 3. 数据流分析

#### v1.0 核心流程

1. **备份流程：** 用户点击"立即备份" → `POST /api/history/backup` → 后台读取 Chrome SQLite 数据库 → 去重后存入 H2
2. **查询流程：** 用户输入关键词/日期 → `GET /api/history` → JPA 分页查询 → 返回 JSON
3. **删除流程：** 用户点击删除 → `DELETE /api/history/{id}` → 从 H2 中移除
4. **跳转流程：** 用户点击标题/URL → `target="_blank"` 在新标签打开原页面

#### v2.0 新增流程

5. **截图+微信发送流程：**
   - 用户勾选表格行（支持全选）
   - 点击「📤 发送选中到公众号」按钮
   - html2canvas 截图表格区域 → `canvas.toDataURL('image/png')`
   - `POST /api/history/wechat/send` → WeChatService 处理
   - WeChatService: 解码 base64 → 上传微信永久素材 → 创建图文草稿
   - 返回 article_id → 前端显示成功消息

### 4. Chrome 历史数据库解析要点

- Chrome 历史文件位置：`%LOCALAPPDATA%\Google\Chrome\User Data\Default\History`
- Chrome 运行时文件被锁定，需要先**复制副本**再读取
- 时间戳格式：以 1601-01-01 UTC 为起点的微秒数
- 转换公式：`unixSeconds = (chromeTimestamp - 11644473600000000L) / 1000000`
- SQLite 表 `urls` 中包含：`url`、`title`、`last_visit_time` 字段

### 5. REST API 设计

| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| GET | `/api/history` | keyword, startDate, endDate, page, size | 分页查询 |
| DELETE | `/api/history/{id}` | id | 删除单条记录 |
| POST | `/api/history/backup` | - | 触发 Chrome 备份 |
| GET | `/api/history/stats` | - | 统计总记录数 |
| GET | `/api/history/by-ids` | ids=1,2,3 | 根据 ID 获取记录 |
| POST | `/api/history/wechat/send` | imageData, selectedIds, keyword | 截图→微信草稿 |

### 6. 微信公众号集成 (v2.0 核心)

**完整调用链路：**

```
前端 Vue (html2canvas)
  │ canvas.toDataURL('image/png')
  │ POST /api/history/wechat/send { imageData, selectedIds, keyword }
  ▼
WeChatController
  │ @PostMapping("/send")
  │ 解析请求 → 调用 WeChatService
  ▼
WeChatService.sendScreenshotToWeChat()
  │ 1. 解码 base64 → byte[]
  │ 2. 获取 access_token (缓存 2h，自动续期)
  │    GET cgi-bin/token?grant_type=client_credential&appid=xxx&secret=xxx
  │ 3. 上传永久图片素材
  │    POST cgi-bin/material/add_material?type=image (multipart/form-data)
  │    → 返回 media_id
  │ 4. 查询选中记录 (repository.findAllById)
  │ 5. 构建图文 HTML 内容
  │ 6. 创建草稿
  │    POST cgi-bin/draft/add
  │    → 返回 article_id
  ▼
返回 { success: true, articleId: "xxx" }
```

**关键设计决策：**

1. **Token 缓存：** access_token 有效期 2 小时，WeChatService 内存缓存 + 过期自动续期，避免每次请求都获取
2. **图片上传：** 使用 multipart/form-data 格式，前端 base64 → 后端解码为 byte[]
3. **草稿内容：** 截图图片 + 选中记录的 HTML 表格 → 整洁美观
4. **异常处理：** WeChatService 捕获所有异常 → 返回 `{ success: false, message: "..." }`

### 7. 前端变更 (v2.0)

| 组件 | 变更 |
|------|------|
| html2canvas | 新增依赖 (v1.4.1)，npm 已有 |
| 表格行 | 新增复选框列 (col-cb)，支持多选 |
| 头部操作栏 | 新增「📤 发送选中到公众号」按钮 |
| 全选 | 表头/搜索栏全选 checkbox |
| 样式 | 微信绿按钮 `.btn-wechat`，选中行高亮 `.selected` |
| 发送逻辑 | html2canvas 截图 → base64 → POST 后端 |
| 旧截图服务 | 移除 Puppeteer 截图服务 (改为纯前端 html2canvas) |

### 8. 测试策略 (v2.0)

**测试金字塔：**

```
        ╱ 端到端验证 ╲          (手动验证)
       ╱────────────────╲
      ╱  Controller 层   ╲      (@WebMvcTest + MockMvc)
     ╱────────────────────╲
    ╱    Service 层        ╲    (@ExtendWith + Mockito)
   ╱────────────────────────╲
  ╱    ChromeHistoryReader   ╲   (纯单元测试)
 ╱────────────────────────────╲
```

**测试覆盖：**

- **Controller 层 (11 用例):** HistoryController (8) + WeChatController (3)
- **Service 层 (11 用例):** HistoryService (8) + WeChatService (3)
- **工具类 (3 用例):** ChromeHistoryReader (文件/时间戳/模拟数据)
- **总计: 25 测试用例，全部通过**

**测试隔离原则：**
- 所有 Service 测试使用 `@Mock` 模拟 Repository 依赖
- 所有 Controller 测试使用 `@WebMvcTest` + `@MockitoBean`
- WeChatService 测试不实际调用微信 API
- ChromeHistoryReader 使用内存 SQLite 模拟

### 9. PPT 生成修复

**原始问题：** PPT 中文本溢出幻灯片边界
- `contentRows` 的 `step=0.265` + `fontSize=11` 过高
- 密集幻灯片 (S11 项目结构) 文本超出底部
- 图例/流程图元素重叠

**修复方案：**
- 压缩 `step` 至 0.20，`fontSize` 降至 8-10
- 减少头部高度 (1.1→0.9)
- 增加 `maxY` 溢出保护
- 项目结构改用 Courier New + `lineSpacingMultiple`
- 密集幻灯片增加溢出门限检测

### 10. 微信提醒

**状态：SKIPPED**
- 个人微信插件不可用
- 使用邮件通知替代

---

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

### 运行测试
```bash
mvn test
```

### 生成 PPT
```bash
cd browser-history-backup/docs
npm install
node create-ppt.js
```

### 发送邮件
```bash
cd browser-history-backup/docs
node send-email.js
```

### 访问地址
- 前端: http://localhost:5173
- 后端: http://localhost:8080
- H2 控制台: http://localhost:8080/h2-console

---

## 📎 附件清单

1. `docs/项目演示.pptx` — 12 页 PPTX 演示文稿
2. `docs/requirements-and-thoughts.md` — 本文件
3. `docs/test-report.md` — 测试报告
4. `docs/create-ppt.js` — PPT 生成脚本
5. `docs/send-email.js` — 邮件发送脚本

## 🔗 代码仓库

- **GitHub:** `https://github.com/drudao/ForOpeanClaw`
- **分支:** `feature/history-backup`

---

*文档生成时间：2026-07-12 · Sylvanas*
