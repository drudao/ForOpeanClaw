package com.example.historybackup.controller;

import com.example.historybackup.service.WeChatService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Base64;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WeChatController.class)
class WeChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WeChatService weChatService;

    @Test
    void shouldSendScreenshotToWeChat() throws Exception {
        String fakeImage = "data:image/png;base64," + Base64.getEncoder().encodeToString(new byte[]{1, 2, 3, 4});
        Map<String, Object> mockResult = Map.of(
                "success", true,
                "articleId", "test_article_123",
                "message", "发送成功"
        );

        when(weChatService.sendScreenshotToWeChat(anyString(), anyList(), anyString()))
                .thenReturn(mockResult);

        String body = "{"
                + "\"imageData\":\"" + fakeImage + "\","
                + "\"selectedIds\":[1,2,3],"
                + "\"keyword\":\"测试\""
                + "}";

        mockMvc.perform(post("/api/history/wechat/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.articleId").value("test_article_123"));
    }

    @Test
    void shouldRejectEmptyImageData() throws Exception {
        String body = "{"
                + "\"imageData\":\"\","
                + "\"selectedIds\":[1],"
                + "\"keyword\":\"\""
                + "}";

        mockMvc.perform(post("/api/history/wechat/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("图片数据为空"));
    }

    @Test
    void shouldHandleServiceFailure() throws Exception {
        String fakeImage = "data:image/png;base64," + Base64.getEncoder().encodeToString(new byte[]{1, 2, 3, 4});
        Map<String, Object> mockResult = Map.of(
                "success", false,
                "message", "微信 API 调用失败"
        );

        when(weChatService.sendScreenshotToWeChat(anyString(), anyList(), anyString()))
                .thenReturn(mockResult);

        String body = "{"
                + "\"imageData\":\"" + fakeImage + "\","
                + "\"selectedIds\":[1],"
                + "\"keyword\":\"\""
                + "}";

        mockMvc.perform(post("/api/history/wechat/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false));
    }
}
