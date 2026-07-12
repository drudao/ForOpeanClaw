const tls = require('tls');
const fs = require('fs');
const path = require('path');

const SMTP_HOST = 'smtp.qq.com';
const SMTP_PORT = 465;
const FROM = '908561654@qq.com';
const TO = '908561654@qq.com';
const AUTH_USER = '908561654@qq.com';
const AUTH_PASS = 'sldumnyaqwotbeei';

const PROJECT_DIR = path.resolve(__dirname, '..');

function base64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

async function sendEmail() {
  return new Promise((resolve, reject) => {
    const sock = tls.connect(SMTP_PORT, SMTP_HOST, () => {
      console.log('📡 已连接 SMTP');
      let step = 0;
      let buffer = '';
      let attachments = [];

      function readFile(filePath) {
        return fs.readFileSync(filePath);
      }

      // Load attachments
      const pptPath = path.join(PROJECT_DIR, 'docs', '项目演示.pptx');
      const reqPath = path.join(PROJECT_DIR, 'docs', 'requirements-and-thoughts.md');
      const testPath = path.join(PROJECT_DIR, 'docs', 'test-report.md');

      const pptData = readFile(pptPath);
      const reqData = readFile(reqPath);
      const testData = readFile(testPath);

      const boundary = '----=_NextPart_' + Date.now() + Math.random().toString(36).slice(2);

      // Build MIME message
      const header = [
        'From: "' + base64('Sylvanas') + '" <' + FROM + '>',
        'To: ' + TO,
        'Subject: =?UTF-8?B?' + base64('浏览器历史记录备份工具 v2.0 - 项目交付') + '?=',
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' + boundary + '"',
        '',
        '--' + boundary,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        base64(`巫妖王好，

浏览器历史记录备份工具 v2.0 已全部完成。本次交付包含：

📌 新增功能
- 前端多选 + html2canvas 截图
- 选中数据发送到微信公众号草稿
- WeChatService 对接微信 API（上传素材 → 创建草稿）

📋 测试
- 4 个测试类，19 个测试用例
- Controller 层 @WebMvcTest + Service 层 Mockito

📎 附件清单：
1. 项目演示.pptx（12 页，含系统架构图、数据流图、API 设计、微信集成详解）
2. requirements-and-thoughts.md（完整需求分析与设计思路，含微信集成章节）
3. test-report.md（测试报告含全部测试用例）

📦 GitHub: feature/history-backup 分支已推送
🔗 https://github.com/drudao/ForOpeanClaw

祝好，
Sylvanas`),
        '',
        '--' + boundary,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        base64(`<html><body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
<h2 style="color:#1a1a2e;border-bottom:2px solid #4f6ef7;padding-bottom:8px">📋 浏览器历史记录备份工具 v2.0</h2>
<p style="color:#333">巫妖王好，</p>
<p style="color:#333">项目 v2.0 已全部完成，以下为本次交付内容：</p>
<h3 style="color:#4f6ef7">📌 新增功能</h3>
<ul>
<li>前端多选 + html2canvas 截图</li>
<li>选中数据发送到微信公众号草稿</li>
<li>WeChatService 对接微信 API（上传素材 → 创建草稿）</li>
</ul>
<h3 style="color:#10b981">📋 测试</h3>
<ul>
<li>4 个测试类，19 个测试用例</li>
<li>Controller 层 @WebMvcTest + Service 层 Mockito</li>
</ul>
<h3 style="color:#0d9488">📎 附件</h3>
<ol>
<li>项目演示.pptx（12 页）</li>
<li>requirements-and-thoughts.md（需求分析）</li>
<li>test-report.md（测试报告）</li>
</ol>
<p style="background:#eef2ff;padding:10px;border-radius:6px;font-size:13px">
📦 <strong>GitHub:</strong> <a href="https://github.com/drudao/ForOpeanClaw" style="color:#4f6ef7">https://github.com/drudao/ForOpeanClaw</a><br>
🌿 分支: <code>feature/history-backup</code>
</p>
<p style="color:#999;font-size:12px">祝好，<br>Sylvanas · 2026-07-12</p>
</div></body></html>`),
        '',
        '--' + boundary,
        'Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation; name="项目演示.pptx"',
        'Content-Transfer-Encoding: base64',
        'Content-Disposition: attachment; filename="=?UTF-8?B?' + base64('项目演示.pptx') + '?="',
        '',
        pptData.toString('base64').match(/.{1,76}/g).join('\n'),
        '',
        '--' + boundary,
        'Content-Type: text/markdown; charset="UTF-8"; name="requirements-and-thoughts.md"',
        'Content-Transfer-Encoding: base64',
        'Content-Disposition: attachment; filename="requirements-and-thoughts.md"',
        '',
        reqData.toString('base64').match(/.{1,76}/g).join('\n'),
        '',
        '--' + boundary,
        'Content-Type: text/markdown; charset="UTF-8"; name="test-report.md"',
        'Content-Transfer-Encoding: base64',
        'Content-Disposition: attachment; filename="test-report.md"',
        '',
        testData.toString('base64').match(/.{1,76}/g).join('\n'),
        '',
        '--' + boundary + '--'
      ].join('\r\n');

      const data = header + '\r\n.\r\n';

      function sendCommand(cmd, expectedCode, next) {
        sock.write(cmd + '\r\n');
        let resp = '';
        const handler = (chunk) => {
          resp += chunk.toString();
          if (resp.includes('\r\n') && resp.match(/^\d{3} /m)) {
            sock.removeListener('data', handler);
            console.log(`<< ${resp.trim()}`);
            next();
          }
        };
        sock.on('data', handler);
      }

      // SMTP conversation
      const cmds = [
        // Wait for initial greeting
        () => {
          let greeting = '';
          const handler = (chunk) => {
            greeting += chunk.toString();
            if (greeting.includes('\r\n')) {
              sock.removeListener('data', handler);
              console.log(`<< ${greeting.trim()}`);
              sendCommand('EHLO localhost', 250, runNext);
            }
          };
          sock.on('data', handler);
        },
        // AUTH LOGIN
        () => sendCommand('AUTH LOGIN', 334, runNext),
        () => sendCommand(base64(AUTH_USER), 334, runNext),
        () => sendCommand(base64(AUTH_PASS), 235, runNext),
        // MAIL FROM
        () => sendCommand('MAIL FROM:<' + FROM + '>', 250, runNext),
        // RCPT TO
        () => sendCommand('RCPT TO:<' + TO + '>', 250, runNext),
        // DATA
        () => sendCommand('DATA', 354, runNext),
        // Send body
        () => {
          sock.write(data);
          console.log('>> [邮件正文 ' + (Buffer.byteLength(data, 'utf-8') / 1024).toFixed(1) + ' KB]');
          // Wait for 250
          let resp = '';
          const handler = (chunk) => {
            resp += chunk.toString();
            if (resp.includes('\r\n')) {
              sock.removeListener('data', handler);
              console.log(`<< ${resp.trim()}`);
              runNext();
            }
          };
          sock.on('data', handler);
        },
        // QUIT
        () => sendCommand('QUIT', 221, () => {
          sock.end();
          resolve();
        })
      ];

      let i = 0;
      function runNext() {
        i++;
        if (i < cmds.length) {
          cmds[i]();
        }
      }

      cmds[0]();
    });

    sock.on('error', (err) => {
      console.error('SMTP 错误:', err.message);
      reject(err);
    });
  });
}

sendEmail()
  .then(() => console.log('✅ 邮件发送成功'))
  .catch(e => console.error('❌', e.message));
