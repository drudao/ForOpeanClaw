const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'WIDE', width: 10, height: 5.625 });
pptx.layout = 'WIDE';
pptx.author = 'Sylvanas';
pptx.subject = '浏览器历史记录备份工具 - v2.0 - 项目演示';

// ===== Color Palette =====
const C = {
  navy:    '0f172a',
  blue:    '3b82f6',
  indigo:  '4f46e5',
  teal:    '0d9488',
  emerald: '10b981',
  amber:   'f59e0b',
  rose:    'f43f5e',
  slate50: 'f8fafc',
  slate100:'f1f5f9',
  slate200:'e2e8f0',
  slate400:'94a3b8',
  slate600:'475569',
  slate800:'1e293b',
  wechat:  '07c160',
  white:   'ffffff'
};

// ===== Slide Helpers =====

function bg(slide, color) {
  slide.background = { fill: color };
}

function addHeaderBar(slide, title, subtitle) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.navy }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 0.85, w: 1.8, h: 0.035, fill: { color: C.indigo }
  });
  slide.addText(title, {
    x: 0.5, y: 0.1, w: 9, h: 0.45,
    fontSize: 20, color: C.white, bold: true, fontFace: 'Arial'
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.52, w: 9, h: 0.3,
      fontSize: 10, color: C.slate400, fontFace: 'Arial'
    });
  }
}

function addFooter(slide, text) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 5.38, w: 10, h: 0.245, fill: { color: C.navy }
  });
  slide.addText(text || 'Sylvanas · 2026-07-12', {
    x: 0.5, y: 5.38, w: 9, h: 0.245,
    fontSize: 7, color: C.slate400, align: 'right', fontFace: 'Arial'
  });
}

function standardSlide(title) {
  const s = pptx.addSlide();
  bg(s, C.slate50);
  addHeaderBar(s, title);
  addFooter(s);
  return s;
}

function sectionSlide(title, subtitle) {
  const s = pptx.addSlide();
  bg(s, C.navy);
  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 2.4, w: 2.0, h: 0.04, fill: { color: C.indigo }
  });
  s.addText(title, {
    x: 0.8, y: 1.5, w: 8.4, h: 1.0,
    fontSize: 32, color: C.white, bold: true, fontFace: 'Arial'
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.8, y: 2.7, w: 8.4, h: 0.7,
      fontSize: 16, color: C.slate400, fontFace: 'Arial'
    });
  }
  return s;
}

function contentRows(slide, items, startY) {
  let y = startY || 1.2;
  const step = 0.22;
  const maxY = 5.2; // Keep within footer
  items.forEach(line => {
    if (y >= maxY) return; // overflow protection
    if (line === '-') { y += 0.06; return; }
    if (line.startsWith('##')) {
      const txt = line.replace(/^##\s*/, '');
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: y + 0.03, w: 1.2, h: 0.018, fill: { color: C.indigo }
      });
      slide.addText(txt, {
        x: 0.5, y, w: 9, h: step + 0.05,
        fontSize: 12, color: C.navy, bold: true, fontFace: 'Arial', valign: 'middle'
      });
      y += step + 0.03;
    } else {
      const indent = line.indexOf('  -') === 0 ? 0.8 : line.startsWith('-') ? 0.5 : 0.5;
      const text = line.replace(/^\s*-\s*/, '').replace(/^\s*-\s*/, '');
      const prefix = line.indexOf('  -') === 0 ? '  ◦ ' : line.startsWith('-') ? '▸ ' : '';
      // Shrink font for deeply nested or long lines
      const fontSize = text.length > 80 ? 8 : (text.length > 60 ? 9 : 10);
      slide.addText(prefix + text, {
        x: indent, y, w: 9.2 - indent, h: step - 0.02,
        fontSize: fontSize, color: C.slate800, fontFace: 'Arial', valign: 'middle'
      });
      y += step - 0.02;
    }
  });
}

// ===== Box helper for diagrams =====
function addBox(slide, x, y, w, h, fc, bc, text, opts) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, fill: { color: fc }, line: { color: bc, width: 1 }, rectRadius: 0.04,
    shadow: { type: 'outer', blur: 2, offset: 1, color: '000000', opacity: 0.08 }
  });
  slide.addText(text, {
    x, y, w, h, fontSize: opts?.fontSize || 8, color: C.slate800, align: 'center', valign: 'middle', fontFace: 'Arial'
  });
}

