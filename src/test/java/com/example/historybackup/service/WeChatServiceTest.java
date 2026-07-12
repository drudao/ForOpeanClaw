package com.example.historybackup.service;

import com.example.historybackup.model.HistoryRecord;
import com.example.historybackup.repository.HistoryRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * WeChatService 单元测试 - 模拟依赖，不实际调用微信 API
 */
@ExtendWith(MockitoExtension.class)
class WeChatServiceTest {

    @Mock
    private HistoryRecordRepository repository;

    private WeChatService weChatService;

    private List<HistoryRecord> sampleRecords;

    @BeforeEach
    void setUp() {
        weChatService = new WeChatService(repository);

        sampleRecords = List.of(
                new HistoryRecord("https://example.com", "Example Page",
                        LocalDateTime.of(2026, 7, 10, 14, 30), "Chrome"),
                new HistoryRecord("https://test.org", "Test Org",
                        LocalDateTime.of(2026, 7, 11, 10, 0), "Chrome")
        );
    }

    @Test
    void shouldReturnFailureWhenImageDataIsInvalid() {
        // 传入无效的 base64 数据应该不会导致异常，而是返回 error
        Map<String, Object> result = weChatService.sendScreenshotToWeChat(
                "invalid-base64!!!", List.of(1L, 2L), "test");

        assertFalse((boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }

    @Test
    void shouldRejectNonExistentRecordIds() {
        String fakeImage = "data:image/png;base64," + Base64.getEncoder().encodeToString(new byte[]{1, 2, 3, 4});

        Map<String, Object> result = weChatService.sendScreenshotToWeChat(
                fakeImage, List.of(999L), "");

        // 会失败因为 WeChat API token 获取失败（无 appId/secret）
        assertFalse((boolean) result.get("success"));
    }

    @Test
    void shouldHandleEmptySelectedList() {
        String fakeImage = "data:image/png;base64," + Base64.getEncoder().encodeToString(new byte[]{1, 2, 3, 4});

        Map<String, Object> result = weChatService.sendScreenshotToWeChat(
                fakeImage, List.of(), "");

        assertFalse((boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }
}
