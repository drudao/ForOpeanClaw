package com.example.historybackup.controller;

import com.example.historybackup.service.WeChatService;
import com.example.historybackup.service.WeChatUrlService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history/wechat")
@CrossOrigin(origins = "*")
public class WeChatController {

    private final WeChatService weChatService;
    private final WeChatUrlService weChatUrlService;

    public WeChatController(WeChatService weChatService, WeChatUrlService weChatUrlService) {
        this.weChatService = weChatService;
        this.weChatUrlService = weChatUrlService;
    }

    /**
     * (旧) 接收前端截图并发送到公众号草稿 - 保留兼容
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendToWeChat(@RequestBody Map<String, Object> request) {
        String imageData = (String) request.get("imageData");
        List<Long> selectedIds = ((List<Integer>) request.get("selectedIds"))
                .stream().map(Integer::longValue).toList();
        String keyword = (String) request.getOrDefault("keyword", "");

        if (imageData == null || imageData.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "图片数据为空"));
        }

        Map<String, Object> result = weChatService.sendScreenshotToWeChat(imageData, selectedIds, keyword);
        if ((boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * (新) 选中 URL 列表，逐条截图并发送到公众号草稿
     * POST /api/history/wechat/send-urls
     * Body: [{ "url": "https://...", "title": "..." }]
     * 
     * 对每条 URL 执行：Puppeteer 截图 → 上传微信图片素材 → 创建草稿文章
     */
    @PostMapping("/send-urls")
    public ResponseEntity<Map<String, Object>> sendUrlsToWeChat(@RequestBody List<Map<String, String>> urlItems) {
        if (urlItems == null || urlItems.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "URL 列表为空"
            ));
        }

        // 限制最多处理 10 条，避免超时
        if (urlItems.size() > 10) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "一次最多处理 10 条 URL，当前 " + urlItems.size() + " 条"
            ));
        }

        try {
            List<Map<String, Object>> results = weChatUrlService.processUrls(urlItems);

            long successCount = results.stream().filter(r -> "success".equals(r.get("status"))).count();
            long failCount = results.stream().filter(r -> "failed".equals(r.get("status"))).count();

            return ResponseEntity.ok(Map.of(
                "success", true,
                "total", results.size(),
                "successCount", successCount,
                "failCount", failCount,
                "results", results
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "处理失败: " + e.getMessage()
            ));
        }
    }
}