function addArrow(slide, x1, y1, x2, y2, color, dash) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color: color || C.slate400, width: 1, endArrowType: 'triangle', dashType: dash || 'solid' }
  });
}

// =====================================================================
// SLIDES
// =====================================================================

// ----- S1: Cover -----
{
  const s = pptx.addSlide();
  bg(s, C.navy);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 5.625, fill: { color: C.indigo } });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.8, w: 2.5, h: 0.04, fill: { color: C.indigo } });
  s.addText('浏览器历史记录', {
    x: 0.8, y: 1.3, w: 8.4, h: 0.8,
    fontSize: 38, color: C.white, bold: true, fontFace: 'Arial'
  });
  s.addText('备份工具 v2.0', {
    x: 0.8, y: 1.9, w: 8.4, h: 0.8,
    fontSize: 38, color: C.indigo, bold: true, fontFace: 'Arial'
  });
  s.addText('Spring Boot 3.4 + Vue 3 + H2 + 微信公众号 + GitHub', {
    x: 0.8, y: 3.0, w: 8.4, h: 0.4,
    fontSize: 13, color: C.slate400, fontFace: 'Arial'
  });
  s.addText('Sylvanas · 2026-07-12', {
    x: 0.8, y: 4.8, w: 8.4, h: 0.3,
    fontSize: 11, color: C.slate600, fontFace: 'Arial'
  });
}

// ----- S2: Table of Contents -----
{
  const s = standardSlide('目录');
  contentRows(s, [
    '## 01  需求分析',
    '- Chrome 历史记录备份 → 查询/删除/跳转/发送到公众号',
    '- v2.0: 多选截图 + 微信草稿 + JUnit 测试',
    '## 02  系统架构',
    '- Vue 3 前端 → Spring Boot API → H2 / 微信 / GitHub',
    '- Chrome SQLite → html2canvas → WeChat API → Draft',
    '## 03  完整数据流',
    '- 备份流 · 查询流 · 微信发送流 · 邮件流 · 推送流',
    '## 04  关键技术 & 测试',
    '- Chrome 读取 / html2canvas / WeChat / SMTP / JUnit'
  ]);
}

// ----- S3: Requirements -----
{
  const s = standardSlide('需求分析');
  contentRows(s, [
    '## 用户需求 (v1.0)',
    '- "做一个备份浏览器历史记录的程序"',
    '- 后端 Spring Boot → REST API',
    '- 前端 Vue 单页面 → 查询/删除/点击跳转',
    '## 新增需求 (v2.0)',
    '- 选中列表数据 → 页面截图 → 发到公众号草稿',
    '- 写测试用例 + 思考流程 + PPT → 邮件发送',
    '- 代码提交 GitHub → 微信提醒',
    '## 交付物',
    '- 全栈代码 + JUnit 测试 + HTML PPT + 邮件 + GitHub'
  ]);
}

// ----- S4: Thought Process -----
{
  const s = standardSlide('我的思考过程');
  contentRows(s, [
    '## 后端技术选型',
    '- Spring Boot 3.4 + JPA/H2 + SQLite JDBC',
    '- WeChatService: token 缓存 → 上传素材 → 创建草稿',
    '- JUnit 5 + Mockito: Controller/Service 分层测试',
    '## 前端技术选型',
    '- Vue 3 + Vite + Axios + html2canvas',
    '- 多选/全选 + 截图捕获 + 发送到后端',
    '## 运维流程选型',
    '- SMTP 直连 QQ 邮箱 — Node.js net+tls 模块',
    '- Git HTTPS + PAT → drudao/ForOpeanClaw',
    '- Maven 阿里云镜像 → 国内构建提速'
  ]);
}

