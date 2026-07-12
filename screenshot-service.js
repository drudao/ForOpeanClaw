/**
 * 截图 + 微信发布服务
 *
 * 接收选中记录 → Puppeteer 打开每个网页截图 → 上传微信素材 → 创建公众号草稿
 */
const http = require('http');
const https = require('https');
const puppeteer = require('puppeteer-core');
const { PNG } = require('pngjs');

// ====== 配置 ======
const WECHAT_APPID = 'wx846808bc8f41d7ec';
const WECHAT_SECRET = 'b8e93714e41f9ee4e95c28f5c88b2526';
const WECHAT_API = 'https://api.weixin.qq.com/cgi-bin';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let accessToken = null;
let tokenExpires = 0;

// ====== HTTP 工具 ======
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get(u.href, { rejectUnauthorized: false }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ errmsg: data }); } });
    }).on('error', reject);
  });
}

function httpsPost(url, body, contentType) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isMultipart = contentType && contentType.includes('multipart');
    const opts = {
      hostname: u.hostname, port: 443, path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': contentType || 'application/json; charset=UTF-8' },
      rejectUnauthorized: false
    };
    if (body) opts.headers['Content-Length'] = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve({ errmsg: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ====== 微信 API ======
async function getToken() {
  if (accessToken && Date.now() < tokenExpires) return accessToken;
  const res = await httpsGet(`${WECHAT_API}/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}`);
  if (res.access_token) {
    accessToken = res.access_token;
    tokenExpires = Date.now() + (res.expires_in - 60) * 1000;
    console.log('  ✅ 微信 token 获取成功');
    return accessToken;
  }
  throw new Error(`Token 失败: ${JSON.stringify(res)}`);
}

/** 上传图片素材，返回 { mediaId, url } */
async function uploadImage(token, imageBuffer, filename) {
  const boundary = '----Boundary' + Math.random().toString(36).slice(2, 10);
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`;
  const foot = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([
    Buffer.from(head, 'utf-8'), imageBuffer, Buffer.from(foot, 'utf-8')
  ]);

  const res = await httpsPost(
    `${WECHAT_API}/material/add_material?access_token=${token}&type=image`,
    body,
    `multipart/form-data; boundary=${boundary}`
  );

  if (res.media_id) {
    console.log(`  ✅ 上传图片成功 (${(imageBuffer.length/1024).toFixed(1)} KB)`);
    // 确保 URL 使用 HTTPS
    const url = (res.url || '').replace(/^http:/i, 'https:');
    return { mediaId: res.media_id, url };
  }
  throw new Error(`上传图片失败: ${JSON.stringify(res)}`);
}

/** 创建图文草稿 */
async function createDraft(token, title, htmlContent, thumbMediaId) {
  const body = {
    articles: [{
      title,
      content: htmlContent,
      thumb_media_id: thumbMediaId,
      show_cover_pic: 1,
      need_open_comment: 0,
      only_fans_can_comment: 0
    }]
  };
  const res = await httpsPost(`${WECHAT_API}/draft/add?access_token=${token}`, JSON.stringify(body));
  if (res.media_id) return res.media_id;
  throw new Error(`创建草稿失败: ${JSON.stringify(res)}`);
}

// ====== Puppeteer 截图 ======
async function screenshotUrl(url, title, index) {
  console.log(`  📸 [${index + 1}] ${title}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-gpu', '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    defaultViewport: { width: 1280, height: 800 }
  });
  try {
    const page = await browser.newPage();
    // 设置更真实的 User-Agent 避免被反爬
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
    await page.setUserAgent(userAgent);
    await page.setDefaultNavigationTimeout(25000);
    // 忽略 SSL 错误
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    // 等待页面渲染
    await new Promise(r => setTimeout(r, 3000));
    // 尝试滚动到底部触发懒加载
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight || 0)).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    // 滚回顶部截图
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    const screenshot = await page.screenshot({ type: 'png', fullPage: true });
    console.log(`  ✅ 截图完成: ${(screenshot.length / 1024).toFixed(1)} KB`);
    return screenshot;
  } catch (e) {
    console.log(`  ⚠️ 截图失败: ${e.message.slice(0, 60)}`);
    return generateErrorPng(url, title);
  } finally {
    await browser.close();
  }
}

