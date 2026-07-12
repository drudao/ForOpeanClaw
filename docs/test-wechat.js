/**
 * 测试微信发布链路：生成测试截图 → 发送到公众号草稿
 */
const http = require('http');
const { PNG } = require('pngjs');
const zlib = require('zlib');

// 生成一个 800x400 的测试 PNG 图片
function generateImage() {
  const width = 800;
  const height = 400;
  const png = new PNG({ width, height, filterType: -1 });

  // 白色背景
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      // Header bar
      if (y < 40) {
        png.data[idx] = 15;     // R
        png.data[idx+1] = 23;   // G
        png.data[idx+2] = 42;   // B (navy)
      } else if (y < 42) {
        png.data[idx] = 79;     // R
        png.data[idx+1] = 70;   // G
        png.data[idx+2] = 229;  // B (indigo accent)
      } else {
        png.data[idx] = 245;    // R
        png.data[idx+1] = 247;  // G
        png.data[idx+2] = 250;  // B (light bg)
      }
      png.data[idx+3] = 255; // A
    }
  }

  // 表头行 (y=50-75)
  for (let y = 50; y < 75; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = 248;
      png.data[idx+1] = 250;
      png.data[idx+2] = 252;
      png.data[idx+3] = 255;
    }
  }

  // 分隔线 (y=75)
  for (let x = 0; x < width; x++) {
    const idx = (width * 75 + x) << 2;
    png.data[idx] = 232;
    png.data[idx+1] = 236;
    png.data[idx+2] = 241;
    png.data[idx+3] = 255;
  }

  // 数据行背景
  for (let row = 0; row < 5; row++) {
    const startY = 76 + row * 30;
    for (let y = startY; y < startY + 28; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        if (row % 2 === 0) {
          // Checker pattern for readability
        }
        // Light gray at bottom
        if (y === startY + 27) {
          png.data[idx] = 240;
          png.data[idx+1] = 242;
          png.data[idx+2] = 245;
        }
      }
    }
  }

  // 添加一些文字像素（模拟标题）
  // 列标题
  const drawText = (startX, startY, color) => {
    // 简单地在特定位置画深色像素模拟文字
    for (let y = startY; y < startY + 12; y++) {
      for (let x = startX; x < startX + 60; x++) {
        if (y >= 400 || x >= 800) continue;
        const idx = (width * y + x) << 2;
        png.data[idx] = color[0];
        png.data[idx+1] = color[1];
        png.data[idx+2] = color[2];
        png.data[idx+3] = 255;
      }
    }
  };

  // 写一些"文字" (实际就是彩色方块模拟)
  drawText(10, 58, [102, 102, 102]);    // #
  drawText(50, 58, [102, 102, 102]);    // 标题
  drawText(280, 58, [102, 102, 102]);   // URL
  drawText(550, 58, [102, 102, 102]);   // 访问时间
  drawText(730, 58, [102, 102, 102]);   // 浏览器

  // 模拟数据 (蓝色链接)
  const data = [
    [50, 88, '# Example Page'],
    [280, 88, 'https://example.com'],
    [550, 88, '2026-07-10 14:30'],
    [50, 118, '# Test Page'],
    [280, 118, 'https://test.org/'],
    [550, 118, '2026-07-11 10:00'],
    [50, 148, '# 百度一下'],
    [280, 148, 'https://baidu.com'],
    [550, 148, '2026-07-09 08:15'],
  ];

  data.forEach(([x, y]) => {
    drawText(x, y, [79, 110, 247]);
  });

  return PNG.sync.write(png);
}

async function test() {
  console.log('📸 生成测试截图 (800x400 PNG)...');
  const imageBuffer = generateImage();
  const base64Data = imageBuffer.toString('base64');
  const imageData = 'data:image/png;base64,' + base64Data;

  console.log(`📏 图片大小: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

  const postData = JSON.stringify({
    imageData: imageData,
    selectedIds: [1, 2, 3],
    keyword: '测试'
  });

  console.log('📤 发送到后端 /api/history/wechat/send ...');

  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/history/wechat/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📩 响应:', JSON.stringify(result, null, 2));
          if (result.success) {
            console.log('\n✅ 公众号草稿创建成功！');
            console.log(`📝 文章ID: ${result.articleId}`);
            console.log('🔗 可以到公众号后台「草稿箱」查看');
          } else {
            console.log(`\n❌ 失败: ${result.message}`);
          }
          resolve(result);
        } catch (e) {
          console.error('解析响应失败:', data);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('请求失败:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

test().catch(e => console.error('测试失败:', e.message));