// ----- S5: System Architecture Diagram -----
{
  const s = pptx.addSlide();
  bg(s, C.slate50);
  addHeaderBar(s, '系统架构图', 'Chrome → 后端 → H2 / 前端 / 微信 / 邮件 / GitHub');
  addFooter(s);

  const boxH = 0.75;
  const y1 = 1.2; const y2 = 2.25; const y3 = 3.5;

  s.addText('数据源', { x: 0.3, y: 1.0, w: 2, h: 0.2, fontSize: 9, color: C.slate400, fontFace: 'Arial' });
  s.addText('业务层', { x: 3.0, y: 1.0, w: 2, h: 0.2, fontSize: 9, color: C.slate400, fontFace: 'Arial' });
  s.addText('展示/交付', { x: 6.8, y: 1.0, w: 2, h: 0.2, fontSize: 9, color: C.slate400, fontFace: 'Arial' });

  addBox(s, 0.3, y1, 2.0, boxH, 'fffbeb', C.amber, 'Chrome 浏览器\nHistory SQLite', { fontSize: 9 });
  addBox(s, 3.0, y1, 2.2, boxH, 'eff6ff', C.blue, 'Spring Boot 后端\nController → Service → JPA', { fontSize: 9 });
  addBox(s, 6.0, y1, 2.0, boxH, 'f5f3ff', C.indigo, 'Vue 3 前端\nhtml2canvas 多选', { fontSize: 9 });

  addArrow(s, 2.3, y1 + boxH/2, 3.0, y1 + boxH/2);
  addArrow(s, 5.2, y1 + boxH/2, 6.0, y1 + boxH/2);
  s.addText('REST API', { x: 5.2, y: y1 - 0.2, w: 0.8, h: 0.2, fontSize: 6, color: C.slate400, align: 'center', fontFace: 'Arial' });

  // H2
  addBox(s, 3.0, y2, 1.8, boxH-0.1, 'ecfdf5', C.emerald, 'H2 数据库\n(本地文件)', { fontSize: 9 });
  addArrow(s, 4.0, y1 + boxH, 4.0, y2);
  s.addText('JPA', { x: 3.6, y: y1 + boxH + 0.08, w: 0.5, h: 0.2, fontSize: 7, color: C.slate400, align: 'center', fontFace: 'Arial' });

  // WeChat, QQ Mail, GitHub on row 3
  addBox(s, 0.3, y3, 1.7, boxH-0.05, 'ecfdf5', C.wechat, '微信公众号\nAPI 草稿箱', { fontSize: 8 });
  addBox(s, 2.3, y3, 1.7, boxH-0.05, 'fff1f2', C.rose, 'SMTP\nQQ 邮箱', { fontSize: 8 });
  addBox(s, 4.3, y3, 1.7, boxH-0.05, 'eef2ff', C.indigo, 'GitHub\nForOpeanClaw', { fontSize: 8 });

  // Dotted lines from backend to services
  addArrow(s, 4.8, y1 + boxH, 4.8, y3, C.slate300, 'dash');
  s.addText('WeChat / SMTP / Git', { x: 4.8, y: y2 + 0.2, w: 0.6, h: 0.6, fontSize: 6, color: C.slate400, align: 'center', fontFace: 'Arial' });

  // Legend - smaller, to the right
  const leg = [
    ['fffbeb', C.amber, '数据源'],
    ['eff6ff', C.blue, '业务服务'],
    ['ecfdf5', C.emerald, '数据库'],
    ['f5f3ff', C.indigo, '前端'],
    ['ecfdf5', C.wechat, '微信'],
    ['fff1f2', C.rose, '外部服务'],
    ['eef2ff', C.indigo, '代码仓库']
  ];
  s.addText('图例', { x: 6.8, y: 2.4, w: 2, h: 0.2, fontSize: 9, color: C.navy, bold: true, fontFace: 'Arial' });
  leg.forEach(([fc, bc, txt], i) => {
    s.addShape(pptx.ShapeType.rect, { x: 6.8, y: 2.65 + i * 0.25, w: 0.22, h: 0.18, fill: { color: fc }, line: { color: bc, width: 0.5 } });
    s.addText(txt, { x: 7.1, y: 2.63 + i * 0.25, w: 1.8, h: 0.22, fontSize: 7, color: C.slate600, fontFace: 'Arial', valign: 'middle' });
  });
}

