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
    x: 0, y: 0, w: 10, h: 1.1, fill: { color: C.navy }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 1.0, w: 2.0, h: 0.04, fill: { color: C.indigo }
  });
  slide.addText(title, {
    x: 0.5, y: 0.15, w: 9, h: 0.55,
    fontSize: 22, color: C.white, bold: true, fontFace: 'Arial'
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.65, w: 9, h: 0.3,
      fontSize: 12, color: C.slate400, fontFace: 'Arial'
    });
  }
}

function addFooter(slide, text) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 5.35, w: 10, h: 0.275, fill: { color: C.navy }
  });
  slide.addText(text || 'Sylvanas · 2026-07-12', {
    x: 0.5, y: 5.35, w: 9, h: 0.275,
    fontSize: 8, color: C.slate400, align: 'right', fontFace: 'Arial'
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
  let y = startY || 1.35;
  const step = 0.265;
  items.forEach(line => {
    if (line === '-') { y += 0.08; return; }
    if (line.startsWith('##')) {
      const txt = line.replace(/^##\s*/, '');
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: y + 0.04, w: 1.3, h: 0.02, fill: { color: C.indigo }
      });
      slide.addText(txt, {
        x: 0.5, y, w: 9, h: step + 0.05,
        fontSize: 14, color: C.navy, bold: true, fontFace: 'Arial', valign: 'middle'
      });
      y += step + 0.05;
    } else {
      const indent = line.indexOf('  -') === 0 ? 0.8 : line.startsWith('-') ? 0.5 : 0.5;
      const bullet = line.startsWith('  -') ? '  ◦ ' : line.startsWith('-') ? '▸ ' : '';
      const text = bullet + line.replace(/^\s*-\s*/, '').replace(/^\s*-\s*/, '');
      slide.addText(text, {
        x: indent, y, w: 9.2 - indent, h: step - 0.02,
        fontSize: 11, color: C.slate800, fontFace: 'Arial', valign: 'middle'
      });
      y += step;
    }
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

  s.addText('数据源', { x: 0.3, y: 1.2, w: 2, h: 0.25, fontSize: 10, color: C.slate400, fontFace: 'Arial' });
  s.addText('业务层', { x: 3.4, y: 1.2, w: 2, h: 0.25, fontSize: 10, color: C.slate400, fontFace: 'Arial' });
  s.addText('展示/交付', { x: 6.8, y: 1.2, w: 2, h: 0.25, fontSize: 10, color: C.slate400, fontFace: 'Arial' });

  // Row 1: Chrome
  s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 1.55, w: 2.0, h: 0.9, fill: { color: 'fffbeb' }, line: { color: C.amber, width: 1.5 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 } });
  s.addText('Chrome 浏览器\nHistory SQLite', { x: 0.3, y: 1.55, w: 2.0, h: 0.9, fontSize: 10, color: '92400e', align: 'center', valign: 'middle', fontFace: 'Arial' });

  // Row 1: Spring Boot
  s.addShape(pptx.ShapeType.roundRect, { x: 2.7, y: 1.55, w: 2.6, h: 0.9, fill: { color: 'eff6ff' }, line: { color: C.blue, width: 1.5 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 } });
  s.addText('Spring Boot 后端\nController → Service → JPA', { x: 2.7, y: 1.55, w: 2.6, h: 0.9, fontSize: 10, color: '1e3a5f', align: 'center', valign: 'middle', fontFace: 'Arial' });

  // Arrow Chrome → Backend
  s.addShape(pptx.ShapeType.line, { x: 2.3, y: 2.0, w: 0.4, h: 0, line: { color: C.slate400, width: 1.5, endArrowType: 'triangle' } });

  // Row 1: Vue Frontend
  s.addShape(pptx.ShapeType.roundRect, { x: 5.8, y: 1.55, w: 2.0, h: 0.9, fill: { color: 'f5f3ff' }, line: { color: C.indigo, width: 1.5 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 } });
  s.addText('Vue 3 前端\nhtml2canvas 多选', { x: 5.8, y: 1.55, w: 2.0, h: 0.9, fontSize: 10, color: '4c1d95', align: 'center', valign: 'middle', fontFace: 'Arial' });

  // Arrow Backend → Vue
  s.addShape(pptx.ShapeType.line, { x: 5.3, y: 2.0, w: 0.5, h: 0, line: { color: C.slate400, width: 1, endArrowType: 'triangle' } });
  s.addText('REST API', { x: 5.3, y: 1.65, w: 0.5, h: 0.2, fontSize: 7, color: C.slate400, align: 'center', fontFace: 'Arial' });

  // Row 2: H2
  s.addShape(pptx.ShapeType.roundRect, { x: 2.7, y: 2.9, w: 2.0, h: 0.85, fill: { color: 'ecfdf5' }, line: { color: C.emerald, width: 1.5 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 } });
  s.addText('H2 数据库\n(本地文件)', { x: 2.7, y: 2.9, w: 2.0, h: 0.85, fontSize: 10, color: '064e3b', align: 'center', valign: 'middle', fontFace: 'Arial' });
  s.addShape(pptx.ShapeType.line, { x: 4.0, y: 2.45, w: 0, h: 0.45, line: { color: C.slate400, width: 1.5, endArrowType: 'triangle' } });
  s.addText('JPA', { x: 3.6, y: 2.55, w: 0.4, h: 0.2, fontSize: 8, color: C.slate400, align: 'center', fontFace: 'Arial' });

  // Row 3: WeChat API
  s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 3.1, w: 1.8, h: 0.85, fill: { color: 'ecfdf5' }, line: { color: C.wechat, width: 1.5 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 } });
  s.addText('微信公众号\nAPI 草稿箱', { x: 0.3, y: 3.1, w: 1.8, h: 0.85, fontSize: 10, color: '065f46', align: 'center', valign: 'middle', fontFace: 'Arial' });

  // Row 3: QQ Mail
  s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 4.1, w: 1.8, h: 0.85, fill: { color: 'fff1f2' }, line: { color: C.rose, width: 1.5 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 } });
  s.addText('SMTP\nQQ 邮箱', { x: 0.3, y: 4.1, w: 1.8, h: 0.85, fontSize: 10, color: '9f1239', align: 'center', valign: 'middle', fontFace: 'Arial' });

  // Row 3: GitHub
  s.addShape(pptx.ShapeType.roundRect, { x: 2.7, y: 4.1, w: 1.8, h: 0.85, fill: { color: 'eef2ff' }, line: { color: C.indigo, width: 1.5 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.1 } });
  s.addText('GitHub\nForOpeanClaw', { x: 2.7, y: 4.1, w: 1.8, h: 0.85, fontSize: 10, color: '312e81', align: 'center', valign: 'middle', fontFace: 'Arial' });

  // Arrows Backend → Services
  s.addShape(pptx.ShapeType.line, { x: 2.7, y: 2.0, w: 0, h: 2.95, line: { color: C.slate300, width: 1, endArrowType: 'triangle', dashType: 'dash' } });
  s.addText('WeChat / SMTP / Git', { x: 1.9, y: 3.5, w: 0.7, h: 0.25, fontSize: 7, color: C.slate400, align: 'center', fontFace: 'Arial' });

  // Legend
  const leg = [
    ['fffbeb', C.amber, '数据源'], ['eff6ff', C.blue, '业务服务'],
    ['ecfdf5', C.emerald, '数据库'], ['f5f3ff', C.indigo, '前端'],
    ['ecfdf5', C.wechat, '微信'], ['fff1f2', C.rose, '外部服务'],
    ['eef2ff', C.indigo, '代码仓库']
  ];
  s.addText('图例', { x: 6.8, y: 2.7, w: 2, h: 0.25, fontSize: 10, color: C.navy, bold: true, fontFace: 'Arial' });
  leg.forEach(([fc, bc, txt], i) => {
    s.addShape(pptx.ShapeType.rect, { x: 6.8, y: 3.05 + i * 0.35, w: 0.25, h: 0.22, fill: { color: fc }, line: { color: bc, width: 0.5 } });
    s.addText(txt, { x: 7.15, y: 3.03 + i * 0.35, w: 1.8, h: 0.25, fontSize: 9, color: C.slate600, fontFace: 'Arial', valign: 'middle' });
  });
}

