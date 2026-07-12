package com.example.historybackup.controller;

import com.example.historybackup.model.HistoryRecord;
import com.example.historybackup.service.HistoryService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "*")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    /**
     * 查询历史记录
     */
    @GetMapping
    public ResponseEntity<Page<HistoryRecord>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<HistoryRecord> result = historyService.searchHistory(keyword, startDate, endDate, page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除单条记录
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        boolean deleted = historyService.deleteRecord(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("success", true, "message", "删除成功"));
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "记录不存在"));
    }

    /**
     * 手动触发备份
     */
    @PostMapping("/backup")
    public ResponseEntity<Map<String, Object>> backup() {
        int count = historyService.backupChromeHistory();
        return ResponseEntity.ok(Map.of("success", true, "imported", count));
    }

    /**
     * 获取统计数据
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        long total = historyService.getTotalCount();
        return ResponseEntity.ok(Map.of("totalCount", total));
    }

    /**
     * 根据 ID 列表获取记录
     */
    @GetMapping("/by-ids")
    public ResponseEntity<List<HistoryRecord>> getByIds(@RequestParam("ids") String ids) {
        List<Long> idList = Arrays.stream(ids.split(","))
                .map(String::trim)
                .map(Long::parseLong)
                .toList();
        List<HistoryRecord> records = historyService.getRecordsByIds(idList);
        return ResponseEntity.ok(records);
    }
}