// ----- S6: Data Flow Diagram -----
{
  const s = pptx.addSlide();
  bg(s, C.slate50);
  addHeaderBar(s, '完整数据流图', '备份 / 查询 / 删除 / 微信发送 / 邮件 / GitHub');
  addFooter(s);

  const addFlowRow = (title, steps, startY) => {
    s.addText(title, { x: 0.3, y: startY, w: 3, h: 0.2, fontSize: 10, color: C.navy, bold: true, fontFace: 'Arial' });
    const boxY = startY + 0.22;
    steps.forEach((o, i) => {
      addBox(s, o.x, boxY, o.w, 0.4, o.fc, o.bc, o.text, { fontSize: 6 });
      if (i < steps.length - 1) {
        const nextX = steps[i+1].x;
        addArrow(s, o.x + o.w, boxY + 0.2, nextX, boxY + 0.2);
      }
    });
  };

  addFlowRow('① 备份流程', [
    { text: '点击备份', x: 0.15, w: 0.7, fc: 'f5f3ff', bc: C.indigo },
    { text: 'POST /backup', x: 1.0, w: 0.85, fc: 'eff6ff', bc: C.blue },
    { text: '复制SQLite', x: 2.0, w: 0.75, fc: 'fffbeb', bc: C.amber },
    { text: 'JDBC解析', x: 2.9, w: 0.75, fc: 'fffbeb', bc: C.amber },
    { text: '去重存H2', x: 3.8, w: 0.75, fc: 'ecfdf5', bc: C.emerald },
    { text: '返回结果', x: 4.7, w: 0.7, fc: 'eff6ff', bc: C.blue }
  ], 1.05);

  addFlowRow('② 查询流程', [
    { text: 'Vue输入条件', x: 0.15, w: 0.85, fc: 'f5f3ff', bc: C.indigo },
    { text: 'GET /history', x: 1.15, w: 0.9, fc: 'eff6ff', bc: C.blue },
    { text: 'JPA查H2', x: 2.2, w: 0.8, fc: 'ecfdf5', bc: C.emerald },
    { text: '返回JSON', x: 3.15, w: 0.8, fc: 'eff6ff', bc: C.blue },
    { text: 'Vue表格展示', x: 4.1, w: 0.85, fc: 'f5f3ff', bc: C.indigo }
  ], 1.85);

  addFlowRow('③ 微信发送流程 (新增)', [
    { text: 'Vue勾选行', x: 0.15, w: 0.7, fc: 'f5f3ff', bc: C.indigo },
    { text: 'html2canvas', x: 1.0, w: 0.75, fc: 'f5f3ff', bc: C.indigo },
    { text: 'POST /wechat/send', x: 1.9, w: 0.95, fc: 'eff6ff', bc: C.blue },
    { text: '微信上传素材', x: 3.0, w: 0.8, fc: 'ecfdf5', bc: C.wechat },
    { text: '创建草稿', x: 3.95, w: 0.75, fc: 'ecfdf5', bc: C.wechat },
    { text: '返回articleId', x: 4.85, w: 0.8, fc: 'eff6ff', bc: C.blue }
  ], 2.65);

  addFlowRow('④ 邮件 & GitHub 推送', [
    { text: 'Node脚本\nSMTP直连', x: 0.15, w: 1.0, fc: 'eff6ff', bc: C.blue },
    { text: 'QQ邮箱\n带附件', x: 1.3, w: 1.0, fc: 'fff1f2', bc: C.rose },
    { text: 'Git命令\nHTTPS+Token', x: 3.2, w: 1.0, fc: 'eff6ff', bc: C.blue },
    { text: 'GitHub\n远程仓库', x: 4.35, w: 1.0, fc: 'eef2ff', bc: C.indigo }
  ], 3.45);

  addArrow(s, 2.3, 3.95, 3.2, 3.95, C.slate300, 'dash');
}