// ----- S6: Data Flow Diagram -----
{
  const s = pptx.addSlide();
  bg(s, C.slate50);
  addHeaderBar(s, '完整数据流图', '备份 / 查询 / 删除 / 微信发送 / 邮件 / GitHub');
  addFooter(s);

  // Backup flow
  s.addText('① 备份流程', { x: 0.3, y: 1.2, w: 2, h: 0.25, fontSize: 12, color: C.navy, bold: true, fontFace: 'Arial' });
  const bSteps = [
    { text: '点击\n备份', x: 0.15, y: 1.5, w: 0.9, h: 0.55, fc: 'f5f3ff', bc: C.indigo },
    { text: 'POST\n/backup', x: 1.2, y: 1.5, w: 0.9, h: 0.55, fc: 'eff6ff', bc: C.blue },
    { text: '复制\nSQLite', x: 2.25, y: 1.5, w: 0.9, h: 0.55, fc: 'fffbeb', bc: C.amber },
    { text: 'JDBC\n解析', x: 3.3, y: 1.5, w: 0.9, h: 0.55, fc: 'fffbeb', bc: C.amber },
    { text: '去重\n存H2', x: 4.35, y: 1.5, w: 0.9, h: 0.55, fc: 'ecfdf5', bc: C.emerald },
    { text: '返回\n结果', x: 5.4, y: 1.5, w: 0.9, h: 0.55, fc: 'eff6ff', bc: C.blue }
  ];
  bSteps.forEach(o => {
    s.addShape(pptx.ShapeType.roundRect, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: o.fc }, line: { color: o.bc, width: 1 }, rectRadius: 0.04, shadow: { type: 'outer', blur: 2, offset: 1, color: '000000', opacity: 0.08 } });
    s.addText(o.text, { x: o.x, y: o.y, w: o.w, h: o.h, fontSize: 7, color: C.slate800, align: 'center', valign: 'middle', fontFace: 'Arial' });
  });
  for (let i = 0; i < bSteps.length - 1; i++) {
    s.addShape(pptx.ShapeType.line, { x: bSteps[i].x + bSteps[i].w, y: 1.77, w: bSteps[i+1].x - bSteps[i].x - bSteps[i].w, h: 0, line: { color: C.slate400, width: 1, endArrowType: 'triangle' } });
  }

  // Query flow
  s.addText('② 查询流程', { x: 0.3, y: 2.25, w: 2, h: 0.25, fontSize: 12, color: C.navy, bold: true, fontFace: 'Arial' });
  const qSteps = [
    { text: 'Vue\n输入条件', x: 0.15, y: 2.55, w: 1.1, h: 0.55, fc: 'f5f3ff', bc: C.indigo },
    { text: 'GET\n/history', x: 1.4, y: 2.55, w: 1.1, h: 0.55, fc: 'eff6ff', bc: C.blue },
    { text: 'JPA\n查H2', x: 2.65, y: 2.55, w: 1.1, h: 0.55, fc: 'ecfdf5', bc: C.emerald },
    { text: '返回\nJSON', x: 3.9, y: 2.55, w: 1.1, h: 0.55, fc: 'eff6ff', bc: C.blue },
    { text: 'Vue\n表格展示', x: 5.15, y: 2.55, w: 1.1, h: 0.55, fc: 'f5f3ff', bc: C.indigo }
  ];
  qSteps.forEach(o => {
    s.addShape(pptx.ShapeType.roundRect, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: o.fc }, line: { color: o.bc, width: 1 }, rectRadius: 0.04, shadow: { type: 'outer', blur: 2, offset: 1, color: '000000', opacity: 0.08 } });
    s.addText(o.text, { x: o.x, y: o.y, w: o.w, h: o.h, fontSize: 7, color: C.slate800, align: 'center', valign: 'middle', fontFace: 'Arial' });
  });
  for (let i = 0; i < qSteps.length - 1; i++) {
    s.addShape(pptx.ShapeType.line, { x: qSteps[i].x + qSteps[i].w, y: 2.82, w: qSteps[i+1].x - qSteps[i].x - qSteps[i].w, h: 0, line: { color: C.slate400, width: 1, endArrowType: 'triangle' } });
  }

  // WeChat flow
  s.addText('③ 微信发送流程 (新增)', { x: 0.3, y: 3.2, w: 3, h: 0.25, fontSize: 12, color: C.navy, bold: true, fontFace: 'Arial' });
  const wcSteps = [
    { text: 'Vue\n勾选行', x: 0.15, y: 3.5, w: 0.9, h: 0.5, fc: 'f5f3ff', bc: C.indigo },
    { text: 'html2\ncanvas', x: 1.15, y: 3.5, w: 0.9, h: 0.5, fc: 'f5f3ff', bc: C.indigo },
    { text: 'POST\n/wechat/send', x: 2.15, y: 3.5, w: 1.0, h: 0.5, fc: 'eff6ff', bc: C.blue },
    { text: '微信\n上传素材', x: 3.25, y: 3.5, w: 0.9, h: 0.5, fc: 'ecfdf5', bc: C.wechat },
    { text: '微信\n创建草稿', x: 4.25, y: 3.5, w: 0.9, h: 0.5, fc: 'ecfdf5', bc: C.wechat },
    { text: '返回\narticleId', x: 5.25, y: 3.5, w: 0.9, h: 0.5, fc: 'eff6ff', bc: C.blue }
  ];
  wcSteps.forEach(o => {
    s.addShape(pptx.ShapeType.roundRect, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: o.fc }, line: { color: o.bc, width: 1 }, rectRadius: 0.04, shadow: { type: 'outer', blur: 2, offset: 1, color: '000000', opacity: 0.08 } });
    s.addText(o.text, { x: o.x, y: o.y, w: o.w, h: o.h, fontSize: 7, color: C.slate800, align: 'center', valign: 'middle', fontFace: 'Arial' });
  });
  for (let i = 0; i < wcSteps.length - 1; i++) {
    s.addShape(pptx.ShapeType.line, { x: wcSteps[i].x + wcSteps[i].w, y: 3.75, w: wcSteps[i+1].x - wcSteps[i].x - wcSteps[i].w, h: 0, line: { color: C.slate400, width: 1, endArrowType: 'triangle' } });
  }

  // Email + GitHub flow
  s.addText('④ 邮件 & GitHub 推送', { x: 0.3, y: 4.2, w: 3, h: 0.25, fontSize: 12, color: C.navy, bold: true, fontFace: 'Arial' });
  const flow = [
    { text: 'Node 脚本\nSMTP 直连', x: 0.15, y: 4.5, w: 1.2, h: 0.55, fc: 'eff6ff', bc: C.blue },
    { text: 'QQ 邮箱\n带附件', x: 1.5, y: 4.5, w: 1.2, h: 0.55, fc: 'fff1f2', bc: C.rose },
    { text: 'Git 命令\nHTTPS+Token', x: 3.5, y: 4.5, w: 1.2, h: 0.55, fc: 'eff6ff', bc: C.blue },
    { text: 'GitHub\n远程仓库', x: 4.85, y: 4.5, w: 1.2, h: 0.55, fc: 'eef2ff', bc: C.indigo }
  ];
  flow.forEach(o => {
    s.addShape(pptx.ShapeType.roundRect, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: o.fc }, line: { color: o.bc, width: 1 }, rectRadius: 0.04, shadow: { type: 'outer', blur: 2, offset: 1, color: '000000', opacity: 0.08 } });
    s.addText(o.text, { x: o.x, y: o.y, w: o.w, h: o.h, fontSize: 8, color: C.slate800, align: 'center', valign: 'middle', fontFace: 'Arial' });
  });
  s.addShape(pptx.ShapeType.line, { x: 1.35, y: 4.77, w: 0.15, h: 0, line: { color: C.slate400, width: 1, endArrowType: 'triangle' } });
  s.addShape(pptx.ShapeType.line, { x: 2.7, y: 4.77, w: 0.8, h: 0, line: { color: C.slate300, width: 1, dashType: 'dash' } });
  s.addShape(pptx.ShapeType.line, { x: 4.7, y: 4.77, w: 0.15, h: 0, line: { color: C.slate400, width: 1, endArrowType: 'triangle' } });
}

