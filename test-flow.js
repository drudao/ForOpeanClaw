/**
 * 完整测试：发送 URL 到截图服务 → 微信草稿
 */
const http = require('http');

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const json = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(json);
    req.end();
  });
}

async function main() {
  const records = [
    {
      id: 1,
      url: 'https://www.baidu.com',
      title: '百度一下，你就知道',
      visitTime: '2026-07-12T10:00:00',
      browser: 'Chrome'
    },
    {
      id: 2,
      url: 'https://www.wikipedia.org',
      title: 'Wikipedia',
      visitTime: '2026-07-12T09:30:00',
      browser: 'Chrome'
    },
    {
      id: 3,
      url: 'https://github.com/trending',
      title: 'GitHub Trending',
      visitTime: '2026-07-12T08:00:00',
      browser: 'Chrome'
    }
  ];

  console.log('📤 发送 3 个公开网页到截图服务...');
  records.forEach(r => console.log(`   ${r.title}: ${r.url}`));

  const result = await httpPost('http://localhost:3000/screenshot-wechat', {
    records,
    keyword: '公开网站测试'
  });

  console.log('\n📩 结果:', JSON.stringify(result, null, 2));
  if (result.success) {
    console.log(`\n✅ 公众号草稿创建成功！`);
    console.log(`📝 草稿ID: ${result.articleId}`);
    console.log(`🔗 去 https://mp.weixin.qq.com → 草稿箱 查看`);
  } else {
    console.log(`\n❌ 失败: ${result.message}`);
  }
}

main().catch(e => console.error('❌', e.message));