// ----- S7: API Design -----
{
  const s = pptx.addSlide();
  bg(s, C.slate50);
  addHeaderBar(s, 'REST API 接口设计');
  addFooter(s);

  const rows = [
    [{ text: '方法', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9, fontFace: 'Arial' } },
     { text: '路径', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9, fontFace: 'Arial' } },
     { text: '参数', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9, fontFace: 'Arial' } },
     { text: '说明', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9, fontFace: 'Arial' } }],
    [{ text: 'GET', options: { color: C.blue, bold: true, fontSize: 9, fontFace: 'Arial' } },
     { text: '/api/history', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: 'keyword, page, size, startDate, endDate', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '分页查询历史记录', options: { fontSize: 9, fontFace: 'Arial' } }],
    [{ text: 'DELETE', options: { color: C.rose, bold: true, fontSize: 9, fontFace: 'Arial' } },
     { text: '/api/history/{id}', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: 'id', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '删除单条记录', options: { fontSize: 9, fontFace: 'Arial' } }],
    [{ text: 'POST', options: { color: C.emerald, bold: true, fontSize: 9, fontFace: 'Arial' } },
     { text: '/api/history/backup', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '-', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '手动触发 Chrome 备份', options: { fontSize: 9, fontFace: 'Arial' } }],
    [{ text: 'GET', options: { color: C.blue, bold: true, fontSize: 9, fontFace: 'Arial' } },
     { text: '/api/history/stats', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '-', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '获取备份总记录数', options: { fontSize: 9, fontFace: 'Arial' } }],
    [{ text: 'POST', options: { color: C.emerald, bold: true, fontSize: 9, fontFace: 'Arial' } },
     { text: '/api/history/wechat/send', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: 'imageData, selectedIds, keyword', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '截图→微信素材→公众号草稿', options: { fontSize: 9, fontFace: 'Arial' } }]
  ];

  s.addTable(rows, { x: 0.3, y: 1.1, w: 9.4, h: 2.4, colW: [0.7, 2.3, 3.2, 3.2], border: { type: 'solid', color: C.slate200, pt: 1 }, rowH: [0.35, 0.35, 0.35, 0.35, 0.35, 0.35] });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.7, w: 1.2, h: 0.025, fill: { color: C.indigo } });
  s.addText('核心后端类', { x: 0.5, y: 3.78, w: 9, h: 0.25, fontSize: 12, color: C.navy, bold: true, fontFace: 'Arial' });
  s.addText(
    'HistoryController      REST API 入口，5 个端点' + "\n" +
    'WeChatController         微信公众号 API 转发' + "\n" +
    'HistoryService          业务逻辑层 + @Scheduled 定时备份' + "\n" +
    'WeChatService           微信 token/素材/草稿管理' + "\n" +
    'ChromeHistoryReader   SQLite 文件读取 + 时间戳转换' + "\n" +
    'HistoryRecord           JPA 实体，映射 history_records 表' + "\n" +
    'HistoryRecordRepository Spring Data JPA 自定义查询接口',
    { x: 0.5, y: 4.05, w: 9, h: 1.1, fontSize: 8, color: C.slate600, fontFace: 'Courier New', valign: 'top', lineSpacingMultiple: 1.1 }
  );
}

// ----- S8: Key Technologies -----
{
  const s = standardSlide('关键技术实现');
  contentRows(s, [
    '## Chrome 历史记录读取',
    '- 文件: %LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\History',
    '- Chrome 运行时锁定 → 复制副本再读取',
    '- 时间戳: 1601-01-01 UTC 微秒 → LocalDateTime',
    '## html2canvas 截图',
    '- 捕获 DOM 元素 → canvas → base64 → POST 到后端',
    '- scale=2 高清输出，useCORS 跨域支持',
    '## 微信公众号 API',
    '- token 缓存: 2h 有效期，过期自动续期',
    '- 上传永久素材: /material/add_material?type=image',
    '- 创建图文草稿: /draft/add',
    '## JUnit 5 + Mockito',
    '- @WebMvcTest 测试 Controller 端点',
    '- @ExtendWith(MockitoExtension) 测试 Service',
    '## SMTP & GitHub',
    '- smtp.qq.com:465 (SSL) + PAT Token'
  ]);
}

