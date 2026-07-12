package com.example.historybackup.controller;

import com.example.historybackup.model.HistoryRecord;
import com.example.historybackup.service.HistoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HistoryController.class)
class HistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private HistoryService historyService;

    @Autowired
    private ObjectMapper objectMapper;

    private HistoryRecord sampleRecord;

    @BeforeEach
    void setUp() {
        sampleRecord = new HistoryRecord(
                "https://example.com",
                "Example Page",
                LocalDateTime.of(2026, 7, 10, 14, 30),
                "Chrome"
        );
        sampleRecord.setId(1L);
    }

    @Test
    void shouldSearchHistory() throws Exception {
        Page<HistoryRecord> page = new PageImpl<>(
                List.of(sampleRecord),
                PageRequest.of(0, 20),
                1
        );

        when(historyService.searchHistory(any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(page);

        mockMvc.perform(get("/api/history")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].url").value("https://example.com"))
                .andExpect(jsonPath("$.content[0].title").value("Example Page"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void shouldSearchWithKeyword() throws Exception {
        Page<HistoryRecord> page = new PageImpl<>(
                List.of(sampleRecord),
                PageRequest.of(0, 20),
                1
        );

        when(historyService.searchHistory(eq("example"), any(), any(), anyInt(), anyInt()))
                .thenReturn(page);

        mockMvc.perform(get("/api/history")
                        .param("keyword", "example")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Example Page"));
    }

    @Test
    void shouldDeleteRecord() throws Exception {
        when(historyService.deleteRecord(1L)).thenReturn(true);

        mockMvc.perform(delete("/api/history/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void shouldReturn404WhenDeleteNonExistent() throws Exception {
        when(historyService.deleteRecord(999L)).thenReturn(false);

        mockMvc.perform(delete("/api/history/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldTriggerBackup() throws Exception {
        when(historyService.backupChromeHistory()).thenReturn(539);

        mockMvc.perform(post("/api/history/backup"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.imported").value(539));
    }

    @Test
    void shouldGetStats() throws Exception {
        when(historyService.getTotalCount()).thenReturn(539L);

        mockMvc.perform(get("/api/history/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(539));
    }

    @Test
    void shouldSearchWithDateRange() throws Exception {
        Page<HistoryRecord> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);

        when(historyService.searchHistory(any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/history")
                        .param("startDate", "2026-01-01T00:00:00")
                        .param("endDate", "2026-06-30T23:59:59")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void shouldGetRecordsByIds() throws Exception {
        when(historyService.getRecordsByIds(List.of(1L, 2L)))
                .thenReturn(List.of(sampleRecord));

        mockMvc.perform(get("/api/history/by-ids")
                        .param("ids", "1,2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Example Page"));
    }

    @Test
    void shouldReturnEmptyWhenGettingNonExistentIds() throws Exception {
        when(historyService.getRecordsByIds(List.of(999L)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/history/by-ids")
                        .param("ids", "999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }
}
