package com.example.historybackup.service;

import com.example.historybackup.model.HistoryRecord;
import com.example.historybackup.repository.HistoryRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HistoryServiceTest {

    @Mock
    private HistoryRecordRepository repository;

    @Mock
    private ChromeHistoryReader chromeReader;

    private HistoryService historyService;

    private HistoryRecord sampleRecord;

    @BeforeEach
    void setUp() {
        historyService = new HistoryService(repository, chromeReader);

        sampleRecord = new HistoryRecord(
                "https://example.com",
                "Example Page",
                LocalDateTime.of(2026, 7, 10, 14, 30),
                "Chrome"
        );
        sampleRecord.setId(1L);
    }

    @Test
    void shouldBackupChromeHistoryWithNewRecords() {
        when(chromeReader.readChromeHistory(1000)).thenReturn(List.of(sampleRecord));
        when(repository.existsByUrlAndVisitTime(anyString(), any())).thenReturn(false);

        int imported = historyService.backupChromeHistory();

        assertEquals(1, imported);
        verify(repository, times(1)).save(sampleRecord);
    }

    @Test
    void shouldSkipDuplicateRecordsOnBackup() {
        when(chromeReader.readChromeHistory(1000)).thenReturn(List.of(sampleRecord));
        when(repository.existsByUrlAndVisitTime(anyString(), any())).thenReturn(true);

        int imported = historyService.backupChromeHistory();

        assertEquals(0, imported);
        verify(repository, never()).save(any());
    }

    @Test
    void shouldReturnZeroWhenChromeReaderReturnsEmpty() {
        when(chromeReader.readChromeHistory(1000)).thenReturn(List.of());

        int imported = historyService.backupChromeHistory();

        assertEquals(0, imported);
        verify(repository, never()).save(any());
    }

    @Test
    void shouldSearchHistory() {
        PageRequest pageable = PageRequest.of(0, 20);
        Page<HistoryRecord> expectedPage = new PageImpl<>(List.of(sampleRecord), pageable, 1);

        when(repository.searchHistory(any(), any(), any(), any())).thenReturn(expectedPage);

        Page<HistoryRecord> result = historyService.searchHistory("example", null, null, 0, 20);

        assertEquals(1, result.getTotalElements());
        assertEquals("Example Page", result.getContent().get(0).getTitle());
    }

    @Test
    void shouldDeleteExistingRecord() {
        when(repository.existsById(1L)).thenReturn(true);

        boolean deleted = historyService.deleteRecord(1L);

        assertTrue(deleted);
        verify(repository, times(1)).deleteById(1L);
    }

    @Test
    void shouldReturnFalseWhenDeletingNonExistentRecord() {
        when(repository.existsById(999L)).thenReturn(false);

        boolean deleted = historyService.deleteRecord(999L);

        assertFalse(deleted);
        verify(repository, never()).deleteById(any());
    }

    @Test
    void shouldGetTotalCount() {
        when(repository.count()).thenReturn(539L);

        long count = historyService.getTotalCount();

        assertEquals(539L, count);
    }
}