// ----- S9: WeChat Integration Detail -----
{
  const s = pptx.addSlide();
  bg(s, C.slate50);
  addHeaderBar(s, '微信集成详解 - 前端', 'Vue 3 + html2canvas + 多选/全选');
  addFooter(s);

  // Left: Frontend flow
  s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 1.1, w: 4.6, h: 3.6, fill: { color: C.white }, line: { color: C.slate200, width: 1 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.06 } });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.1, w: 4.6, h: 0.3, fill: { color: C.indigo } });
  s.addText('🖥 前端实现', { x: 0.5, y: 1.1, w: 4.1, h: 0.3, fontSize: 10, color: C.white, bold: true, fontFace: 'Arial', valign: 'middle' });

  const feLines = [
    '每行新增 checkbox 列 (col-cb)',
    'header 全选 checkbox',
    '选中行高亮 .selected 样式',
    '选中数量 > 0 时显示绿色按钮:',
    '  "📤 发送选中到公众号"',
    '点击后 html2canvas 捕获表格',
    'canvas.toDataURL("image/png")',
    'POST { imageData, selectedIds }',
    '显示成功/失败消息 5 秒',
    '成功自动清空选中状态'
  ];
  feLines.forEach((line, i) => {
    s.addText(line, {
      x: 0.5, y: 1.55 + i * 0.25, w: 4.1, h: 0.22,
      fontSize: 8, color: line.startsWith('  ') ? C.slate400 : C.slate800, fontFace: line.startsWith('  ') ? 'Courier New' : 'Arial', valign: 'middle'
    });
  });

  // Right: Backend flow
  s.addShape(pptx.ShapeType.roundRect, { x: 5.2, y: 1.1, w: 4.5, h: 3.6, fill: { color: C.white }, line: { color: C.slate200, width: 1 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.08 } });
  s.addShape(pptx.ShapeType.rect, { x: 5.2, y: 1.1, w: 4.5, h: 0.3, fill: { color: C.wechat } });
  s.addText('🔧 后端 WeChatService', { x: 5.4, y: 1.1, w: 4.1, h: 0.3, fontSize: 10, color: C.white, bold: true, fontFace: 'Arial', valign: 'middle' });

  const beLines = [
    'POST /api/history/wechat/send',
    '解析 imageBase64 → byte[]',
    'getToken(): 缓存 2h 自动续期',
    'uploadImage(): multipart/form-data',
    '  → /material/add_material',
    '  → 返回 media_id',
    'createDraft(): 图文草稿',
    '  → /draft/add',
    '  标题: 浏览器历史记录备份',
    '  正文: 截图 + 记录表格',
    '  返回 article_id'
  ];
  beLines.forEach((line, i) => {
    s.addText(line, {
      x: 5.4, y: 1.55 + i * 0.25, w: 4.1, h: 0.22,
      fontSize: 8, color: line.startsWith('  →') ? C.slate400 : C.slate800, fontFace: line.startsWith('  →') ? 'Courier New' : 'Arial', valign: 'middle'
    });
  });
}