function generateErrorPng(url, title) {
  const png = new PNG({ width: 800, height: 400, filterType: -1 });
  for (let y = 0; y < 400; y++) {
    for (let x = 0; x < 800; x++) {
      const i = (800 * y + x) << 2;
      if (y < 40) { png.data[i] = 239; png.data[i+1] = 68; png.data[i+2] = 68; }
      else { png.data[i] = 255; png.data[i+1] = 255; png.data[i+2] = 255; }
      png.data[i+3] = 255;
    }
  }
  return PNG.sync.write(png);
}

// ====== HTTP 服务 ======
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST' || req.url !== '/screenshot-wechat') {
    res.writeHead(404); res.end(JSON.stringify({ error: 'Not Found' })); return;
  }

  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    try {
      const { records, keyword } = JSON.parse(body);
      if (!records || records.length === 0) throw new Error('记录为空');

      console.log(`\n📋 处理 ${records.length} 条记录...`);

      // 1. 逐个截图
      const screenshots = [];
      for (let i = 0; i < records.length; i++) {
        const buf = await screenshotUrl(records[i].url, records[i].title, i);
        screenshots.push(buf);
      }

      // 2. 获取 token
      const token = await getToken();

      // 3. 上传所有截图到微信素材
      console.log(`\n📤 上传 ${screenshots.length} 张截图到微信素材...`);
      const uploaded = [];
      for (let i = 0; i < screenshots.length; i++) {
        try {
          const { mediaId, url } = await uploadImage(token, screenshots[i], `page_${i}.png`);
          uploaded.push({ ...records[i], mediaId, imageUrl: url || '' });
        } catch (e) {
          console.log(`  ❌ 上传失败: ${e.message}`);
        }
      }

      if (uploaded.length === 0) throw new Error('没有成功上传任何图片');

      // 4. 构建图文正文
      const now = new Date();
      const ds = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const title = keyword
        ? `浏览器历史记录备份 - ${keyword} - ${ds}`
        : `浏览器历史记录备份 - ${uploaded.length} 个网页 - ${ds}`;

      let html = `<h2>浏览器历史记录备份</h2><p>${ds} | 共 ${uploaded.length} 个网页</p><hr/>`;
      for (let i = 0; i < uploaded.length; i++) {
        const u = uploaded[i];
        const vt = u.visitTime ? u.visitTime.replace('T', ' ').slice(0, 19) : '-';
        html += `<div style="margin:24px 0;page-break-after:always">`;
        html += `<h3>${i+1}. <a href="${escHtml(u.url)}" target="_blank">${escHtml(u.title || u.url)}</a></h3>`;
        html += `<p style="color:#999">访问时间: ${vt}</p>`;
        if (u.imageUrl) {
          html += `<p><img src="${u.imageUrl}" data-src="${u.imageUrl}" style="max-width:100%;border:1px solid #ddd;display:block"/></p>`;
        }
        html += `</div>`;
      }
      html += `<hr/><p style="color:#999">由 Sylvanas 自动生成</p>`;

      // 5. 创建草稿
      console.log(`\n📝 创建公众号草稿...`);
      const articleId = await createDraft(token, title, html, uploaded[0].mediaId);

      console.log(`\n✅ 全部完成！草稿ID: ${articleId}`);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, articleId, recordCount: uploaded.length }));

    } catch (e) {
      console.error(`\n❌ ${e.message}`);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, message: e.message }));
    }
  });
});

server.listen(3000, () => {
  console.log(`\n========================================`);
  console.log(`  📸 截图+微信发布服务 · 端口 3000`);
  console.log(`  🖥️  Chrome: ${CHROME_PATH}`);
  console.log(`========================================\n`);
});

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
