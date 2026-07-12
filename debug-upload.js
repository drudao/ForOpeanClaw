/** 测试微信图片上传，看返回什么 */
const https = require('https');
const { PNG } = require('pngjs');

// 生成一个带颜色的测试图片
const png = new PNG({ width: 100, height: 100 });
for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    const i = (100 * y + x) << 2;
    png.data[i] = 255; png.data[i+1] = 0; png.data[i+2] = 0; // red
    png.data[i+3] = 255;
  }
}
const img = PNG.sync.write(png);

async function main() {
  // 1. Token
  const t = await new Promise((resolve, reject) => {
    https.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx846808bc8f41d7ec&secret=b8e93714e41f9ee4e95c28f5c88b2526',
      { rejectUnauthorized: false }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
  const token = t.access_token;
  console.log('Token OK');

  // 2. Upload image
  const boundary = '----Test' + Math.random().toString(36).slice(2, 10);
  const head = '--' + boundary + '\r\nContent-Disposition: form-data; name="media"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n';
  const foot = '\r\n--' + boundary + '--\r\n';
  const body = Buffer.concat([Buffer.from(head), img, Buffer.from(foot)]);

  const u = new URL('https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=' + token + '&type=image');
  const res = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: u.hostname, port: 443, path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length
      },
      rejectUnauthorized: false
    }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  console.log('响应:', JSON.stringify(res, null, 2));

  // 3. If got url, test it in a draft
  if (res.url) {
    const draft = {
      articles: [{
        title: 'Test Image',
        content: '<p>Test image:</p><p><img src="' + res.url + '" style="max-width:100%"/></p>',
        thumb_media_id: res.media_id,
        show_cover_pic: 1,
        need_open_comment: 0,
        only_fans_can_comment: 0
      }]
    };
    const d = await new Promise((resolve, reject) => {
      const u2 = new URL('https://api.weixin.qq.com/cgi-bin/draft/add?access_token=' + token);
      const b = JSON.stringify(draft);
      const req = https.request({
        hostname: u2.hostname, port: 443, path: u2.pathname + u2.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Content-Length': Buffer.byteLength(b) },
        rejectUnauthorized: false
      }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => resolve(JSON.parse(d))); });
      req.on('error', reject);
      req.write(b);
      req.end();
    });
    console.log('草稿响应:', JSON.stringify(d, null, 2));
  }
}

main().catch(e => console.error(e));