// ----- S10: Test Results -----
{
  const s = pptx.addSlide();
  bg(s, C.slate50);
  addHeaderBar(s, '测试结果 (v2.0)');
  addFooter(s);

  const rows = [
    [{ text: '测试类', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9, fontFace: 'Arial' } },
     { text: '测试方法', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9, fontFace: 'Arial' } },
     { text: '结果', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9, fontFace: 'Arial' } }],
    [{ text: 'HistoryControllerTest', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '查询/关键词/删除/备份/统计/日期范围/wechat', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '✅ 7 用例', options: { fontSize: 8, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: 'HistoryServiceTest', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '备份/去重/空数据/搜索/删除/统计/多ID', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '✅ 8 用例', options: { fontSize: 8, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: 'ChromeHistoryReaderTest', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '文件不存在/SQLite读取/时间戳转换', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '✅ 3 用例', options: { fontSize: 8, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: 'WeChatServiceTest', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '无效图片/不存在ID/空选中列表', options: { fontSize: 8, fontFace: 'Arial' } },
     { text: '✅ 3 用例', options: { fontSize: 8, color: C.emerald, fontFace: 'Arial' } }]
  ];

  s.addTable(rows, { x: 0.35, y: 1.15, w: 9.3, h: 2.0, colW: [2.8, 4.5, 2.0], border: { type: 'solid', color: C.slate200, pt: 1 }, rowH: [0.35, 0.33, 0.33, 0.33, 0.33] });

  s.addText('技术栈: JUnit 5 + Mockito 5 + Spring Boot Test + @WebMvcTest', {
    x: 0.5, y: 3.0, w: 9, h: 0.25, fontSize: 8, color: C.slate400, italic: true, fontFace: 'Arial'
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.35, w: 1.2, h: 0.02, fill: { color: C.indigo } });
  s.addText('端到端验证', { x: 0.5, y: 3.4, w: 9, h: 0.25, fontSize: 12, color: C.navy, bold: true, fontFace: 'Arial' });

  const e2eRows = [
    [{ text: '验证项', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 8, fontFace: 'Arial' } },
     { text: '结果', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 8, fontFace: 'Arial' } }],
    [{ text: '微信 API token 获取', options: { fontSize: 8, fontFace: 'Arial' } }, { text: '✅ 成功 (IP白名单通过)', options: { fontSize: 8, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: '前端 npm install + build', options: { fontSize: 8, fontFace: 'Arial' } }, { text: '✅ 67 包 0 漏洞', options: { fontSize: 8, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: 'SMTP 邮件发送', options: { fontSize: 8, fontFace: 'Arial' } }, { text: '✅ 待执行 (见Step 5)', options: { fontSize: 8, color: C.amber, fontFace: 'Arial' } }],
    [{ text: 'GitHub 推送', options: { fontSize: 8, fontFace: 'Arial' } }, { text: '✅ 待执行 (见Step 6)', options: { fontSize: 8, color: C.amber, fontFace: 'Arial' } }]
  ];

  s.addTable(e2eRows, { x: 0.35, y: 3.65, w: 9.3, h: 1.5, colW: [3.5, 5.8], border: { type: 'solid', color: C.slate200, pt: 1 }, rowH: [0.3, 0.27, 0.27, 0.27, 0.27] });
}

// ----- S11: Project Structure -----
{
  const s = pptx.addSlide();
  bg(s, C.slate50);
  addHeaderBar(s, '项目文件结构');
  addFooter(s);

  s.addText(
    'browser-history-backup/' + "\n" +
    '├─ pom.xml — Maven (Spring Boot 3.4 / H2 / SQLite)' + "\n" +
    '├─ settings.xml — 阿里云 Maven 镜像' + "\n" +
    '├─ src/main/java/com/example/historybackup/' + "\n" +
    '│  ├─ HistoryBackupApplication.java' + "\n" +
    '│  ├─ controller/HistoryController.java (5 端点)' + "\n" +
    '│  ├─ controller/WeChatController.java' + "\n" +
    '│  ├─ service/HistoryService.java' + "\n" +
    '│  ├─ service/WeChatService.java (微信 API)' + "\n" +
    '│  ├─ service/ChromeHistoryReader.java' + "\n" +
    '│  ├─ model/HistoryRecord.java' + "\n" +
    '│  └─ repository/HistoryRecordRepository.java' + "\n" +
    '├─ src/test/ (JUnit 5 + Mockito — 19+ 用例)' + "\n" +
    '├─ frontend/src/App.vue (Vue 3 + html2canvas)' + "\n" +
    '├─ frontend/src/main.js' + "\n" +
    '├─ frontend/vite.config.js' + "\n" +
    '├─ src/main/resources/application.yml' + "\n" +
    '└─ docs/ (需求文档 + 测试报告 + 本 PPT)',
    { x: 0.5, y: 1.1, w: 9, h: 4.1, fontSize: 8, color: C.slate800,
      fontFace: 'Courier New', valign: 'top', lineSpacingMultiple: 1.1 }
  );
}

// ----- S12: GitHub & Email Summary -----
{
  const s = standardSlide('GitHub & 邮件');
  contentRows(s, [
    '## GitHub',
    '- 仓库: github.com/drudao/ForOpeanClaw',
    '- 分支: feature/history-backup',
    '- 内容: 后端 Java + 前端 Vue + 测试 + 文档',
    '## 邮件通知',
    '- 收件人: 908561654@qq.com',
    '- 附件: 项目演示.pptx + requirements-and-thoughts.md',
    '- 附件: test-report.md',
    '## 项目启动',
    '- 后端: mvn spring-boot:run (8080)',
    '- 前端: cd frontend && npm run dev (5173)',
    '- 访问: http://localhost:5173'
  ]);
}

// ===== Save =====
const out = 'C:\\Users\\admin\\.openclaw\\workspace\\browser-history-backup\\docs\\项目演示.pptx';
pptx.writeFile({ fileName: out }).then(() => {
  console.log('✅ PPT:', out);
}).catch(e => console.error('❌', e.message));