// ----- S7: API Design -----
{
  const s = pptx.addSlide();
  bg(s, C.slate50);
  addHeaderBar(s, 'REST API 接口设计');
  addFooter(s);

  const rows = [
    [{ text: '方法', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Arial' } },
     { text: '路径', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Arial' } },
     { text: '参数', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Arial' } },
     { text: '说明', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Arial' } }],
    [{ text: 'GET', options: { color: C.blue, bold: true, fontSize: 10, fontFace: 'Arial' } },
     { text: '/api/history', options: { fontSize: 10, fontFace: 'Arial' } },
     { text: 'keyword, page, size, startDate, endDate', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '分页查询历史记录', options: { fontSize: 10, fontFace: 'Arial' } }],
    [{ text: 'DELETE', options: { color: C.rose, bold: true, fontSize: 10, fontFace: 'Arial' } },
     { text: '/api/history/{id}', options: { fontSize: 10, fontFace: 'Arial' } },
     { text: 'id', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '删除单条记录', options: { fontSize: 10, fontFace: 'Arial' } }],
    [{ text: 'POST', options: { color: C.emerald, bold: true, fontSize: 10, fontFace: 'Arial' } },
     { text: '/api/history/backup', options: { fontSize: 10, fontFace: 'Arial' } },
     { text: '-', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '手动触发 Chrome 备份', options: { fontSize: 10, fontFace: 'Arial' } }],
    [{ text: 'GET', options: { color: C.blue, bold: true, fontSize: 10, fontFace: 'Arial' } },
     { text: '/api/history/stats', options: { fontSize: 10, fontFace: 'Arial' } },
     { text: '-', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '获取备份总记录数', options: { fontSize: 10, fontFace: 'Arial' } }],
    [{ text: 'POST', options: { color: C.emerald, bold: true, fontSize: 10, fontFace: 'Arial' } },
     { text: '/api/history/wechat/send', options: { fontSize: 10, fontFace: 'Arial' } },
     { text: 'imageData, selectedIds, keyword', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '截图→微信素材→公众号草稿', options: { fontSize: 10, fontFace: 'Arial' } }]
  ];

  s.addTable(rows, { x: 0.35, y: 1.25, w: 9.3, h: 2.8, colW: [0.8, 2.3, 3.2, 3.0], border: { type: 'solid', color: C.slate200, pt: 1 }, rowH: [0.42, 0.42, 0.42, 0.42, 0.42, 0.42] });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 4.2, w: 1.3, h: 0.025, fill: { color: C.indigo } });
  s.addText('核心后端类', { x: 0.5, y: 4.3, w: 9, h: 0.3, fontSize: 14, color: C.navy, bold: true, fontFace: 'Arial' });
  s.addText(
    'HistoryController      REST API 入口，5 个端点' + "\n" +
    'WeChatController         微信公众号 API 转发' + "\n" +
    'HistoryService          业务逻辑层 + @Scheduled 定时备份' + "\n" +
    'WeChatService           微信 token/素材/草稿管理' + "\n" +
    'ChromeHistoryReader   SQLite 文件读取 + 时间戳转换' + "\n" +
    'HistoryRecord           JPA 实体，映射 history_records 表' + "\n" +
    'HistoryRecordRepository Spring Data JPA 自定义查询接口',
    { x: 0.5, y: 4.55, w: 9, h: 0.8, fontSize: 10, color: C.slate600, fontFace: 'Courier New', valign: 'top', lineSpacingMultiple: 1.3 }
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
  s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 1.25, w: 4.5, h: 3.9, fill: { color: C.white }, line: { color: C.slate200, width: 1 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.06 } });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.25, w: 4.5, h: 0.35, fill: { color: C.indigo } });
  s.addText('🖥 前端实现', { x: 0.5, y: 1.25, w: 4.1, h: 0.35, fontSize: 12, color: C.white, bold: true, fontFace: 'Arial', valign: 'middle' });

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
      x: 0.5, y: 1.75 + i * 0.28, w: 4.1, h: 0.26,
      fontSize: 9, color: line.startsWith('  ') ? C.slate400 : C.slate800, fontFace: line.startsWith('  ') ? 'Courier New' : 'Arial', valign: 'middle'
    });
  });

  // Right: Backend flow
  s.addShape(pptx.ShapeType.roundRect, { x: 5.2, y: 1.25, w: 4.5, h: 3.9, fill: { color: C.white }, line: { color: C.slate200, width: 1 }, rectRadius: 0.06, shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.08 } });
  s.addShape(pptx.ShapeType.rect, { x: 5.2, y: 1.25, w: 4.5, h: 0.35, fill: { color: C.wechat } });
  s.addText('🔧 后端 WeChatService', { x: 5.4, y: 1.25, w: 4.1, h: 0.35, fontSize: 12, color: C.white, bold: true, fontFace: 'Arial', valign: 'middle' });

  const beLines = [
    'POST /api/history/wechat/send',
    '解析 imageBase64 → byte[]',
    'getToken(): 缓存 2h 自动续期',
    'uploadImage(): multipart/form-data',
    '  → /material/add_material',
    '  → 返回 media_id',
    'createDraft(): 图文草稿',
    '  → /draft/add',
    '  标题: 浏览器历史记录备份 - 时间',
    '  正文: 截图 + 记录表格',
    '  返回 article_id'
  ];
  beLines.forEach((line, i) => {
    s.addText(line, {
      x: 5.4, y: 1.75 + i * 0.28, w: 4.1, h: 0.26,
      fontSize: 9, color: line.startsWith('  →') ? C.slate400 : C.slate800, fontFace: line.startsWith('  →') ? 'Courier New' : 'Arial', valign: 'middle'
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
    [{ text: '测试类', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Arial' } },
     { text: '测试方法', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Arial' } },
     { text: '结果', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Arial' } }],
    [{ text: 'HistoryControllerTest', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '查询/关键词/删除/备份/统计/日期范围', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '✅ 6 用例', options: { fontSize: 9, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: 'HistoryServiceTest', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '备份/去重/空数据/搜索/删除/统计', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '✅ 7 用例', options: { fontSize: 9, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: 'ChromeHistoryReaderTest', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '文件不存在/SQLite读取/时间戳转换', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '✅ 3 用例', options: { fontSize: 9, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: 'WeChatServiceTest', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '无效图片/不存在ID/空选中列表', options: { fontSize: 9, fontFace: 'Arial' } },
     { text: '✅ 3 用例', options: { fontSize: 9, color: C.emerald, fontFace: 'Arial' } }]
  ];

  s.addTable(rows, { x: 0.5, y: 1.3, w: 9, h: 2.5, colW: [3.0, 4.0, 2.0], border: { type: 'solid', color: C.slate200, pt: 1 }, rowH: [0.42, 0.38, 0.38, 0.38, 0.38] });

  s.addText('技术栈: JUnit 5 + Mockito 5 + Spring Boot Test + @WebMvcTest', {
    x: 0.5, y: 3.3, w: 9, h: 0.3, fontSize: 10, color: C.slate400, italic: true, fontFace: 'Arial'
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.75, w: 1.3, h: 0.025, fill: { color: C.indigo } });
  s.addText('端到端验证', { x: 0.5, y: 3.85, w: 9, h: 0.3, fontSize: 14, color: C.navy, bold: true, fontFace: 'Arial' });

  const e2eRows = [
    [{ text: '验证项', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Arial' } },
     { text: '结果', options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Arial' } }],
    [{ text: '微信 API token 获取', options: { fontSize: 10, fontFace: 'Arial' } }, { text: '✅ 成功 (IP白名单通过)', options: { fontSize: 10, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: '前端 npm install + build', options: { fontSize: 10, fontFace: 'Arial' } }, { text: '✅ 67 包 0 漏洞', options: { fontSize: 10, color: C.emerald, fontFace: 'Arial' } }],
    [{ text: 'SMTP 邮件发送', options: { fontSize: 10, fontFace: 'Arial' } }, { text: '✅ 待执行 (见Step 5)', options: { fontSize: 10, color: C.amber, fontFace: 'Arial' } }],
    [{ text: 'GitHub 推送', options: { fontSize: 10, fontFace: 'Arial' } }, { text: '✅ 待执行 (见Step 6)', options: { fontSize: 10, color: C.amber, fontFace: 'Arial' } }]
  ];

  s.addTable(e2eRows, { x: 0.5, y: 4.15, w: 9, h: 1.0, colW: [4.0, 5.0], border: { type: 'solid', color: C.slate200, pt: 1 }, rowH: [0.32, 0.28, 0.28, 0.28, 0.28] });
}

// ----- S11: Project Structure -----
{
  const s = standardSlide('项目文件结构');
  contentRows(s, [
    '- browser-history-backup/',
    '  - pom.xml — Maven (Spring Boot 3.4 / H2 / SQLite)',
    '  - settings.xml — 阿里云 Maven 镜像',
    '  - src/main/java/com/example/historybackup/',
    '    - HistoryBackupApplication.java',
    '    - controller/HistoryController.java (5 端点)',
    '    - controller/WeChatController.java',
    '    - service/HistoryService.java',
    '    - service/WeChatService.java (微信 API)',
    '    - service/ChromeHistoryReader.java',
    '    - model/HistoryRecord.java',
    '    - repository/HistoryRecordRepository.java',
    '  - src/main/resources/application.yml',
    '  - src/test/ (JUnit 5 + Mockito - 19 用例)',
    '  - frontend/src/App.vue (Vue 3 + html2canvas)',
    '  - docs/ (需求文档 + 测试报告 + 本 PPT)'
  ]);
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
