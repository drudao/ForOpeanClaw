package com.example.historybackup.controller;

import com.example.historybackup.service.WeChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history/wechat")
@CrossOrigin(origins = "*")
public class WeChatController {

    private final WeChatService weChatService;

    public WeChatController(WeChatService weChatService) {
        this.weChatService = weChatService;
    }

    /**
     * 接收前端截图并发送到公众号草稿
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendToWeChat(@RequestBody Map<String, Object> request) {
        String imageData = (String) request.get("imageData");
        List<Long> selectedIds = ((List<Integer>) request.get("selectedIds"))
                .stream().map(Long::longValue).toList();
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
}
